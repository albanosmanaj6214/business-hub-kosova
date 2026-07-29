// Phase 1: SSRF-safe URL validation + fetch for admin-controlled source URLs
// and connection tests. Fixes the Phase 0 SSRF findings. No insecureHTTPParser.
import { lookup } from 'node:dns/promises'
import net from 'node:net'

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeUrlError'
  }
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'ip6-localhost', 'ip6-loopback', 'metadata.google.internal'])

/** True for loopback, private, link-local, CGNAT, multicast, reserved, or metadata IPs. */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number)
    if (p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true
    if (p[0] === 0) return true // "this" network
    if (p[0] === 10) return true // private
    if (p[0] === 127) return true // loopback
    if (p[0] === 169 && p[1] === 254) return true // link-local incl. 169.254.169.254 metadata
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true // private
    if (p[0] === 192 && p[1] === 168) return true // private
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true // CGNAT
    if (p[0] >= 224) return true // multicast + reserved
    return false
  }
  if (net.isIPv6(ip)) {
    const a = ip.toLowerCase()
    if (a === '::1' || a === '::') return true // loopback / unspecified
    if (a.startsWith('fe80')) return true // link-local
    if (a.startsWith('fc') || a.startsWith('fd')) return true // unique local
    if (a.startsWith('ff')) return true // multicast
    if (a.startsWith('::ffff:')) {
      // IPv4-mapped IPv6 — validate the embedded IPv4
      const tail = a.slice('::ffff:'.length)
      if (net.isIPv4(tail)) return isPrivateOrReservedIp(tail)
    }
    return false
  }
  return true // not a valid IP literal -> treat as unsafe
}

export interface AssertSafeUrlOptions {
  allowedProtocols?: string[]
}

/**
 * Validate a URL for outbound fetch. Blocks non-http(s), embedded credentials,
 * blocked hostnames, and any hostname that is (or resolves to) a private/
 * reserved/metadata address. Hostnames are DNS-resolved and EVERY resolved
 * address is checked (DNS-rebinding defense). IP literals are checked directly.
 */
export async function assertSafeUrl(raw: string, opts: AssertSafeUrlOptions = {}): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new UnsafeUrlError('URL e pavlefshme')
  }
  const protocols = opts.allowedProtocols ?? ['http:', 'https:']
  if (!protocols.includes(url.protocol)) throw new UnsafeUrlError(`Protokoll i palejuar: ${url.protocol}`)
  if (url.username || url.password) throw new UnsafeUrlError('Kredencialet e ngulitura në URL nuk lejohen')

  const host = url.hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '')
  if (!host) throw new UnsafeUrlError('Host bosh')
  if (BLOCKED_HOSTNAMES.has(host)) throw new UnsafeUrlError('Host i bllokuar')

  if (net.isIP(host)) {
    if (isPrivateOrReservedIp(host)) throw new UnsafeUrlError('Adresë private/e rezervuar e bllokuar')
    return url
  }

  let addresses: { address: string }[]
  try {
    addresses = await lookup(host, { all: true })
  } catch {
    throw new UnsafeUrlError('Hosti nuk u zgjidh (DNS)')
  }
  if (addresses.length === 0) throw new UnsafeUrlError('DNS bosh')
  for (const a of addresses) {
    if (isPrivateOrReservedIp(a.address)) throw new UnsafeUrlError('Hosti zgjidhet në adresë private/e rezervuar')
  }
  return url
}

export interface SafeFetchOptions {
  maxBytes?: number
  timeoutMs?: number
  maxRedirects?: number
  allowedContentTypes?: string[]
}

export interface SafeFetchResult {
  status: number
  contentType: string | null
  body: string
  finalUrl: string
}

/** SSRF-safe fetch: re-validates every hop (including redirects), caps bytes + time. */
export async function safeFetch(raw: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const maxBytes = opts.maxBytes ?? 5_000_000
  const timeoutMs = opts.timeoutMs ?? 15_000
  const maxRedirects = opts.maxRedirects ?? 3

  let currentUrl = raw
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await assertSafeUrl(currentUrl) // validate EVERY hop
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': 'KosovaBusinessHubBot/1.0 (+source-governance)' },
    })

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) throw new UnsafeUrlError('Ridrejtim pa Location')
      currentUrl = new URL(loc, url).toString()
      continue
    }

    const contentType = res.headers.get('content-type')
    if (opts.allowedContentTypes && contentType && !opts.allowedContentTypes.some((t) => contentType.includes(t))) {
      throw new UnsafeUrlError(`Content-type i palejuar: ${contentType}`)
    }

    const reader = res.body?.getReader()
    const chunks: Buffer[] = []
    let total = 0
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > maxBytes) {
          await reader.cancel()
          throw new UnsafeUrlError('Përgjigjja e tejkalon kufirin e madhësisë')
        }
        chunks.push(Buffer.from(value))
      }
    }
    return { status: res.status, contentType, body: Buffer.concat(chunks).toString('utf-8'), finalUrl: url.toString() }
  }
  throw new UnsafeUrlError('Shumë ridrejtime')
}

export interface ConnectionProbe {
  ok: boolean
  status: number | null
  contentType: string | null
  sizeBytes: number | null
  redirectCount: number
  durationMs: number
  error?: string
}

/**
 * Admin-facing Test Connection: SSRF-guarded probe returning only safe, non-
 * sensitive metrics. Never returns internal IPs, secret values, response bodies,
 * or raw stack traces.
 */
export async function probeConnection(raw: string, opts: SafeFetchOptions = {}): Promise<ConnectionProbe> {
  const started = Date.now()
  const maxBytes = opts.maxBytes ?? 2_000_000
  const timeoutMs = opts.timeoutMs ?? 12_000
  const maxRedirects = opts.maxRedirects ?? 3
  let currentUrl = raw
  let redirectCount = 0
  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const url = await assertSafeUrl(currentUrl) // re-validate EVERY hop (incl. redirects)
      const res = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'user-agent': 'KosovaBusinessHubBot/1.0 (+source-governance)' },
      })
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) return { ok: false, status: res.status, contentType: null, sizeBytes: null, redirectCount, durationMs: Date.now() - started, error: 'Ridrejtim pa Location' }
        redirectCount++
        currentUrl = new URL(loc, url).toString()
        continue
      }
      // read up to the cap only to measure size safely
      const reader = res.body?.getReader()
      let total = 0
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          total += value.byteLength
          if (total > maxBytes) { await reader.cancel(); break }
        }
      }
      return { ok: res.status >= 200 && res.status < 400, status: res.status, contentType: res.headers.get('content-type'), sizeBytes: total, redirectCount, durationMs: Date.now() - started }
    }
    return { ok: false, status: null, contentType: null, sizeBytes: null, redirectCount, durationMs: Date.now() - started, error: 'Shumë ridrejtime' }
  } catch (e) {
    return { ok: false, status: null, contentType: null, sizeBytes: null, redirectCount, durationMs: Date.now() - started, error: sanitizeFetchError(e) }
  }
}

/** Convert any fetch/validation error into a safe, user-facing Albanian message (no IPs, no stack, no secrets). */
export function sanitizeFetchError(e: unknown): string {
  if (e instanceof UnsafeUrlError) return e.message
  const name = (e as { name?: string })?.name
  if (name === 'TimeoutError' || name === 'AbortError') return 'Koha e pritjes skadoi'
  if (name === 'TypeError') return 'Lidhja dështoi (host i paarritshëm)'
  return 'Lidhja dështoi'
}
