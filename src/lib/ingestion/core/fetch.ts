// Canonical safe-fetch layer. REUSES the approved Phase 1 SSRF gate
// (assertSafeUrl) on every hop, and adds: conditional requests, content-type
// policy, Retry-After + bounded retry, size cap, blocked-page detection, and a
// checksum. A 200 is NOT treated as success until content-type/size/body checks
// and the optional parser-accepts callback pass.
import { createHash } from 'node:crypto'
import { assertSafeUrl, UnsafeUrlError } from '../safe-url'
import { IngestionError, sanitizeError } from './errors'
import { withRetry, parseRetryAfterHeader, classifyHttpError, type RetryOptions } from './retry'
import type { DiscoveredRef, FetchResult } from './contracts'

export interface CanonicalFetchOptions {
  timeoutMs?: number
  maxBytes?: number
  maxRedirects?: number
  allowedContentTypes?: string[]
  etag?: string | null
  lastModified?: string | null
  userAgent?: string
  signal?: AbortSignal
  retry?: RetryOptions
  now?: () => number
  acceptBody?: (bodyText: string, contentType: string | null) => boolean
}

const DEFAULT_UA = 'KosovaBusinessHubBot/1.0 (+ingestion-core; contact: admin)'
const BLOCKED_MARKERS = [
  /just a moment/i, /cf-browser-verification/i, /captcha/i, /access denied/i,
  /site maintenance/i, /temporarily unavailable/i, /please (sign|log) in to continue/i,
]

function looksBlocked(body: string, contentType: string | null): boolean {
  if (contentType && !/text\/html|application\/xhtml/i.test(contentType)) return false
  const head = body.slice(0, 4000)
  return BLOCKED_MARKERS.some((re) => re.test(head))
}

/** SSRF-safe, feature-complete fetch of a single reference. */
export async function canonicalFetch(ref: DiscoveredRef, opts: CanonicalFetchOptions = {}): Promise<FetchResult> {
  const raw = ref.url
  if (!raw) throw new IngestionError('UNKNOWN', 'Referencë pa URL.')
  const timeoutMs = opts.timeoutMs ?? 15_000
  const maxBytes = opts.maxBytes ?? 5_000_000
  const maxRedirects = opts.maxRedirects ?? 3
  const now = opts.now ?? Date.now

  return withRetry(async () => {
    let currentUrl = raw
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const url = await assertSafeUrl(currentUrl) // SSRF gate on EVERY hop
      const headers: Record<string, string> = { 'user-agent': opts.userAgent ?? DEFAULT_UA }
      if (opts.etag) headers['if-none-match'] = opts.etag
      if (opts.lastModified) headers['if-modified-since'] = opts.lastModified

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      const signal = opts.signal ? anySignal([opts.signal, controller.signal]) : controller.signal
      let res: Response
      try {
        res = await fetch(url, { redirect: 'manual', headers, signal, cache: 'no-store' })
      } finally {
        clearTimeout(timer)
      }

      if (res.status === 304) {
        return { ref, status: 304, contentType: res.headers.get('content-type'), bodyText: '', sizeBytes: 0, checksum: '', etag: opts.etag ?? null, lastModified: opts.lastModified ?? null, retrievedAt: new Date(now()).toISOString(), fromCache: true }
      }
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) throw new IngestionError('HTTP_ERROR', 'Ridrejtim pa Location.')
        currentUrl = new URL(loc, url).toString()
        continue
      }
      if (res.status === 429) {
        const err = classifyHttpError(429)
        ;(err as IngestionError & { retryAfter?: number }).retryAfter = parseRetryAfterHeader(res.headers.get('retry-after'), now()) ?? undefined
        throw err
      }
      if (res.status >= 400) throw classifyHttpError(res.status)

      const contentType = res.headers.get('content-type')
      if (opts.allowedContentTypes && contentType && !opts.allowedContentTypes.some((t) => contentType.includes(t))) {
        throw new IngestionError('CONTENT_TYPE', `Content-type i palejuar: ${contentType}`)
      }

      // Read with a hard size cap.
      const reader = res.body?.getReader()
      const chunks: Buffer[] = []
      let total = 0
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          total += value.byteLength
          if (total > maxBytes) { await reader.cancel(); throw new IngestionError('TOO_LARGE', 'Përgjigjja tejkalon kufirin e madhësisë.') }
          chunks.push(Buffer.from(value))
        }
      }
      const bodyText = Buffer.concat(chunks).toString('utf-8')

      // A 200 is not success until the body passes these gates.
      if (looksBlocked(bodyText, contentType)) throw new IngestionError('BLOCKED_PAGE', 'Përgjigjja duket faqe bllokimi/CAPTCHA/mirëmbajtjeje.')
      if (opts.acceptBody && !opts.acceptBody(bodyText, contentType)) throw new IngestionError('PARSE', 'Trupi nuk kaloi kontrollin e parserit.')

      const checksum = createHash('sha256').update(bodyText, 'utf8').digest('hex')
      return {
        ref, status: res.status, contentType, bodyText, sizeBytes: total, checksum,
        etag: res.headers.get('etag'), lastModified: res.headers.get('last-modified'),
        retrievedAt: new Date(now()).toISOString(), fromCache: false,
      }
    }
    throw new IngestionError('NETWORK', 'Shumë ridrejtime.')
  }, {
    ...opts.retry,
    retryAfterMs: (err) => (err as { retryAfter?: number })?.retryAfter ?? null,
  }).catch((err) => {
    if (err instanceof UnsafeUrlError) throw new IngestionError('UNSAFE_URL', err.message)
    if (err instanceof IngestionError) throw err
    throw new IngestionError('NETWORK', sanitizeError(err))
  })
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const s of signals) {
    if (s.aborted) { controller.abort(); break }
    s.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}
