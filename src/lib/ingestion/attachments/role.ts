// Deterministic attachment ROLE classification from the anchor label + filename.
// Precedence matters: a "guideline"/"declaration"/result-list label may also contain
// "public call", so specific roles are matched BEFORE the generic public_call. The first
// attachment is NEVER assumed to be the main call — role is inferred from text, not
// position. A result/beneficiary list must NEVER be treated as an active public call.
export type AttachmentRole =
  | 'public_call'
  | 'application_form'
  | 'guideline'
  | 'declaration'
  | 'annex'
  | 'budget_template'
  | 'beneficiary_or_result_list'
  | 'technical_form'
  | 'other'

// Order = precedence. Earlier rules win.
const RULES: Array<{ role: AttachmentRole; re: RegExp }> = [
  { role: 'declaration', re: /deklarat|statement of|n[eë] betim|solemn/i },
  // Result / beneficiary / participant lists — matched BEFORE public_call so a
  // "Lista e përfituesve" is never mistaken for an active call.
  { role: 'beneficiary_or_result_list', re: /list[ae]?\s+e\s+(p[eë]rfitues|pjes[eë]marr|fitues|aplikant[eë]ve\s+t[eë]\s+sukses)|lista\s+(p[eë]rfundimtare|e\s+aprovuar)|list\s+of\s+(beneficiaries|participants|winners|results|selected)|results?\s+list|beneficiar(y|ies)/i },
  { role: 'guideline', re: /udh[eë]zues|udh[eë]zim|guide(line)?s?\b|manual/i },
  // Budget/financial templates. Checked BEFORE technical_form so a technical form that
  // is specifically a budget template (mentions budget/buxhet) classifies as budget.
  { role: 'budget_template', re: /buxhet|budget|kalkulim|cost\s+breakdown|financial\s+template/i },
  { role: 'technical_form', re: /formular(i)?\s+teknik|technical\s+form|specifikim(et)?\s+teknik/i },
  { role: 'annex', re: /aneks|appendix|shtoj|shtes[eë]/i },
  { role: 'application_form', re: /aplikacion|application\s+form|formular(?!i?\s+teknik)|proposal|propozim/i },
  { role: 'public_call', re: /thirrje\s*(publike|e\s*rishpallur|e\s*p[eë]rs[eë]ritur)?|public\s+call|ftes[eë]\s+p[eë]r\s+pjes|call\s+for|njoftim\s+p[eë]r\s+shtyrje/i },
]

export function classifyAttachmentRole(label: string, filename?: string): AttachmentRole {
  const s = `${label} ${filename ?? ''}`
  for (const r of RULES) if (r.re.test(s)) return r.role
  return 'other'
}

/** Requirement-bearing roles (a public call's substantive fields may legitimately come
 *  from these). Result lists are intentionally EXCLUDED — they describe outcomes, not an
 *  active call. Used by the field-extraction precedence. */
export function roleProvidesCallRequirements(role: AttachmentRole | null): boolean {
  return role !== 'beneficiary_or_result_list'
}
