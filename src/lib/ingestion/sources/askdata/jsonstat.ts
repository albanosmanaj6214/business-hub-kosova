// Minimal JSON-stat v2 (dataset) reader: unflatten the row-major value array into
// per-cell observations keyed by each dimension's category code + label.
export interface JsonStatDataset {
  class?: string
  id: string[]
  size: number[]
  label?: string
  source?: string
  updated?: string
  dimension: Record<string, { label?: string; category: { index: Record<string, number>; label: Record<string, string> } }>
  value: (number | null)[]
}

export interface JsonStatObservation {
  dims: Record<string, { code: string; label: string }>
  value: number | null
}

/** True if the object looks like a JSON-stat2 dataset (parser-accepts guard). */
export function isJsonStatDataset(o: unknown): o is JsonStatDataset {
  const d = o as JsonStatDataset
  return !!d && Array.isArray(d.id) && Array.isArray(d.size) && Array.isArray(d.value) && typeof d.dimension === 'object'
}

export function unflattenJsonStat(ds: JsonStatDataset): JsonStatObservation[] {
  const dims = ds.id
  const sizes = ds.size
  // Row-major strides.
  const strides = new Array(dims.length).fill(1)
  for (let k = dims.length - 2; k >= 0; k--) strides[k] = strides[k + 1] * sizes[k + 1]
  // Ordered category codes per dimension (by index position).
  const codesByDim: Record<string, string[]> = {}
  for (const dim of dims) {
    const index = ds.dimension[dim].category.index
    const arr: string[] = []
    for (const [code, pos] of Object.entries(index)) arr[pos] = code
    codesByDim[dim] = arr
  }
  const total = ds.value.length
  const out: JsonStatObservation[] = []
  for (let i = 0; i < total; i++) {
    const rec: JsonStatObservation = { dims: {}, value: ds.value[i] ?? null }
    for (let k = 0; k < dims.length; k++) {
      const dim = dims[k]
      const pos = Math.floor(i / strides[k]) % sizes[k]
      const code = codesByDim[dim][pos]
      rec.dims[dim] = { code, label: ds.dimension[dim].category.label[code] ?? code }
    }
    out.push(rec)
  }
  return out
}
