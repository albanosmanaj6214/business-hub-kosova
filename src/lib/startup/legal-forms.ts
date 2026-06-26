// Verifikuar kundër https://arbk.rks-gov.net më 2026-06. Jo këshillë ligjore;
// bizneset verifikojnë me ARBK/ATK. Pa OJQ (vendim i spec-it).

export interface LegalForm {
  slug: string
  name: { sq: string; en: string; de: string }
  tagline: { sq: string; en: string; de: string }
  liability: { sq: string; en: string; de: string }
  minCapital: string | null
  founders: string
  foundingDocs: string[]        // id-të te STARTUP_DOCS (documents.ts)
  statuteModelDocId: string | null
  typicalDays: string
  pros: string[]
  cons: string[]
  source: { label: string; url: string }
}

const ARBK = { label: 'ARBK', url: 'https://arbk.rks-gov.net' }

export const LEGAL_FORMS: LegalForm[] = [
  {
    slug: 'bi',
    name: { sq: 'Biznes Individual', en: 'Sole proprietorship', de: 'Einzelunternehmen' },
    tagline: { sq: 'Një pronar, regjistrim i shpejtë, pa kapital fillestar.', en: 'One owner, fast registration, no starting capital.', de: 'Ein Inhaber, schnelle Registrierung, kein Startkapital.' },
    liability: { sq: 'Përgjegjësi e pakufizuar personale.', en: 'Unlimited personal liability.', de: 'Unbeschränkte persönliche Haftung.' },
    minCapital: null,
    founders: '1',
    foundingDocs: ['formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: null,
    typicalDays: '1 ditë pune',
    pros: ['Regjistrim i shpejtë dhe i thjeshtë', 'Pa kapital minimal', 'Administrim i lehtë'],
    cons: ['Përgjegjësi e pakufizuar personale', 'Më e vështirë për të tërhequr investitorë'],
    source: ARBK,
  },
  {
    slug: 'op',
    name: { sq: 'Ortakëri e Përgjithshme', en: 'General partnership', de: 'Offene Handelsgesellschaft' },
    tagline: { sq: 'Dy ose më shumë ortakë me përgjegjësi solidare.', en: 'Two or more partners with joint liability.', de: 'Zwei oder mehr Partner mit gesamtschuldnerischer Haftung.' },
    liability: { sq: 'Përgjegjësi solidare e pakufizuar e ortakëve.', en: 'Unlimited joint liability of partners.', de: 'Unbeschränkte gesamtschuldnerische Haftung.' },
    minCapital: null,
    founders: '2+',
    foundingDocs: ['marreveshje-ortakerie', 'formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: 'marreveshje-ortakerie',
    typicalDays: '1 deri 3 ditë pune',
    pros: ['Ndarje e përgjegjësive mes ortakëve', 'Pa kapital minimal'],
    cons: ['Përgjegjësi solidare e pakufizuar', 'Vendimet kërkojnë dakordësi mes ortakëve'],
    source: ARBK,
  },
  {
    slug: 'ok',
    name: { sq: 'Ortakëri e Kufizuar', en: 'Limited partnership', de: 'Kommanditgesellschaft' },
    tagline: { sq: 'Ortakë të përgjithshëm dhe ortakë të kufizuar.', en: 'General partners and limited partners.', de: 'Komplementäre und Kommanditisten.' },
    liability: { sq: 'Ortakët e përgjithshëm përgjigjen pakufizuar, të kufizuarit deri në kontributin e tyre.', en: 'General partners unlimited, limited partners up to their contribution.', de: 'Komplementäre unbeschränkt, Kommanditisten bis zur Einlage.' },
    minCapital: null,
    founders: '2+',
    foundingDocs: ['marreveshje-ortakerie', 'formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: 'marreveshje-ortakerie',
    typicalDays: '1 deri 3 ditë pune',
    pros: ['Ortakët e kufizuar mbajnë rrezik të kufizuar', 'Mundëson investitorë pasivë'],
    cons: ['Struktura më komplekse', 'Ortaku i përgjithshëm mban përgjegjësi të pakufizuar'],
    source: ARBK,
  },
  {
    slug: 'shpk',
    name: { sq: 'Shoqëri me Përgjegjësi të Kufizuar', en: 'Limited liability company', de: 'Gesellschaft mit beschränkter Haftung' },
    tagline: { sq: 'Forma më e shpeshtë; përgjegjësi e kufizuar, statut i thjeshtë.', en: 'Most common form; limited liability, simple charter.', de: 'Häufigste Form; beschränkte Haftung, einfache Satzung.' },
    liability: { sq: 'Përgjegjësi e kufizuar deri në kapitalin e shoqërisë.', en: 'Liability limited to the company capital.', de: 'Haftung beschränkt auf das Gesellschaftskapital.' },
    minCapital: '1 €',
    founders: '1+',
    foundingDocs: ['statut-shpk', 'akt-themelimi', 'formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: 'statut-shpk',
    typicalDays: '1 deri 3 ditë pune',
    pros: ['Përgjegjësi e kufizuar', 'Kapital minimal simbolik', 'E pranueshme nga bankat dhe partnerët'],
    cons: ['Kërkon statut dhe akt themelimi', 'Më shumë detyrime raportuese se Biznesi Individual'],
    source: ARBK,
  },
  {
    slug: 'sha',
    name: { sq: 'Shoqëri Aksionare', en: 'Joint-stock company', de: 'Aktiengesellschaft' },
    tagline: { sq: 'Kapital i ndarë në aksione; e përshtatshme për biznese të mëdha.', en: 'Capital divided into shares; suited to larger businesses.', de: 'In Aktien geteiltes Kapital; für größere Unternehmen.' },
    liability: { sq: 'Përgjegjësi e kufizuar deri në vlerën e aksioneve.', en: 'Liability limited to the value of shares.', de: 'Haftung beschränkt auf den Aktienwert.' },
    minCapital: '10 000 €',
    founders: '1+',
    foundingDocs: ['statut-sha', 'akt-themelimi', 'formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: 'statut-sha',
    typicalDays: '3 deri 7 ditë pune',
    pros: ['Mundëson kapital nga shumë aksionarë', 'Përgjegjësi e kufizuar'],
    cons: ['Kapital minimal më i lartë', 'Detyrime raportuese dhe qeverisëse më të rënda'],
    source: ARBK,
  },
  {
    slug: 'dega',
    name: { sq: 'Degë e shoqërisë së huaj', en: 'Branch of a foreign company', de: 'Zweigniederlassung eines ausländischen Unternehmens' },
    tagline: { sq: 'Prani e një kompanie të huaj në Kosovë pa krijuar entitet të ri.', en: 'Presence of a foreign company in Kosovo without a new entity.', de: 'Präsenz eines ausländischen Unternehmens ohne neue Gesellschaft.' },
    liability: { sq: 'Kompania mëmë e huaj mban përgjegjësinë.', en: 'The foreign parent company bears liability.', de: 'Die ausländische Muttergesellschaft haftet.' },
    minCapital: null,
    founders: '1',
    foundingDocs: ['vendim-deges', 'dokumente-kompanise-meme', 'formular-aplikimi'],
    statuteModelDocId: null,
    typicalDays: '3 deri 7 ditë pune',
    pros: ['Ruan identitetin e kompanisë mëmë', 'E përshtatshme për diasporën dhe investitorët e huaj'],
    cons: ['Kërkon dokumente të përkthyera dhe të vërtetuara', 'Kompania mëmë mban përgjegjësinë'],
    source: ARBK,
  },
]

export const LEGAL_FORM_SLUGS: readonly string[] = LEGAL_FORMS.map((f) => f.slug)

export function legalFormBySlug(slug: string): LegalForm | undefined {
  return LEGAL_FORMS.find((f) => f.slug === slug)
}
