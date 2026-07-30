import { describe, it, expect } from 'vitest'
import { buildSnapshot, verifyChecksum, INLINE_SNAPSHOT_LIMIT_BYTES } from './snapshot'

describe('raw snapshot', () => {
  it('stores small payloads inline with a verifiable checksum', () => {
    const s = buildSnapshot({ sourceId: 's1', importRunId: 'r1', retrievedAt: '2026-07-01T00:00:00Z', bodyText: 'hello' })
    expect(s.storageKind).toBe('INLINE')
    expect(s.inlineBody).toBe('hello')
    expect(s.contentLength).toBe(5)
    expect(verifyChecksum('hello', s.checksum)).toBe(true)
    expect(verifyChecksum('tampered', s.checksum)).toBe(false)
  })
  it('does NOT inline a payload over the documented cap', () => {
    const big = 'x'.repeat(INLINE_SNAPSHOT_LIMIT_BYTES + 1)
    const s = buildSnapshot({ sourceId: 's1', importRunId: 'r1', retrievedAt: '2026-07-01T00:00:00Z', bodyText: big })
    expect(s.storageKind).toBe('OBJECT')
    expect(s.inlineBody).toBeNull()
  })
  it('uses a FILE reference when one is provided', () => {
    const s = buildSnapshot({ sourceId: 's1', importRunId: 'r1', retrievedAt: '2026-07-01T00:00:00Z', bodyText: 'hi', storageRef: '/snapshots/x.bin' })
    expect(s.storageKind).toBe('FILE')
    expect(s.storageRef).toBe('/snapshots/x.bin')
  })
})
