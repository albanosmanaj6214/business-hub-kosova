// Deterministic attachment ROLE classification from the anchor label + filename.
// Precedence matters: a "guideline"/"declaration" label may also contain "public call",
// so specific roles are matched BEFORE the generic public_call. The first attachment is
// NEVER assumed to be the main call — role is inferred from text, not position.
export type AttachmentRole = 'public_call' | 'application_form' | 'guideline' | 'declaration' | 'annex' | 'budget_template' | 'other'

const RULES: Array<{ role: AttachmentRole; re: RegExp }> = [
  { role: 'declaration', re: /deklarat|statement of|n[eë] betim|solemn/i },
  { role: 'guideline', re: /udh[eë]zues|udh[eë]zim|guide(line)?s?\b|manual/i },
  { role: 'budget_template', re: /buxhet|budget|formular(i)? teknik|template|kalkulim/i },
  { role: 'annex', re: /aneks|appendix|shtoj|shtes[eë]/i },
  { role: 'application_form', re: /aplikacion|application form|formular(?!i? teknik)|proposal|propozim/i },
  { role: 'public_call', re: /thirrje\s*(publike|e\s*rishpallur|e\s*p[eë]rs[eë]ritur)?|public call|ftes[eë] p[eë]r pjes|call for|njoftim p[eë]r shtyrje/i },
]

export function classifyAttachmentRole(label: string, filename?: string): AttachmentRole {
  const s = `${label} ${filename ?? ''}`
  for (const r of RULES) if (r.re.test(s)) return r.role
  return 'other'
}
