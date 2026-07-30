// Internal fixture adapter: exercises the full canonical pipeline end to end with
// NO network and NO external service. Used by tests and dry-run demonstrations.
import type {
  AdapterContext, ConnectionResult, DiscoveredRef, FetchResult, ParsedItem,
  NormalizedRecord, ValidationOutcome, Checkpoint, HealthReport, IngestionAdapter,
} from './contracts'
import { checksumOf } from './snapshot'
import { normalizeTitle, canonicalizeUrl, parseDateSafe, normalizeCurrency } from './normalize'
import { validateRecord } from './validation'

export interface FixtureItem {
  officialId?: string
  title: string
  url?: string
  publishedAt?: string
  deadline?: string
  amount?: string
  currency?: string
}

const DEFAULT_FIXTURES: FixtureItem[] = [
  { officialId: 'KIESA-2026-001', title: '  Grant për eksport   ', url: 'https://example.org/thirrje/1?utm_source=x', publishedAt: '2026-07-01', deadline: '15/08/2026', amount: '10.000', currency: '€' },
  { officialId: 'KIESA-2026-002', title: 'Panair në Munih', url: 'https://example.org/panair/2', publishedAt: '', deadline: '03/13/2026', currency: 'EUR' },
  // Exact duplicate of #1 (same officialId) to prove idempotent dedup.
  { officialId: 'KIESA-2026-001', title: 'Grant për eksport', url: 'https://example.org/thirrje/1', publishedAt: '2026-07-01' },
]

const PARSER_VERSION = 'fixture-parser@1'

export function createFixtureAdapter(fixtures: FixtureItem[] = DEFAULT_FIXTURES): IngestionAdapter {
  return {
    name: 'fixture',
    version: 'fixture-adapter@1',
    family: 'fixture',

    async testConnection(): Promise<ConnectionResult> {
      return { ok: true, status: 200, contentType: 'application/json', sizeBytes: 0, durationMs: 0 }
    },
    async discover(): Promise<DiscoveredRef[]> {
      return [{ id: 'fixture-batch', url: 'https://example.org/fixtures.json', label: 'Fixture batch' }]
    },
    async fetch(ref: DiscoveredRef, ctx: AdapterContext): Promise<FetchResult> {
      const bodyText = JSON.stringify(fixtures)
      return {
        ref, status: 200, contentType: 'application/json', bodyText,
        sizeBytes: Buffer.byteLength(bodyText, 'utf8'), checksum: checksumOf(bodyText),
        etag: '"fixture"', lastModified: null, retrievedAt: ctx.now().toISOString(), fromCache: false,
      }
    },
    async parse(fetched: FetchResult): Promise<ParsedItem[]> {
      const arr = JSON.parse(fetched.bodyText) as FixtureItem[]
      return arr.map((f) => ({ sourceRecordId: f.officialId, fields: f as unknown as Record<string, unknown>, parserVersion: PARSER_VERSION }))
    },
    async normalize(item: ParsedItem): Promise<NormalizedRecord> {
      const f = item.fields as unknown as FixtureItem
      const title = normalizeTitle(f.title)
      const url = f.url ? canonicalizeUrl(f.url) : null
      const pub = f.publishedAt ? parseDateSafe(f.publishedAt, { assumeDayFirst: true }) : null
      const deadline = f.deadline ? parseDateSafe(f.deadline, { assumeDayFirst: true }) : null
      const currency = f.currency ? normalizeCurrency(f.currency) : null
      const warnings = [
        ...title.warnings.map((w) => ({ field: 'title', reason: w.reason, confidence: w.confidence })),
        ...(url?.warnings ?? []).map((w) => ({ field: 'url', reason: w.reason, confidence: w.confidence })),
        ...(pub?.warnings ?? []).map((w) => ({ field: 'publishedAt', reason: w.reason, confidence: w.confidence })),
        ...(deadline?.warnings ?? []).map((w) => ({ field: 'deadline', reason: w.reason, confidence: w.confidence })),
        ...(currency?.warnings ?? []).map((w) => ({ field: 'currency', reason: w.reason, confidence: w.confidence })),
      ]
      const confidence = warnings.length === 0 ? 1 : Math.max(0.3, 1 - 0.2 * warnings.length)
      return {
        canonical: {
          kind: 'opportunity',
          title: title.value,
          url: url?.value ?? undefined,
          publicationDate: pub?.value ?? undefined,
          deadline: deadline?.value ?? undefined,
          identifiers: { officialId: f.officialId, canonicalUrl: url?.value ?? undefined, sourceRecordId: item.sourceRecordId },
          payload: { currency: currency?.value ?? f.currency ?? null, amount: f.amount ?? null },
        },
        original: item.fields,
        warnings,
        confidence,
      }
    },
    async validate(record: NormalizedRecord): Promise<ValidationOutcome> {
      return validateRecord(record, { hasCitation: true, hasSnapshot: true })
    },
    async createCheckpoint(): Promise<Checkpoint> {
      return { stage: 'REVIEW_HANDOFF', cursor: 'fixture-complete' }
    },
    async reportHealth(): Promise<HealthReport> {
      return { ok: true, state: 'HEALTHY' }
    },
  }
}
