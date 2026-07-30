/**
 * Cloudflare Turnstile server-side verification + in-memory login/registration
 * rate limiting.
 *
 * Security hotfix: production now FAILS CLOSED when Turnstile is misconfigured
 * (missing keys, or a known Cloudflare *test* key configured, or no expected
 * hostname). It also verifies the response hostname (and action when used).
 * The secret key is read at request time and never logged or returned.
 */

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Publicly documented Cloudflare Turnstile *test* keys. They always pass/fail
// deterministically and MUST NOT be used in production.
export const CLOUDFLARE_TEST_SITE_KEYS = new Set([
  '1x00000000000000000000AA', // visible, always passes
  '2x00000000000000000000AB', // visible, always blocks
  '3x00000000000000000000FF', // forces an interactive challenge
])
export const CLOUDFLARE_TEST_SECRET_KEYS = new Set([
  '1x0000000000000000000000000000000AA', // always passes
  '2x0000000000000000000000000000000AA', // always fails
  '3x0000000000000000000000000000000AA', // token already spent
])

export interface TurnstileVerifyResult {
  success: boolean
  error?: string
  codes?: string[]
}

export type TurnstileConfigReason =
  | 'ok'
  | 'missing_secret'
  | 'missing_site_key'
  | 'test_secret_in_production'
  | 'test_site_key_in_production'
  | 'missing_expected_hostname'

export interface TurnstileConfigStatus {
  ok: boolean
  reason: TurnstileConfigReason
}

/**
 * Whether we are running as production. An explicit APP_ENV overrides NODE_ENV
 * so an isolated prod-like verification can be run without a real prod build.
 */
export function isProductionRuntime(): boolean {
  if (process.env.APP_ENV) return process.env.APP_ENV === 'production'
  return process.env.NODE_ENV === 'production'
}

/**
 * Validate the Turnstile configuration. In production this refuses test keys,
 * missing keys, and a missing expected hostname. Development and automated
 * tests may use the official Cloudflare test keys.
 */
export function turnstileConfigStatus(): TurnstileConfigStatus {
  const secret = process.env.TURNSTILE_SECRET_KEY
  const site = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  if (!secret) return { ok: false, reason: 'missing_secret' }
  if (isProductionRuntime()) {
    if (!site) return { ok: false, reason: 'missing_site_key' }
    if (CLOUDFLARE_TEST_SECRET_KEYS.has(secret)) return { ok: false, reason: 'test_secret_in_production' }
    if (CLOUDFLARE_TEST_SITE_KEYS.has(site)) return { ok: false, reason: 'test_site_key_in_production' }
    if (!process.env.TURNSTILE_EXPECTED_HOSTNAME) return { ok: false, reason: 'missing_expected_hostname' }
  }
  return { ok: true, reason: 'ok' }
}

// Generic, non-leaking user-facing messages.
const MSG_CONFIG = 'Verifikimi i sigurisë nuk është i disponueshëm për momentin.'
const MSG_MISSING_TOKEN = 'Mungon verifikimi i sigurisë (Turnstile).'
const MSG_FAILED = 'Verifikimi i sigurisë dështoi. Provo prap.'
const MSG_NETWORK = 'Gabim rrjeti gjatë verifikimit të sigurisë.'

/**
 * Verify a Turnstile token against Cloudflare's siteverify endpoint.
 * Fails closed on misconfiguration, missing/invalid token, hostname/action
 * mismatch, or network/parse error. Never throws; never logs or returns the
 * secret or the token.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const cfg = turnstileConfigStatus()
  if (!cfg.ok) {
    // Fail closed. Log the reason CODE only, never any key value.
    console.error(`[turnstile] verification refused: misconfiguration (${cfg.reason})`)
    return { success: false, error: MSG_CONFIG }
  }

  if (!token || typeof token !== 'string') {
    return { success: false, error: MSG_MISSING_TOKEN }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY as string
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
      hostname?: string
      action?: string
      'error-codes'?: string[]
    }

    if (!data.success) {
      return { success: false, error: MSG_FAILED, codes: data['error-codes'] }
    }

    // Hostname pinning: in production this env var is required (see config).
    const expectedHost = process.env.TURNSTILE_EXPECTED_HOSTNAME
    if (expectedHost && data.hostname !== expectedHost) {
      console.error('[turnstile] hostname mismatch')
      return { success: false, error: MSG_FAILED }
    }

    // Action pinning: only enforced when the implementation configures one.
    const expectedAction = process.env.TURNSTILE_EXPECTED_ACTION
    if (expectedAction && data.action !== expectedAction) {
      console.error('[turnstile] action mismatch')
      return { success: false, error: MSG_FAILED }
    }

    return { success: true }
  } catch {
    // Fail closed. Never log the error object (avoids leaking request detail).
    console.error('[turnstile] verify request failed')
    return { success: false, error: MSG_NETWORK }
  }
}

/**
 * Extract a best-effort client IP from a Next.js Request. Trusts standard proxy
 * headers because we sit behind Cloudflare. Falls back to a literal marker so
 * the rate limiter never keys on `undefined`.
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
// In-memory rate limiter: max N hits per window per IP. Single Node process
// behind one PM2 worker; move to Redis if we scale to multiple workers.
// ---------------------------------------------------------------------------

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

function checkBucket(map: Map<string, Bucket>, ip: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = map.get(ip)
  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs }
    map.set(ip, fresh)
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt }
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }
  existing.count += 1
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

const REGISTRATION_BUCKETS: Map<string, Bucket> = new Map()
const REGISTRATION_LIMIT = 3
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const LOGIN_BUCKETS: Map<string, Bucket> = new Map()
const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/** Registration limit: max 3 per IP per hour. */
export function checkRegistrationRateLimit(ip: string): RateLimitResult {
  return checkBucket(REGISTRATION_BUCKETS, ip, REGISTRATION_LIMIT, REGISTRATION_WINDOW_MS)
}

/** Login limit: max 10 attempts per IP per 15 minutes (independent of Turnstile). */
export function checkLoginRateLimit(ip: string): RateLimitResult {
  return checkBucket(LOGIN_BUCKETS, ip, LOGIN_LIMIT, LOGIN_WINDOW_MS)
}

/** Test-only: clear all rate-limit state. */
export function __resetRateLimitsForTest(): void {
  REGISTRATION_BUCKETS.clear()
  LOGIN_BUCKETS.clear()
}

// Opportunistic sweep so the maps do not grow forever in a long-lived process.
setInterval(() => {
  const now = Date.now()
  for (const map of [REGISTRATION_BUCKETS, LOGIN_BUCKETS]) {
    map.forEach((bucket, ip) => {
      if (bucket.resetAt <= now) map.delete(ip)
    })
  }
}, REGISTRATION_WINDOW_MS).unref?.()
