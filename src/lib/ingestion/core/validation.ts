// Explicit validation + quality results. Critical failures BLOCK review handoff;
// warnings may proceed but force a visible review requirement.
import type { NormalizedRecord, QualityIssue, ValidationOutcome } from './contracts'

export interface ValidationContext {
  hasCitation: boolean
  hasSnapshot: boolean
  minConfidence?: number
  freshnessSlaHours?: number | null
  now?: () => Date
}

const CRITICAL = 'critical' as const
const WARNING = 'warning' as const

export function validateRecord(record: NormalizedRecord, ctx: ValidationContext): ValidationOutcome {
  const issues: QualityIssue[] = []
  const c = record.canonical
  const minConfidence = ctx.minConfidence ?? 0.5

  if (!c.title || c.title.trim().length === 0) {
    issues.push({ code: 'missing_title', dimension: 'completeness', severity: CRITICAL, message: 'Titulli mungon.' })
  }
  const hasIdentity = !!(c.identifiers.officialId || c.identifiers.canonicalUrl || c.identifiers.sourceRecordId || c.url)
  if (!hasIdentity) {
    issues.push({ code: 'missing_identity', dimension: 'traceability', severity: CRITICAL, message: 'Asnjë identifikues burimi (URL/ID zyrtar).' })
  }
  if (!ctx.hasCitation) {
    issues.push({ code: 'missing_citation', dimension: 'traceability', severity: CRITICAL, message: 'Mungon citimi te burimi.' })
  }
  if (!c.publicationDate) {
    issues.push({ code: 'missing_publication_date', dimension: 'freshness', severity: WARNING, message: 'Data e publikimit mungon.' })
  }
  if (c.url) {
    try { new URL(c.url) } catch { issues.push({ code: 'invalid_url', dimension: 'validity', severity: WARNING, message: 'URL e pavlefshme.' }) }
  }
  // Surface normalization uncertainty as quality warnings.
  for (const w of record.warnings) {
    issues.push({ code: `norm_${w.reason}`, dimension: 'transformation_confidence', severity: WARNING, message: `Transformim i pasigurt te ${w.field}: ${w.reason}.` })
  }
  if (record.confidence < minConfidence) {
    issues.push({ code: 'low_confidence', dimension: 'transformation_confidence', severity: WARNING, message: `Besueshmëri e ulët e normalizimit (${record.confidence.toFixed(2)}).` })
  }
  // Freshness SLA (optional).
  if (ctx.freshnessSlaHours && c.publicationDate) {
    const now = (ctx.now ?? (() => new Date()))()
    const ageH = (now.getTime() - new Date(c.publicationDate).getTime()) / 3_600_000
    if (ageH > ctx.freshnessSlaHours) {
      issues.push({ code: 'stale', dimension: 'freshness', severity: WARNING, message: 'Rekordi tejkalon SLA-në e freskisë.' })
    }
  }

  const critical = issues.filter((i) => i.severity === CRITICAL)
  const warnings = issues.filter((i) => i.severity === WARNING)
  return {
    ok: critical.length === 0,
    issues,
    // Any critical (blocks) or any warning forces a human review before publish.
    requiresReview: critical.length > 0 || warnings.length > 0,
  }
}

/** Aggregate quality dimensions score for observability (0..1). */
export function qualityScore(outcome: ValidationOutcome): number {
  if (outcome.issues.length === 0) return 1
  const penalty = outcome.issues.reduce((s, i) => s + (i.severity === 'critical' ? 0.34 : 0.1), 0)
  return Math.max(0, 1 - penalty)
}
