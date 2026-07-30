// Error classification + sanitization for the ingestion core. Sanitized messages
// never contain secrets, tokens, raw bodies, IPs, or stack traces.
export type IngestionErrorCode =
  | 'UNSAFE_URL'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'HTTP_ERROR'
  | 'TOO_LARGE'
  | 'CONTENT_TYPE'
  | 'BLOCKED_PAGE'
  | 'PARSE'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'CIRCUIT_OPEN'
  | 'CANCELLED'
  | 'UNKNOWN'

export class IngestionError extends Error {
  code: IngestionErrorCode
  retryable: boolean
  constructor(code: IngestionErrorCode, message: string, retryable = false) {
    super(message)
    this.name = 'IngestionError'
    this.code = code
    this.retryable = retryable
  }
}

const RETRYABLE_CODES: ReadonlySet<IngestionErrorCode> = new Set<IngestionErrorCode>([
  'TIMEOUT',
  'NETWORK',
  'RATE_LIMITED',
  'HTTP_ERROR', // only 5xx/429 are constructed with this + retryable=true
])

export function isRetryable(err: unknown): boolean {
  if (err instanceof IngestionError) return err.retryable || RETRYABLE_CODES.has(err.code)
  const name = (err as { name?: string })?.name
  if (name === 'TimeoutError' || name === 'AbortError') return true
  if (name === 'TypeError') return true // fetch network failure
  return false
}

/** A safe, user/log-facing message. Never leaks internal detail. */
export function sanitizeError(err: unknown): string {
  if (err instanceof IngestionError) return err.message
  const name = (err as { name?: string })?.name
  if (name === 'TimeoutError' || name === 'AbortError') return 'Koha e pritjes skadoi.'
  if (name === 'TypeError') return 'Lidhja dështoi (host i paarritshëm).'
  return 'Gabim gjatë procesit të importimit.'
}

/** Redact anything that looks like a token/secret/URL-credential from free text. */
export function redactSecrets(text: string): string {
  return text
    .replace(/(secret|token|apikey|api_key|password|authorization)\s*[=:]\s*\S+/gi, '$1=[redacted]')
    .replace(/\/\/[^/@\s]+:[^/@\s]+@/g, '//[redacted]@')
}
