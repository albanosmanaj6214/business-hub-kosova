import { describe, it, expect, vi, afterEach } from 'vitest'
import { canonicalFetch } from './fetch'
import { IngestionError } from './errors'

// Public IP literal → the real SSRF gate (assertSafeUrl) passes without DNS,
// and fetch is mocked so no network is used.
const PUB = 'https://93.184.216.34/'
const ref = (url = PUB) => ({ id: 'r', url })
const noSleep = async () => {}
afterEach(() => vi.unstubAllGlobals())

describe('canonicalFetch — SSRF + robustness', () => {
  it('rejects a redirect whose target is a private address', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/' } })))
    await expect(canonicalFetch(ref(), { retry: { maxAttempts: 1, sleep: noSleep } })).rejects.toMatchObject({ code: 'UNSAFE_URL' })
  })
  it('enforces the redirect limit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 302, headers: { location: 'https://93.184.216.35/' } })))
    await expect(canonicalFetch(ref(), { maxRedirects: 2, retry: { maxAttempts: 1, sleep: noSleep } })).rejects.toBeInstanceOf(IngestionError)
  })
  it('enforces the max response size', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(5000), { status: 200, headers: { 'content-type': 'text/plain' } })))
    await expect(canonicalFetch(ref(), { maxBytes: 100, retry: { maxAttempts: 1, sleep: noSleep } })).rejects.toMatchObject({ code: 'TOO_LARGE' })
  })
  it('enforces the content-type policy', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 200, headers: { 'content-type': 'text/html' } })))
    await expect(canonicalFetch(ref(), { allowedContentTypes: ['application/json'], retry: { maxAttempts: 1, sleep: noSleep } })).rejects.toMatchObject({ code: 'CONTENT_TYPE' })
  })
  it('returns fromCache on a 304 conditional response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 304 })))
    const r = await canonicalFetch(ref(), { etag: '"x"', retry: { maxAttempts: 1, sleep: noSleep } })
    expect(r.fromCache).toBe(true)
    expect(r.status).toBe(304)
  })
  it('detects a blocked / CAPTCHA / maintenance page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Just a moment... captcha</html>', { status: 200, headers: { 'content-type': 'text/html' } })))
    await expect(canonicalFetch(ref(), { retry: { maxAttempts: 1, sleep: noSleep } })).rejects.toMatchObject({ code: 'BLOCKED_PAGE' })
  })
  it('retries a 5xx then succeeds, returning body + checksum + etag/last-modified', async () => {
    let n = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      n++
      if (n < 2) return new Response('err', { status: 500 })
      return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json', etag: '"v1"', 'last-modified': 'Wed, 01 Jul 2026 00:00:00 GMT' } })
    }))
    const r = await canonicalFetch(ref(), { retry: { maxAttempts: 3, sleep: noSleep, rng: () => 0 } })
    expect(r.status).toBe(200)
    expect(r.bodyText).toContain('ok')
    expect(r.etag).toBe('"v1"')
    expect(r.lastModified).toContain('2026')
    expect(r.checksum).toHaveLength(64)
    expect(n).toBe(2)
  })
})
