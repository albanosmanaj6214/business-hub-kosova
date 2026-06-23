import { describe, it, expect } from 'vitest'
import type { User, Grant, TradeFair } from '@prisma/client'

describe('schema shape', () => {
  it('exposes the new audience fields', () => {
    const u = {} as User
    const g = {} as Grant
    const f = {} as TradeFair
    // Type-level assertions: these compile only if the fields exist.
    const _a: string | null = u.activityType
    const _b: string[] = u.entitledSectors
    const _c: boolean = g.isGeneral
    const _d: string[] = g.targetActivityTypes
    const _e: boolean = f.isGeneral
    void _a; void _b; void _c; void _d; void _e
    expect(true).toBe(true)
  })
})
