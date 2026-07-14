/**
 * Eksport-related product certifications relevant to Kosovo businesses.
 * Reference content (relatively stable) — kept in code to avoid DB overhead.
 * Edit here when standards / fees change; admin UI can come later if needed.
 */

export type MandatoryLevel =
  | 'eu_mandatory'       // legally required to sell on EU market for the relevant product class
  | 'sector_required'    // de facto required by major buyers in a sector (e.g. retailers ask for it)
  | 'optional_advantage' // not required, but opens markets or premium prices

export interface Certification {
  slug: string
  name: string                       // canonical short name, e.g. "ISO 9001"
  fullName?: string                  // full title in English
  fullNameSq?: string                // Albanian full title
  whatIs: string                     // plain-language definition
  industries: string[]               // chip-style tags
  mandatory: MandatoryLevel
  mandatoryNote?: string             // free-text caveat
  whyMatters: string                 // why a business should care
  issuedBy: string[]                 // global certification bodies / standard owners
  issuedByKosovo?: string[]          // local bodies that issue this in Kosovo, if any
  costRange?: { min: number; max: number; currency: 'EUR'; note?: string }
  durationMonths?: { min: number; max: number; note?: string }
  marketAccess?: string[]            // which markets / buyer categories want this
  related?: string[]                 // related certifications (slugs)
  // Personalization v1: canonical sector slugs this cert targets. Empty array =
  // universal (shows for all users; e.g. ISO 9001 applies to every industry).
  // Non-empty = shows only to users whose sectors[] intersects.
  targetSectors?: string[]
}

export interface CertificationCategory {
  id: string
  title: string                      // Albanian section title
  icon: string                       // lucide-react icon name
  description?: string
  certifications: Certification[]
  // Personalization v1: when a cert in this category has no `targetSectors` of
  // its own, the category default fills in. Empty/undefined = universal.
  targetSectors?: string[]
}

export const CERTIFICATION_CATEGORIES: CertificationCategory[] = [
  {
    id: 'cilesia',
    title: 'Cilësia & Menaxhimi',
    icon: 'Award',
    description: 'Standarde që dëshmojnë se kompania funksionon në mënyrë profesionale. Shpesh të kërkuara nga blerës të mëdhenj si parakusht para se të blejnë prej teje.',
    certifications: [
      {
        slug: 'iso-9001',
        name: 'ISO 9001',
        fullName: 'Quality Management Systems',
        fullNameSq: 'Sistemi i Menaxhimit të Cilësisë',
        whatIs: 'Standardi më i përhapur në botë për menaxhimin e cilësisë. Vërteton se ke procese të dokumentuara, kontroll cilësie, dhe një mënyrë sistematike për t\'u përmirësuar.',
        industries: ['Prodhim', 'Shërbime', 'Druri', 'Mobilje', 'Tekstil', 'Metalpunues', 'IT', 'Ndërtim'],
        mandatory: 'optional_advantage',
        whyMatters: 'Shumica e blerësve gjermanë, austriakë, dhe zinxhirëve të mëdhenj nuk punojnë me furnizues pa ISO 9001. Edhe disa tendere publike në Kosovë e kërkojnë. Pa të, dyert e tregut europian janë shumë më të ngushta.',
        issuedBy: ['TÜV (DE/AT)', 'SGS', 'Bureau Veritas', 'DEKRA', 'BSI', 'Lloyd\'s Register'],
        issuedByKosovo: ['TÜV Kosova', 'SGS Kosova', 'Bureau Veritas Kosova'],
        costRange: { min: 1500, max: 8000, currency: 'EUR', note: 'Sipas madhësisë së kompanisë. NVM = €1,500–€3,500.' },
        durationMonths: { min: 3, max: 6 },
        marketAccess: ['BE', 'Gjermani', 'Austri', 'Tendere publike'],
        related: ['iso-14001', 'iso-45001'],
      },
      {
        slug: 'iso-14001',
        name: 'ISO 14001',
        fullName: 'Environmental Management Systems',
        fullNameSq: 'Sistemi i Menaxhimit Mjedisor',
        whatIs: 'Sistem për të reduktuar ndikimin tënd mjedisor: konsumin e energjisë, mbetjet, ujin, emetimet. Tregon se i merr seriozisht përgjegjësitë mjedisore.',
        industries: ['Prodhim', 'Ndërtim', 'Druri', 'Metalpunues', 'Tekstil', 'Kimi'],
        mandatory: 'optional_advantage',
        whyMatters: 'Blerësit europianë gjithnjë e më shumë e kërkojnë si pjesë e politikave të tyre të qëndrueshmërisë (CSR). Bashkë me ISO 9001, kjo është "dyshe" që shumë furnizues të mëdhenj e kërkojnë.',
        issuedBy: ['TÜV', 'SGS', 'Bureau Veritas', 'DEKRA', 'DNV'],
        issuedByKosovo: ['TÜV Kosova', 'SGS Kosova'],
        costRange: { min: 1500, max: 7000, currency: 'EUR' },
        durationMonths: { min: 3, max: 6 },
        marketAccess: ['BE', 'Tendere publike', 'Korporata multinacionale'],
        related: ['iso-9001', 'iso-50001'],
      },
      {
        slug: 'iso-45001',
        name: 'ISO 45001',
        fullName: 'Occupational Health and Safety Management',
        fullNameSq: 'Siguria dhe Shëndeti në Punë',
        whatIs: 'Vërteton se ke sistem të strukturuar për sigurinë e punëtorëve: vlerësim rreziku, procedura për aksidente, trajnime, mbrojtje personale.',
        industries: ['Ndërtim', 'Prodhim', 'Druri', 'Metalpunues', 'Kimi', 'Logjistikë'],
        mandatory: 'optional_advantage',
        whyMatters: 'E kërkojnë blerës ndërkombëtarë në sektorë me rrezik (ndërtim, prodhim i rëndë). Gjithashtu zvogëlon premitë e sigurimit dhe rrezikun ligjor. Punëtorët e trajnuar = më pak aksidente = më pak ndalim prodhimi.',
        issuedBy: ['TÜV', 'SGS', 'Bureau Veritas', 'DNV'],
        issuedByKosovo: ['TÜV Kosova', 'SGS Kosova'],
        costRange: { min: 1500, max: 6000, currency: 'EUR' },
        durationMonths: { min: 3, max: 6 },
        related: ['iso-9001', 'iso-14001'],
      },
      {
        slug: 'iso-50001',
        name: 'ISO 50001',
        fullName: 'Energy Management Systems',
        fullNameSq: 'Sistemi i Menaxhimit të Energjisë',
        whatIs: 'Sistem për të matur dhe reduktuar konsumin e energjisë në kompani. Identifikon ku po humbet energji dhe vendos plan për kursim.',
        industries: ['Prodhim', 'Ushqim', 'Tekstil', 'Druri', 'Metalpunues'],
        mandatory: 'optional_advantage',
        whyMatters: 'Faturat e energjisë janë kosto kryesore për prodhuesit. Implementimi i kësaj zakonisht ul faturën 10-20% në vitin e parë. Blerës me objektiva net-zero (BE) gjithnjë e më shumë e kërkojnë.',
        issuedBy: ['TÜV', 'SGS', 'DEKRA', 'DNV'],
        costRange: { min: 2000, max: 8000, currency: 'EUR' },
        durationMonths: { min: 4, max: 8 },
        marketAccess: ['BE — Green Deal', 'Korporata me objektiva ESG'],
        related: ['iso-14001'],
      },
    ],
  },
  {
    id: 'ushqim',
    title: 'Siguria e Ushqimit',
    icon: 'Utensils',
    description: 'Sektori kryesor i eksportit të Kosovës. Pa këto certifikime, ushqimi nuk shitet ligjërisht në BE dhe asnjë zinxhir i madh nuk do ta blejë.',
    targetSectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'],
    certifications: [
      {
        slug: 'haccp',
        name: 'HACCP',
        fullName: 'Hazard Analysis and Critical Control Points',
        fullNameSq: 'Analiza e Rrezikut dhe Pikat Kritike të Kontrollit',
        whatIs: 'Sistem që identifikon dhe kontrollon rreziqet (biologjike, kimike, fizike) në çdo fazë të prodhimit të ushqimit. Bazë absolute e sigurisë ushqimore.',
        industries: ['Ushqim & Pije', 'Mish', 'Bulmet', 'Mjaltë', 'Verë', 'Konserva', 'Pastiçeri'],
        mandatory: 'eu_mandatory',
        mandatoryNote: 'I detyrueshëm me ligj për çdo biznes që prodhon, përpunon ose paketon ushqim. Pa HACCP, eksporti drejt BE-së është i pamundur.',
        whyMatters: 'Pa HACCP, ushqimi yt nuk del nga Kosova. AVUK (Agjencia për Ushqim dhe Veterinari e Kosovës) e inspekton para se të lëshojë çertifikatën shëndetësore për eksport. Asnjë doganë BE nuk e lejon pa të.',
        issuedBy: ['TÜV', 'SGS', 'Bureau Veritas', 'KIWA'],
        issuedByKosovo: ['AVUK', 'TÜV Kosova', 'SGS Kosova'],
        costRange: { min: 1500, max: 5000, currency: 'EUR' },
        durationMonths: { min: 2, max: 6 },
        marketAccess: ['BE — i detyrueshëm', 'Çdo treg ndërkombëtar'],
        related: ['iso-22000', 'fssc-22000'],
      },
      {
        slug: 'iso-22000',
        name: 'ISO 22000',
        fullName: 'Food Safety Management System',
        fullNameSq: 'Sistemi i Menaxhimit të Sigurisë Ushqimore',
        whatIs: 'HACCP plus ISO 9001 — kombinim i sigurisë ushqimore me menaxhim cilësie. Standard ndërkombëtar i njohur globalisht.',
        industries: ['Ushqim & Pije', 'Mish', 'Bulmet', 'Vaj', 'Konserva', 'Mjaltë', 'Erëza'],
        mandatory: 'sector_required',
        mandatoryNote: 'Jo i detyrueshëm me ligj, por shumë blerës ndërkombëtarë e kërkojnë në vend të HACCP të vetëm.',
        whyMatters: 'Më prestigjoz se HACCP për tregjet e mëdha (Gjermani, SHBA, Emirate). Shpesh e zëvendëson HACCP për blerës që duan një kombinim cilësi + siguri.',
        issuedBy: ['TÜV', 'SGS', 'Bureau Veritas', 'DNV', 'DEKRA'],
        issuedByKosovo: ['TÜV Kosova', 'SGS Kosova', 'Bureau Veritas Kosova'],
        costRange: { min: 2500, max: 8000, currency: 'EUR' },
        durationMonths: { min: 4, max: 8 },
        marketAccess: ['BE', 'SHBA', 'Emirate', 'Zinxhirë retail global'],
        related: ['haccp', 'fssc-22000'],
      },
      {
        slug: 'brcgs',
        name: 'BRCGS',
        fullName: 'British Retail Consortium Global Standards',
        fullNameSq: 'Standardi Global i Konsorciumit Britanik të Shitësve',
        whatIs: 'Standard i sigurisë ushqimore i krijuar nga zinxhirët e mëdhenj britanikë. Sot kërkohet nga retail-i në mbarë botën, jo vetëm UK.',
        industries: ['Ushqim & Pije', 'Konserva', 'Mish', 'Bulmet', 'Pastiçeri'],
        mandatory: 'sector_required',
        mandatoryNote: 'I detyrueshëm de facto për të hyrë në Tesco, Sainsbury\'s, Lidl, Aldi, Marks & Spencer dhe shumicën e zinxhirëve të mëdhenj europianë.',
        whyMatters: 'Nëse synon raftet e Lidl-it, Aldi-t, Tesco-s, ose etiketin privat të zinxhirëve të tjerë, BRCGS nuk është opsion — është biletë hyrjeje.',
        issuedBy: ['SGS', 'Bureau Veritas', 'TÜV NORD', 'KIWA', 'Intertek'],
        issuedByKosovo: ['SGS Kosova', 'Bureau Veritas Kosova'],
        costRange: { min: 3500, max: 12000, currency: 'EUR' },
        durationMonths: { min: 4, max: 9 },
        marketAccess: ['Mbretëria e Bashkuar', 'Gjermani — Lidl/Aldi', 'Zinxhirë retail global'],
        related: ['ifs', 'iso-22000'],
      },
      {
        slug: 'ifs',
        name: 'IFS Food',
        fullName: 'International Featured Standards Food',
        fullNameSq: 'Standardi Ndërkombëtar i Veçuar për Ushqimin',
        whatIs: 'Ekuivalenti gjerman/francez i BRCGS. I krijuar nga zinxhirët retail gjermanë (REWE, Aldi) dhe francezë (Carrefour, Auchan).',
        industries: ['Ushqim & Pije', 'Mish', 'Bulmet', 'Pastiçeri', 'Konserva'],
        mandatory: 'sector_required',
        mandatoryNote: 'I detyrueshëm de facto për të hyrë te zinxhirët gjermanë dhe francezë.',
        whyMatters: 'Gjermania është tregu më i madh BE për ushqim, dhe REWE/EDEKA/Lidl janë gatekeepers-at. Pa IFS, etiketi privat i tyre nuk është i mundur.',
        issuedBy: ['DQS', 'TÜV SÜD', 'SGS', 'Bureau Veritas', 'KIWA'],
        issuedByKosovo: ['TÜV Kosova', 'SGS Kosova'],
        costRange: { min: 3500, max: 12000, currency: 'EUR' },
        durationMonths: { min: 4, max: 9 },
        marketAccess: ['Gjermani', 'Francë', 'Austri', 'Zinxhirë retail europianë'],
        related: ['brcgs', 'iso-22000'],
      },
      {
        slug: 'globalgap',
        targetSectors: ['bujqesi-blegtori', 'ushqim-dhe-pije'],
        name: 'GlobalG.A.P',
        fullName: 'Good Agricultural Practices',
        fullNameSq: 'Praktikat e Mira Bujqësore',
        whatIs: 'Standard për prodhimin parësor bujqësor: fruta, perime, kafshë, peshk. Mbulon sigurinë, mjedisin, mirëqenien e kafshëve dhe shëndetin e punëtorëve.',
        industries: ['Fruta & Perime', 'Kafshë', 'Peshk', 'Lule', 'Bujqësi e freskët'],
        mandatory: 'sector_required',
        mandatoryNote: 'I detyrueshëm de facto për të shitur fruta/perime të freskëta në zinxhirët retail europianë.',
        whyMatters: 'Pa GlobalG.A.P, mollët, dredhëzat, domatet, qershitë e Kosovës nuk hyjnë në zinxhirët e mëdhenj BE. Edhe importuesit me shumicë e kërkojnë.',
        issuedBy: ['TÜV', 'SGS', 'Bureau Veritas', 'Control Union', 'KIWA'],
        issuedByKosovo: ['TÜV Kosova', 'Control Union'],
        costRange: { min: 800, max: 4000, currency: 'EUR', note: 'Për fermerë individualë; grupet e prodhuesve marrin çmim më të mirë.' },
        durationMonths: { min: 3, max: 8 },
        marketAccess: ['BE — fruta/perime të freskëta', 'Gjermani', 'Holandë'],
        related: ['eu-organic'],
      },
      {
        slug: 'fssc-22000',
        targetSectors: ['ushqim-dhe-pije', 'bujqesi-blegtori', 'leter-paketim'],
        name: 'FSSC 22000',
        fullName: 'Food Safety System Certification 22000',
        fullNameSq: 'Çertifikimi i Sistemit të Sigurisë Ushqimore',
        whatIs: 'Versioni i njohur globalisht i ISO 22000, i njohur nga GFSI (Global Food Safety Initiative). Plotëson kërkesat e shumicës absolute të blerësve global.',
        industries: ['Ushqim & Pije', 'Paketim ushqimor', 'Ushqim kafshësh'],
        mandatory: 'sector_required',
        whyMatters: 'Nëse blerësit e tu kërkojnë "GFSI-recognized", FSSC 22000 është më i përshtatshmi për prodhues. Më i fortë se ISO 22000 i pastër.',
        issuedBy: ['TÜV', 'SGS', 'DNV', 'Bureau Veritas', 'DEKRA'],
        costRange: { min: 3500, max: 10000, currency: 'EUR' },
        durationMonths: { min: 4, max: 9 },
        marketAccess: ['BE', 'SHBA', 'Korporata global ushqimore'],
        related: ['iso-22000', 'brcgs', 'ifs'],
      },
    ],
  },
  {
    id: 'ce',
    title: 'CE Marking & Direktivat BE',
    icon: 'ShieldCheck',
    description: 'Pa shenjën CE, produktet që bien në fushën e detyrueshme nuk shiten ligjërisht në BE/EEA. E lëshon vetë prodhuesi (deklarata e konformitetit), por dokumentohet me testet e duhura.',
    certifications: [
      {
        slug: 'ce-marking',
        targetSectors: ['druri-mobilje', 'metale-makineri', 'pajisje-elektrike', 'ndertim-materiale', 'plastika-goma', 'farmaceutike-mjekesore', 'tekstil-konfeksion', 'konstruksion-inxhinieri', 'lekure-kepuce'],
        name: 'CE Marking',
        fullName: 'Conformité Européenne',
        fullNameSq: 'Konformiteti Europian',
        whatIs: 'Shenja CE është deklaratë e prodhuesit që produkti i tij plotëson kërkesat e BE-së për siguri, shëndet dhe mjedis. Aplikohet për kategori specifike produktesh.',
        industries: ['Makineri', 'Elektronikë', 'Dyer/dritare', 'Lodra', 'Pajisje mjekësore', 'Materiale ndërtimi', 'PPE'],
        mandatory: 'eu_mandatory',
        mandatoryNote: 'I detyrueshëm për të gjitha produktet që bien në direktivat CE të BE-së. Pa CE, doganat BE e ndalojnë mallin.',
        whyMatters: 'CE është "pasaporta" e produktit për tregun europian — tregu më i madh në botë. Pa të, asnjë nga 27 vendet BE + 4 EFTA nuk e pranon produktin.',
        issuedBy: ['Vetëdeklarim (modul A)', 'Notified Bodies (TÜV, SGS, etj.) për module më të rrepta'],
        issuedByKosovo: ['TÜV Kosova', 'SGS Kosova', 'Bureau Veritas Kosova — për testim'],
        costRange: { min: 1000, max: 30000, currency: 'EUR', note: 'Produkte të thjeshta: €1,000–€3,000. Pajisje mjekësore ose komplekse: €15,000–€30,000+.' },
        durationMonths: { min: 1, max: 12 },
        marketAccess: ['BE 27', 'Islandë', 'Norvegji', 'Lihtenshtejn', 'Zvicër (në shumë raste)'],
        related: ['rohs', 'reach', 'emc', 'lvd'],
      },
      {
        slug: 'lvd',
        targetSectors: ['pajisje-elektrike'],
        name: 'LVD',
        fullName: 'Low Voltage Directive (2014/35/EU)',
        fullNameSq: 'Direktiva për Tensionin e Ulët',
        whatIs: 'Pjesë e CE Marking për produkte elektrike midis 50V dhe 1000V AC ose 75V dhe 1500V DC. Mbulon sigurinë elektrike.',
        industries: ['Elektronikë', 'Pajisje shtëpiake', 'Ndriçim', 'Pajisje industriale'],
        mandatory: 'eu_mandatory',
        whyMatters: 'Çdo produkt elektrik që dëshiron të shitet në BE duhet të jetë në përputhje me LVD. Pa testet (zakonisht IEC 60335 ose 61010), nuk merr CE.',
        issuedBy: ['Laboratorë test të akredituar (TÜV, SGS, Intertek, DEKRA)'],
        costRange: { min: 1500, max: 8000, currency: 'EUR' },
        durationMonths: { min: 1, max: 4 },
        related: ['ce-marking', 'emc'],
      },
      {
        slug: 'emc',
        targetSectors: ['pajisje-elektrike'],
        name: 'EMC',
        fullName: 'Electromagnetic Compatibility (2014/30/EU)',
        fullNameSq: 'Përputhshmëria Elektromagnetike',
        whatIs: 'Direktiva që siguron se pajisjet nuk emetojnë interferencë elektromagnetike që prish pajisjet e tjera, dhe vetë janë rezistente ndaj saj.',
        industries: ['Elektronikë', 'Telekomunikacion', 'IT hardware', 'Pajisje industriale'],
        mandatory: 'eu_mandatory',
        whyMatters: 'Çdo pajisje elektronike që shitet në BE duhet të kalojë testet EMC. Bashkë me LVD, formojnë bazën e CE për elektronikë.',
        issuedBy: ['Laboratorë test të akredituar (TÜV, SGS, Intertek)'],
        costRange: { min: 2000, max: 10000, currency: 'EUR' },
        durationMonths: { min: 1, max: 4 },
        related: ['ce-marking', 'lvd'],
      },
      {
        slug: 'rohs',
        targetSectors: ['pajisje-elektrike'],
        name: 'RoHS',
        fullName: 'Restriction of Hazardous Substances (2011/65/EU)',
        fullNameSq: 'Kufizimi i Substancave të Rrezikshme',
        whatIs: 'Ndalon përdorimin e 10 substancave të rrezikshme (plumb, merkur, kadmium, etj.) në produktet elektrike dhe elektronike.',
        industries: ['Elektronikë', 'Pajisje shtëpiake', 'Lodra elektronike', 'Pajisje mjekësore'],
        mandatory: 'eu_mandatory',
        whyMatters: 'Pjesë e detyrueshme e CE-së për elektronikë. Pa deklaratën RoHS, doganat BE e ndalojnë.',
        issuedBy: ['Vetëdeklarim me bazë teste laboratorike (XRF, ICP-MS)'],
        costRange: { min: 500, max: 3000, currency: 'EUR' },
        durationMonths: { min: 1, max: 2 },
        related: ['ce-marking', 'reach'],
      },
      {
        slug: 'reach',
        targetSectors: ['kimi-kozmetike', 'plastika-goma', 'tekstil-konfeksion', 'lekure-kepuce', 'druri-mobilje', 'ndertim-materiale'],
        name: 'REACH',
        fullName: 'Registration, Evaluation, Authorisation and Restriction of Chemicals',
        fullNameSq: 'Regjistrimi, Vlerësimi dhe Autorizimi i Kimikateve',
        whatIs: 'Rregullorja kryesore e BE për kimikate. Çdo substancë në sasi >1 ton/vit duhet të regjistrohet me ECHA (Agjencia Europiane e Kimikateve).',
        industries: ['Kimi', 'Tekstil', 'Lëkurë', 'Mobilje', 'Lodra', 'Kozmetikë'],
        mandatory: 'eu_mandatory',
        mandatoryNote: 'Kompanitë jashtë-BE që eksportojnë në BE duhet të caktojnë një "Only Representative" brenda BE-së për regjistrim.',
        whyMatters: 'Pa pajtueshmëri REACH, kimikatet, ngjyrat, materialet me bazë kimike nuk shiten në BE.',
        issuedBy: ['ECHA — regjistrim direkt', 'Konsulentë specialë REACH'],
        costRange: { min: 3000, max: 50000, currency: 'EUR', note: 'Varet shumë nga sasia dhe substancat. Regjistrime të mëdha mund të kalojnë €100k.' },
        durationMonths: { min: 6, max: 24 },
        related: ['rohs', 'ce-marking'],
      },
      {
        slug: 'mdr',
        targetSectors: ['farmaceutike-mjekesore'],
        name: 'MDR (CE për pajisje mjekësore)',
        fullName: 'Medical Device Regulation (2017/745)',
        fullNameSq: 'Rregullorja për Pajisje Mjekësore',
        whatIs: 'Direktiva e re BE për pajisje mjekësore. Zëvendësoi MDD më 2021. Standarde shumë më të rrepta për dokumentim, klinikë dhe vigjilencë.',
        industries: ['Pajisje mjekësore', 'Diagnostikë', 'Implante', 'Software medical'],
        mandatory: 'eu_mandatory',
        whyMatters: 'Çdo pajisje mjekësore që shitet në BE duhet të ketë CE sipas MDR. Procesi është i gjatë dhe i shtrenjtë, por hapja e tregut prej 450M njerëzish e justifikon.',
        issuedBy: ['Notified Bodies të MDR (TÜV SÜD, BSI, DEKRA, DNV)'],
        costRange: { min: 15000, max: 100000, currency: 'EUR', note: 'Varet shumë nga klasa e pajisjes (I, IIa, IIb, III).' },
        durationMonths: { min: 9, max: 24 },
        marketAccess: ['BE 27 + EEA'],
        related: ['ce-marking', 'iso-9001'],
      },
    ],
  },
  {
    id: 'organike',
    title: 'BIO & Organike',
    targetSectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'],
    icon: 'Leaf',
    description: 'Tregu organik është rritja më e shpejtë në BE. Konsumatorët gjermanë, austriakë, dhe nordikë paguajnë 30–80% më shumë për produkte BIO të certifikuara.',
    certifications: [
      {
        slug: 'eu-organic',
        name: 'BIO BE (EU Organic)',
        fullName: 'EU Organic Logo (Regulation 2018/848)',
        fullNameSq: 'Logo Organike e BE-së',
        whatIs: 'Certifikimi zyrtar i BE-së për prodhime bujqësore organike. Logoja e gjelbër me yje (Euro-leaf). Mbulon mënyrën e prodhimit nga toka deri te rafti.',
        industries: ['Bujqësi', 'Ushqim & Pije', 'Mjaltë', 'Verë', 'Mishi', 'Bulmet'],
        mandatory: 'sector_required',
        mandatoryNote: 'I detyrueshëm për të përdorur fjalët "BIO", "ORGANIC", "ECO" në etiketim brenda BE-së. Nuk mund të quash diçka BIO pa këtë.',
        whyMatters: 'Premium çmimi 30–80% mbi produkte konvencionale. Tregu BIO BE rritet ~10% në vit. Kosovë ka pak prodhues të certifikuar, kështu që konkurrenca është e ulët.',
        issuedBy: ['Kontrolluar nga organe të akredituara nga BE: Kontrol BIO, Control Union, BCS Öko-Garantie', 'CERES'],
        issuedByKosovo: ['Albinspekt', 'Control Union Kosova (përmes Maqedonisë)', 'IMO/Ecocert'],
        costRange: { min: 1500, max: 6000, currency: 'EUR', note: 'Plus 2-3 vite "konvertim" — toka duhet të mbahet organike para çertifikimit.' },
        durationMonths: { min: 24, max: 36, note: 'Periudha e konvertimit është 2 vjet për kulturat vjetore, 3 vjet për shumëvjeçaret.' },
        marketAccess: ['BE 27', 'Gjermani', 'Austri', 'Skandinavi', 'Zvicër'],
        related: ['globalgap'],
      },
      {
        slug: 'usda-organic',
        name: 'USDA Organic',
        fullName: 'United States Department of Agriculture Organic',
        whatIs: 'Certifikimi organik amerikan. I nevojshëm për të shitur si "ORGANIC" në SHBA. Ekuivalent reciprokisht i njohur me BIO BE për shumicën e produkteve.',
        industries: ['Bujqësi', 'Ushqim & Pije', 'Verë', 'Çaj'],
        mandatory: 'sector_required',
        mandatoryNote: 'I detyrueshëm për etiketin "Organic" në SHBA. Por nëse ke EU Organic, mund ta përdorësh në SHBA përmes marrëveshjes USDA-EU.',
        whyMatters: 'Tregu organik SHBA është më i madhi në botë (~$60B). Marrëveshja USDA-BE për ekuivalencë e bën më të lehtë për prodhues kosovarë me EU Organic të hyjnë.',
        issuedBy: ['Organe të akredituara USDA (CCOF, OCIA, Quality Assurance International)'],
        costRange: { min: 2000, max: 8000, currency: 'EUR' },
        durationMonths: { min: 24, max: 36 },
        related: ['eu-organic'],
      },
    ],
  },
  {
    id: 'religjioze',
    title: 'Certifikime Religjioze',
    targetSectors: ['ushqim-dhe-pije', 'bujqesi-blegtori', 'kimi-kozmetike', 'farmaceutike-mjekesore'],
    icon: 'Heart',
    description: 'Hapin tregje që ndryshe janë të mbyllura — Lindjen e Mesme (1.8 miliardë konsumatorë myslimanë) dhe komunitetet hebreje në SHBA/Europë.',
    certifications: [
      {
        slug: 'halal',
        name: 'Halal',
        fullName: 'Halal Certification',
        fullNameSq: 'Certifikimi Halal',
        whatIs: 'Vërteton se produkti është prodhuar sipas ligjit Islamik (Sheriati): pa derr, alkool, përbërës haram, dhe (për mish) sipas mënyrës së therjes së përshkruar.',
        industries: ['Ushqim & Pije', 'Mish', 'Pastiçeri', 'Kozmetikë', 'Suplementë', 'Farmaceutikë'],
        mandatory: 'sector_required',
        mandatoryNote: 'I detyrueshëm de facto për të shitur në Lindjen e Mesme dhe vendet me popullsi myslimane. Edhe BE: konsumatorët myslimanë (~30M) e kërkojnë.',
        whyMatters: 'Hap tregjet Halal globalë me vlerë ~$2.4 trilionë në vit. Emiratet, Arabia Saudite, Turqia janë destinacionet kryesore. Edhe Lidl dhe Edeka në Gjermani kanë rafte Halal.',
        issuedBy: ['Halal Albania Center', 'JAKIM (Malajzia, e njohur globalisht)', 'IFANCA (SHBA)', 'GIMDES (Turqi)', 'IFRC'],
        issuedByKosovo: ['Halal Albania Center (njihet në Kosovë)', 'Bashkësia Islamike e Kosovës (BIK)'],
        costRange: { min: 800, max: 4000, currency: 'EUR' },
        durationMonths: { min: 2, max: 6 },
        marketAccess: ['Emiratet e Bashkuara Arabe', 'Arabia Saudite', 'Turqia', 'Indonezi', 'Malajzia', 'BE — konsumatorë myslimanë'],
        related: ['kosher'],
      },
      {
        slug: 'kosher',
        targetSectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'],
        name: 'Kosher',
        fullName: 'Kosher Certification',
        whatIs: 'Vërteton se produkti është prodhuar sipas ligjit hebre dietar (Kashrut): ndarja e mishit dhe qumështit, mënyra e therjes (Shechita), pa përbërës të ndaluar.',
        industries: ['Ushqim & Pije', 'Verë', 'Mish', 'Bulmet', 'Pastiçeri'],
        mandatory: 'sector_required',
        whyMatters: 'Tregu Kosher në SHBA është ~$24B/vit, dhe shumë konsumatorë jo-hebrenj e blejnë sepse e shohin si simbol cilësie. Vera kosher është nika ku Kosova mund të hyjë.',
        issuedBy: ['OU (Orthodox Union — më i njohuri)', 'OK Kosher', 'Star-K', 'CRC', 'Kof-K'],
        costRange: { min: 1500, max: 8000, currency: 'EUR', note: 'Plus vizitat e rregullta të mashgiach (mbikëqyrës).' },
        durationMonths: { min: 2, max: 6 },
        marketAccess: ['SHBA — komunitetet hebreje', 'Izrael', 'BE — komuna hebreje në Francë, UK, Gjermani'],
        related: ['halal'],
      },
    ],
  },
  {
    id: 'tekstil',
    title: 'Tekstil & Veshje',
    targetSectors: ['tekstil-konfeksion'],
    icon: 'Shirt',
    description: 'Industria e tekstilit në Kosovë po rritet (rritje 15% në 2024). Certifikimet janë kyçe për të hyrë te markat e mëdha të modës.',
    certifications: [
      {
        slug: 'oeko-tex-100',
        name: 'OEKO-TEX Standard 100',
        fullName: 'OEKO-TEX Standard 100',
        whatIs: 'Standardi më i njohur për tekstile pa substanca të dëmshme. Çdo komponent i produktit (filli, pëlhura, ngjyra, butonat) testohet për kimikate të rrezikshme.',
        industries: ['Tekstil', 'Veshje', 'Veshje fëmijësh', 'Mbulesa', 'Pëlhurë industriale'],
        mandatory: 'sector_required',
        mandatoryNote: 'I kërkuar nga shumica e markave europiane të modës si parakusht para se të blejnë.',
        whyMatters: 'Zinxhirët si H&M, Zara, C&A, Esprit kërkojnë OEKO-TEX. Pa të, prodhuesit kosovarë mbeten te porositë e vogla. Me të, hyjnë te markat e mëdha.',
        issuedBy: ['Instituti OEKO-TEX (Hohenstein, TESTEX, ITV Denkendorf, etj.)'],
        costRange: { min: 1500, max: 6000, currency: 'EUR', note: 'Për produkt — secili produkt apo material kërkon testet e veta.' },
        durationMonths: { min: 1, max: 3 },
        marketAccess: ['BE', 'Markat ndërkombëtare të modës', 'Veshje fëmijësh (kërkohet me siguri)'],
        related: ['gots', 'bluesign'],
      },
      {
        slug: 'gots',
        name: 'GOTS',
        fullName: 'Global Organic Textile Standard',
        fullNameSq: 'Standardi Global për Tekstile Organike',
        whatIs: 'Certifikim për tekstile organike — nga fija e pambukut (që duhet të jetë BIO) deri te punëtori i fundit. Mbulon edhe kushtet sociale të punëtorëve.',
        industries: ['Tekstil organik', 'Veshje BIO', 'Pambuk organik'],
        mandatory: 'optional_advantage',
        whyMatters: 'Markat premium (Patagonia, Stella McCartney, brendet sustainable) e kërkojnë. Çmimi premium 30-50% mbi tekstile konvencionale. Tregu po rritet 20%/vit.',
        issuedBy: ['Control Union', 'CERES', 'Ecocert', 'IMO'],
        costRange: { min: 2500, max: 10000, currency: 'EUR' },
        durationMonths: { min: 3, max: 8 },
        marketAccess: ['Markat sustainable', 'Gjermani', 'Skandinavi', 'SHBA'],
        related: ['oeko-tex-100', 'eu-organic'],
      },
    ],
  },
  {
    id: 'druri',
    title: 'Druri & Letra',
    targetSectors: ['druri-mobilje', 'leter-paketim', 'ndertim-materiale'],
    icon: 'Trees',
    description: 'BE ka rregulla strikte për origjinën e drurit (EUTR / EUDR i ri). Pa certifikim, druri ilegal nuk hyn në BE.',
    certifications: [
      {
        slug: 'fsc',
        name: 'FSC',
        fullName: 'Forest Stewardship Council',
        fullNameSq: 'Këshilli i Administrimit të Pyjeve',
        whatIs: 'Standardi më i njohur global për pyje të menaxhuara në mënyrë të qëndrueshme. Logot FSC tregojnë se druri vjen nga burim i ligjshëm dhe i ripërsëritshëm.',
        industries: ['Druri', 'Mobilje', 'Letra', 'Paketim', 'Ndërtim'],
        mandatory: 'sector_required',
        mandatoryNote: 'Praktikisht i detyrueshëm me Rregulloren e re BE për Deforestim (EUDR, hyri në fuqi 2025) për druri, kafe, kakao, soja, vajin e palmës.',
        whyMatters: 'Zinxhirët si IKEA, Leroy Merlin, Hornbach e kërkojnë FSC. Pa të, druri kosovar nuk hyn në mobilje BE me etiketim, edhe pse cilësia është e mirë.',
        issuedBy: ['Bureau Veritas', 'SGS', 'TÜV', 'NEPCon', 'Soil Association'],
        issuedByKosovo: ['Bureau Veritas Kosova', 'SGS Kosova', 'NEPCon (përmes rajonit)'],
        costRange: { min: 1500, max: 7000, currency: 'EUR' },
        durationMonths: { min: 3, max: 8 },
        marketAccess: ['BE', 'IKEA', 'Leroy Merlin', 'Hornbach', 'Zinxhirë DIY'],
        related: ['pefc'],
      },
      {
        slug: 'pefc',
        name: 'PEFC',
        fullName: 'Programme for the Endorsement of Forest Certification',
        whatIs: 'Standardi alternativ ndaj FSC për pyje të qëndrueshme. Më i përhapur në Europë qendrore (Gjermani, Austri, Francë).',
        industries: ['Druri', 'Mobilje', 'Letra', 'Paketim'],
        mandatory: 'sector_required',
        whyMatters: 'Disa blerës pranojnë vetëm FSC, të tjerë vetëm PEFC, shumë e pranojnë çdonjërin. Marrja e të dyjave maksimon hapje tregu.',
        issuedBy: ['Bureau Veritas', 'SGS', 'TÜV', 'DNV'],
        costRange: { min: 1500, max: 6000, currency: 'EUR' },
        durationMonths: { min: 3, max: 7 },
        marketAccess: ['BE', 'Gjermani', 'Austri', 'Francë'],
        related: ['fsc'],
      },
    ],
  },
  {
    id: 'etike',
    title: 'Etike & Sociale',
    icon: 'Heart',
    description: 'BE ka shtrënguar rregullat për kushtet e punës në zinxhirin e furnizimit. Auditi etik nuk është më luks — është standard për blerës të mëdhenj.',
    certifications: [
      {
        slug: 'bsci',
        name: 'BSCI (amfori)',
        fullName: 'Business Social Compliance Initiative',
        whatIs: 'Audit social i kushteve të punës: orari, paga, siguria, mosha minimale, liria e organizimit. I bërë nga firmat amfori sipas Kodit të Sjelljes.',
        industries: ['Prodhim', 'Tekstil', 'Veshje', 'Lëkurë', 'Lodra', 'Mobilje'],
        mandatory: 'sector_required',
        mandatoryNote: 'I kërkuar nga shumica absolute e zinxhirëve BE për të blerë nga vende me rrezik social (përfshirë Ballkanin).',
        whyMatters: 'Pa BSCI ose audit ekuivalent (SMETA, SA8000), zinxhirët si Lidl, Aldi, H&M, IKEA nuk porosit ose përfundon kontratën. Sot është "minimum viable" për të hyrë te ata.',
        issuedBy: ['Audituar nga: amfori auditues të akredituar — Bureau Veritas, SGS, TÜV, Intertek'],
        issuedByKosovo: ['Bureau Veritas Kosova', 'SGS Kosova'],
        costRange: { min: 1500, max: 5000, currency: 'EUR' },
        durationMonths: { min: 2, max: 5 },
        marketAccess: ['Lidl, Aldi, Edeka', 'H&M, C&A', 'IKEA', 'Zinxhirë retail BE'],
        related: ['smeta', 'sa8000'],
      },
      {
        slug: 'smeta',
        name: 'SMETA (Sedex)',
        fullName: 'Sedex Members Ethical Trade Audit',
        whatIs: 'Audit etik 4-shtyllash: punës, shëndetit dhe sigurisë, mjedisit, dhe biznesit etik. I përdorur kryesisht nga retail britanik.',
        industries: ['Prodhim', 'Ushqim', 'Tekstil', 'Lëkurë'],
        mandatory: 'sector_required',
        mandatoryNote: 'I kërkuar nga zinxhirët britanikë (Tesco, Sainsbury\'s, M&S, Asda) dhe shumë multinacionale.',
        whyMatters: 'Nëse synon UK ose blerës me prani anglo-saksone (M&S, Walmart), SMETA është ekuivalentja e BSCI por më e njohur në atë tregut.',
        issuedBy: ['Bureau Veritas', 'SGS', 'Intertek', 'TÜV'],
        costRange: { min: 1500, max: 5000, currency: 'EUR' },
        durationMonths: { min: 2, max: 4 },
        marketAccess: ['UK', 'SHBA', 'Walmart, Tesco, M&S, Sainsbury\'s'],
        related: ['bsci', 'sa8000'],
      },
      {
        slug: 'sa8000',
        name: 'SA8000',
        fullName: 'Social Accountability 8000',
        fullNameSq: 'Përgjegjësia Sociale 8000',
        whatIs: 'Standardi më i rreptë për kushtet sociale të punës. Përfshin orare, paga, siguri, lirinë e organizimit, mosha minimale, dhe ndalimin e diskriminimit. Më i fortë se BSCI dhe SMETA.',
        industries: ['Prodhim', 'Tekstil', 'Veshje', 'Mobilje'],
        mandatory: 'optional_advantage',
        whyMatters: 'Më prestigjoz se BSCI/SMETA — disa blerës premium (markat etike, brandet sustainable) e preferojnë. Çmim më i mirë për kompani që mund ta provojnë.',
        issuedBy: ['SAI (Social Accountability International) auditues të akredituar — Bureau Veritas, SGS, TÜV, DNV'],
        costRange: { min: 3000, max: 10000, currency: 'EUR' },
        durationMonths: { min: 4, max: 9 },
        related: ['bsci', 'smeta'],
      },
      {
        slug: 'fair-trade',
        targetSectors: ['bujqesi-blegtori', 'ushqim-dhe-pije'],
        name: 'Fair Trade',
        fullName: 'Fairtrade International (FLO-CERT)',
        whatIs: 'Garanti që prodhuesit (zakonisht fermerë në vende në zhvillim) marrin çmim minimal të garantuar plus një premium social për investim në komunitet.',
        industries: ['Kafe', 'Kakao', 'Çaj', 'Sheqer', 'Mjaltë', 'Frutat e thata', 'Lulet'],
        mandatory: 'optional_advantage',
        whyMatters: 'Konsumatorët europianë gjithnjë më shumë blejnë Fair Trade. Premium çmimi 20-50%. Më i përshtatshëm për kooperativa dhe grupe fermerësh sesa kompani individuale.',
        issuedBy: ['FLO-CERT (organi i vetëm i autorizuar)'],
        costRange: { min: 1000, max: 5000, currency: 'EUR' },
        durationMonths: { min: 4, max: 9 },
        marketAccess: ['BE', 'SHBA', 'Skandinavi', 'Zinxhirë me CSR të fortë'],
        related: ['eu-organic'],
      },
    ],
  },
  {
    id: 'energji',
    title: 'Energji & Mjedis',
    icon: 'Zap',
    description: 'Etiketat e gjelbra dhe efikasiteti energjetik po bëhen kërkesë rritëse, jo opsion. Green Deal e BE i jep shtytje me rregullore të reja çdo vit.',
    certifications: [
      {
        slug: 'eu-ecolabel',
        targetSectors: ['kimi-kozmetike', 'leter-paketim', 'druri-mobilje', 'tekstil-konfeksion', 'lekure-kepuce', 'turizem-mikpritje'],
        name: 'EU Ecolabel',
        fullName: 'EU Ecolabel (Lulja)',
        fullNameSq: 'Etiketa Ekologjike e BE-së',
        whatIs: 'Etiketa zyrtare ekologjike e BE-së (logo me lule). Vërteton se produkti ka ndikim të reduktuar mjedisor gjatë gjithë ciklit jetësor.',
        industries: ['Detergjentë', 'Letra', 'Mobilje', 'Tekstil', 'Bojëra', 'Turizëm', 'Pastrim'],
        mandatory: 'optional_advantage',
        whyMatters: 'Diferenciator i fortë në treg. Disa tendere publike BE e kërkojnë. Konsumatorët gjermanë, austriakë, nordikë e njohin dhe e preferojnë.',
        issuedBy: ['Organet kombëtare të akredituara — në Kosovë përmes organizmash BE'],
        costRange: { min: 1500, max: 6000, currency: 'EUR' },
        durationMonths: { min: 4, max: 8 },
        marketAccess: ['BE', 'Tendere publike BE', 'Konsumatorë eko'],
        related: ['iso-14001'],
      },
      {
        slug: 'energy-star',
        targetSectors: ['pajisje-elektrike'],
        name: 'Energy Star',
        fullName: 'Energy Star',
        whatIs: 'Programi i SHBA për produkte me efikasitet të lartë energjetik (frigoriferë, kompjuterë, ndriçim, etj.). E pranuar globalisht.',
        industries: ['Pajisje shtëpiake', 'Elektronikë', 'IT hardware', 'Ndriçim'],
        mandatory: 'optional_advantage',
        whyMatters: 'I detyrueshëm de facto për shitje në SHBA për produktet me konsum energjie. Edhe BE ka programe ekuivalente (etiketat A-G energjetike).',
        issuedBy: ['EPA (US Environmental Protection Agency) përmes laboratorëve të akredituar'],
        costRange: { min: 1000, max: 5000, currency: 'EUR', note: 'Për produkt.' },
        durationMonths: { min: 2, max: 5 },
        marketAccess: ['SHBA', 'Tregje globale efikasiteti'],
        related: ['iso-50001'],
      },
    ],
  },
]

// Helpers for the page
export function allCertifications(): Certification[] {
  return CERTIFICATION_CATEGORIES.flatMap((c) => c.certifications)
}

export function findCertification(slug: string): Certification | undefined {
  return allCertifications().find((c) => c.slug === slug)
}

// Effective targetSectors for a cert: prefer the cert's own list, fall back to
// the category's list, default to [] (universal).
export function certTargetSectors(
  cert: Certification,
  category: CertificationCategory,
): string[] {
  return cert.targetSectors ?? category.targetSectors ?? []
}

// Personalization filter. Returns the same shape as CERTIFICATION_CATEGORIES,
// dropping individual certs that don't match userSectors. A category whose
// certs are all dropped is removed entirely.
//
// Rules:
//  - Empty userSectors[] = pass-through, no filtering.
//  - A cert with empty effective targetSectors = universal, always shows.
//  - Otherwise: shows when effective targetSectors intersects userSectors.
export function filterCertCategoriesByUserSectors(
  categories: CertificationCategory[],
  userSectors: readonly string[],
): CertificationCategory[] {
  if (!userSectors || userSectors.length === 0) return categories
  return categories
    .map((cat) => {
      const next = cat.certifications.filter((c) => {
        const ts = certTargetSectors(c, cat)
        if (ts.length === 0) return true
        return ts.some((s) => userSectors.includes(s))
      })
      return { ...cat, certifications: next }
    })
    .filter((cat) => cat.certifications.length > 0)
}

export function mandatoryLabel(level: MandatoryLevel): { label: string; tone: 'danger' | 'warning' | 'success' } {
  switch (level) {
    case 'eu_mandatory':
      return { label: 'I detyrueshëm për BE', tone: 'danger' }
    case 'sector_required':
      return { label: 'Kërkohet nga blerës', tone: 'warning' }
    case 'optional_advantage':
      return { label: 'Opsional — avantazh tregu', tone: 'success' }
  }
}
