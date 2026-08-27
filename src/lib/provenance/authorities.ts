/**
 * Regjistri i autoriteteve — klasifikim i kuruar i burimeve.
 *
 * Pse ekziston: niveli i një burimi NUK përcaktohet dot me shprehje të rregullta mbi
 * domenin. `tulli.fi` është Administrata Doganore e Finlandës, `toll.no` është Dogana
 * Norvegjeze, `sii.org.il` është Instituti i Standardeve i Izraelit — asnjëri nuk ka
 * `.gov` në emër. Anasjelltas, `trade.gov` është faqe qeveritare amerikane, por për
 * rregullat e Francës është burim dytësor, jo legjislatori.
 *
 * Prandaj regjistri mban dy akse të ndara:
 *   1. `level`  — sa afër legjislatorit është burimi
 *   2. `scope`  — për CILIN juridiksion është autoritativ
 *
 * Një pretendim për Francën i marrë nga një burim me nivel A por me `scope: ['US']`
 * nuk është burim parësor për Francën. Kjo është arsyeja pse `effectiveLevel()` e ul
 * nivelin kur juridiksioni nuk përputhet.
 */

export type AuthorityLevel = 'A' | 'B' | 'C' | 'D' | 'FORBIDDEN' | 'UNKNOWN'

export type AuthorityKind =
  | 'legislator' // gazeta zyrtare, kodet, EUR-Lex
  | 'ministry'
  | 'customs'
  | 'foodSafety'
  | 'standards' // organ kombëtar standardizimi
  | 'tax'
  | 'ipr'
  | 'health'
  | 'intergov' // OBT, FAO, OBSH, Codex, CEFTA, EFTA
  | 'standardOwner' // pronari i standardit vullnetar (ISO, FSC, OEKO-TEX)
  | 'certBody' // shet certifikimin, nuk e shkruan rregullin
  | 'consultancy'
  | 'logistics'
  | 'media'
  | 'aggregator'
  | 'retired' // program i mbyllur ose faqe e arkivuar
  | 'unknown'

export interface AuthorityEntry {
  level: AuthorityLevel
  /** Kodet ISO të vendeve / 'EU' / 'INT'. '*' = i vlefshëm kudo. */
  scope: string[]
  kind: AuthorityKind
  name: string
  note?: string
}

/** Modele domenesh që tregojnë me siguri qeveri. Përdoren vetëm kur domeni nuk është në regjistër. */
const TLD_RULES: { re: RegExp; scope: (h: string) => string[]; name: string }[] = [
  { re: /(^|\.)europa\.eu$/, scope: () => ['EU'], name: 'Institucion i Bashkimit Europian' },
  { re: /(^|\.)rks-gov\.net$/, scope: () => ['XK'], name: 'Institucion i Republikës së Kosovës' },
  { re: /(^|\.)gouv\.fr$/, scope: () => ['FR'], name: 'Qeveria e Francës' },
  { re: /(^|\.)gv\.at$/, scope: () => ['AT'], name: 'Qeveria e Austrisë' },
  { re: /(^|\.)admin\.ch$/, scope: () => ['CH'], name: 'Administrata Federale Zvicerane' },
  { re: /(^|\.)bund\.de$/, scope: () => ['DE'], name: 'Qeveria Federale Gjermane' },
  { re: /(^|\.)gc\.ca$/, scope: () => ['CA'], name: 'Qeveria e Kanadasë' },
  { re: /(^|\.)canada\.ca$/, scope: () => ['CA'], name: 'Qeveria e Kanadasë' },
  { re: /(^|\.)govt\.nz$/, scope: () => ['NZ'], name: 'Qeveria e Zelandës së Re' },
  { re: /(^|\.)gov\.uk$/, scope: () => ['GB'], name: 'Qeveria e Mbretërisë së Bashkuar' },
  { re: /(^|\.)gov\.([a-z]{2})$/, scope: (h) => [h.slice(-2).toUpperCase()], name: 'Institucion qeveritar' },
  { re: /(^|\.)gob\.([a-z]{2})$/, scope: (h) => [h.slice(-2).toUpperCase()], name: 'Institucion qeveritar' },
  { re: /(^|\.)go\.([a-z]{2})$/, scope: (h) => [h.slice(-2).toUpperCase()], name: 'Institucion qeveritar' },
  { re: /(^|\.)gov\.[a-z]{2}\.[a-z]{2}$/, scope: (h) => [h.slice(-2).toUpperCase()], name: 'Institucion qeveritar' },
]

const A = (scope: string[], kind: AuthorityKind, name: string, note?: string): AuthorityEntry =>
  ({ level: 'A', scope, kind, name, note })
const B = (scope: string[], kind: AuthorityKind, name: string, note?: string): AuthorityEntry =>
  ({ level: 'B', scope, kind, name, note })
const C = (kind: AuthorityKind, name: string, note?: string): AuthorityEntry =>
  ({ level: 'C', scope: ['*'], kind, name, note })
const D = (kind: AuthorityKind, name: string, note?: string): AuthorityEntry =>
  ({ level: 'D', scope: ['*'], kind, name, note })
const X = (kind: AuthorityKind, name: string, note?: string): AuthorityEntry =>
  ({ level: 'FORBIDDEN', scope: [], kind, name, note })

export const AUTHORITIES: Record<string, AuthorityEntry> = {
  // ── BE: legjislatori dhe institucionet ─────────────────────────────────────
  'eur-lex.europa.eu': A(['EU'], 'legislator', 'EUR-Lex — e drejta e BE-së'),
  'ec.europa.eu': A(['EU'], 'ministry', 'Komisioni Europian'),
  'food.ec.europa.eu': A(['EU'], 'foodSafety', 'Komisioni Europian — Siguria Ushqimore'),
  'trade.ec.europa.eu': A(['EU'], 'ministry', 'Komisioni Europian — Tregtia'),
  'policy.trade.ec.europa.eu': A(['EU'], 'ministry', 'Komisioni Europian — Politika Tregtare'),
  'taxation-customs.ec.europa.eu': A(['EU'], 'customs', 'Komisioni Europian — Tatimet dhe Dogana'),
  'single-market-economy.ec.europa.eu': A(['EU'], 'ministry', 'Komisioni Europian — Tregu i Brendshëm'),
  'agriculture.ec.europa.eu': A(['EU'], 'ministry', 'Komisioni Europian — Bujqësia'),
  'environment.ec.europa.eu': A(['EU'], 'ministry', 'Komisioni Europian — Mjedisi'),
  'commission.europa.eu': A(['EU'], 'ministry', 'Komisioni Europian'),
  'europa.eu': A(['EU'], 'ministry', 'Portali zyrtar i BE-së'),
  'echa.europa.eu': A(['EU'], 'standards', 'ECHA — Agjencia Europiane e Kimikateve'),
  'osha.europa.eu': A(['EU'], 'health', 'EU-OSHA'),
  'eeas.europa.eu': A(['EU'], 'ministry', 'Shërbimi Europian i Veprimit të Jashtëm'),
  'gdpr-info.eu': D('aggregator', 'Faqe private që riboton tekstin e GDPR-së',
    'Teksti mund të jetë i saktë, por burimi parësor është EUR-Lex CELEX 32016R0679.'),

  // ── Ndërkombëtare ─────────────────────────────────────────────────────────
  'fao.org': B(['INT'], 'intergov', 'FAO — Organizata për Ushqimin dhe Bujqësinë'),
  'wto.org': B(['INT'], 'intergov', 'Organizata Botërore e Tregtisë'),
  'who.int': B(['INT'], 'intergov', 'Organizata Botërore e Shëndetësisë'),
  'unece.org': B(['INT'], 'intergov', 'UNECE'),
  'cefta.int': A(['XK', 'AL', 'MK', 'ME', 'RS', 'BA', 'MD'], 'intergov', 'Sekretariati i CEFTA-s'),
  'transparency.cefta.int': A(['XK', 'AL', 'MK', 'ME', 'RS', 'BA', 'MD'], 'intergov', 'CEFTA — portali i transparencës'),
  'efta.int': A(['NO', 'IS', 'CH', 'LI'], 'intergov', 'Sekretariati i EFTA-s'),
  'norden.org': B(['DK', 'SE', 'NO', 'FI', 'IS'], 'intergov', 'Këshilli Nordik'),
  'findrulesoforigin.org': B(['INT'], 'intergov', 'Rules of Origin Facilitator (ITC/OBT/OBD)',
    'Mjet i përbashkët ndërqeveritar; teksti ligjor duhet marrë nga marrëveshja vetë.'),
  'gso.org.sa': A(['SA', 'AE', 'KW', 'QA', 'BH', 'OM'], 'standards', 'GSO — Organizata e Standardizimit e Gjirit'),

  // ── Pronarë standardesh vullnetare (burim i saktë PËR standardin) ──────────
  'iso.org': B(['INT'], 'standardOwner', 'ISO — pronari i standardit'),
  'iec.ch': B(['INT'], 'standardOwner', 'IEC — pronari i standardit'),
  'fsc.org': B(['INT'], 'standardOwner', 'FSC — pronari i skemës'),
  'oeko-tex.com': B(['INT'], 'standardOwner', 'OEKO-TEX — pronari i skemës'),
  'brcgs.com': B(['INT'], 'standardOwner', 'BRCGS — pronari i skemës'),
  'codexalimentarius.net': B(['INT'], 'intergov', 'Codex Alimentarius'),

  // ── Organe certifikimi: SHESIN certifikatën, nuk e shkruajnë rregullin ─────
  'sgs.com': C('certBody', 'SGS — organ certifikimi',
    'Ofrues shërbimi. I pranueshëm si kontakt, jo si bazë ligjore.'),
  'tuv.com': C('certBody', 'TÜV — organ certifikimi', 'Ofrues shërbimi, jo autoritet rregullator.'),
  'intertek.com': C('certBody', 'Intertek — organ certifikimi', 'Ofrues shërbimi, jo autoritet rregullator.'),
  'wwbridge-cert.com': D('certBody', 'Organ/ndërmjetës certifikimi privat'),
  'certification-experts.com': D('consultancy', 'Konsulencë certifikimi'),
  'certifiedcosmetics.com': D('consultancy', 'Konsulencë kozmetike'),
  'measurlabs.com': D('certBody', 'Laborator privat'),
  'en.product-certification.com': D('consultancy', 'Konsulencë certifikimi'),
  'halalcertificationturkey.com': D('certBody', 'Organ privat certifikimi halal'),
  'halalfoundation.org': D('certBody', 'Organizatë private halal'),
  'foodsafety.institute': D('consultancy', 'Faqe private'),

  // ── SHBA ──────────────────────────────────────────────────────────────────
  'trade.gov': A(['US'], 'ministry', 'Administrata e Tregtisë Ndërkombëtare (SHBA)',
    'Autoritet për rregullat amerikane. Për tregje të treta është burim dytësor: përshkruan '
    + 'kushtet siç i hasin eksportuesit amerikanë, të cilët hyjnë me marrëveshje dhe status '
    + 'tarifor të ndryshëm nga Kosova.'),
  'cbp.gov': A(['US'], 'customs', 'U.S. Customs and Border Protection'),
  'fda.gov': A(['US'], 'foodSafety', 'U.S. Food and Drug Administration'),
  'fsis.usda.gov': A(['US'], 'foodSafety', 'USDA FSIS'),
  'fas.usda.gov': A(['US'], 'ministry', 'USDA Foreign Agricultural Service'),
  'apps.fas.usda.gov': A(['US'], 'ministry', 'USDA FAS — raportet GAIN',
    'Raporte të hartuara për eksportuesit amerikanë; të dobishme, por dytësore për vende të treta.'),
  'ttb.gov': A(['US'], 'ministry', 'Alcohol and Tobacco Tax and Trade Bureau'),
  'ftc.gov': A(['US'], 'ministry', 'Federal Trade Commission'),
  'ecfr.gov': A(['US'], 'legislator', 'Kodi Federal i Rregulloreve (eCFR)'),
  'hts.usitc.gov': A(['US'], 'customs', 'Tarifa e Harmonizuar e SHBA-së'),
  'ustr.gov': A(['US'], 'ministry', 'Përfaqësuesi Tregtar i SHBA-së'),
  'export.gov': { level: 'D', scope: [], kind: 'retired', name: 'export.gov — program i mbyllur',
    note: 'U shkri te trade.gov. Lidhjet janë të arkivuara; nuk duhet përdorur si burim aktiv.' },
  'legacy.export.gov': { level: 'D', scope: [], kind: 'retired', name: 'export.gov (arkivi)',
    note: 'Arkiv. Nuk përditësohet.' },
  'privacyshield.gov': { level: 'FORBIDDEN', scope: [], kind: 'retired', name: 'Privacy Shield — i shfuqizuar',
    note: 'Skema u shfuqizua nga GJDBE me vendimin Schrems II (C-311/18, 16 korrik 2020). '
      + 'Nuk është më bazë e vlefshme. Zëvendësuar nga EU-US Data Privacy Framework (2023).' },
  'uscisguide.com': D('aggregator', 'Faqe private, jo USCIS'),

  // ── Kosovë ────────────────────────────────────────────────────────────────
  'dogana.rks-gov.net': A(['XK'], 'customs', 'Dogana e Kosovës',
    'Autoritet për procedurat e eksportit NGA Kosova. Nuk është burim për rregullat e vendit importues.'),
  'auvk.rks-gov.net': A(['XK'], 'foodSafety', 'Agjencia e Ushqimit dhe Veterinarisë'),
  'kiesa.rks-gov.net': A(['XK'], 'ministry', 'KIESA'),
  'tatime.gov.al': A(['AL'], 'tax', 'Drejtoria e Tatimeve, Shqipëri'),
  'dogana.gov.al': A(['AL'], 'customs', 'Drejtoria e Përgjithshme e Doganave, Shqipëri'),
  'aida.gov.al': A(['AL'], 'ministry', 'AIDA — Agjencia Shqiptare e Investimeve'),
  'invest-in-albania.org': D('media', 'Portal privat informativ'),
  'sherbimekontabiliteti.al': D('consultancy', 'Zyrë kontabiliteti private'),

  // ── Doganat dhe autoritetet kombëtare pa `.gov` në emër ───────────────────
  'tulli.fi': A(['FI'], 'customs', 'Dogana e Finlandës'),
  'toll.no': A(['NO'], 'customs', 'Dogana e Norvegjisë'),
  'mattilsynet.no': A(['NO'], 'foodSafety', 'Autoriteti Norvegjez i Sigurisë Ushqimore'),
  'tullverket.se': A(['SE'], 'customs', 'Dogana e Suedisë'),
  'skatteverket.se': A(['SE'], 'tax', 'Agjencia Tatimore Suedeze'),
  'aduana.cl': A(['CL'], 'customs', 'Dogana e Kilit'),
  'ispch.cl': A(['CL'], 'health', 'Instituti i Shëndetit Publik, Kili'),
  'cbsa-asfc.gc.ca': A(['CA'], 'customs', 'Agjencia e Kufirit e Kanadasë'),
  'inspection.canada.ca': A(['CA'], 'foodSafety', 'Agjencia Kanadeze e Inspektimit Ushqimor'),
  'fsai.ie': A(['IE'], 'foodSafety', 'Autoriteti i Sigurisë Ushqimore i Irlandës'),
  'revenue.ie': A(['IE'], 'tax', 'Revenue — Irlandë'),
  'nsai.ie': A(['IE'], 'standards', 'Autoriteti Kombëtar i Standardeve i Irlandës'),
  'emta.ee': A(['EE'], 'tax', 'Bordi Tatimor dhe Doganor i Estonisë'),
  'mccaa.org.mt': A(['MT'], 'standards', 'MCCAA — Autoriteti i Konkurrencës dhe Konsumatorit, Maltë'),
  'adm.gov.it': A(['IT'], 'customs', 'Agjencia e Doganave dhe Monopoleve, Itali'),
  'carina.gov.hr': A(['HR'], 'customs', 'Dogana e Kroacisë'),
  'celnisprava.gov.cz': A(['CZ'], 'customs', 'Administrata Doganore e Çekisë'),
  'szpi.gov.cz': A(['CZ'], 'foodSafety', 'Inspektorati Çek i Bujqësisë dhe Ushqimit'),
  'puesc.gov.pl': A(['PL'], 'customs', 'Platforma Doganore e Polonisë'),
  'gis.gov.pl': A(['PL'], 'health', 'Inspektorati Sanitar i Polonisë'),
  'fu.gov.si': A(['SI'], 'tax', 'Administrata Financiare e Sllovenisë'),
  'nav.gov.hu': A(['HU'], 'tax', 'Administrata Tatimore dhe Doganore e Hungarisë'),
  'vid.gov.lv': A(['LV'], 'tax', 'Shërbimi i të Ardhurave Shtetërore, Letoni'),
  'lrmuitine.lt': A(['LT'], 'customs', 'Dogana e Lituanisë'),
  'customs.ro': A(['RO'], 'customs', 'Autoriteti Doganor i Rumanisë'),
  'evedomet.gr': A(['GR'], 'standards', 'Autoritet grek'),
  'skatturinn.is': A(['IS'], 'tax', 'Administrata Tatimore e Islandës'),
  'mast.is': A(['IS'], 'foodSafety', 'MAST — Autoriteti Islandez i Ushqimit dhe Veterinarisë'),
  'reykjavik.is': A(['IS'], 'ministry', 'Bashkia e Reykjavikut'),
  'bazg.admin.ch': A(['CH'], 'customs', 'Zyra Federale e Doganave dhe Sigurisë Kufitare, Zvicër'),
  'estv.admin.ch': A(['CH'], 'tax', 'Administrata Federale Tatimore, Zvicër'),
  'zoll.de': A(['DE'], 'customs', 'Dogana Gjermane'),
  'bmleh.de': A(['DE'], 'ministry', 'Ministria Federale e Ushqimit dhe Bujqësisë, Gjermani'),
  'douane.nl': A(['NL'], 'customs', 'Dogana e Holandës'),
  'belastingdienst.nl': A(['NL'], 'tax', 'Administrata Tatimore e Holandës'),
  'business.gov.nl': A(['NL'], 'ministry', 'Portali zyrtar i biznesit, Holandë'),
  'government.nl': A(['NL'], 'ministry', 'Qeveria e Holandës'),
  'finance.belgium.be': A(['BE'], 'tax', 'Shërbimi Publik Federal i Financave, Belgjikë'),
  'sede.agenciatributaria.gob.es': A(['ES'], 'tax', 'Agjencia Tatimore e Spanjës'),
  'douane.gouv.fr': A(['FR'], 'customs', 'Dogana Franceze'),
  'ecologie.gouv.fr': A(['FR'], 'ministry', 'Ministria e Tranzicionit Ekologjik, Francë'),
  'economie.gouv.fr': A(['FR'], 'ministry', 'Ministria e Ekonomisë, Francë (DGCCRF)'),
  'bmf.gv.at': A(['AT'], 'tax', 'Ministria Federale e Financave, Austri'),
  'food.gov.uk': A(['GB'], 'foodSafety', 'Food Standards Agency, MB'),
  'trade-tariff.service.gov.uk': A(['GB'], 'customs', 'Tarifa Tregtare e MB-së'),
  'uino.gov.ba': A(['BA'], 'customs', 'Administrata e Tatimeve Indirekte, BeH'),
  'customs.gov.md': A(['MD'], 'customs', 'Shërbimi Doganor i Moldavisë'),
  'trade.gov.md': A(['MD'], 'ministry', 'Portali tregtar i Moldavisë'),
  'trade.gov.tr': A(['TR'], 'ministry', 'Ministria e Tregtisë, Turqi'),
  'turkreach.com.tr': D('consultancy', 'Konsulencë private'),

  // ── Jashtë Europe ─────────────────────────────────────────────────────────
  'sars.gov.za': A(['ZA'], 'tax', 'Shërbimi i të Ardhurave i Afrikës së Jugut'),
  'nrcs.org.za': A(['ZA'], 'standards', 'NRCS — Rregullatori Kombëtar i Specifikimeve Detyruese'),
  'health.gov.za': A(['ZA'], 'health', 'Ministria e Shëndetësisë, Afrika e Jugut'),
  'kra.go.ke': A(['KE'], 'tax', 'Autoriteti i të Ardhurave i Kenias'),
  'kebs.org': A(['KE'], 'standards', 'Byroja e Standardeve e Kenias'),
  'gra.gov.gh': A(['GH'], 'tax', 'Autoriteti i të Ardhurave i Ganës'),
  'fdaghana.gov.gh': A(['GH'], 'foodSafety', 'FDA e Ganës'),
  'customs.gov.ng': A(['NG'], 'customs', 'Shërbimi Doganor i Nigerisë'),
  'nafdac.gov.ng': A(['NG'], 'foodSafety', 'NAFDAC — Nigeri'),
  'douane.gov.ma': A(['MA'], 'customs', 'Administrata Doganore e Marokut'),
  'onssa.gov.ma': A(['MA'], 'foodSafety', 'ONSSA — Maroku'),
  'imanor.gov.ma': A(['MA'], 'standards', 'IMANOR — Instituti Maroken i Standardizimit'),
  'customs.gov.sg': A(['SG'], 'customs', 'Dogana e Singaporit'),
  'sfa.gov.sg': A(['SG'], 'foodSafety', 'Agjencia Ushqimore e Singaporit'),
  'customs.govt.nz': A(['NZ'], 'customs', 'Dogana e Zelandës së Re'),
  'mpi.govt.nz': A(['NZ'], 'foodSafety', 'Ministria e Industrive Parësore, ZR'),
  'abf.gov.au': A(['AU'], 'customs', 'Forca Kufitare Australiane'),
  'agriculture.gov.au': A(['AU'], 'foodSafety', 'Ministria e Bujqësisë, Australi'),
  'foodstandards.gov.au': A(['AU', 'NZ'], 'foodSafety', 'FSANZ — Standardet Ushqimore Australi/ZR'),
  'beacukai.go.id': A(['ID'], 'customs', 'Dogana e Indonezisë'),
  'pom.go.id': A(['ID'], 'foodSafety', 'BPOM — Indonezi'),
  'bpjph.halal.go.id': A(['ID'], 'foodSafety', 'BPJPH — Agjencia Shtetërore Halal, Indonezi'),
  'customs.gov.my': A(['MY'], 'customs', 'Dogana e Malajzisë'),
  'halal.gov.my': A(['MY'], 'foodSafety', 'JAKIM — autoriteti shtetëror halal i Malajzisë'),
  'kpdn.gov.my': A(['MY'], 'ministry', 'Ministria e Tregtisë së Brendshme, Malajzi'),
  'customs.go.th': A(['TH'], 'customs', 'Dogana e Tajlandës'),
  'fda.moph.go.th': A(['TH'], 'foodSafety', 'FDA e Tajlandës'),
  'customs.gov.vn': A(['VN'], 'customs', 'Dogana e Vietnamit'),
  'moh.gov.vn': A(['VN'], 'health', 'Ministria e Shëndetësisë, Vietnam'),
  'customs.go.jp': A(['JP'], 'customs', 'Dogana e Japonisë'),
  'caa.go.jp': A(['JP'], 'foodSafety', 'Agjencia e Çështjeve të Konsumatorit, Japoni'),
  'hokeniryo1.metro.tokyo.lg.jp': A(['JP'], 'health', 'Qeveria Metropolitane e Tokios'),
  'investkorea.org': B(['KR'], 'ministry', 'KOTRA — agjenci promovimi'),
  'sat.gob.mx': A(['MX'], 'tax', 'SAT — Administrata Tatimore e Meksikës'),
  'gob.mx': A(['MX'], 'ministry', 'Qeveria e Meksikës'),
  'afip.gob.ar': A(['AR'], 'tax', 'AFIP — Argjentinë'),
  'argentina.gob.ar': A(['AR'], 'ministry', 'Qeveria e Argjentinës'),
  'gov.br': A(['BR'], 'ministry', 'Qeveria e Brazilit'),
  'bis.gov.in': A(['IN'], 'standards', 'Byroja e Standardeve Indiane'),
  'fssai.gov.in': A(['IN'], 'foodSafety', 'FSSAI — Indi'),
  'foodregulatory.fssai.gov.in': A(['IN'], 'foodSafety', 'FSSAI — portali rregullator'),
  'cbic.gov.in': A(['IN'], 'customs', 'CBIC — Indi'),
  'commerce.gov.pk': A(['PK'], 'ministry', 'Ministria e Tregtisë, Pakistan'),
  'zatca.gov.sa': A(['SA'], 'tax', 'ZATCA — Arabi Saudite'),
  'sfda.gov.sa': A(['SA'], 'foodSafety', 'SFDA — Arabi Saudite'),
  'moiat.gov.ae': A(['AE'], 'ministry', 'Ministria e Industrisë dhe Teknologjisë, EBA'),
  'mohap.gov.ae': A(['AE'], 'health', 'Ministria e Shëndetësisë, EBA'),
  'uaecustoms.ae': A(['AE'], 'customs', 'Dogana e EBA-së'),
  'u.ae': A(['AE'], 'ministry', 'Portali zyrtar i EBA-së'),
  'dgtx.ae': A(['AE'], 'ministry', 'Autoritet i Dubait'),
  'invest.qa': B(['QA'], 'ministry', 'Invest Qatar — agjenci promovimi'),
  'customs.gov.kw': A(['KW'], 'customs', 'Dogana e Kuvajtit'),
  'oek.org.kw': A(['KW'], 'standards', 'Autoritet kuvajtian'),
  'pafn.gov.kw': A(['KW'], 'foodSafety', 'Autoriteti Publik i Ushqimit dhe Ushqyerjes, Kuvajt'),
  'pai.gov.kw': A(['KW'], 'ministry', 'Autoriteti Publik i Industrisë, Kuvajt'),
  'sii.org.il': A(['IL'], 'standards', 'Instituti i Standardeve i Izraelit'),
  'health.gov.il': A(['IL'], 'health', 'Ministria e Shëndetësisë, Izrael'),
  'iaa.gov.il': A(['IL'], 'ministry', 'Autoritet izraelit'),
  'gov.me': A(['ME'], 'ministry', 'Qeveria e Malit të Zi'),

  // ── Dytësore profesionale (C) ─────────────────────────────────────────────
  'taxsummaries.pwc.com': C('consultancy', 'PwC Worldwide Tax Summaries',
    'Përmbledhje profesionale e besueshme, por jo tekst ligjor. Kërkon burim parësor.'),
  'kpmg.com': C('consultancy', 'KPMG'),
  'avalara.com': C('consultancy', 'Avalara — shitës softueri tatimor'),
  'marosavat.com': C('consultancy', 'Konsulencë TVSH'),
  'santandertrade.com': C('media', 'Santander Trade Markets',
    'Portal bankar; përmbledhje tregu, jo burim rregullator.'),
  'businesscompanion.info': C('media', 'Business Companion (financuar nga qeveria e MB-së)'),

  // ── Të pamjaftueshme (D) dhe të ndaluara ──────────────────────────────────
  'en.wikipedia.org': X('aggregator', 'Wikipedia', 'E ndaluar shprehimisht nga protokolli.'),
  'ruleandlaw.com': D('aggregator', 'Faqe private agreguese'),
  'bens-consulting.com': D('consultancy', 'Konsulencë private'),
  'dutydecoder.com': D('aggregator', 'Mjet privat tarifor'),
  'gistnet.com': D('aggregator', 'Shërbim privat i të dhënave tregtare'),
  'invoicedataextraction.com': D('media', 'Blog produkti'),
  'deepbeez.com': D('media', 'Blog'),
  'food.chemlinked.com': D('media', 'Shërbim privat lajmesh rregullatore'),
  'internationalshippingusa.com': D('logistics', 'Faqe transportuesi privat'),
  'ripplellc.ae': D('consultancy', 'Konsulencë private'),
  'legalmetrologyindia.com': D('consultancy', 'Konsulencë private'),
  'manufacturingsafety.com': D('media', 'Faqe private'),
  'franzosini.ch': D('logistics', 'Spedicion privat'),
  'compliancegate.com': D('media', 'Blog i pajtueshmërisë'),
  'aramex.com': D('logistics', 'Transportues privat'),
  'fedex.com': D('logistics', 'Transportues privat'),
  'middleeastbriefing.com': D('media', 'Portal privat (Dezan Shira)'),
  'china-briefing.com': D('media', 'Portal privat (Dezan Shira)'),
  'india-briefing.com': D('media', 'Portal privat (Dezan Shira)'),
  'visahq.com': D('media', 'Shërbim privat vizash'),
  'corpenza.com': D('consultancy', 'Konsulencë private'),
  'rfid.averydennison.com': D('media', 'Faqe tregtare e prodhuesit'),
  'made-to-measure-suits.bgfashion.net': X('media', 'Blog rrobaqepësie',
    'Burim i papranueshëm për rregulla ligjore.'),
  'taobe.consulting': D('consultancy', 'Konsulencë private'),
  'freightamigo.com': D('logistics', 'Blog transportues'),
  '99-halalexpo.vercel.app': X('unknown', 'Faqe e pastrehë në Vercel', 'Pa botues të identifikueshëm.'),
  'ukcalculator.com': D('aggregator', 'Kalkulator privat'),
  'digicomply.com': D('consultancy', 'Shitës softueri pajtueshmërie'),
  'growrk.com': D('media', 'Faqe tregtare'),
  'tradecouncil.org': D('aggregator', 'Organizatë private'),
  'customssupport.com': D('logistics', 'Agjent doganor privat'),
  'ashbury.global': D('consultancy', 'Konsulencë etiketimi'),
  'shipmondo.com': D('logistics', 'Platformë private transporti'),
  'complir.io': D('consultancy', 'Shitës softueri pajtueshmërie'),
  'gourmetpro.co': D('consultancy', 'Konsulencë private'),
  'covue.com': D('consultancy', 'Konsulencë private'),
  'tigerpug.com': D('media', 'Faqe private'),
  'iiiem.in': D('media', 'Institut privat trajnimi'),
  'ficsi.in': D('media', 'Këshill aftësish sektorial'),
  'gfi-india.org': D('media', 'OJQ private'),
  'mtca.gov.mt': A(['MT'], 'ministry', 'Ministri e Maltës'),
  'agriculture.gov.mt': A(['MT'], 'ministry', 'Ministria e Bujqësisë, Maltë'),
  'minsal.cl': A(['CL'], 'health', 'Ministria e Shëndetësisë, Kili'),
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

/** Kërkon domenin, pastaj prapashtesat e tij, pastaj rregullat e TLD-së. */
export function lookupAuthority(url: string): (AuthorityEntry & { host: string }) | null {
  const h = hostOf(url)
  if (!h) return null
  if (AUTHORITIES[h]) return { ...AUTHORITIES[h], host: h }
  const parts = h.split('.')
  for (let i = 1; i < parts.length - 1; i++) {
    const suffix = parts.slice(i).join('.')
    if (AUTHORITIES[suffix]) return { ...AUTHORITIES[suffix], host: h }
  }
  for (const r of TLD_RULES) {
    if (r.re.test(h)) {
      return { level: 'A', scope: r.scope(h), kind: 'ministry', name: r.name, host: h }
    }
  }
  return { level: 'UNKNOWN', scope: [], kind: 'unknown', name: 'I paklasifikuar', host: h }
}

export interface ClaimAssessment {
  host: string
  level: AuthorityLevel
  /** Niveli pasi merret parasysh nëse burimi është autoritativ për këtë juridiksion. */
  effectiveLevel: AuthorityLevel
  fitsJurisdiction: boolean
  authorityName: string
  note?: string
  reason?: string
}

const ORDER: AuthorityLevel[] = ['A', 'B', 'C', 'D', 'FORBIDDEN']

/**
 * Vlerëson një pretendim.
 * @param url          burimi i cituar
 * @param jurisdiction kodi ISO i vendit të cilit i takon rregulli, ose 'EU'
 * @param euMember     a është vendi anëtar i BE-së (atëherë burimet e BE-së janë parësore për të)
 */
export function assessClaim(
  url: string | null | undefined,
  jurisdiction: string,
  euMember: boolean,
): ClaimAssessment {
  if (!url) {
    return { host: '', level: 'UNKNOWN', effectiveLevel: 'UNKNOWN', fitsJurisdiction: false,
      authorityName: 'pa burim', reason: 'Pretendimi nuk ka asnjë burim.' }
  }
  const a = lookupAuthority(url)!
  const scope = a.scope
  const fits =
    scope.includes('*') ||
    scope.includes('INT') ||
    scope.includes(jurisdiction) ||
    (euMember && scope.includes('EU'))

  let eff = a.level
  let reason: string | undefined
  if (a.level === 'A' && !fits) {
    eff = 'C'
    reason = `${a.name} është autoritet për ${scope.join(', ') || '(pa juridiksion)'}, `
      + `jo për ${jurisdiction}. Vlen si burim dytësor.`
  } else if (a.level === 'B' && !fits) {
    eff = 'C'
    reason = `${a.name} nuk mbulon ${jurisdiction} drejtpërdrejt.`
  }
  return { host: a.host, level: a.level, effectiveLevel: eff, fitsJurisdiction: fits,
    authorityName: a.name, note: a.note, reason }
}

/** A lejohet publikimi i një pretendimi të detyrueshëm me këtë nivel efektiv? */
export function canPublishAsMandatory(level: AuthorityLevel): boolean {
  return level === 'A' || level === 'B'
}

export function levelRank(l: AuthorityLevel): number {
  const i = ORDER.indexOf(l)
  return i < 0 ? ORDER.length : i
}
