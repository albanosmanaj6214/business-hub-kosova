/**
 * Cloudflare Turnstile server-side verification + IP rate limiting.
 *
 * Turnstile is a free, privacy-friendly CAPTCHA. The client widget produces a
 * token via JS challenge; we POST it to siteverify with our secret key to
 * confirm it is valid and consumed exactly once.
 *
 * Rate limiter is an in-memory Map keyed by IP. Fine for a single Node
 * process behind one PM2 worker. Move to Redis if we scale to multiple workers.
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileVerifyResult {
  success: boolean
  error?: string
  codes?: string[]
}

/**
 * Verify a Turnstile token against Cloudflare's siteverify endpoint.
 * Returns success=false (never throws) so callers can map to a 400 response.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  if (!token || typeof token !== 'string') {
    return { success: false, error: 'Mungon verifikimi i sigurisë (Turnstile).' }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Fail closed: if the server is misconfigured we do not silently accept
    // unverified requests. Surfaces fast in logs.
    console.error('[turnstile] TURNSTILE_SECRET_KEY missing from env')
    return { success: false, error: 'Konfigurimi i sigurisë mungon në server.' }
  }

  const params = new URLSearchParams()
  params.set('secret', secret)
  params.set('response', token)
  if (remoteIp) params.set('remoteip', remoteIp)

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      cache: 'no-store',
    })

    const data = (await res.json()) as {
      success: boolean
      'error-codes'?: string[]
    }

    if (!data.success) {
      return {
        success: false,
        error: 'Verifikimi i sigurisë dështoi. Provo prap.',
        codes: data['error-codes'],
      }
    }

    return { success: true }
  } catch (err) {
    console.error('[turnstile] verify request failed:', err)
    return { success: false, error: 'Gabim rrjeti gjatë verifikimit të sigurisë.' }
  }
}

/**
 * Extract a best-effort client IP from a Next.js Request. Trusts standard
 * proxy headers because we sit behind Cloudflare. Falls back to a literal
 * marker so the rate limiter never keys on `undefined`.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

// ---------------------------------------------------------------------------
// In-memory rate limiter: max N hits per window per IP. Reset hourly.
// ---------------------------------------------------------------------------

interface Bucket {
  count: number
  resetAt: number
}

const REGISTRATION_BUCKETS: Map<string, Bucket> = new Map()
const REGISTRATION_LIMIT = 3
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/**
 * Check + increment the registration rate limit for an IP. Returns ok=false
 * if the IP has already hit REGISTRATION_LIMIT inside the window.
 */
export function checkRegistrationRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const existing = REGISTRATION_BUCKETS.get(ip)

  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + REGISTRATION_WINDOW_MS }
    REGISTRATION_BUCKETS.set(ip, fresh)
    return { ok: true, remaining: REGISTRATION_LIMIT - 1, resetAt: fresh.resetAt }
  }

  if (existing.count >= REGISTRATION_LIMIT) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return {
    ok: true,
    remaining: REGISTRATION_LIMIT - existing.count,
    resetAt: existing.resetAt,
  }
}

// Opportunistic sweep on every check so the map does not grow forever in a
// long-lived process. Cheap (single pass over a tiny map).
setInterval(() => {
  const now = Date.now()
  REGISTRATION_BUCKETS.forEach((bucket, ip) => {
    if (bucket.resetAt <= now) REGISTRATION_BUCKETS.delete(ip)
  })
}, REGISTRATION_WINDOW_MS).unref?.()
