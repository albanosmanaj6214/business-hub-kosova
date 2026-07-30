// Polite, resilient fetch used by every adapter:
//  - explicit User-Agent
//  - per-request timeout
//  - small retry with backoff
//  - global rate limit (min gap between any two outbound requests)
//  - TLS chain repair for an explicit allowlist of trusted hosts that omit a
//    public intermediate CA (full verification is preserved; see ./tls)
import * as https from 'node:https'
import { caBundleWithIntermediates, needsChainRepair } from './tls'

const USER_AGENT =
  'KosovaBusinessHubBot/1.0 (+https://kosovabusinesses.aiaohub.com; opportunity indexer)'
const TIMEOUT_MS = 20000
const MAX_RETRIES = 2
const MIN_GAP_MS = 1200 // be gentle on institutional sites

let lastRequestAt = 0

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function rateLimit() {
  const now = Date.now()
  const wait = lastRequestAt + MIN_GAP_MS - now
  if (wait > 0) await sleep(wait)
  lastRequestAt = Date.now()
}

export interface FetchResult {
  ok: boolean
  status: number
  body: string
  contentType: string
}

const REQ_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'sq,en;q=0.8',
}

// node:https GET that trusts the system roots PLUS supplied public intermediates,
// so a valid leaf on a server with an incomplete chain still verifies fully
// (rejectUnauthorized stays true). Used only for allowlisted hosts. Follows a few
// redirects; JSON/text body returned as a string.
export function httpsGetWithCa(url: string, redirectsLeft = 3): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    let u: URL
    try {
      u = new URL(url)
    } catch (e) {
      reject(new Error(`invalid url ${url}`))
      return
    }
    const req = https.get(
      url,
      {
        headers: REQ_HEADERS,
        timeout: TIMEOUT_MS,
        ca: caBundleWithIntermediates(),
        // rejectUnauthorized defaults to true — verification is NOT disabled.
        servername: u.hostname,
      },
      (res) => {
        const status = res.statusCode ?? 0
        const loc = res.headers.location
        if (status >= 300 && status < 400 && loc && redirectsLeft > 0) {
          res.resume()
          const next = new URL(loc, url).toString()
          httpsGetWithCa(next, redirectsLeft - 1).then(resolve, reject)
          return
        }
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(Buffer.from(c)))
        res.on('end', () => {
          resolve({
            ok: status >= 200 && status < 300,
            status,
            body: Buffer.concat(chunks).toString('utf8'),
            contentType: String(res.headers['content-type'] ?? ''),
          })
        })
      },
    )
    req.on('timeout', () => req.destroy(new Error('request timeout')))
    req.on('error', reject)
  })
}

export async function politeFetch(url: string): Promise<FetchResult> {
  let lastErr: unknown = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await rateLimit()
    try {
      // Allowlisted hosts with a known-incomplete server chain use the CA-repair path.
      if (needsChainRepair(url)) {
        return await httpsGetWithCa(url)
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      try {
        const res = await fetch(url, {
          headers: REQ_HEADERS,
          signal: controller.signal,
          redirect: 'follow',
        })
        clearTimeout(timer)
        const body = await res.text()
        return {
          ok: res.ok,
          status: res.status,
          body,
          contentType: res.headers.get('content-type') ?? '',
        }
      } finally {
        clearTimeout(timer)
      }
    } catch (e) {
      lastErr = e
      if (attempt < MAX_RETRIES) await sleep(800 * (attempt + 1))
    }
  }
  throw new Error(`fetch failed for ${url}: ${String((lastErr as Error)?.message ?? lastErr)}`)
}

export async function politeFetchJson<T = unknown>(url: string): Promise<T> {
  const r = await politeFetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
  return JSON.parse(r.body) as T
}
