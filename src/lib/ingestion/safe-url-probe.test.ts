import { describe, it, expect, vi, afterEach } from 'vitest'
import { safeFetch, probeConnection, sanitizeFetchError, UnsafeUrlError } from '@/lib/ingestion/safe-url'

afterEach(() => vi.unstubAllGlobals())

// A public IP literal passes assertSafeUrl without DNS; fetch is mocked so no network is used.
describe('probeConnection / safeFetch (mocked fetch)', () => {
  it('rejects a redirect whose target is a private address', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/' } })))
    const p = await probeConnection('https://93.184.216.34/')
    expect(p.ok).toBe(false)
    expect(p.error ?? '').toMatch(/private|rezervuar/i)
  })
  it('enforces the redirect limit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 302, headers: { location: 'https://93.184.216.35/' } })))
    const p = await probeConnection('https://93.184.216.34/', { maxRedirects: 2 })
    expect(p.ok).toBe(false)
    expect(p.error ?? '').toMatch(/ridrejtime/i)
  })
  it('enforces the max response size (safeFetch throws)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(5000), { status: 200, headers: { 'content-type': 'text/plain' } })))
    await expect(safeFetch('https://93.184.216.34/', { maxBytes: 100 })).rejects.toBeInstanceOf(UnsafeUrlError)
  })
  it('returns safe metrics on a normal 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(50), { status: 200, headers: { 'content-type': 'application/json' } })))
    const p = await probeConnection('https://93.184.216.34/')
    expect(p).toMatchObject({ ok: true, status: 200, contentType: 'application/json', redirectCount: 0 })
    expect(typeof p.durationMs).toBe('number')
  })
})

describe('sanitizeFetchError', () => {
  it('never leaks internal IPs or stack detail', () => {
    expect(sanitizeFetchError(new UnsafeUrlError('mesazh i sigurt'))).toBe('mesazh i sigurt')
    expect(sanitizeFetchError({ name: 'TimeoutError' })).toMatch(/skadoi/)
    const masked = sanitizeFetchError(new Error('connect ECONNREFUSED 10.0.0.1:22'))
    expect(masked).not.toContain('10.0.0.1')
  })
})
