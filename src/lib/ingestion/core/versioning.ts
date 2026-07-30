// Version-aware change detection (pure). Content hash drives version changes; the
// stable identity (see identity.ts) drives record continuity.
export type ChangeType = 'new' | 'unchanged' | 'changed'

export function decideChangeType(existing: { contentHash: string } | null | undefined, newContentHash: string): ChangeType {
  if (!existing) return 'new'
  return existing.contentHash === newContentHash ? 'unchanged' : 'changed'
}

export interface FieldChange { field: string; from: unknown; to: unknown }

/** Small, safe, field-level structured diff of two normalized canonical payloads. */
export function structuredDiff(prev: Record<string, unknown> | null | undefined, next: Record<string, unknown> | null | undefined): FieldChange[] {
  const a = prev ?? {}
  const b = next ?? {}
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
  const out: FieldChange[] = []
  for (const k of keys) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push({ field: k, from: a[k] ?? null, to: b[k] ?? null })
  }
  return out
}

/** Small, safe normalized summary of a canonical record for version diffing. */
export function canonicalSummary(canonical: { title?: string; url?: string; publicationDate?: string; deadline?: string; payload: Record<string, unknown> }): Record<string, unknown> {
  return { title: canonical.title ?? null, url: canonical.url ?? null, publicationDate: canonical.publicationDate ?? null, deadline: canonical.deadline ?? null, ...canonical.payload }
}
