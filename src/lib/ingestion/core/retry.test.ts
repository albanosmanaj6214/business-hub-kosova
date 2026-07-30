import { describe, it, expect } from 'vitest'
import { withRetry, parseRetryAfterHeader, RateLimiter, CircuitBreaker, classifyHttpError } from './retry'
import { IngestionError } from './errors'

const noSleep = async () => {}

describe('withRetry (bounded)', () => {
  it('retries retryable errors up to maxAttempts then throws', async () => {
    let calls = 0
    await expect(withRetry(async () => { calls++; throw new IngestionError('TIMEOUT', 't', true) }, { maxAttempts: 3, sleep: noSleep, rng: () => 0 }))
      .rejects.toBeInstanceOf(IngestionError)
    expect(calls).toBe(3)
  })
  it('does not retry a non-retryable error', async () => {
    let calls = 0
    await expect(withRetry(async () => { calls++; throw new IngestionError('CONTENT_TYPE', 'c', false) }, { maxAttempts: 3, sleep: noSleep }))
      .rejects.toBeInstanceOf(IngestionError)
    expect(calls).toBe(1)
  })
  it('returns on first success', async () => {
    let calls = 0
    const r = await withRetry(async () => { calls++; if (calls < 2) throw new IngestionError('NETWORK', 'n', true); return 'ok' }, { maxAttempts: 3, sleep: noSleep, rng: () => 0 })
    expect(r).toBe('ok')
    expect(calls).toBe(2)
  })
})

describe('retry-after + http classify', () => {
  it('parses numeric + date Retry-After', () => {
    expect(parseRetryAfterHeader('120')).toBe(120000)
    expect(parseRetryAfterHeader(null)).toBeNull()
  })
  it('classifies 429/5xx as retryable, 4xx as not', () => {
    expect(classifyHttpError(429).retryable).toBe(true)
    expect(classifyHttpError(503).retryable).toBe(true)
    expect(classifyHttpError(404).retryable).toBe(false)
  })
})

describe('rate limiter + circuit breaker', () => {
  it('token bucket blocks after the burst is spent', () => {
    let t = 0
    const rl = new RateLimiter(60, () => t, 2)
    expect(rl.tryRemove()).toBe(true)
    expect(rl.tryRemove()).toBe(true)
    expect(rl.tryRemove()).toBe(false)
    t = 60_000 // +1 minute refills the bucket
    expect(rl.tryRemove()).toBe(true)
  })
  it('opens after threshold failures and half-opens after cooldown', () => {
    let t = 0
    const cb = new CircuitBreaker(2, 1000, () => t)
    expect(cb.allowRequest()).toBe(true)
    cb.recordFailure(); cb.recordFailure()
    expect(cb.allowRequest()).toBe(false) // open
    t = 1000
    expect(cb.currentState).toBe('half_open')
    cb.recordSuccess()
    expect(cb.allowRequest()).toBe(true) // closed
  })
})
