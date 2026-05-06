import Anthropic from '@anthropic-ai/sdk'
import { PDFParse } from 'pdf-parse'
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

export async function extractFromPdf(opts: ExtractFromPdfOptions): Promise<ExtractedGrantFields> {
  const buf = await fetchTolerant(opts.pdfUrl)
  const parser = new PDFParse({ data: new Uint8Array(buf) })
  const parsed = await parser.getText()
  let text = (parsed.text ?? '').trim()
  if (!text) throw new Error(`PDF has no extractable text: ${opts.pdfUrl}`)
  if (text.length > MAX_PDF_CHARS) text = text.slice(0, MAX_PDF_CHARS) + '\n[...truncated]'

  const userText = [
    opts.context ? `Listing title: ${opts.context}` : '',
    `PDF source: ${opts.pdfUrl}`,
    '',
    '--- BEGIN PDF TEXT ---',
    text,
    '--- END PDF TEXT ---',
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

  let json: ExtractedGrantFields
  try {
    json = JSON.parse(raw) as ExtractedGrantFields
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON output: ${(err as Error).message}\nRaw: ${raw.slice(0, 300)}`)
  }
  return json
}

export function deadlineToDate(d: string | null): Date | null {
  if (!d) return null
  const parsed = new Date(`${d}T23:59:59Z`)
  return isNaN(parsed.getTime()) ? null : parsed
}
