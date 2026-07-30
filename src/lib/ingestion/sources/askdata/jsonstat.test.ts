import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { unflattenJsonStat, isJsonStatDataset, type JsonStatDataset } from './jsonstat'

const ds = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/tab08-sample.json', import.meta.url)), 'utf8')) as JsonStatDataset

describe('json-stat2 reader', () => {
  it('recognizes a dataset', () => {
    expect(isJsonStatDataset(ds)).toBe(true)
    expect(isJsonStatDataset({})).toBe(false)
  })
  it('unflattens the row-major value array into labeled cells', () => {
    const obs = unflattenJsonStat(ds)
    expect(obs).toHaveLength(9) // 3 years x 3 variables
    const get = (year: string, v: string) => obs.find((o) => o.dims.Viti.code === year && o.dims.Variabla.code === v)!
    expect(get('2025', '0').value).toBe(942137) // 2025 Export
    expect(get('2025', '1').value).toBe(7055838) // 2025 Import
    expect(get('2025', '2').value).toBe(-6113701) // 2025 Trade balance
    expect(get('2023', '0').value).toBe(863141) // 2023 Export
    expect(get('2025', '2').dims.Variabla.label).toBe('Trade balance')
  })
})
