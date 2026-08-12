// Regjistri i provenancës — pjesa STATIKE.
//
// Përmbajtja e procedurave kosovare jeton në kod, jo në databazë, prandaj burimet
// e saj nuk mund të lexohen nga një pyetësor. Këtu deklarohen shprehimisht, që
// Regjistri i Burimeve te /admin/burimet të jetë i plotë.
//
// RREGULL: kur shton ose ndryshon një procedurë në faqet e dashboard-it, PËRDITËSO
// këtë file. Testi `provenance.test.ts` numëron referencat në faqe dhe dështon nëse
// regjistri largohet nga realiteti.

export type SourceKind =
  | 'PARESOR'          // akti ligjor vetë, ose institucioni që e lëshon
  | 'AUTORITET'        // autoriteti kompetent i tregut/fushës
  | 'STATISTIKE'       // enti statistikor
  | 'DYTESOR'          // guidë e një qeverie të tretë ose përmbledhje
  | 'PRIVAT'           // kompani private
  | 'PA_BURIM'         // nuk ka

export interface ProvenanceRow {
  /** Moduli ku e sheh përdoruesi. */
  module: string
  /** Rruga në aplikacion. */
  route: string
  /** Zëri konkret: forma, procedura, certifikimi, shifra. */
  item: string
  /** Emri i burimit ose i aktit. */
  source: string
  /** Link që i dërgohet dikujt që pyet. */
  url: string | null
  /** Data e verifikimit ose e marrjes, ISO. */
  checkedAt: string | null
  kind: SourceKind
  /** Shënim kur burimi nuk mjafton ose kur ka rezervë. */
  note?: string
}

const ARBK = { module: 'ARBK — Regjistrimi i biznesit', route: '/dashboard/arbk' }
const ATK = { module: 'ATK — Tatimet', route: '/dashboard/tatime' }
const DOGANA = { module: 'Dogana', route: '/dashboard/dogana' }
const AUV = { module: 'AUV — Siguria e ushqimit', route: '/dashboard/auv' }
const KIPA = { module: 'KIPA — Prona industriale', route: '/dashboard/kipa' }
const SIGURIA = { module: 'Siguria dhe Shëndeti në Punë', route: '/dashboard/siguria-ne-pune' }
const ENERGJI = { module: 'Tregu i Energjisë', route: '/dashboard/energji' }
const TRANSPORT = { module: 'Transporti', route: '/dashboard/eksporti/transporti' }
const TERMA = { module: 'Termet e eksportit', route: '/dashboard/terma' }
const CHECKLIST = { module: 'Checklist i eksportit', route: '/dashboard/checklist' }
const BANKA = { module: 'Financime — Bankat', route: '/dashboard/burime-financimi/banka' }
const HAPBIZNES = { module: 'Hap biznes në Kosovë', route: '/dashboard/hap-biznes-kosove' }
const INVEST = { module: 'Investo në Kosovë', route: '/dashboard/investime' }
const CERT = { module: 'Katalogu i certifikimeve', route: '/dashboard/certifikime' }

const LSHT = 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare'
const GZK = 'https://gzk.rks-gov.net'

export const STATIC_PROVENANCE: ProvenanceRow[] = [
  // ── ARBK: gjashtë format e regjistrimit ────────────────────────────────────
  { ...ARBK, item: 'Biznes Individual (B.I.)', source: `${LSHT}, neni 12`, url: GZK, checkedAt: '2026-07-08', kind: 'PARESOR' },
  { ...ARBK, item: 'Shoqëri me Përgjegjësi të Kufizuar (SH.P.K.)', source: `${LSHT}, nenet 76–140`, url: GZK, checkedAt: '2026-07-08', kind: 'PARESOR' },
  { ...ARBK, item: 'Shoqëri Aksionare (Sh.A.)', source: `${LSHT}, nenet 141–249`, url: GZK, checkedAt: '2026-07-08', kind: 'PARESOR', note: 'Kapitali minimal 25 000 EUR shfaqet me shënimin e brendshëm se duhet riverifikuar.' },
  { ...ARBK, item: 'Ortakëri e Përgjithshme (O.P.)', source: `${LSHT}, nenet 24–42`, url: GZK, checkedAt: '2026-07-08', kind: 'PARESOR' },
  { ...ARBK, item: 'Ortakëri e Kufizuar (O.K.)', source: `${LSHT}, nenet 43–75`, url: GZK, checkedAt: '2026-07-08', kind: 'PARESOR' },
  { ...ARBK, item: 'Degë e Kompanisë së Huaj', source: `${LSHT}, nenet 250–260`, url: GZK, checkedAt: '2026-07-08', kind: 'PARESOR' },
  { ...ARBK, item: 'Formularët zyrtarë të aplikimit', source: 'ARBK — dokumente PDF', url: 'https://arbk.rks-gov.net', checkedAt: '2026-07-08', kind: 'AUTORITET' },
  { ...ARBK, item: 'Portali i shërbimeve elektronike', source: 'eKosova', url: 'https://ekosova.rks-gov.net', checkedAt: '2026-07-08', kind: 'AUTORITET' },
  // ── ARBK: dhjetë ndryshimet, pa referencë ─────────────────────────────────
  ...['Ndryshim i adresës së biznesit', 'Ndryshim, shtim ose heqje e aktivitetit (NACE)',
      'Ndryshim i kapitalit themeltar', 'Ndryshim i drejtorit ose përfaqësuesit ligjor',
      'Ndryshim i pronarit ose aksionarëve', 'Ndryshim i emrit të biznesit',
      'Hapje ose mbyllje e njësisë', 'Dublikat i certifikatës',
      'Pezullim i përkohshëm i aktivitetit', 'Çregjistrim (mbyllje e biznesit)',
     ].map((item): ProvenanceRow => ({ ...ARBK, item, source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
       note: 'Procedurë pa akt të cituar. Duhet neni përkatës i Ligjit 06/L-016 ose UA-ja e ARBK-së.' })),
  { ...ARBK, item: 'Tarifat e të 16 procedurave', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
    note: 'Shfaqen si «simbolike» ose «varion». Duhet tarifa zyrtare e ARBK-së.' },
  { ...ARBK, item: 'Adresat dhe telefonat e 7 zyrave rajonale', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' },

  // ── ATK ───────────────────────────────────────────────────────────────────
  { ...ATK, item: 'Regjistrim dhe aktivizim në EDI', source: 'Ligji Nr. 03/L-222 për Administratën Tatimore dhe Procedurat', url: GZK, checkedAt: '2026-07-01', kind: 'PARESOR' },
  { ...ATK, item: 'TVSH', source: 'Ligji Nr. 05/L-037 për TVSH-në', url: GZK, checkedAt: '2026-07-01', kind: 'PARESOR', note: 'Pragu 30 000 EUR shfaqet pa nenin përkatës.' },
  { ...ATK, item: 'Tatimi në fitim (korporativ)', source: 'Ligji Nr. 05/L-029 për Tatimin në të Ardhurat e Korporatave', url: GZK, checkedAt: '2026-07-01', kind: 'PARESOR' },
  { ...ATK, item: 'Tatimi në paga dhe kontributet', source: 'Ligji Nr. 05/L-028 + Ligji Nr. 04/L-101 (Fondet Pensionale)', url: GZK, checkedAt: '2026-07-01', kind: 'PARESOR' },
  { ...ATK, item: 'Arka fiskale', source: 'Ligjet 03/L-222, 05/L-037, 04/L-101 (si listë e përgjithshme)', url: GZK, checkedAt: '2026-07-01', kind: 'DYTESOR', note: 'Listë ligjesh, jo referencë e hapit konkret.' },
  { ...ATK, item: 'Kalendari i afateve tatimore', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
    note: 'PRIORITET: afatet janë ligjore dhe vonesa sjell gjobë. Duhet neni për çdo afat.' },
  { ...ATK, item: 'Autorizim i kontabilistit', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' },
  { ...ATK, item: 'Dokumentet që duhen ruajtur në arkiv', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' },
  { ...ATK, item: 'Portali i deklarimit elektronik', source: 'ATK — EDI', url: 'https://edeklarimi.atk-ks.org', checkedAt: '2026-07-01', kind: 'AUTORITET' },

  // ── Dogana ────────────────────────────────────────────────────────────────
  { ...DOGANA, item: 'Shpediter — si ta zgjedhësh', source: 'Ligji Nr. 03/L-109 (Kodi Doganor dhe i Akcizave)', url: GZK, checkedAt: '2026-06-15', kind: 'PARESOR' },
  ...['Aktivizimi në ASYCUDA World', 'Eksporti — hap pas hapi', 'Importi — hap pas hapi',
      'Re-eksporti (transit)', 'Dëshmia e origjinës (EUR.1 dhe deklarata në faturë)',
      'Certifikata sanitare, veterinare, fitosanitare',
     ].map((item): ProvenanceRow => ({ ...DOGANA, item, source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
       note: 'PRIORITET: procedurë doganore kryesore pa bazë ligjore të cituar.' })),
  { ...DOGANA, item: 'Portali doganor', source: 'Dogana e Kosovës', url: 'https://dogana.rks-gov.net', checkedAt: '2026-06-15', kind: 'AUTORITET' },

  // ── AUV ───────────────────────────────────────────────────────────────────
  { ...AUV, item: 'Regjistrimi i operatorit të biznesit ushqimor', source: 'Rregullorja (QRK) Nr. 18/2016 për regjistrimin dhe aprovimin e operatorëve', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...AUV, item: 'Aprovimi i objektit për ushqime me origjinë shtazore', source: 'Rregullorja (QRK) Nr. 18/2016; Rregullorja Nr. 11/2011 për higjienën', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...AUV, item: 'Certifikata veterinare për eksport', source: 'Ligji Nr. 2004/21 për Veterinarinë; Rregullorja Nr. 13/2011', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...AUV, item: 'Certifikata fitosanitare për eksport', source: 'Vendimi Nr. 01-932/2015', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...AUV, item: 'Ri-eksporti (fitosanitar dhe veterinar)', source: 'Rregullorja Nr. 11/2011; Rregullorja Nr. 43/2013; Ligji Nr. 03/L-016 për Ushqimin', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...AUV, item: 'Mish dhe përpunim mishi', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' },
  { ...AUV, item: 'Faqja e autoritetit', source: 'AUV — Agjencia e Ushqimit dhe Veterinarisë', url: 'https://auvk.rks-gov.net', checkedAt: null, kind: 'AUTORITET' },

  // ── Modulet pa asnjë akt ──────────────────────────────────────────────────
  ...['Marka tregtare', 'Patenta', 'Dizajni industrial', 'Treguesit gjeografikë',
      'Afatet dhe tarifat e aplikimit',
     ].map((item): ProvenanceRow => ({ ...KIPA, item, source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
       note: 'PRIORITET: afatet e markave janë prekluzive. Duhet ligji përkatës + UA për tarifat.' })),
  ...['Vlerësimi i rrezikut', 'Detyrimet e punëdhënësit', 'Raportimi i aksidenteve',
      'Trajnimi i punëtorëve', 'Inspektimi',
     ].map((item): ProvenanceRow => ({ ...SIGURIA, item, source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
       note: 'PRIORITET: terren ku inspektorati gjobit. Duhet ligji për sigurinë dhe shëndetin në punë + UA-të.' })),
  { ...ENERGJI, item: 'Kushti i kualifikimit: 50+ punëtorë ose mbi 10M qarkullim', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
    note: 'PRIORITET: ky kusht vendos kush e sheh modulin. Duhet rregulla e ZRRE-së.' },
  { ...ENERGJI, item: 'Rolet e aktorëve (KESCO si furnizues universal)', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' },
  { ...ENERGJI, item: 'Çmimet referencë të tregut', source: 'ALPEX — bursa shqiptare e energjisë', url: 'https://alpex.al/day-ahead-market-2/', checkedAt: null, kind: 'DYTESOR',
    note: 'Burim jo-kosovar; nuk përcakton detyrime për bizneset kosovare.' },

  // ── Transporti, Termet, Checklist, Banka ──────────────────────────────────
  ...['Transport frigo', 'Transport kontejnerësh', 'Transport rrugor (LTL/FTL)', 'Transport ajror',
     ].map((item): ProvenanceRow => ({ ...TRANSPORT, item, source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' })),
  { ...TERMA, item: 'Incoterms dhe termat tregtarë', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
    note: 'Duhet referencë te Incoterms të ICC-së (botimi në fuqi).' },
  { ...CHECKLIST, item: 'Hapat e eksportit', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' },
  { ...BANKA, item: 'Gjashtë bankat: emri dhe faqja', source: 'Faqet zyrtare të bankave', url: 'https://bqk-kos.org', checkedAt: null, kind: 'AUTORITET',
    note: 'BQK-ja mban regjistrin e institucioneve të licencuara.' },
  { ...BANKA, item: 'Përshkrimi i fokusit të secilës bankë', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
    note: 'Vlerësim redaksional, jo fakt i cituar.' },
  { ...BANKA, item: 'Llojet e kredive dhe kushtet', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
    note: 'Pa normë, pa datë. Duhet ofertë e datuar nga banka, me afat skadimi.' },

  // ── Hap biznes / Investime ────────────────────────────────────────────────
  ...['Zgjidh formën ligjore', 'Përgatit dokumentet kryesore', 'Autorizim me firmë të noterizuar',
      'Kur duhet prezencë fizike', 'Hap llogari bankare', 'Aktivizim EDI dhe kontabilist',
     ].map((item): ProvenanceRow => ({ ...HAPBIZNES, item, source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
       note: 'Përsërit procedurat e ARBK-së pa nenet që ARBK-ja i ka.' })),
  { ...INVEST, item: 'Tatimi në fitim', source: 'Ligji Nr. 05/L-029', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...INVEST, item: 'Tatimi në paga', source: 'Ligji Nr. 05/L-028', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...INVEST, item: 'TVSH dhe TVSH për eksport', source: 'Ligji Nr. 05/L-037', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...INVEST, item: 'Kontributet pensionale', source: 'Ligji Nr. 04/L-101', url: GZK, checkedAt: null, kind: 'PARESOR' },
  { ...INVEST, item: 'Doganë drejt BE-së dhe CEFTA-s', source: 'MSA BE–Kosovë; CEFTA 2006', url: null, checkedAt: null, kind: 'DYTESOR', note: 'Marrëveshje e emërtuar, pa link te teksti.' },
  { ...INVEST, item: 'Katër zonat ekonomike dhe parqet industriale', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' },
  { ...INVEST, item: 'Gjashtë sektorët me «potencial investimi»', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM' },

  // ── Katalogu i certifikimeve ──────────────────────────────────────────────
  { ...CERT, item: 'Katalogu (90 certifikime): emri, përshkrimi, industritë', source: 'Redaksional, në kod', url: null, checkedAt: null, kind: 'PA_BURIM' },
  { ...CERT, item: 'Organi që e lëshon secilin certifikim', source: 'Emrat e organeve të standardizimit', url: 'https://www.iso.org', checkedAt: null, kind: 'DYTESOR', note: 'Emër pa link për shumicën.' },
  { ...CERT, item: 'Niveli «i detyrueshëm në BE»', source: '—', url: null, checkedAt: null, kind: 'PA_BURIM',
    note: 'PRIORITET: pretendim ligjor pa referencë te rregullorja që e krijon detyrimin.' },
]

/** Dataset-et zyrtare që ushqejnë të dhënat sasiore. Të deklaruara për referencë. */
export const DATA_SOURCE_CATALOG = [
  { name: 'ASK — Agjencia e Statistikave të Kosovës', dataset: 'PxWeb tab08.px', url: 'https://askdata.rks-gov.net/api/v1/sq/ASKdata', what: 'Tregtia e jashtme e Kosovës' },
  { name: 'Eurostat', dataset: 'tps00001', url: 'https://ec.europa.eu/eurostat/databrowser/view/tps00001', what: 'Popullsia e tregjeve' },
  { name: 'Eurostat', dataset: 'tec00001', url: 'https://ec.europa.eu/eurostat/databrowser/view/tec00001', what: 'GDP për banor' },
  { name: 'Eurostat Comext', dataset: 'DS-045409', url: 'https://ec.europa.eu/eurostat/comext/newxtweb/', what: 'Importet sektoriale të BE-së' },
  { name: 'UN Comtrade', dataset: 'COMTRADE-HS', url: 'https://comtradeplus.un.org/', what: 'Importet sektoriale jashtë BE-së' },
  { name: 'FMN', dataset: 'WEO-NGDPDPC, WEO-LP', url: 'https://www.imf.org/external/datamapper/api/', what: 'Tregues për tregjet jo-evropiane' },
  { name: 'EUR-Lex', dataset: '—', url: 'https://eur-lex.europa.eu', what: 'Aktet ligjore të BE-së për kërkesat e tregjeve' },
  { name: 'Gazeta Zyrtare e Republikës së Kosovës', dataset: '—', url: 'https://gzk.rks-gov.net', what: 'Aktet ligjore kosovare' },
] as const
