// Export checklist data: core documents + per-destination overrides.
// Verified against Kosovo customs (Dogana e Kosovës) + EU SAA + CEFTA agreements as of 2026-06.
// Not legal advice; bizneset duhet të konfirmojnë me agjentë doganorë para çdo dërgese.

export type DocStatus = 'always' | 'usually' | 'sometimes' | 'conditional'

export interface ChecklistDoc {
  id: string
  name: string
  description: string
  status: DocStatus
  condition?: string
  whoIssues: string
  link?: { label: string; url: string }
}

export interface CountryProfile {
  code: string
  name: string
  region: 'EU' | 'CEFTA' | 'EFTA' | 'UK' | 'TR' | 'NA' | 'OTHER'
  preferentialOrigin: 'EUR.1' | 'CEFTA' | 'EUR.MED' | 'TR-A.TR' | 'EFTA-EUR.1' | 'none'
  saa: boolean
  notes: string[]
  extraDocs: ChecklistDoc[]
  customs: { name: string; website: string }
}

export const CORE_DOCS: ChecklistDoc[] = [
  {
    id: 'invoice',
    name: 'Fatura komerciale',
    description: 'Fatura zyrtare e shitjes me shitësin, blerësin, përshkrimin e mallrave, sasinë, vlerën në EUR, kushtet Incoterms dhe afatin e pagesës. Minimumi 3 kopje origjinale.',
    status: 'always',
    whoIssues: 'Eksportuesi (vetë biznesi)',
  },
  {
    id: 'packing',
    name: 'Packing list',
    description: 'Lista e paketimit: numri i kolive, pesha neto/bruto, dimensionet, përmbajtja për koli. Përdoret nga dogana dhe transportuesi.',
    status: 'always',
    whoIssues: 'Eksportuesi',
  },
  {
    id: 'origin',
    name: 'Certifikatë origjine',
    description: 'Formë EUR.1 për BE/EFTA/UK ose certifikatë CEFTA për Ballkanin Perëndimor. Lëshohet nga Oda Ekonomike e Kosovës ose Dogana. I nevojshëm për tarifa preferenciale.',
    status: 'always',
    whoIssues: 'Oda Ekonomike e Kosovës ose Dogana',
    link: { label: 'OEK – aplikim certifikate', url: 'https://oek.org.kw' },
  },
  {
    id: 'customs',
    name: 'Deklarata doganore (DAU/EX-A)',
    description: 'Forma e doganës për eksport, e plotësuar nga agjenti doganor. Ndërlidhet me HS code, vlerën, peshën, destinacionin.',
    status: 'always',
    whoIssues: 'Agjenti doganor në emër të eksportuesit',
    link: { label: 'Dogana e Kosovës', url: 'https://dogana.rks-gov.net' },
  },
  {
    id: 'contract',
    name: 'Kontratë ose porosi e konfirmuar',
    description: 'Marrëveshje me blerësin: çmimi, sasia, kushtet e dorëzimit, Incoterms, pagesa, garancia, kushtet e zgjidhjes së mosmarrëveshjes.',
    status: 'always',
    whoIssues: 'Eksportuesi + blerësi',
  },
  {
    id: 'transport',
    name: 'Dokumenti i transportit',
    description: 'CMR për transport rrugor, Bill of Lading për det, Air Waybill për ajror. Provë e dorëzimit dhe instrument për pagesë (sidomos në LC).',
    status: 'always',
    whoIssues: 'Transportuesi',
  },
  {
    id: 'incoterms',
    name: 'Specifikim i Incoterms (2020)',
    description: 'EXW, FCA, FOB, CIF, DAP, DDP etj. – cakton kush paguan transportin, sigurimin, doganat. Duhet shkruar qartë në faturë dhe kontratë.',
    status: 'always',
    whoIssues: 'Eksportuesi + blerësi e bien dakord',
    link: { label: 'Tabela e Incoterms', url: '/dashboard/terma/incoterms' },
  },
  {
    id: 'hscode',
    name: 'Kodi tarifor HS',
    description: 'Kodi 6-shifror Harmonized System (10-shifror për BE: TARIC). Përcakton tarifat, kufizimet, kontrollet sanitare/cilësisë.',
    status: 'always',
    whoIssues: 'Eksportuesi (konfirmohet nga doganë/agjent)',
    link: { label: 'HS Code Finder', url: '/dashboard/terma/hs-code' },
  },
  {
    id: 'sanitary',
    name: 'Certifikatë sanitare / fitosanitare',
    description: 'I kërkuar për ushqim, bujqësi, drurë, kafshë të gjalla, bimë. Lëshohet nga AVUK (Agjencia e Ushqimit e Veterinarisë) ose ARPK (bimët).',
    status: 'conditional',
    condition: 'Vetëm për produkte ushqimore, bujqësore, drunore, kafshë',
    whoIssues: 'AVUK ose ARPK – varësisht produktit',
  },
  {
    id: 'standards',
    name: 'Konformitet me standardet e tregut destinacion',
    description: 'CE Mark për BE (lodra, makineri, elektrike); HALAL/KOSHER për tregje specifike; FDA për ushqim/farmaci në SHBA. Verifikohet para dërgesës.',
    status: 'usually',
    whoIssues: 'Trupë e akredituar certifikimi',
  },
]

export const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  DE: {
    code: 'DE',
    name: 'Gjermani',
    region: 'EU',
    preferentialOrigin: 'EUR.1',
    saa: true,
    notes: [
      'BE pa tarifa për shumicën e produkteve nga Kosova nën Marrëveshjen e Stabilizim-Asociimit (MSA) që nga 2016.',
      'Mish, qumësht, vezë: Kosova nuk është në listën e vendeve të treta të miratuara. Eksporti i kategorive të caktuara s\'lejohet pa miratim BVL/BfR.',
      'Verërat: kërkohet etiketim EU + analizë kimike + deklarim alergenesh në gjermanisht.',
      'Mobiljet/druri: kërkohet konformitet me REACH (kimikatet) + EUTR (origjina e drurit).',
    ],
    extraDocs: [
      {
        id: 'eutr',
        name: 'EUTR – deklarata e drurit',
        description: 'Due Diligence System (EUTR/EU 995/2010): origjina ligjore e drurit, gjurma deri te pylltari. I detyrueshëm për mobilje, panele, palet.',
        status: 'conditional',
        condition: 'Vetëm për produkte druri ose me përmbajtje druri',
        whoIssues: 'Eksportuesi (sistemi DDS)',
      },
      {
        id: 'ce',
        name: 'CE Mark + Deklaratë Konformiteti',
        description: 'I detyrueshëm për lodra, makineri, materiale ndërtimi, pajisje elektrike, pajisje mjekësore. Vlen për të gjithë BE-në + EEA.',
        status: 'conditional',
        condition: 'Për kategoritë e produkteve që mbulohen nga direktivat e Re Approach',
        whoIssues: 'Notified Body ose vetë-deklarim sipas produktit',
      },
    ],
    customs: { name: 'Zoll (Doganat Gjermane)', website: 'https://www.zoll.de' },
  },
  IT: {
    code: 'IT',
    name: 'Itali',
    region: 'EU',
    preferentialOrigin: 'EUR.1',
    saa: true,
    notes: [
      'Pjesë e BE-së → tarifat zero për shumicën e mallrave nga Kosova (MSA).',
      'Verërat: kufizime të rrepta etiketimi + akciza, kërkohet operacion VI-1 për treti i tretë.',
      'Ushqim: regjistrim Operator në sistemin SINTESI nëse kalon TRACES NT.',
      'Mobiljet & dizajn: Italia ka kërkesa specifike anti-zjarr (Classe 1 IM).',
    ],
    extraDocs: [
      {
        id: 'vi1',
        name: 'Dokument V I-1 (vetëm verërat)',
        description: 'Certifikatë analitike + organoleptike e detyrueshme për importin e verës nga vendet e treta në BE.',
        status: 'conditional',
        condition: 'Vetëm për eksport vere',
        whoIssues: 'Laborator i akredituar + AVUK',
      },
    ],
    customs: { name: 'Agenzia delle Dogane e dei Monopoli', website: 'https://www.adm.gov.it' },
  },
  CH: {
    code: 'CH',
    name: 'Zvicër',
    region: 'EFTA',
    preferentialOrigin: 'EFTA-EUR.1',
    saa: false,
    notes: [
      'EFTA → trajtim preferencial me certifikatë EUR.1 (Kosova ka FTA me EFTA që nga 2013).',
      'Nuk është BE → kufizime ushqimore/mjekësore vendore (Swissmedic për farmaci).',
      'Ushqimi i përpunuar: etiketim shumëgjuhësh (DE/FR/IT) i detyrueshëm.',
      'Akcizat: cigare/alkool/vajra – tarifa të larta + dozat e deklarueshme paraprakisht.',
    ],
    extraDocs: [
      {
        id: 'swissmedic',
        name: 'Autorizim Swissmedic',
        description: 'Për barna, kozmetikë mjekësore, pajisje mjekësore. Procesi mund të zgjasë 6-12 muaj.',
        status: 'conditional',
        condition: 'Vetëm për barna ose pajisje mjekësore',
        whoIssues: 'Swissmedic',
      },
    ],
    customs: { name: 'Eidgenössische Zollverwaltung (EZV)', website: 'https://www.bazg.admin.ch' },
  },
  AL: {
    code: 'AL',
    name: 'Shqipëri',
    region: 'CEFTA',
    preferentialOrigin: 'CEFTA',
    saa: false,
    notes: [
      'CEFTA → zero tarifa për pjesën dërrmuese të mallrave industriale.',
      'Disa produkte bujqësore (mish, qumësht, fruta të caktuara) kanë kufizime sezonale ose kuota.',
      'Nuk nevojitet përkthim → faturat shqip pranohen.',
      'Akcizat (alkool, cigare, naftë) zbatohen normal.',
    ],
    extraDocs: [],
    customs: { name: 'Drejtoria e Përgjithshme e Doganave', website: 'https://www.dogana.gov.al' },
  },
  MK: {
    code: 'MK',
    name: 'Maqedoni e Veriut',
    region: 'CEFTA',
    preferentialOrigin: 'CEFTA',
    saa: false,
    notes: [
      'CEFTA → zero tarifa për shumicën e mallrave.',
      'Etiketim në maqedonisht ose anglisht (përveç ushqimit ku kërkohet maqedonisht).',
      'Standardet sanitare të harmonizuara me BE për ushqim.',
      'Disa produkte bujqësore kanë kuota dhe pengesa fitosanitare në praktikë.',
    ],
    extraDocs: [],
    customs: { name: 'Doganat e Maqedonisë së Veriut', website: 'https://www.customs.gov.mk' },
  },
  RS: {
    code: 'RS',
    name: 'Serbi',
    region: 'CEFTA',
    preferentialOrigin: 'CEFTA',
    saa: false,
    notes: [
      'CEFTA → preferencial në letër, por në praktikë ka pengesa joftarifore për produkte nga Kosova.',
      'Certifikata origjinës nga Kosova historikisht ka pasur kontestime nga Serbia – verifiko status aktual para dërgesës.',
      'Dialogu Kosovë-Serbi ka shtuar kërkesa specifike për disa produkte.',
      'Përdor agjent doganor me përvojë në relacionin Kosovë-Serbi.',
    ],
    extraDocs: [],
    customs: { name: 'Uprava carina', website: 'https://www.carina.rs' },
  },
  US: {
    code: 'US',
    name: 'Shtetet e Bashkuara',
    region: 'NA',
    preferentialOrigin: 'none',
    saa: false,
    notes: [
      'Kosova nuk ka FTA me SHBA → tarifa MFN standarde aplikohen.',
      'Trump-tariffs 2025: ende në fuqi për Kosovën sipas kategorive (verifiko në USITC).',
      'Ushqim/pije: regjistrim FDA Food Facility Registration (FFFR) + Prior Notice 4 orë para mbërritjes.',
      'Importi mbi $2,500 → kërkohet Customs Broker + ISF (Importer Security Filing 10+2).',
      'Mobiljet: Lacey Act → deklarim i specieve të drurit.',
    ],
    extraDocs: [
      {
        id: 'fda',
        name: 'FDA Prior Notice + Facility Reg.',
        description: 'Çdo prodhues ushqimi/pije duhet të regjistrohet në FDA çdo 2 vjet + njoftim minimum 4 orë para dorëzimit në port.',
        status: 'conditional',
        condition: 'Vetëm për ushqime, pije, suplemente, kozmetikë',
        whoIssues: 'FDA',
        link: { label: 'FDA Registration', url: 'https://www.access.fda.gov' },
      },
      {
        id: 'lacey',
        name: 'Lacey Act – deklarim druri',
        description: 'PPQ Form 505 për lloje pyjore + origjina. Detyrueshëm për mobilje, panel, kufiza.',
        status: 'conditional',
        condition: 'Vetëm për produkte druri',
        whoIssues: 'USDA APHIS',
      },
    ],
    customs: { name: 'U.S. Customs and Border Protection (CBP)', website: 'https://www.cbp.gov' },
  },
  AT: {
    code: 'AT',
    name: 'Austri',
    region: 'EU',
    preferentialOrigin: 'EUR.1',
    saa: true,
    notes: [
      'BE → tarifa zero nën MSA për shumicën e mallrave.',
      'Mobiljet & ndërtimi: kërkesa anti-zjarr B1/B2 + CE.',
      'Ushqim: standardet austriake AGES + etiketim gjerman.',
      'Operatorët me kthim VAT duhet regjistruar në FinanzOnline.',
    ],
    extraDocs: [],
    customs: { name: 'Bundesministerium für Finanzen', website: 'https://www.bmf.gv.at' },
  },
  TR: {
    code: 'TR',
    name: 'Turqi',
    region: 'TR',
    preferentialOrigin: 'TR-A.TR',
    saa: false,
    notes: [
      'Kosova-Turqia kanë FTA që nga 2019 → tarifa preferenciale me certifikatë A.TR ose EUR.1.',
      'Tekstil & lëkurë: tarifa zero ose minimale → mundësi e madhe për prodhuesit kosovarë.',
      'Verifikim me MERSiS (sistemi turk) për importuesit.',
      'Etiketim turqisht + ngjyrat / madhësia / origjina e detyrueshme.',
    ],
    extraDocs: [
      {
        id: 'atr',
        name: 'Certifikatë A.TR',
        description: 'Alternativë e EUR.1 për qarkullim të lirë me Turqinë në kuadër të Bashkimit Doganor TR-BE (zbatohet edhe për mallra origjinë Kosovë).',
        status: 'sometimes',
        condition: 'Për mallra industriale të origjinës kosovare ose BE',
        whoIssues: 'Oda Ekonomike e Kosovës ose Dogana',
      },
    ],
    customs: { name: 'Türkiye Gümrük Bakanlığı', website: 'https://www.ticaret.gov.tr' },
  },
}

export const COUNTRY_LIST = Object.values(COUNTRY_PROFILES).map((c) => ({ code: c.code, name: c.name }))
