// Standard shape every adapter returns. Decouples the rest of the system from
// how a particular source is fetched/parsed.

export type VerificationStatus = 'auto_publish' | 'needs_review' | 'published' | 'rejected'

export interface StandardOpportunity {
  title: string
  description?: string | null
  sourceName: string
  sourceUrl: string
  publishedAt?: Date | null
  deadline?: Date | null
  amountMin?: number | null
  amountMax?: number | null
  currency?: string | null
  sectors?: string[]
  supportTypes?: string[]
  eligibility?: string | null
  documents?: unknown
  attachments?: unknown
  originalTextSnippet?: string | null
  extractedFrom?: string | null
}

// Per-source adapter config, stored on Source.selectors (JSON).
export interface AdapterConfig {
  feedUrl?: string            // rss / wordpress base
  listUrl?: string            // html-list / pdf listing page (defaults to source.baseUrl)
  itemSelector?: string       // html-list: each opportunity row
  titleSelector?: string
  linkSelector?: string
  dateSelector?: string
  descriptionSelector?: string
  pdfLinkSelector?: string    // pdf: anchors to PDF files
  maxItems?: number
}

// Minimal slice of a Source row the adapters need.
export interface SourceLike {
  id: string
  code: string
  name: string
  baseUrl: string
  kind: string | null
  category: string
  keywords: string[]
  sectorsHint: string[]
  selectors: unknown
}

export type Adapter = (source: SourceLike, cfg: AdapterConfig) => Promise<StandardOpportunity[]>
