// Source citation: full traceability from a factual record back to its origin.
export type CitationReviewStatus = 'unreviewed' | 'in_review' | 'approved' | 'rejected'

export interface CitationInput {
  sourceId: string
  sourceEndpointId?: string | null
  importRunId: string
  rawSnapshotId?: string | null
  entityType: string
  entityId?: string | null
  canonicalUrl?: string | null
  datasetId?: string | null
  officialId?: string | null
  documentTitle?: string | null
  pageReference?: string | null
  sourcePublicationDate?: string | null
  retrievedAt: string
  sourceVersion?: string | null
  reviewStatus?: CitationReviewStatus
  reviewer?: string | null
  // First-class statistical metadata (nullable; populated for statistical sources).
  datasetIdentifier?: string | null
  datasetTitle?: string | null
  referencePeriod?: string | null
  unit?: string | null
  currency?: string | null
  measureCode?: string | null
  measureLabel?: string | null
}

export function buildCitation(input: CitationInput): CitationInput {
  return { reviewStatus: 'unreviewed', ...input }
}

/** A record is traceable only if it links a source + run + a locator. */
export function isTraceable(c: CitationInput): boolean {
  return !!c.sourceId && !!c.importRunId && !!(c.canonicalUrl || c.officialId || c.datasetId || c.rawSnapshotId)
}
