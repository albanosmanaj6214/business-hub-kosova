// Polite, resilient fetch used by every adapter:
//  - explicit User-Agent
//  - per-request timeout
//  - small retry with backoff
//  - global rate limit (min gap between any two outbound requests)

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

export async function politeFetch(url: string): Promise<FetchResult> {
  let lastErr: unknown = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await rateLimit()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
          'Accept-Language': 'sq,en;q=0.8',
        },
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
    } catch (e) {
      clearTimeout(timer)
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
