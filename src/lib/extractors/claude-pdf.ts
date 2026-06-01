import Anthropic from '@anthropic-ai/sdk'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import * as cheerio from 'cheerio'
import * as https from 'node:https'
import * as http from 'node:http'
import * as zlib from 'node:zlib'
import { URL } from 'node:url'

const USER_AGENT = 'BusinessHubKosova/1.0 (+https://kosovabusinesses.aiaohub.com)'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_PDF_CHARS = 60_000
const MAX_REDIRECTS = 3

let _client: Anthropic | null = null
function client(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'placeholder') {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    _client = new Anthropic()
  }
  return _client
}

export interface ExtractedGrantFields {
  deadline: string | null
  amountMin: number | null
  amountMax: number | null
  currency: string | null
  eligibility: string | null
  sectors: string[]
  summary: string | null
  confidence: 'high' | 'medium' | 'low'
  notes: string | null
}

export interface ExtractFromPdfOptions {
  pdfUrl: string
  context?: string
}

const SYSTEM_PROMPT = `You extract structured data from Kosovo government grant call PDFs.
Documents are usually in Albanian, sometimes English.

Return STRICT JSON matching this schema:
{
  "deadline": "YYYY-MM-DD" | null,
  "amountMin": number | null,
  "amountMax": number | null,
  "currency": "EUR" | "USD" | null,
  "eligibility": string | null,
  "sectors": string[],
  "summary": string | null,
  "confidence": "high" | "medium" | "low",
  "notes": string | null
}

Rules:
- "deadline" is the FINAL application submission deadline. If multiple dates appear (publication, opening, closing, evaluation), pick the closing/submission date.
- Amounts: extract in EUR. If a range is given, set both amountMin and amountMax. If only one figure, set both equal.
- "eligibility": 1-2 sentences in Albanian describing who can apply (e.g., "NMVM të regjistruara në Kosovë me të paktën 1 vit aktivitet").
- "sectors": short tags (e.g., ["bujqësi"], ["TIK"], ["industri kreative"], ["turizëm"]). Empty array if generic.
- "summary": 2-3 sentence Albanian summary of what the grant funds.
- "confidence": "high" if all key fields explicit, "medium" if some inferred, "low" if document is fragmented or ambiguous.
- "notes": null OR a brief note on missing/ambiguous fields.
- NEVER invent values. Use null for anything not explicitly stated.
- Output ONLY the JSON object. No markdown, no commentary, no preamble.`

/**
 * KIESA's web server emits malformed HTTP headers (leading whitespace) that
 * undici (which powers global fetch) rejects. We bypass undici by using
 * node:https directly with insecureHTTPParser.
 */
export function fetchTolerant(url: string, redirects = 0): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'http:' ? http : https
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'http:' ? 80 : 443),
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
        },
        insecureHTTPParser: true,
      },
      (res) => {
        const status = res.statusCode ?? 0
        if (status >= 300 && status < 400 && res.headers.location && redirects < MAX_REDIRECTS) {
          const next = new URL(res.headers.location, url).toString()
          res.resume()
          fetchTolerant(next, redirects + 1).then(resolve, reject)
          return
        }
        if (status < 200 || status >= 300) {
          res.resume()
          reject(new Error(`HTTP ${status} for ${url}`))
          return
        }
        const chunks: Buffer[] = []
        const enc = (res.headers['content-encoding'] || '').toLowerCase()
        const stream =
          enc === 'gzip' ? res.pipe(zlib.createGunzip())
          : enc === 'deflate' ? res.pipe(zlib.createInflate())
          : res
        stream.on('data', (c: Buffer) => chunks.push(c))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      },
    )
    req.on('error', reject)
    req.end()
  })
}

export async function fetchTextTolerant(url: string): Promise<string> {
  const buf = await fetchTolerant(url)
  return buf.toString('utf-8')
}

/**
 * Lower-level: send arbitrary plain text from a grant call to Claude and
 * get the structured JSON back. Used by extractFromPdf and extractFromHtmlPage.
 */
export async function extractFromText(text: string, opts: { context?: string; sourceUrl?: string } = {}): Promise<ExtractedGrantFields> {
  let body = text.trim()
  if (!body) throw new Error('extractFromText: empty input')
  if (body.length > MAX_PDF_CHARS) body = body.slice(0, MAX_PDF_CHARS) + '\n[...truncated]'

  const userText = [
    opts.context ? `Listing title: ${opts.context}` : '',
    opts.sourceUrl ? `Source: ${opts.sourceUrl}` : '',
    '',
    '--- BEGIN DOCUMENT TEXT ---',
    body,
    '--- END DOCUMENT TEXT ---',
  ].filter(Boolean).join('\n')

  const resp = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userText }],
  })

  const textBlock = resp.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude response had no text block')
  }
  let raw = textBlock.text.trim()
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  try {
    return JSON.parse(raw) as ExtractedGrantFields
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON output: ${(err as Error).message}\nRaw: ${raw.slice(0, 300)}`)
  }
}

export async function extractFromPdf(opts: ExtractFromPdfOptions): Promise<ExtractedGrantFields> {
  const buf = await fetchTolerant(opts.pdfUrl)
  const parser = new PDFParse({ data: new Uint8Array(buf) })
  const parsed = await parser.getText()
  const text = (parsed.text ?? '').trim()
  if (!text) throw new Error(`PDF has no extractable text: ${opts.pdfUrl}`)
  return extractFromText(text, { context: opts.context, sourceUrl: opts.pdfUrl })
}

export async function extractFromDocx(opts: ExtractFromPdfOptions): Promise<ExtractedGrantFields> {
  const buf = await fetchTolerant(opts.pdfUrl)
  const result = await mammoth.extractRawText({ buffer: buf })
  const text = (result.value ?? '').trim()
  if (!text) throw new Error(`DOCX has no extractable text: ${opts.pdfUrl}`)
  return extractFromText(text, { context: opts.context, sourceUrl: opts.pdfUrl })
}

/** Picks the right extractor based on URL extension. Falls back to PDF. */
export async function extractFromDocument(opts: ExtractFromPdfOptions): Promise<ExtractedGrantFields> {
  const lower = opts.pdfUrl.split('?')[0].toLowerCase()
  if (lower.endsWith('.docx')) return extractFromDocx(opts)
  return extractFromPdf(opts)
}

export interface ExtractFromHtmlPageOptions {
  pageUrl: string
  /** CSS selectors tried in order; the first match's text content is sent to Claude. */
  articleSelectors?: string[]
  context?: string
}

/**
 * Fetches an HTML page (e.g. a WordPress thirrje article) and extracts
 * structured fields from the article body text.
 */
export async function extractFromHtmlPage(opts: ExtractFromHtmlPageOptions): Promise<ExtractedGrantFields> {
  const html = await fetchTextTolerant(opts.pageUrl)
  const $ = cheerio.load(html)
  // Strip nav/header/footer/script/style noise before reading.
  $('nav, header, footer, script, style, noscript, .menu, .navbar, #header, #footer').remove()

  const selectors = opts.articleSelectors ?? [
    'article .entry-content',
    'article',
    '.entry-content',
    '.post-content',
    'main',
    '#content',
  ]
  let text = ''
  for (const sel of selectors) {
    const $el = $(sel).first()
    if ($el.length) {
      text = $el.text().replace(/\s+/g, ' ').trim()
      if (text.length > 200) break
    }
  }
  if (!text) text = $('body').text().replace(/\s+/g, ' ').trim()
  if (!text) throw new Error(`HTML page has no extractable text: ${opts.pageUrl}`)

  return extractFromText(text, { context: opts.context, sourceUrl: opts.pageUrl })
}

export function deadlineToDate(d: string | null): Date | null {
  if (!d) return null
  const parsed = new Date(`${d}T23:59:59Z`)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Merges Claude-extracted fields into an OpportunityInput in place.
 * Used by every per-source enrich function so the merge rules stay consistent.
 */
export function mergeExtractedFields(
  item: { deadline?: Date | null; eligibility?: string | null; amount?: string | null; currency?: string | null; description?: string | null; legacy?: { sectors?: string[] } | null },
  extracted: ExtractedGrantFields,
): void {
  const deadline = deadlineToDate(extracted.deadline)
  if (deadline) item.deadline = deadline
  if (extracted.eligibility) item.eligibility = extracted.eligibility
  if (extracted.amountMin != null && extracted.amountMax != null) {
    item.amount = extracted.amountMin === extracted.amountMax
      ? `€${extracted.amountMin.toLocaleString('de-DE')}`
      : `€${extracted.amountMin.toLocaleString('de-DE')} - €${extracted.amountMax.toLocaleString('de-DE')}`
  }
  if (extracted.currency) item.currency = extracted.currency
  if (extracted.summary) item.description = extracted.summary
  if (extracted.sectors.length > 0) {
    const legacy = item.legacy ?? {}
    legacy.sectors = Array.from(new Set([...(legacy.sectors ?? []), ...extracted.sectors]))
    item.legacy = legacy
  }
}

/**
 * Common knob set applied across all scrapers' enrichment paths.
 */
export interface EnrichmentEnv {
  enabled: boolean
  max: number
}

export function enrichmentEnvFor(prefix: string): EnrichmentEnv {
  return {
    enabled: process.env[`${prefix}_ENRICH`] === 'true',
    max: Number(process.env[`${prefix}_ENRICH_MAX`] || '5'),
  }
}
