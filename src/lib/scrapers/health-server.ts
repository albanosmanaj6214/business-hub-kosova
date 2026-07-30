// Server-side loader: reads existing Source + SourceHealth + recent ScrapeAttempt
// rows and returns per-source health assessments + the alert list. No new schema.
import { prisma } from '@/lib/prisma'
import { assessSourceHealth, sourcesNeedingAttention, type HealthAssessment, type AttemptLite } from './health'
import { CUSTOM_CODES } from './run-source'
import { REGISTRY_KINDS } from './framework/runner'
import { hasAdapter } from '@/lib/ingestion/registry'

export type SourceRuntime = 'LEGACY_CUSTOM' | 'LEGACY_FRAMEWORK' | 'CANONICAL' | 'NONE'

export interface SourceHealthRow extends HealthAssessment {
  id: string
  name: string
  isActive: boolean
  path: 'custom' | 'framework' | 'none'
  runtime: SourceRuntime
  canonicalAvailable: boolean
}

function pathFor(code: string, kind: string | null): 'custom' | 'framework' | 'none' {
  if (CUSTOM_CODES.includes(code)) return 'custom'
  if (kind && REGISTRY_KINDS.includes(kind)) return 'framework'
  return 'none'
}

// PRIMARY runtime that actually produces a source's live records. Legacy paths take
// precedence because they are the active runtime; a canonical adapter that also exists
// is surfaced separately as `canonicalAvailable` (e.g. KIESA = LEGACY_CUSTOM primary +
// canonical shadow available). Only a source with NO legacy path (ASKdata) is CANONICAL.
function runtimeFor(code: string, kind: string | null): SourceRuntime {
  if (CUSTOM_CODES.includes(code)) return 'LEGACY_CUSTOM'
  if (kind && REGISTRY_KINDS.includes(kind)) return 'LEGACY_FRAMEWORK'
  if (hasAdapter(code)) return 'CANONICAL'
  return 'NONE'
}

/**
 * Health for OPERATIONAL legacy sources: those with a real implementation
 * (custom scraper or framework adapter kind). Config-only rows (no adapter) are
 * excluded unless `includeConfigOnly` is set. Uses existing tables only.
 */
export async function loadSourceHealth(opts: { includeConfigOnly?: boolean; now?: Date } = {}): Promise<SourceHealthRow[]> {
  const now = opts.now ?? new Date()
  const sources = await prisma.source.findMany({
    select: { id: true, code: true, name: true, isActive: true, kind: true },
    orderBy: { code: 'asc' },
  })
  const healths = await prisma.sourceHealth.findMany({
    select: { sourceId: true, lastSuccessAt: true, lastFailureAt: true, consecutiveFailures: true, totalItemsLifetime: true },
  })
  const healthById = new Map(healths.map((h) => [h.sourceId, h]))

  // Recent attempts (newest first), grouped per source, capped at 5 each.
  const attempts = await prisma.scrapeAttempt.findMany({
    select: { sourceId: true, status: true, itemsFound: true, startedAt: true },
    orderBy: { startedAt: 'desc' },
    take: 600,
  })
  const recentBySource = new Map<string, AttemptLite[]>()
  for (const a of attempts) {
    const arr = recentBySource.get(a.sourceId) ?? []
    if (arr.length < 5) arr.push({ status: a.status, itemsFound: a.itemsFound, startedAt: a.startedAt })
    recentBySource.set(a.sourceId, arr)
  }

  const rows: SourceHealthRow[] = []
  for (const s of sources) {
    const path = pathFor(s.code, s.kind)
    const runtime = runtimeFor(s.code, s.kind)
    const hasImplementation = path !== 'none' || runtime === 'CANONICAL'
    if (!hasImplementation && !opts.includeConfigOnly) continue
    const assessment = assessSourceHealth({
      code: s.code,
      isActive: s.isActive,
      hasImplementation,
      health: healthById.get(s.id) ?? null,
      recent: recentBySource.get(s.id) ?? [],
      now,
    })
    rows.push({ ...assessment, id: s.id, name: s.name, isActive: s.isActive, path, runtime, canonicalAvailable: hasAdapter(s.code) })
  }
  return rows
}

/** Alert list (health-based, internal). No external notification is sent. */
export async function loadSourceAlerts(now = new Date()): Promise<SourceHealthRow[]> {
  const rows = await loadSourceHealth({ now })
  return sourcesNeedingAttention(rows) as SourceHealthRow[]
}
