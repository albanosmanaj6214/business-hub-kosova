// Reusable bounded retry with exponential backoff + jitter, plus a token-bucket
// rate limiter and a circuit breaker. All clocks/rng are injectable so the whole
// module is deterministic under test.
import { isRetryable, IngestionError } from './errors'

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  retryAfterMs?: (err: unknown) => number | null
  rng?: () => number
  sleep?: (ms: number) => Promise<void>
  isRetryable?: (err: unknown) => boolean
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export async function withRetry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3
  const base = opts.baseDelayMs ?? 300
  const max = opts.maxDelayMs ?? 10_000
  const rng = opts.rng ?? Math.random
  const sleep = opts.sleep ?? realSleep
  const retryable = opts.isRetryable ?? isRetryable
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt)
    } catch (err) {
      lastErr = err
      if (attempt >= maxAttempts || !retryable(err)) throw err
      const retryAfter = opts.retryAfterMs?.(err) ?? null
      const backoff = Math.min(max, base * 2 ** (attempt - 1))
      const jitter = Math.floor(rng() * base)
      await sleep(retryAfter != null ? retryAfter : backoff + jitter)
    }
  }
  throw lastErr
}

export function parseRetryAfterHeader(value: string | null | undefined, now = Date.now()): number | null {
  if (!value) return null
  const secs = Number(value)
  if (!Number.isNaN(secs)) return Math.max(0, secs * 1000)
  const date = Date.parse(value)
  if (!Number.isNaN(date)) return Math.max(0, date - now)
  return null
}

// --- Token-bucket rate limiter ---
export class RateLimiter {
  private tokens: number
  private lastRefill: number
  constructor(private ratePerMin: number, private now: () => number = Date.now, private burst = ratePerMin) {
    this.tokens = burst
    this.lastRefill = now()
  }
  tryRemove(count = 1): boolean {
    const t = this.now()
    const elapsedMin = (t - this.lastRefill) / 60_000
    this.tokens = Math.min(this.burst, this.tokens + elapsedMin * this.ratePerMin)
    this.lastRefill = t
    if (this.tokens >= count) { this.tokens -= count; return true }
    return false
  }
}

// --- Circuit breaker ---
export type CircuitState = 'closed' | 'open' | 'half_open'
export class CircuitBreaker {
  private failures = 0
  private state: CircuitState = 'closed'
  private openedAt = 0
  constructor(
    private threshold = 5,
    private cooldownMs = 60_000,
    private now: () => number = Date.now,
  ) {}
  get currentState(): CircuitState {
    if (this.state === 'open' && this.now() - this.openedAt >= this.cooldownMs) this.state = 'half_open'
    return this.state
  }
  allowRequest(): boolean {
    return this.currentState !== 'open'
  }
  recordSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }
  recordFailure(): void {
    this.failures += 1
    if (this.failures >= this.threshold) { this.state = 'open'; this.openedAt = this.now() }
  }
}

export function classifyHttpError(status: number): IngestionError {
  if (status === 429) return new IngestionError('RATE_LIMITED', `HTTP ${status}`, true)
  if (status >= 500) return new IngestionError('HTTP_ERROR', `HTTP ${status}`, true)
  return new IngestionError('HTTP_ERROR', `HTTP ${status}`, false)
}
