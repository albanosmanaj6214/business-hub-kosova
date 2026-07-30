import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  verifyTurnstile,
  turnstileConfigStatus,
  isProductionRuntime,
  checkLoginRateLimit,
  checkRegistrationRateLimit,
  __resetRateLimitsForTest,
} from './turnstile'

const REAL_SECRET = '0xAAAA_real_secret_value_not_a_test_key'
const REAL_SITE = '0xAAAA_real_site_key'
const HOST = 'kosovabusinesses.aiaohub.com'
const TEST_SECRET = '1x0000000000000000000000000000000AA'
const TEST_SITE = '1x00000000000000000000AA'

function mockSiteverify(body: Record<string, unknown>) {
  const spy = vi.fn(async () => ({ json: async () => body }))
  vi.stubGlobal('fetch', spy)
  return spy
}
function prod() {
  vi.stubEnv('APP_ENV', 'production')
}

beforeEach(() => {
  __resetRateLimitsForTest()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('turnstileConfigStatus — production fails closed', () => {
  it('missing secret', () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    expect(turnstileConfigStatus()).toEqual({ ok: false, reason: 'missing_secret' })
  })
  it('a known TEST secret in production is rejected', () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', TEST_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', REAL_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST)
    expect(turnstileConfigStatus()).toEqual({ ok: false, reason: 'test_secret_in_production' })
  })
  it('a known TEST site key in production is rejected', () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', REAL_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', TEST_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST)
    expect(turnstileConfigStatus()).toEqual({ ok: false, reason: 'test_site_key_in_production' })
  })
  it('missing site key in production', () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', REAL_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', ''); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST)
    expect(turnstileConfigStatus()).toEqual({ ok: false, reason: 'missing_site_key' })
  })
  it('missing expected hostname in production', () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', REAL_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', REAL_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', '')
    expect(turnstileConfigStatus()).toEqual({ ok: false, reason: 'missing_expected_hostname' })
  })
  it('a fully real production config is ok', () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', REAL_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', REAL_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST)
    expect(turnstileConfigStatus()).toEqual({ ok: true, reason: 'ok' })
  })
  it('development/test may use the official test keys', () => {
    // no APP_ENV; NODE_ENV = test
    vi.stubEnv('TURNSTILE_SECRET_KEY', TEST_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', TEST_SITE)
    expect(isProductionRuntime()).toBe(false)
    expect(turnstileConfigStatus()).toEqual({ ok: true, reason: 'ok' })
  })
})

describe('verifyTurnstile', () => {
  it('production refuses a test secret WITHOUT calling siteverify (fail closed)', async () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', TEST_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', REAL_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST)
    const spy = mockSiteverify({ success: true, hostname: HOST })
    const res = await verifyTurnstile('any-token', '1.2.3.4')
    expect(res.success).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })
  it('rejects a missing token', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', TEST_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', TEST_SITE)
    const spy = mockSiteverify({ success: true })
    const res = await verifyTurnstile(undefined)
    expect(res.success).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })
  it('rejects an invalid token (siteverify success=false) and surfaces codes', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', TEST_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', TEST_SITE)
    mockSiteverify({ success: false, 'error-codes': ['invalid-input-response'] })
    const res = await verifyTurnstile('bad-token')
    expect(res.success).toBe(false)
    expect(res.codes).toEqual(['invalid-input-response'])
  })
  it('accepts a valid token with matching hostname (production)', async () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', REAL_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', REAL_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST)
    mockSiteverify({ success: true, hostname: HOST, action: 'login' })
    const res = await verifyTurnstile('good-token', '1.2.3.4')
    expect(res.success).toBe(true)
  })
  it('rejects a hostname mismatch', async () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', REAL_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', REAL_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST)
    mockSiteverify({ success: true, hostname: 'evil.example.com' })
    const res = await verifyTurnstile('good-token')
    expect(res.success).toBe(false)
  })
  it('rejects an action mismatch when an expected action is configured', async () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', REAL_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', REAL_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST); vi.stubEnv('TURNSTILE_EXPECTED_ACTION', 'login')
    mockSiteverify({ success: true, hostname: HOST, action: 'register' })
    const res = await verifyTurnstile('good-token')
    expect(res.success).toBe(false)
  })
  it('fails closed when the verification service errors', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', TEST_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', TEST_SITE)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down 10.0.0.1') }))
    const res = await verifyTurnstile('good-token')
    expect(res.success).toBe(false)
    expect(res.error ?? '').not.toContain('10.0.0.1')
  })
  it('never leaks the secret or token, and never returns a secret field', async () => {
    prod(); vi.stubEnv('TURNSTILE_SECRET_KEY', REAL_SECRET); vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', REAL_SITE); vi.stubEnv('TURNSTILE_EXPECTED_HOSTNAME', HOST)
    mockSiteverify({ success: false, 'error-codes': ['bad'] })
    const token = 'SUPER-SECRET-TOKEN-123'
    const res = await verifyTurnstile(token, '9.9.9.9')
    const serialized = JSON.stringify(res)
    expect(serialized).not.toContain(REAL_SECRET)
    expect(serialized).not.toContain(token)
    expect(serialized).not.toContain('9.9.9.9')
    expect(res).not.toHaveProperty('secret')
  })
})

describe('login + registration rate limiting', () => {
  it('login allows up to the limit then blocks, per IP', () => {
    const ip = '203.0.113.7'
    let last = { ok: true } as { ok: boolean }
    for (let i = 0; i < 10; i++) last = checkLoginRateLimit(ip)
    expect(last.ok).toBe(true)
    expect(checkLoginRateLimit(ip).ok).toBe(false) // 11th blocked
    expect(checkLoginRateLimit('203.0.113.8').ok).toBe(true) // different IP is fresh
  })
  it('registration allows 3 then blocks', () => {
    const ip = '203.0.113.9'
    expect(checkRegistrationRateLimit(ip).ok).toBe(true)
    expect(checkRegistrationRateLimit(ip).ok).toBe(true)
    expect(checkRegistrationRateLimit(ip).ok).toBe(true)
    expect(checkRegistrationRateLimit(ip).ok).toBe(false)
  })
})
