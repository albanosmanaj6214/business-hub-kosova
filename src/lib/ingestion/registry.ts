// Canonical adapter registry. EXPLICIT + closed: adapters are registered here by a
// stable identifier and matched to a Source.code by an explicit predicate. There is
// NO inference of an adapter from an arbitrary user-provided path or module — an
// unknown code resolves to null and the run service refuses it.
import type { IngestionAdapter } from './core/contracts'
import { createAskdataAdapter } from './sources/askdata/adapter'

export type AdapterStatus = 'draft' | 'available'

export interface AdapterEntry {
  /** Stable adapter identifier (not user-controlled). */
  id: string
  family: string
  /** DRAFT adapters may be dry-run only (never a production real import/schedule). */
  status: AdapterStatus
  description: string
  /** Which Source.code(s) this adapter serves (explicit, closed match). */
  matchesCode: (code: string) => boolean
  /** Factory for a fresh adapter instance. */
  create: () => IngestionAdapter
}

const REGISTRY: readonly AdapterEntry[] = Object.freeze([
  {
    id: 'askdata-external-trade',
    family: 'jsonstat',
    status: 'draft', // ASKdata stays DRAFT/inactive; dry-run / isolated QA only.
    description: 'ASK PxWeb external-trade turnover (JSON-stat). DRAFT/inactive.',
    matchesCode: (code) => code === 'ASKDATA_EXTERNAL_TRADE' || code === 'ASKDATA_PILOT',
    create: () => createAskdataAdapter(),
  },
])

export function getAdapterEntry(code: string): AdapterEntry | null {
  if (!code) return null
  return REGISTRY.find((e) => e.matchesCode(code)) ?? null
}

export function hasAdapter(code: string): boolean {
  return getAdapterEntry(code) != null
}

export function adapterIsDraft(code: string): boolean {
  const e = getAdapterEntry(code)
  return e != null && e.status === 'draft'
}

/** Admin-facing availability list (no factories / predicates exposed). */
export function listAdapters(): Array<Pick<AdapterEntry, 'id' | 'family' | 'status' | 'description'>> {
  return REGISTRY.map(({ id, family, status, description }) => ({ id, family, status, description }))
}
