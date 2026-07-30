import { describe, it, expect } from 'vitest'
import { freezeRecord, rejectMutation, ImmutabilityError } from './immutability'
import { InMemoryPipelineStore } from './store'
import { buildSnapshot } from './snapshot'

describe('immutability', () => {
  it('freezeRecord blocks mutation', () => {
    const f = freezeRecord({ checksum: 'abc' })
    expect(() => { (f as { checksum: string }).checksum = 'x' }).toThrow()
  })
  it('rejectMutation throws a typed ImmutabilityError', () => {
    expect(() => rejectMutation('RawSnapshot', 'checksum')).toThrow(ImmutabilityError)
  })
  it('a persisted in-memory snapshot cannot be mutated', async () => {
    const store = new InMemoryPipelineStore()
    await store.createImportRun({ sourceId: 's1', trigger: 'FIXTURE', dryRun: false, adapterName: 'a', adapterVersion: 'v' })
    const snap = buildSnapshot({ sourceId: 's1', importRunId: 'r1', retrievedAt: '2026-07-01T00:00:00Z', bodyText: 'hi' })
    await store.createSnapshot(snap)
    expect(() => { (store.snapshots[0] as { checksum: string }).checksum = 'tampered' }).toThrow()
    // there is no update path for snapshots or versions
    expect(() => store.updateSnapshotForbidden('checksum')).toThrow(ImmutabilityError)
    expect(() => store.updateVersionForbidden('contentHash')).toThrow(ImmutabilityError)
  })
})
