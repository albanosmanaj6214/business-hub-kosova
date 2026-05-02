/**
 * Minimal types for Phase 11 scraper. The IStrategy / Runner / Registry
 * abstractions are deferred until we have at least two real strategies to
 * compare (Rule of Three).
 */

export type OpportunityType = 'GRANT' | 'FAIR' | 'REGULATION'

/**
 * LEGACY: Bridge data for the old `Grant` and `TradeFair` tables that the
 * existing UI still reads. The bridge in `route.ts` consumes these fields
 * to keep legacy tables populated.
 *
 * @deprecated Removed in Phase 13 when UI migrates to the `Opportunity` table.
 */
export interface LegacyMeta {
  provider?: string
  sectors?: string[]
  tags?: string[]
  country?: string
  titleSq?: string | null
  descriptionSq?: string | null
  // FAIR-only
  location?: string
  startDate?: Date
  endDate?: Date
  website?: string
}

export interface OpportunityInput {
  /** Stable dedup key. For KIESA: sha1("KIESA:" + itemId). */
  externalId: string
  type: OpportunityType
  title: string
  description?: string | null
  deadline?: Date | null
  amount?: string | null
  currency?: string | null
  eligibility?: string | null
  /** Absolute URL to the source detail page. */
  sourceUrl: string
  /**
   * LEGACY: extra fields needed to keep `Grant` / `TradeFair` populated.
   * @deprecated Removed in Phase 13.
   */
  legacy?: LegacyMeta
}
