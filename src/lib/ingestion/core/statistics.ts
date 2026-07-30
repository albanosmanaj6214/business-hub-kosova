// Statistical layer helpers: deterministic observation grain hash + validation.
// The grain identity is dataset + reference period + measure + any extra
// dimension codes — NEVER the mutable numeric value.
import { deterministicFingerprint } from './dedupe'
import type { StatisticalDescriptor } from './contracts'

/** Deterministic hash of the statistical grain (one current observation per grain). */
export function observationGrainHash(datasetIdentifier: string, referencePeriod: string, measureCode: string, extraDimCodes: string[] = []): string {
  return deterministicFingerprint([datasetIdentifier, referencePeriod, measureCode, ...extraDimCodes])
}

export interface StatIssue { code: string; severity: 'critical' | 'warning'; message: string }
export interface StatValidation { ok: boolean; issues: StatIssue[] }

/** Validate a statistical observation descriptor. Critical failures block persistence. */
export function validateStatistical(desc: StatisticalDescriptor): StatValidation {
  const issues: StatIssue[] = []
  const d = desc.dataset
  const o = desc.observation
  const crit = (code: string, message: string) => issues.push({ code, severity: 'critical', message })
  const warn = (code: string, message: string) => issues.push({ code, severity: 'warning', message })

  if (!d.identifier) crit('missing_dataset_identifier', 'Identifikuesi i dataset-it mungon.')
  if (!d.title) crit('missing_dataset_title', 'Titulli i dataset-it mungon.')
  if (!o.referencePeriod) crit('missing_reference_period', 'Periudha e referencës mungon.')
  if (!o.measureCode) crit('missing_measure_code', 'Kodi i variablës mungon.')
  if (!o.measureLabel) crit('missing_measure_label', 'Etiketa e variablës mungon.')
  if (!o.unitOriginal) crit('missing_unit', 'Njësia mungon.')
  if (o.valueOriginal == null) warn('missing_value', 'Vlera mungon (nuk trajtohet si zero).')
  else if (!Number.isFinite(o.valueOriginal)) crit('non_finite_value', 'Vlera nuk është numër i fundëm.')
  if (!o.dimensionHash) crit('missing_dimension_hash', 'Hash-i i grain-it mungon.')

  return { ok: issues.every((i) => i.severity !== 'critical'), issues }
}
