// Verifikuar kundër https://arbk.rks-gov.net dhe https://www.atk-ks.org më 2026-06.
// Jo këshillë ligjore; bizneset verifikojnë me ARBK/ATK. Pragu i TVSH-së: 30 000 € xhiro vjetore.

export interface RoadmapStep {
  id: string
  order: number
  appliesTo: string[] | 'all'
  title: { sq: string; en: string; de: string }
  body: { sq: string; en: string; de: string }
  institution: string
  estTime: string
  cost: string | null
  link: { label: string; url: string } | null
  checklist: string[]
}

export const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 'zgjedh-formen',
    order: 10,
    appliesTo: 'all',
    title: { sq: 'Zgjedh formën ligjore', en: 'Choose the legal form', de: 'Rechtsform wählen' },
    body: { sq: 'Krahaso format sipas përgjegjësisë, kapitalit dhe numrit të pronarëve.', en: 'Compare forms by liability, capital and number of owners.', de: 'Formen nach Haftung, Kapital und Eigentümerzahl vergleichen.' },
    institution: 'ARBK',
    estTime: 'Vendim paraprak',
    cost: null,
    link: { label: 'ARBK', url: 'https://arbk.rks-gov.net' },
    checklist: ['Krahaso përgjegjësinë dhe kapitalin minimal', 'Vendos numrin e pronarëve ose ortakëve'],
  },
  {
    id: 'zgjedh-aktivitetin',
    order: 20,
    appliesTo: 'all',
    title: { sq: 'Zgjedh kodin e aktivitetit (NACE)', en: 'Choose the activity code (NACE)', de: 'Tätigkeitscode (NACE) wählen' },
    body: { sq: 'Identifiko veprimtarinë kryesore dhe ato dytësore me kodet zyrtare të ARBK.', en: 'Identify the main and secondary activities using the official ARBK codes.', de: 'Haupt- und Nebentätigkeiten mit den offiziellen ARBK-Codes bestimmen.' },
    institution: 'ARBK',
    estTime: 'Vendim paraprak',
    cost: null,
    link: { label: 'Kodet e aktiviteteve (ARBK)', url: 'https://arbk.rks-gov.net/Page/24' },
    checklist: ['Identifiko veprimtarinë kryesore', 'Shto veprimtari dytësore nëse nevojiten'],
  },
  {
    id: 'pergatit-dokumentet',
    order: 30,
    appliesTo: ['op', 'ok', 'shpk', 'sha', 'dega'],
    title: { sq: 'Përgatit dokumentet themeluese', en: 'Prepare the founding documents', de: 'Gründungsunterlagen vorbereiten' },
    body: { sq: 'Plotëso statutin ose marrëveshjen e ortakërisë sipas modelit zyrtar dhe aktin e themelimit.', en: 'Complete the charter or partnership agreement per the official model, plus the act of establishment.', de: 'Satzung oder Gesellschaftsvertrag nach dem offiziellen Muster sowie Gründungsakt erstellen.' },
    institution: 'ARBK / Noter',
    estTime: '1 ditë',
    cost: null,
    link: { label: 'Modelet e statuteve (ARBK)', url: 'https://arbk.rks-gov.net/Page/17' },
    checklist: ['Plotëso statutin ose marrëveshjen sipas modelit zyrtar', 'Përcakto kapitalin dhe ndarjen e pjesëve', 'Nënshkruaj aktin e themelimit'],
  },
  {
    id: 'regjistrohu-arbk',
    order: 40,
    appliesTo: 'all',
    title: { sq: 'Regjistrohu te ARBK', en: 'Register at ARBK', de: 'Bei der ARBK registrieren' },
    body: { sq: 'Dorëzo aplikimin me dokumentet e identitetit dhe dokumentet themeluese nëse aplikohen.', en: 'Submit the application with identity and founding documents where applicable.', de: 'Antrag mit Ausweis- und Gründungsunterlagen einreichen, sofern zutreffend.' },
    institution: 'ARBK',
    estTime: '1 deri 3 ditë pune',
    cost: 'Pa tarifë',
    link: { label: 'ARBK', url: 'https://arbk.rks-gov.net' },
    checklist: ['Dorëzo formularin e aplikimit', 'Bashkëngjit dokumentet e identitetit', 'Bashkëngjit statutin ose marrëveshjen nëse aplikohet'],
  },
  {
    id: 'merr-nui',
    order: 50,
    appliesTo: 'all',
    title: { sq: 'Merr NUI-n dhe numrin fiskal', en: 'Get the unique ID and fiscal number', de: 'Eindeutige ID und Steuernummer erhalten' },
    body: { sq: 'Pas regjistrimit merr certifikatën e biznesit me Numrin Unik Identifikues.', en: 'After registration you receive the business certificate with the unique identification number.', de: 'Nach der Registrierung erhalten Sie die Unternehmensbescheinigung mit der eindeutigen ID.' },
    institution: 'ARBK',
    estTime: 'Me regjistrimin',
    cost: null,
    link: null,
    checklist: ['Ruaj certifikatën e biznesit', 'Verifiko të dhënat në certifikatë'],
  },
  {
    id: 'aktivizohu-atk',
    order: 60,
    appliesTo: 'all',
    title: { sq: 'Aktivizohu te ATK', en: 'Activate with the Tax Administration', de: 'Bei der Steuerverwaltung aktivieren' },
    body: { sq: 'Regjistro biznesin në sistemin EDI të ATK-së dhe cakto përgjegjësin tatimor.', en: 'Register the business in the ATK EDI system and assign the tax responsible person.', de: 'Unternehmen im ATK-EDI-System registrieren und Steuerverantwortlichen benennen.' },
    institution: 'ATK',
    estTime: '1 ditë',
    cost: null,
    link: { label: 'ATK', url: 'https://www.atk-ks.org' },
    checklist: ['Regjistro biznesin në EDI të ATK-së', 'Cakto përgjegjësin tatimor'],
  },
  {
    id: 'tvsh',
    order: 70,
    appliesTo: 'all',
    title: { sq: 'Regjistrohu për TVSH nëse parashikohet xhiro mbi pragun', en: 'Register for VAT if turnover exceeds the threshold', de: 'Bei Umsatz über dem Schwellenwert für MwSt registrieren' },
    body: { sq: 'Nëse xhiroja vjetore parashikohet mbi 30 000 €, regjistrohu për TVSH te ATK.', en: 'If annual turnover is expected above 30,000 EUR, register for VAT at ATK.', de: 'Bei erwartetem Jahresumsatz über 30.000 EUR MwSt-Registrierung bei der ATK.' },
    institution: 'ATK',
    estTime: '1 ditë',
    cost: null,
    link: { label: 'ATK', url: 'https://www.atk-ks.org' },
    checklist: ['Vlerëso xhiron vjetore të parashikuar', 'Apliko për numër TVSH-je nëse je mbi pragun 30 000 €'],
  },
  {
    id: 'llogari-bankare',
    order: 80,
    appliesTo: 'all',
    title: { sq: 'Hap llogari bankare biznesi', en: 'Open a business bank account', de: 'Geschäftskonto eröffnen' },
    body: { sq: 'Zgjedh një bankë të licencuar dhe hap llogarinë me certifikatën e ARBK dhe identitetin.', en: 'Choose a licensed bank and open the account with the ARBK certificate and identity.', de: 'Lizenzierte Bank wählen und Konto mit ARBK-Bescheinigung und Ausweis eröffnen.' },
    institution: 'Banka (e mbikëqyrur nga BQK)',
    estTime: '1 deri 2 ditë',
    cost: null,
    link: null,
    checklist: ['Zgjedh bankën', 'Dorëzo certifikatën e ARBK dhe dokumentin e identitetit'],
  },
  {
    id: 'leje-komunale',
    order: 90,
    appliesTo: 'all',
    title: { sq: 'Merr leje ose licenca komunale sipas veprimtarisë', en: 'Get municipal permits or licenses as required', de: 'Kommunale Genehmigungen je nach Tätigkeit einholen' },
    body: { sq: 'Disa veprimtari kërkojnë leje komunale. Verifiko nëse aplikohet për veprimtarinë tënde.', en: 'Some activities require municipal permits. Check whether it applies to your activity.', de: 'Manche Tätigkeiten erfordern kommunale Genehmigungen. Prüfen Sie die Anwendbarkeit.' },
    institution: 'Komuna',
    estTime: 'Ndryshon sipas komunës',
    cost: null,
    link: null,
    checklist: ['Verifiko nëse veprimtaria kërkon leje', 'Apliko në komunën përkatëse'],
  },
  {
    id: 'punetoret-trusti',
    order: 100,
    appliesTo: 'all',
    title: { sq: 'Regjistro punëtorët dhe kontributet pensionale', en: 'Register employees and pension contributions', de: 'Mitarbeiter und Rentenbeiträge anmelden' },
    body: { sq: 'Nëse punëson, lidh kontrata pune dhe regjistro kontributet te Trusti i Kursimeve Pensionale.', en: 'If you hire, sign employment contracts and register contributions with the Pension Savings Trust.', de: 'Bei Einstellung Arbeitsverträge schließen und Beiträge beim Rentenfonds anmelden.' },
    institution: 'ATK / Trusti',
    estTime: 'Para fillimit të punës',
    cost: null,
    link: null,
    checklist: ['Lidh kontrata pune', 'Regjistro kontributet pensionale për punëtorët'],
  },
  {
    id: 'detyrimet-vazhdueshme',
    order: 110,
    appliesTo: 'all',
    title: { sq: 'Përmbush detyrimet e vazhdueshme', en: 'Meet ongoing obligations', de: 'Laufende Pflichten erfüllen' },
    body: { sq: 'Dorëzo deklaratat tatimore me kohë dhe mbaj librat e blerjes dhe shitjes.', en: 'File tax declarations on time and keep purchase and sales books.', de: 'Steuererklärungen fristgerecht einreichen und Ein- und Verkaufsbücher führen.' },
    institution: 'ATK',
    estTime: 'Mujore dhe vjetore',
    cost: null,
    link: { label: 'ATK', url: 'https://www.atk-ks.org' },
    checklist: ['Dorëzo deklaratat mujore (TVSH dhe paga sipas rastit)', 'Dorëzo deklaratën vjetore', 'Mbaj librin e blerjes dhe librin e shitjes'],
  },
]

export function roadmapFor(formSlug: string): RoadmapStep[] {
  return ROADMAP_STEPS
    .filter((s) => s.appliesTo === 'all' || s.appliesTo.includes(formSlug))
    .sort((a, b) => a.order - b.order)
}

export function allChecklistFor(formSlug: string): { stepTitleSq: string; items: string[] }[] {
  return roadmapFor(formSlug)
    .filter((s) => s.checklist.length > 0)
    .map((s) => ({ stepTitleSq: s.title.sq, items: Array.from(new Set(s.checklist)) }))
}
