// Template-t e dokumenteve për Udhëzuesin ARBK. Çelësat janë të fiksuar;
// admini ngarkon skedarin për secilin. Guide-i shfaq butonin "Shkarko" vetëm
// për ata çelësa që kanë skedar të ngarkuar.

export interface ArbkTemplateKey {
  key: string
  label: string
  desc: string
}

export const ARBK_TEMPLATE_KEYS: ArbkTemplateKey[] = [
  { key: 'statut', label: 'Statuti i shoqërisë', desc: 'Modeli bazë i statutit për SH.P.K. (një ose disa pronarë).' },
  { key: 'akt-themelimi', label: 'Akti i themelimit', desc: 'Akti themelues i shoqërisë tregtare.' },
  { key: 'marreveshje', label: 'Marrëveshja e pronarëve / ortakëve', desc: 'Marrëveshja mes pronarëve ose ortakëve për përqindjet dhe të drejtat.' },
  { key: 'vendim-drejtori', label: 'Vendim për emërim të drejtorit', desc: 'Vendimi për caktimin e drejtorit të shoqërisë.' },
  { key: 'pelqim-drejtori', label: 'Pëlqimi i drejtorit', desc: 'Deklarata e pëlqimit të personit të emëruar drejtor.' },
]

const KEYSET = new Set(ARBK_TEMPLATE_KEYS.map((t) => t.key))

export function isArbkTemplateKey(k: string): boolean {
  return KEYSET.has(k)
}

export function arbkTemplateLabel(key: string): string {
  return ARBK_TEMPLATE_KEYS.find((t) => t.key === key)?.label ?? key
}
