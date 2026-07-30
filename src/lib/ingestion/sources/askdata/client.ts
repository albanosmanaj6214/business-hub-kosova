// SSRF-safe PxWeb client for ASKdata. Reuses the Phase 1 SSRF gate
// (assertSafeUrl) + the Phase 2 bounded-retry helper, WITHOUT modifying the
// (closed) Phase 2 core. GET for metadata, POST for the data query. No redirects
// are followed on POST; size + timeout are capped; JSON only.
import { createHash } from 'node:crypto'
import { assertSafeUrl, UnsafeUrlError } from '../../safe-url'
import { IngestionError, sanitizeError } from '../../core/errors'
import { withRetry, classifyHttpError, type RetryOptions } from '../../core/retry'

const UA = 'KosovaBusinessHubBot/1.0 (+ingestion-askdata-pilot)'

export interface PxWebResult {
  status: number
  contentType: string | null
  bodyText: string
  sizeBytes: number
  checksum: string
  etag: string | null
  lastModified: string | null
  retrievedAt: string
}

export interface PxWebFetchOptions {
  timeoutMs?: number
  maxBytes?: number
  retry?: RetryOptions
  now?: () => number
}

async function request(url: string, init: RequestInit, opts: PxWebFetchOptions): Promise<PxWebResult> {
  const timeoutMs = opts.timeoutMs ?? 20_000
  const maxBytes = opts.maxBytes ?? 5_000_000
  const now = opts.now ?? Date.now
  return withRetry(async () => {
    await assertSafeUrl(url) // SSRF gate
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let res: Response
    try {
      res = await fetch(url, { ...init, redirect: 'manual', signal: controller.signal, cache: 'no-store', headers: { 'user-agent': UA, accept: 'application/json', ...(init.headers as Record<string, string> | undefined) } })
    } finally {
      clearTimeout(timer)
    }
    if (res.status >= 300 && res.status < 400) throw new IngestionError('HTTP_ERROR', 'Ridrejtim i papritur nga PxWeb.')
    if (res.status === 429 || res.status >= 500) throw classifyHttpError(res.status)
    if (res.status >= 400) throw classifyHttpError(res.status)
    const contentType = res.headers.get('content-type')
    if (contentType && !/json/i.test(contentType)) throw new IngestionError('CONTENT_TYPE', `Pritej JSON, u mor: ${contentType}`)
    const reader = res.body?.getReader()
    const chunks: Buffer[] = []
    let total = 0
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > maxBytes) { await reader.cancel(); throw new IngestionError('TOO_LARGE', 'Përgjigjja tejkalon kufirin.') }
        chunks.push(Buffer.from(value))
      }
    }
    const bodyText = Buffer.concat(chunks).toString('utf-8')
    return {
      status: res.status, contentType, bodyText, sizeBytes: total,
      checksum: createHash('sha256').update(bodyText, 'utf8').digest('hex'),
      etag: res.headers.get('etag'), lastModified: res.headers.get('last-modified'),
      retrievedAt: new Date(now()).toISOString(),
    }
  }, opts.retry).catch((err) => {
    if (err instanceof UnsafeUrlError) throw new IngestionError('UNSAFE_URL', err.message)
    if (err instanceof IngestionError) throw err
    throw new IngestionError('NETWORK', sanitizeError(err))
  })
}

export function pxwebGet(url: string, opts: PxWebFetchOptions = {}): Promise<PxWebResult> {
  return request(url, { method: 'GET' }, opts)
}

export function pxwebPost(url: string, body: unknown, opts: PxWebFetchOptions = {}): Promise<PxWebResult> {
  return request(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }, opts)
}
