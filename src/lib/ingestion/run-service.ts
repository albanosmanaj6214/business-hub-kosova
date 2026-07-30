// Safe canonical run service. Wraps the existing runPipeline with governance gates,
// SUPER_ADMIN-agnostic eligibility (the route enforces the session), per-source
// concurrency, and safe error output. NEVER runs "all sources" — one source at a time.
import { prisma } from '@/lib/prisma'
import { runPipeline } from './core/pipeline'
import { PrismaPipelineStore } from './core/prisma-store'
import { getAdapterEntry, type AdapterStatus } from './registry'
import { acquireRunLock, releaseRunLock } from './lock'
import type { PipelineStore } from './core/store'

export type RunBlock =
  | 'no_adapter'
  | 'source_inactive'
  | 'lifecycle_not_active'
  | 'endpoint_disabled'
  | 'endpoint_not_found'
  | 'terms_not_reviewed'
  | 'already_running'

export interface SourceLike {
  code: string
  isActive: boolean
  lifecycle: string | null
  termsOfUseStatus: string | null
}
export interface EndpointLike {
  enabled: boolean
}

export interface Eligibility {
  adapterId: string | null
  adapterStatus: AdapterStatus | null
  canTestConnection: boolean
  canDryRun: boolean
  canRealImport: boolean
  dryRunBlocks: RunBlock[]
  realImportBlocks: RunBlock[]
}

/**
 * Pure eligibility rules.
 * - test connection: adapter exists (reachability probe is always safe).
 * - dry run: adapter exists. Allowed even for DRAFT as an isolated governance test
 *   (the pipeline persists no durable business/statistical records in dry-run).
 * - real import: adapter + lifecycle ACTIVE (implies APPROVED) + source active +
 *   endpoint enabled (if an endpoint is chosen) + terms reviewed (not not_reviewed/prohibited).
 */
export function evaluateEligibility(source: SourceLike, endpoint?: EndpointLike | null): Eligibility {
  const entry = getAdapterEntry(source.code)
  const dryRunBlocks: RunBlock[] = []
  const realImportBlocks: RunBlock[] = []
  if (!entry) {
    dryRunBlocks.push('no_adapter')
    realImportBlocks.push('no_adapter')
  }
  if (!source.isActive) realImportBlocks.push('source_inactive')
  if (source.lifecycle !== 'ACTIVE') realImportBlocks.push('lifecycle_not_active')
  if (endpoint && !endpoint.enabled) realImportBlocks.push('endpoint_disabled')
  const terms = source.termsOfUseStatus
  if (terms == null || terms === 'not_reviewed' || terms === 'prohibited') realImportBlocks.push('terms_not_reviewed')
  return {
    adapterId: entry?.id ?? null,
    adapterStatus: entry?.status ?? null,
    canTestConnection: entry != null,
    canDryRun: dryRunBlocks.length === 0,
    canRealImport: realImportBlocks.length === 0,
    dryRunBlocks,
    realImportBlocks,
  }
}

export interface RunOutcome {
  ok: boolean
  mode: 'dry-run' | 'real'
  sourceCode: string
  importRunId?: string
  status?: string
  counts?: Record<string, number>
  blocks?: RunBlock[]
  error?: string
}

// Per-source concurrency guard (in-memory; one PM2 worker).
const running = new Set<string>()
export function isCanonicalRunning(sourceId: string): boolean {
  return running.has(sourceId)
}

function safeError(e: unknown): string {
  const m = String((e as Error)?.message ?? e)
  // never leak secrets/tokens; keep it short + generic.
  return m.slice(0, 200)
}

export interface RunCanonicalArgs {
  sourceId: string
  endpointId?: string | null
  mode: 'dry-run' | 'real'
  initiatedBy?: string | null
  trigger?: 'MANUAL' | 'SCHEDULED' | 'DRY_RUN'
  store?: PipelineStore
}

/** Run ONE governed source through the canonical pipeline, safely. */
export async function runCanonicalSource(args: RunCanonicalArgs): Promise<RunOutcome> {
  const { sourceId, endpointId, mode } = args
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: { id: true, code: true, isActive: true, lifecycle: true, termsOfUseStatus: true },
  })
  if (!source) return { ok: false, mode, sourceCode: '?', error: 'Source not found' }

  let endpoint: { id: string; enabled: boolean } | null = null
  if (endpointId) {
    endpoint = await prisma.sourceEndpoint.findUnique({ where: { id: endpointId }, select: { id: true, enabled: true } })
    if (!endpoint) return { ok: false, mode, sourceCode: source.code, blocks: ['endpoint_not_found'], error: 'Endpoint not found' }
  }

  const elig = evaluateEligibility(source, endpoint)
  const allowed = mode === 'dry-run' ? elig.canDryRun : elig.canRealImport
  const blocks = mode === 'dry-run' ? elig.dryRunBlocks : elig.realImportBlocks
  if (!allowed) return { ok: false, mode, sourceCode: source.code, blocks, error: `Bllokuar: ${blocks.join(', ')}` }

  const entry = getAdapterEntry(source.code)!
  // Fast local guard (single process) …
  if (running.has(source.id)) return { ok: false, mode, sourceCode: source.code, blocks: ['already_running'], error: 'Tashmë duke u ekzekutuar.' }
  running.add(source.id)
  // … plus the authoritative cross-process DB lease lock (scoped by source+endpoint).
  const holder = `${args.initiatedBy ?? 'run'}-${(source.id + (endpoint?.id ?? '')).slice(0, 8)}-${mode}`
  const lock = await acquireRunLock(source.id, endpoint?.id ?? null, holder)
  if (!lock) {
    running.delete(source.id)
    return { ok: false, mode, sourceCode: source.code, blocks: ['already_running'], error: 'Tashmë duke u ekzekutuar (lock).' }
  }
  try {
    const store = args.store ?? new PrismaPipelineStore()
    const result = await runPipeline({
      adapter: entry.create(),
      store,
      sourceId: source.id,
      sourceEndpointId: endpoint?.id ?? null,
      options: { dryRun: mode === 'dry-run', trigger: args.trigger ?? (mode === 'dry-run' ? 'DRY_RUN' : 'MANUAL'), initiatedBy: args.initiatedBy ?? null },
    })
    const ok = result.status === 'SUCCEEDED'
    // Canonical health: update SourceHealth on REAL runs only (dry-run changes nothing durable).
    if (mode === 'real') {
      await prisma.sourceHealth.upsert({
        where: { sourceId: source.id },
        create: { sourceId: source.id, ...(ok ? { lastSuccessAt: new Date(), consecutiveFailures: 0 } : { lastFailureAt: new Date(), consecutiveFailures: 1 }) },
        update: ok ? { lastSuccessAt: new Date(), consecutiveFailures: 0 } : { lastFailureAt: new Date(), consecutiveFailures: { increment: 1 } },
      }).catch(() => {})
    }
    return { ok, mode, sourceCode: source.code, importRunId: (result as any).importRunId, status: result.status, counts: result.counts as any }
  } catch (e) {
    return { ok: false, mode, sourceCode: source.code, error: safeError(e) }
  } finally {
    await releaseRunLock(lock)
    running.delete(source.id)
  }
}
