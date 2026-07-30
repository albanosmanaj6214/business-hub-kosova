// ASKdata (PxWeb) adapter implementing the Phase 2 canonical IngestionAdapter
// contract for Kosovo external-trade turnover (Export / Import / Trade balance by
// year). Offline mode (offlineBody) runs the whole pipeline without any network,
// so the default test suite never depends on the live service.
import type {
  AdapterContext, ConnectionResult, DiscoveredRef, FetchResult, ParsedItem,
  NormalizedRecord, ValidationOutcome, Checkpoint, HealthReport, IngestionAdapter,
} from '../../core/contracts'
import { validateRecord } from '../../core/validation'
import { checksumOf } from '../../core/snapshot'
import { pxwebGet, pxwebPost } from './client'
import { unflattenJsonStat, isJsonStatDataset, type JsonStatDataset } from './jsonstat'
import { tableUrl, buildTradeQuery, recentYears, ASKDATA_TRADE_TURNOVER, type AskdataDatasetConfig } from './config'

const ADAPTER_VERSION = 'askdata-adapter@1'
const PARSER_VERSION = 'jsonstat2-parser@1'

export interface AskdataAdapterOptions {
  cfg?: AskdataDatasetConfig
  years?: string[]
  yearsCount?: number
  offlineBody?: string // recorded json-stat2 body; when set NO network is used
}

interface TableMeta { variables: { code: string; values: string[]; time?: boolean }[] }

export function createAskdataAdapter(opts: AskdataAdapterOptions = {}): IngestionAdapter {
  const cfg = opts.cfg ?? ASKDATA_TRADE_TURNOVER
  const url = tableUrl(cfg)

  async function resolveYears(): Promise<string[]> {
    if (opts.years) return opts.years
    if (opts.offlineBody) {
      const ds = JSON.parse(opts.offlineBody) as JsonStatDataset
      return Object.keys(ds.dimension[cfg.timeDim].category.index)
    }
    // Live: read metadata, pick the most recent N years.
    const meta = JSON.parse((await pxwebGet(url)).bodyText) as TableMeta
    const time = meta.variables.find((v) => v.code === cfg.timeDim)
    const all = time?.values ?? []
    return all.slice(0, opts.yearsCount ?? 10)
  }

  return {
    name: 'askdata',
    version: ADAPTER_VERSION,
    family: 'jsonstat',

    async testConnection(): Promise<ConnectionResult> {
      const started = Date.now()
      try {
        const r = await pxwebGet(url)
        return { ok: r.status === 200, status: r.status, contentType: r.contentType, sizeBytes: r.sizeBytes, durationMs: Date.now() - started }
      } catch (e) {
        return { ok: false, durationMs: Date.now() - started, error: (e as Error).message }
      }
    },

    async discover(): Promise<DiscoveredRef[]> {
      const years = await resolveYears()
      return [{ id: cfg.code, url, datasetId: cfg.code, label: cfg.institution, meta: { years } }]
    },

    async fetch(ref: DiscoveredRef, ctx: AdapterContext): Promise<FetchResult> {
      const years = (ref.meta?.years as string[]) ?? (await resolveYears())
      if (opts.offlineBody) {
        return { ref, status: 200, contentType: 'application/json', bodyText: opts.offlineBody, sizeBytes: Buffer.byteLength(opts.offlineBody, 'utf8'), checksum: checksumOf(opts.offlineBody), etag: null, lastModified: null, retrievedAt: ctx.now().toISOString(), fromCache: false }
      }
      const r = await pxwebPost(url, buildTradeQuery(cfg, years), { now: () => ctx.now().getTime() })
      return { ref, status: r.status, contentType: r.contentType, bodyText: r.bodyText, sizeBytes: r.sizeBytes, checksum: r.checksum, etag: r.etag, lastModified: r.lastModified, retrievedAt: r.retrievedAt, fromCache: false }
    },

    async parse(fetched: FetchResult): Promise<ParsedItem[]> {
      const ds = JSON.parse(fetched.bodyText) as JsonStatDataset
      if (!isJsonStatDataset(ds)) throw new Error('Përgjigje jo-JSON-stat nga ASKdata')
      const updated = ds.updated ?? null
      return unflattenJsonStat(ds).map((obs) => {
        const year = obs.dims[cfg.timeDim].code
        const variableCode = obs.dims[cfg.variableDim].code
        return {
          sourceRecordId: `${cfg.code}:${year}:${variableCode}`,
          fields: {
            year, variableCode, indicator: cfg.variableLabels[variableCode] ?? obs.dims[cfg.variableDim].label,
            value: obs.value, unit: cfg.unit, currency: cfg.currency, country: cfg.country, updated,
          },
          parserVersion: PARSER_VERSION,
        }
      })
    },

    async normalize(item: ParsedItem): Promise<NormalizedRecord> {
      const f = item.fields as { year: string; variableCode: string; indicator: string; value: number | null; unit: string; currency: string; country: string; updated: string | null }
      const warnings: NormalizedRecord['warnings'] = []
      if (f.value == null) warnings.push({ field: 'value', reason: 'vlerë_mungon', confidence: 0.4 })
      return {
        canonical: {
          kind: 'trade_observation',
          title: `${f.indicator} ${f.year} — tregtia e jashtme e Kosovës`,
          url,
          publicationDate: f.updated ? String(f.updated).slice(0, 10) : undefined,
          identifiers: { officialId: item.sourceRecordId, canonicalUrl: url, sourceRecordId: item.sourceRecordId },
          payload: { year: Number(f.year), indicator: f.indicator, indicatorCode: f.variableCode, value: f.value, unit: f.unit, currency: f.currency, country: f.country },
        },
        original: item.fields,
        warnings,
        confidence: warnings.length ? 0.7 : 1,
      }
    },

    async validate(record: NormalizedRecord): Promise<ValidationOutcome> {
      return validateRecord(record, { hasCitation: true, hasSnapshot: true })
    },

    async createCheckpoint(): Promise<Checkpoint> {
      return { stage: 'REVIEW_HANDOFF', cursor: cfg.code }
    },

    async reportHealth(): Promise<HealthReport> {
      return { ok: true, state: 'HEALTHY' }
    },
  }
}
