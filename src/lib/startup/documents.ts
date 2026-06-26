// Verifikuar kundër https://arbk.rks-gov.net/Page/17 (statutet) dhe
// https://arbk.rks-gov.net/Page/21 (formularët) më 2026-06. Lidhje te dokumentet
// ZYRTARE të ARBK; pa dokumente sintetike. Jo këshillë ligjore.

export interface StartupDoc {
  id: string
  title: { sq: string; en?: string; de?: string }
  kind: 'statut' | 'formular' | 'udhezues'
  appliesTo: string[] | 'all'
  url: string
  premium: boolean
  note?: { sq: string }
}

const STATUTET = 'https://arbk.rks-gov.net/Page/17'
const FORMULARET = 'https://arbk.rks-gov.net/Page/21'

export const STARTUP_DOCS: StartupDoc[] = [
  { id: 'formular-aplikimi', title: { sq: 'Formular aplikimi për regjistrim' }, kind: 'formular', appliesTo: 'all', url: FORMULARET, premium: false },
  { id: 'kopje-identiteti', title: { sq: 'Kopje e dokumentit të identitetit' }, kind: 'formular', appliesTo: 'all', url: FORMULARET, premium: false, note: { sq: 'Letërnjoftim ose pasaportë e themeluesve.' } },
  { id: 'akt-themelimi', title: { sq: 'Akt themelimi' }, kind: 'statut', appliesTo: ['shpk', 'sha'], url: STATUTET, premium: false },
  { id: 'statut-shpk', title: { sq: 'Model statuti SH.P.K.' }, kind: 'statut', appliesTo: ['shpk'], url: STATUTET, premium: false },
  { id: 'statut-sha', title: { sq: 'Model statuti SH.A.' }, kind: 'statut', appliesTo: ['sha'], url: STATUTET, premium: false },
  { id: 'marreveshje-ortakerie', title: { sq: 'Model marrëveshjeje ortakërie' }, kind: 'statut', appliesTo: ['op', 'ok'], url: STATUTET, premium: false },
  { id: 'vendim-deges', title: { sq: 'Vendim për hapjen e degës' }, kind: 'formular', appliesTo: ['dega'], url: FORMULARET, premium: false, note: { sq: 'Vendim i kompanisë mëmë për hapjen e degës në Kosovë.' } },
  { id: 'dokumente-kompanise-meme', title: { sq: 'Dokumentet e kompanisë mëmë' }, kind: 'formular', appliesTo: ['dega'], url: FORMULARET, premium: false, note: { sq: 'Certifikatë regjistrimi e kompanisë së huaj, e përkthyer dhe e vërtetuar.' } },
]

export function docsFor(formSlug: string): StartupDoc[] {
  return STARTUP_DOCS.filter((d) => d.appliesTo === 'all' || d.appliesTo.includes(formSlug))
}
