// Canonical KIESA adapter — deterministic ingestion of the KIESA public-calls
// listing. NO paid AI is required for core extraction: title, type, official URL and
// stable identity come purely from HTML + regex classification reused from the legacy
// scraper (so classification stays in parity for reconciliation). Optional AI
// enrichment is intentionally NOT part of this adapter (it stays a separate, gated
// legacy step) so canonical ingestion never blocks on, or spends on, a model.
import * as cheerio from 'cheerio'
import { createHash } from 'node:crypto'
import * as https from 'node:https'
import { assertSafeUrl } from '../../safe-url'
import { validateRecord } from '../../core/validation'
import { classifyKiesaTitle } from '@/lib/scrapers/kiesa'
import { classifyAttachmentRole, type AttachmentRole } from '../../attachments/role'
import type {
  IngestionAdapter, AdapterContext, ConnectionResult, DiscoveredRef, FetchResult,
  ParsedItem, NormalizedRecord, ValidationOutcome, Checkpoint, HealthReport,
} from '../../core/contracts'

export const KIESA_BASE_URL = 'https://kiesa.rks-gov.net'
export const KIESA_LISTING_PATH = '/page.aspx?id=2,134'
const ADAPTER_VERSION = 'kiesa-canonical@1'
const PARSER_VERSION = 'kiesa-html@1'
const USER_AGENT = 'KosovaBusinessHubBot/1.0 (+https://kosovabusinesses.aiaohub.com)'
const ITEM_ID_RE = /id=2,5,(\d+)/i

function sha256(s: string): string { return createHash('sha256').update(s).digest('hex') }
/** Legacy externalId, reproduced so reconciliation can match legacy Opportunity rows. */
export function legacyExternalId(itemId: string): string { return createHash('sha1').update(`KIESA:${itemId}`).digest('hex') }
function absoluteUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) return href
  return href.startsWith('/') ? `${KIESA_BASE_URL}${href}` : `${KIESA_BASE_URL}/${href}`
}

// SSRF-gated tolerant GET. KIESA's IIS occasionally emits non-conforming HTTP
// headers that undici rejects, so use node:https with a lenient parser AFTER the
// SSRF gate. TLS verification stays on (default).
async function safeTolerantGet(rawUrl: string): Promise<{ status: number; body: string; contentType: string }> {
  const url = await assertSafeUrl(rawUrl)
  return new Promise((resolve, reject) => {
    const req = https.get(url.toString(), { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' }, timeout: 20000, insecureHTTPParser: true }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(Buffer.from(c)))
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8'), contentType: String(res.headers['content-type'] ?? '') }))
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
  })
}

// Binary-safe SSRF-gated GET for OFFICIAL ATTACHMENT files (.docx/.pdf/.xlsx/...).
// Returns raw bytes with a hard size cap so a hostile or oversized attachment cannot
// exhaust memory. TLS verification stays on; assertSafeUrl re-gates the URL first.
async function safeTolerantGetBinary(rawUrl: string, maxBytes = 30 * 1024 * 1024): Promise<{ status: number; buffer: Buffer; contentType: string }> {
  const url = await assertSafeUrl(rawUrl)
  return new Promise((resolve, reject) => {
    const req = https.get(url.toString(), { headers: { 'User-Agent': USER_AGENT, Accept: '*/*' }, timeout: 30000, insecureHTTPParser: true }, (res) => {
      const chunks: Buffer[] = []
      let total = 0
      res.on('data', (c) => {
        total += c.length
        if (total > maxBytes) { req.destroy(new Error('attachment exceeds size cap')); return }
        chunks.push(Buffer.from(c))
      })
      res.on('end', () => resolve({ status: res.statusCode ?? 0, buffer: Buffer.concat(chunks), contentType: String(res.headers['content-type'] ?? '') }))
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
  })
}

interface KiesaItem { itemId: string; title: string; url: string; type: 'GRANT' | 'FAIR' | 'REGULATION' }

/** Pure parser (no network) — unit-testable with a recorded listing fixture. */
export function parseKiesaListing(html: string): KiesaItem[] {
  const $ = cheerio.load(html)
  const out: KiesaItem[] = []
  const seen = new Set<string>()
  $('article.icon-teaser').each((_, el) => {
    const $link = $(el).find('h4 a').first()
    const title = $link.text().trim().replace(/\s+/g, ' ')
    const href = $link.attr('href') ?? ''
    const m = href.match(ITEM_ID_RE)
    if (!title || !m) return
    const cls = classifyKiesaTitle(title)
    if (cls === 'SKIP') return
    const itemId = m[1]
    if (seen.has(itemId)) return
    seen.add(itemId)
    out.push({ itemId, title, url: absoluteUrl(href), type: cls })
  })
  return out
}

export interface KiesaAdapterOptions { offlineBody?: string; baseUrl?: string }

export function createKiesaAdapter(opts: KiesaAdapterOptions = {}): IngestionAdapter {
  const listingUrl = `${opts.baseUrl ?? KIESA_BASE_URL}${KIESA_LISTING_PATH}`
  return {
    name: 'kiesa',
    version: ADAPTER_VERSION,
    family: 'html',

    async testConnection(): Promise<ConnectionResult> {
      const started = Date.now()
      if (opts.offlineBody) return { ok: true, status: 200, durationMs: 0 }
      try {
        const r = await safeTolerantGet(listingUrl)
        return { ok: r.status === 200, status: r.status, contentType: r.contentType, sizeBytes: Buffer.byteLength(r.body), durationMs: Date.now() - started }
      } catch (e) {
        return { ok: false, durationMs: Date.now() - started, error: (e as Error).message }
      }
    },

    async discover(): Promise<DiscoveredRef[]> {
      return [{ id: 'kiesa-listing', url: listingUrl, label: 'KIESA public calls' }]
    },

    async fetch(ref: DiscoveredRef, ctx: AdapterContext): Promise<FetchResult> {
      const body = opts.offlineBody ?? (await safeTolerantGet(ref.url ?? listingUrl)).body
      return { ref, status: 200, contentType: 'text/html', bodyText: body, sizeBytes: Buffer.byteLength(body), checksum: sha256(body), etag: null, lastModified: null, retrievedAt: ctx.now().toISOString(), fromCache: false }
    },

    async parse(fetched: FetchResult): Promise<ParsedItem[]> {
      return parseKiesaListing(fetched.bodyText).map((it) => ({
        sourceRecordId: it.itemId,
        fields: { itemId: it.itemId, title: it.title, url: it.url, type: it.type, legacyExternalId: legacyExternalId(it.itemId) },
        parserVersion: PARSER_VERSION,
      }))
    },

    async normalize(item: ParsedItem): Promise<NormalizedRecord> {
      const f = item.fields as { itemId: string; title: string; url: string; type: string; legacyExternalId: string }
      return {
        canonical: {
          kind: 'kiesa_opportunity',
          title: f.title,
          url: f.url,
          identifiers: { officialId: f.itemId, canonicalUrl: f.url, sourceRecordId: f.itemId },
          payload: { itemId: f.itemId, type: f.type, title: f.title, url: f.url, provider: 'KIESA', country: 'Kosovo', legacyExternalId: f.legacyExternalId, opportunityType: f.type },
          destination: 'opportunity',
        },
        original: item.fields,
        warnings: [],
        confidence: 1,
      }
    },

    async validate(record: NormalizedRecord): Promise<ValidationOutcome> {
      return validateRecord(record, { hasCitation: true, hasSnapshot: true })
    },

    async createCheckpoint(): Promise<Checkpoint> { return { stage: 'REVIEW_HANDOFF', cursor: 'kiesa-listing' } },
    async reportHealth(): Promise<HealthReport> { return { ok: true, state: 'HEALTHY' } },
  }
}

// ── Phase 4: deterministic DETAIL-page extraction (no AI) ────────────────────
export interface KiesaDetailFields {
  publicationDate: string | null // ISO date, only when unambiguous (dd/mm/yyyy)
  location: string | null        // e.g. "Prishtinë" preceding the date
  attachmentUrls: string[]       // ALL official attachment URLs (any format, not only PDF)
  attachments: Array<{ url: string; ext: string | null; label: string; role: AttachmentRole }>
  bodyText: string | null        // raw official summary text (not interpreted)
  // Substantive fields (deadline, amount, eligibility) live inside the PDF and are
  // NOT deterministically available here — left null (AI-only; see the scorecard).
  deadline: null
  amount: null
  eligibility: null
}

const DATE_RE = /(\d{1,2})\/(\d{1,2})\/(\d{4})/
const LOC_DATE_RE = /([A-Za-zëçÿÖüÄÀ-ſ]+),\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/

function toIsoDate(dd: string, mm: string, yyyy: string): string | null {
  const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00Z`)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

/** Pure detail parser (no network) — unit-testable with a recorded detail fixture. */
export function parseKiesaDetail(html: string): KiesaDetailFields {
  const $ = cheerio.load(html)
  // Search the whole page text for the single publication date/location line
  // ("Prishtinë, dd/mm/yyyy"); the summary uses the content region when present.
  const text = $('body').text().replace(/\s+/g, ' ').trim()
  const ci = $('.content-inner').first()
  const summary = (ci.length ? ci.text() : text).replace(/\s+/g, ' ').trim()

  let publicationDate: string | null = null
  let location: string | null = null
  const lm = text.match(LOC_DATE_RE)
  if (lm) { location = lm[1]; publicationDate = toIsoDate(lm[2], lm[3], lm[4]) }
  else { const dm = text.match(DATE_RE); if (dm) publicationDate = toIsoDate(dm[1], dm[2], dm[3]) }

  // ALL official downloadable attachments (KIESA frequently posts .doc/.docx/.xlsx,
  // not only PDF). The main call is NOT assumed to be the first link — role is inferred
  // from the anchor label + filename.
  const attachments: KiesaDetailFields['attachments'] = []
  const attachmentUrls: string[] = []
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href') ?? ''
    // Match by document EXTENSION only (KIESA stores media as <GUID>.<ext>). This
    // deliberately EXCLUDES image/screenshot links under the same /desk/inc/media/ path.
    if (!/\.(docx?|pdf|xlsx?|pptx?|zip)(?:$|[?#])/i.test(href)) return
    const url = absoluteUrl(href)
    if (attachmentUrls.includes(url)) return
    const label = $(a).text().replace(/\s+/g, ' ').trim()
    const ext = (url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? '').toLowerCase() || null
    attachmentUrls.push(url)
    attachments.push({ url, ext, label, role: classifyAttachmentRole(label, url) })
  })

  const bodyText = summary ? summary.slice(0, 1000) : null
  return { publicationDate, location, attachmentUrls, attachments, bodyText, deadline: null, amount: null, eligibility: null }
}

export interface EnrichedKiesaItem {
  itemId: string; title: string; url: string; type: string
  legacyExternalId: string
  detail: KiesaDetailFields
  detailHtml: string
}

/** SSRF-gated tolerant fetch of a KIESA detail page (offline map short-circuits). */
export async function fetchKiesaDetail(url: string, offline?: Record<string, string>, itemId?: string): Promise<string> {
  if (offline && itemId && offline[itemId] != null) return offline[itemId]
  return (await safeTolerantGet(url)).body
}

/** Exported wrapper of the SSRF-gated tolerant GET (for shadow/reconciliation). */
export async function safeTolerantGetPublic(url: string): Promise<{ status: number; body: string; contentType: string }> {
  return safeTolerantGet(url)
}

/** Binary-safe SSRF-gated fetch of an official attachment. An offline map (url -> bytes)
 *  short-circuits network access so shadow/tests stay bounded and deterministic. */
export async function fetchKiesaAttachment(url: string, offline?: Record<string, Buffer>): Promise<{ status: number; buffer: Buffer; contentType: string }> {
  if (offline && offline[url] != null) return { status: 200, buffer: offline[url], contentType: '' }
  return safeTolerantGetBinary(url)
}
