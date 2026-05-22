/**
 * Export terminology glossary for Kosova Business Hub.
 * Incoterms are kept as a dedicated structured system (own page).
 * All other terms are grouped into thematic categories.
 */

export interface Incoterm {
  code: string
  name: string
  mode: 'any' | 'sea'        // any transport mode, or sea/inland waterway only
  carriagePaidBy: 'shitësi' | 'blerësi'
  riskTransfer: string        // where risk passes to buyer
  exportCustoms: 'shitësi' | 'blerësi'
  importCustoms: 'shitësi' | 'blerësi'
  note: string
}

// Incoterms 2020 — ordered from least to most seller responsibility.
export const INCOTERMS: Incoterm[] = [
  { code: 'EXW', name: 'Ex Works (Franko fabrika)', mode: 'any', carriagePaidBy: 'blerësi', riskTransfer: 'Te dera e shitësit, sapo malli vihet në dispozicion', exportCustoms: 'blerësi', importCustoms: 'blerësi', note: 'Përgjegjësia minimale për shitësin. Blerësi merr gjithçka që nga magazina jote.' },
  { code: 'FCA', name: 'Free Carrier (Franko transportues)', mode: 'any', carriagePaidBy: 'blerësi', riskTransfer: 'Kur malli i dorëzohet transportuesit të caktuar nga blerësi', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'Termi më i përdorur sot. Fleksibël për kontejnerë dhe transport multimodal.' },
  { code: 'FAS', name: 'Free Alongside Ship', mode: 'sea', carriagePaidBy: 'blerësi', riskTransfer: 'Kur malli vendoset pranë anijes në portin e nisjes', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'Vetëm transport detar. Për mallra të rënda ose në sasi të mëdha.' },
  { code: 'FOB', name: 'Free on Board', mode: 'sea', carriagePaidBy: 'blerësi', riskTransfer: 'Kur malli ngarkohet në anije', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'Klasik për transport detar. Shitësi e ngarkon në anije, pastaj rreziku kalon.' },
  { code: 'CFR', name: 'Cost and Freight', mode: 'sea', carriagePaidBy: 'shitësi', riskTransfer: 'Kur malli ngarkohet në anije (rreziku), por shitësi paguan transportin deri në portin e destinacionit', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'Shitësi paguan transportin detar, por rreziku kalon herët, te ngarkimi.' },
  { code: 'CIF', name: 'Cost, Insurance and Freight', mode: 'sea', carriagePaidBy: 'shitësi', riskTransfer: 'Kur malli ngarkohet në anije; shitësi paguan transport + sigurim deri në port', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'Si CFR, por shitësi blen edhe sigurimin (mbulim minimal).' },
  { code: 'CPT', name: 'Carriage Paid To', mode: 'any', carriagePaidBy: 'shitësi', riskTransfer: 'Kur malli i dorëzohet transportuesit të parë', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'Si CFR por për çdo mënyrë transporti. Shitësi paguan deri në destinacion.' },
  { code: 'CIP', name: 'Carriage and Insurance Paid To', mode: 'any', carriagePaidBy: 'shitësi', riskTransfer: 'Kur malli i dorëzohet transportuesit të parë; shitësi paguan transport + sigurim', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'Si CPT + sigurim me mbulim të plotë (all-risk).' },
  { code: 'DAP', name: 'Delivered at Place (Dorëzuar në vend)', mode: 'any', carriagePaidBy: 'shitësi', riskTransfer: 'Te vendi i caktuar i destinacionit, gati për shkarkim', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'Shitësi e çon deri te dera e blerësit, por blerësi bën doganën e importit.' },
  { code: 'DPU', name: 'Delivered at Place Unloaded', mode: 'any', carriagePaidBy: 'shitësi', riskTransfer: 'Te vendi i destinacionit, PAS shkarkimit', exportCustoms: 'shitësi', importCustoms: 'blerësi', note: 'I vetmi term ku shitësi e shkarkon mallin. Zëvendësoi DAT-in e vjetër.' },
  { code: 'DDP', name: 'Delivered Duty Paid (Dorëzuar dogana e paguar)', mode: 'any', carriagePaidBy: 'shitësi', riskTransfer: 'Te dera e blerësit, gjithçka e kryer dhe e paguar', exportCustoms: 'shitësi', importCustoms: 'shitësi', note: 'Përgjegjësia maksimale për shitësin, përfshirë doganën e importit.' },
]

export interface TermEntry {
  slug: string
  term: string
  definition: string
  why: string
  example: string
  related?: string[]
  expertCta?: boolean
}

export interface TermCategory {
  id: string
  title: string
  icon: string   // lucide icon name handled in the component
  terms: TermEntry[]
}

export const TERM_CATEGORIES: TermCategory[] = [
  {
    id: 'porosia',
    title: 'Porosia & Prodhimi',
    icon: 'Package',
    terms: [
      {
        slug: 'moq',
        term: 'MOQ — Minimum Order Quantity',
        definition: 'Sasia minimale që një furnizues pranon të prodhojë ose shesë në një porosi të vetme.',
        why: 'Cakton MOQ-në tënde për të mbrojtur marzhin (çdo prodhim ka kosto fillestare). Kur negocion me blerës, MOQ-ja duhet të jetë realiste, ndryshe i humb.',
        example: 'Një prodhues mjalti cakton MOQ 1,000 kavanoza. Një dyqan i vogël që do 50 nuk i shërben; një zinxhir që do 10,000 po.',
        related: ['MOV', 'Lead Time'],
        expertCta: true,
      },
      {
        slug: 'mov',
        term: 'MOV — Minimum Order Value',
        definition: 'Vlera minimale monetare e një porosie, pavarësisht sasisë.',
        why: 'Ndonjëherë më e dobishme se MOQ-ja: siguron që çdo porosi të mbulojë kostot edhe nëse produktet janë me vlerë të lartë e sasi të vogël.',
        example: 'MOV €5,000 do të thotë: porosit sa të duash, por totali duhet të jetë të paktën €5,000.',
        related: ['MOQ'],
      },
      {
        slug: 'lead-time',
        term: 'Lead Time (Koha e dorëzimit)',
        definition: 'Koha nga momenti i porosisë deri te dorëzimi i mallit te blerësi.',
        why: 'Blerësit ndërkombëtarë planifikojnë sipas lead time. Një lead time i gjatë ose i paqartë i largon. Cakto realisht dhe respektoje.',
        example: 'Lead time 6 javë = prodhim 4 javë + transport 2 javë. Komunikoje qartë në ofertë.',
        related: ['MOQ'],
      },
      {
        slug: 'private-label',
        term: 'Private Label / White Label / OEM',
        definition: 'Prodhon mallin që shitet nën markën e dikujt tjetër. Private Label = marka e shitësit (p.sh. zinxhir supermarketi). White Label = produkt gjenerik i ri-brenduar. OEM = prodhon komponentë/produkte që një markë tjetër i integron.',
        why: 'Hyrje e shpejtë në treg pa ndërtuar markë nga zeroja. Vëllim i garantuar, zero kosto marketingu. Rreziku: varësi nga një blerës, marzhe më të holla, pa vlerë marke afatgjate.',
        example: 'Sot 30-50% e produkteve në raftet e BE-së janë private label. Një verëtore kosovare prodhon verë për markën e shtëpisë së një zinxhiri zviceran: vëllim i sigurt pa pasur nevojë të njihet emri vetë.',
        related: ['MOQ'],
        expertCta: true,
      },
    ],
  },
  {
    id: 'dokumentet',
    title: 'Dokumentet e Eksportit',
    icon: 'FileText',
    terms: [
      {
        slug: 'hs-code',
        term: 'HS Code (Kodi i Sistemit të Harmonizuar)',
        definition: 'Kod numerik ndërkombëtar (6-10 shifra) që klasifikon çdo produkt për qëllime doganore. I njëjti sistem përdoret në mbi 200 vende.',
        why: 'Përcakton tarifën doganore, taksat dhe dokumentet e nevojshme në çdo treg. Kod i gabuar = vonesa, gjoba ose taksa të papritura.',
        example: 'Vaji i ullirit = HS 1509. Me këtë kod, blerësi e di saktë tarifën e importit në vendin e tij.',
        related: ['Certifikatë Origjine (EUR.1)'],
        expertCta: true,
      },
      {
        slug: 'eur1',
        term: 'Certifikatë Origjine (EUR.1)',
        definition: 'Dokument zyrtar që dëshmon se malli është me origjinë kosovare, për të përfituar tarifa preferenciale (të reduktuara ose zero) sipas marrëveshjeve tregtare.',
        why: 'Pa EUR.1, blerësi paguan tarifën e plotë. Me të, përfiton tarifa preferenciale CEFTA, MSA (BE), ose EFTA. Bën produktin tënd më konkurrues në çmim.',
        example: 'Eksporton mobilje në Gjermani me EUR.1: blerësi gjerman paguan 0% doganë në vend të tarifës standarde, falë Marrëveshjes së Stabilizim-Asociimit.',
        related: ['HS Code', 'Proforma Invoice'],
        expertCta: true,
      },
      {
        slug: 'proforma-invoice',
        term: 'Proforma Invoice (Faturë paraprake)',
        definition: 'Faturë paraprake që dërgohet para shitjes, me detajet e ofertës: produkti, sasia, çmimi, kushtet, Incoterm-i.',
        why: 'Është baza e marrëveshjes. Blerësi e përdor për të hapur Letter of Credit ose për leje importi. Duhet të jetë e saktë dhe profesionale.',
        example: 'Para se blerësi turk të paguajë, ti i dërgon një proforma invoice me 500 njësi, €10/njësi, FCA Prishtinë.',
        related: ['Letter of Credit (L/C)', 'Incoterms'],
      },
      {
        slug: 'bill-of-lading',
        term: 'Bill of Lading / CMR (Fletëngarkesa)',
        definition: 'Dokument transporti që dëshmon marrjen e mallit nga transportuesi. Bill of Lading = transport detar; CMR = transport rrugor (më i zakonshmi për Kosovën).',
        why: 'Është dëshmi e pronësisë dhe e dorëzimit. Pa të, malli nuk lirohet te destinacioni dhe pagesa mund të bllokohet.',
        example: 'Kamioni që çon mallin tënd në Vjenë lëshon një CMR të nënshkruar — dëshmia që malli u nis dhe u pranua.',
        related: ['Incoterms'],
      },
    ],
  },
  {
    id: 'pagesat',
    title: 'Pagesat & Financimi',
    icon: 'CreditCard',
    terms: [
      {
        slug: 'letter-of-credit',
        term: 'Letter of Credit (L/C — Akreditiv)',
        definition: 'Garanci bankare ku banka e blerësit premton të paguajë shitësin sapo të paraqiten dokumentet e duhura (fletëngarkesa, faturë, certifikata).',
        why: 'Mjet sigurie për shitje me blerës të rinj ose tregje me rrezik. Ti paguhesh kur dorëzon dokumentet korrekte, pa varur nga vullneti i blerësit.',
        example: 'Shet në një blerës të ri në Emirate. Kërkon L/C: banka emiratase garanton pagesën sapo ti dorëzon CMR + faturë + EUR.1.',
        related: ['Proforma Invoice', 'Trade Finance / Factoring'],
        expertCta: true,
      },
      {
        slug: 'trade-finance',
        term: 'Trade Finance / Factoring',
        definition: 'Trade Finance = financim i tregtisë (kredi, garanci) që mbulon hendekun midis prodhimit dhe pagesës. Factoring = shet faturat e papaguara një institucioni financiar për të marrë para menjëherë.',
        why: 'Zgjidh problemin e cash flow: prodhon sot, paguhesh pas 60-90 ditësh. Factoring-u ta jep paranë menjëherë (minus një tarifë).',
        example: 'Ke një faturë €50,000 me afat pagese 90 ditë. Me factoring merr €47,000 sot dhe nuk pret 3 muaj.',
        related: ['Letter of Credit (L/C)'],
        expertCta: true,
      },
    ],
  },
  {
    id: 'logjistika',
    title: 'Logjistika & Transporti',
    icon: 'Truck',
    terms: [
      {
        slug: 'fcl-lcl',
        term: 'FCL vs LCL',
        definition: 'FCL (Full Container Load) = kontejner i tërë vetëm për mallin tënd. LCL (Less than Container Load) = ndan kontejnerin me mallra të kompanive të tjera.',
        why: 'FCL është më i lirë për njësi nëse ke vëllim; LCL të lejon të eksportosh sasi të vogla pa paguar kontejner të tërë. Zgjedhja ndikon koston dhe kohën.',
        example: 'Ke vetëm 8 paleta? LCL është më ekonomik. Ke 20+ paleta? FCL kushton më pak për njësi.',
        related: ['Demurrage', 'Incoterms'],
      },
      {
        slug: 'demurrage',
        term: 'Demurrage (Qëndrim)',
        definition: 'Tarifë që paguhet kur kontejneri ose malli rri në port/terminal më gjatë se koha falas e lejuar.',
        why: 'Vonesat në dokumente ose doganë sjellin kosto demurrage që hanë marzhin. Përgatit dokumentet para se malli të arrijë.',
        example: 'Kontejneri rri 5 ditë shtesë në portin e Durrësit sepse mungonte EUR.1 — paguan demurrage për çdo ditë.',
        related: ['FCL vs LCL', 'Certifikatë Origjine (EUR.1)'],
      },
    ],
  },
  {
    id: 'standardet',
    title: 'Standardet & Cilësia',
    icon: 'ShieldCheck',
    terms: [
      {
        slug: 'ce-marking',
        term: 'CE Marking',
        definition: 'Shenjë që dëshmon se produkti përmbush standardet e sigurisë, shëndetit dhe mjedisit të BE-së. E detyrueshme për shumë produkte në tregun europian.',
        why: 'Pa CE, produkti yt nuk mund të shitet ligjërisht në BE për kategoritë e prekura (lodra, makineri, elektronikë, materiale ndërtimi, etj.). Është pasaporta për tregun europian.',
        example: 'Prodhon dyer dhe dritare alumini për Gjermani: duhet CE Marking sipas standardit EN 14351-1 para se t’i shesësh.',
        related: ['HS Code'],
        expertCta: true,
      },
    ],
  },
  {
    id: 'partneret',
    title: 'Partnerët & Shitja',
    icon: 'Handshake',
    terms: [
      {
        slug: 'distributor-agent',
        term: 'Distributor vs Agjent',
        definition: 'Distributor = blen mallin tënd dhe e rishet vetë (merr pronësinë dhe rrezikun). Agjent = gjen blerës për ty dhe merr komision, pa blerë mallin.',
        why: 'Distributor: më pak kontroll mbi çmimin, por vëllim dhe pa rrezik arkëtimi. Agjent: mban kontrollin e çmimit dhe marrëdhënies, por paguan komision dhe mban rrezikun.',
        example: 'Një distributor gjerman blen 10,000 shishe verë dhe i shet vetë. Një agjent gjen restorante që blejnë direkt nga ti dhe merr 8% komision.',
        related: ['Ekskluziv vs Jo-ekskluziv'],
        expertCta: true,
      },
      {
        slug: 'ekskluziv',
        term: 'Ekskluziv vs Jo-ekskluziv',
        definition: 'Marrëveshje ekskluzive = i jep një partneri të vetëm të drejtën për një treg/territor. Jo-ekskluzive = mund të punosh me disa partnerë në të njëjtin treg.',
        why: 'Ekskluziviteti motivon partnerin të investojë, por të mbyll opsionet nëse ai nuk performon. Vendos kushte performance (vëllim minimal) para se të japësh ekskluzivitet.',
        example: 'I jep ekskluzivitet një distributori për Austrinë me kusht që të shesë minimum 50,000 njësi/vit, ndryshe e humb.',
        related: ['Distributor vs Agjent'],
      },
    ],
  },
]
