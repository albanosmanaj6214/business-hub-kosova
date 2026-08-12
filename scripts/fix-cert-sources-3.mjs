// Pasi 3: mbush burimet ku pasi 1 e 2 lane vetem shenim, dhe rikthe mbi-korrigjimet.
//
// STANDARDI I VERIFIKIMIT, i regjistruar per cdo zë ne `sourceVerified`:
//   'curl'   = pergjigjur 200/30x nga serveri (deshmi e drejtperdrejte)
//   'indeks' = domeni bllokon boti-n tim (403/202) ose serverin (000), POR kerkimi
//              kthen faqe reale te indeksuara ne ate domen zyrtar — pra i gjalle
//              per njerez. Perdoret vetem per autoritete zyrtare ose pronare standardi.
//
//   node scripts/fix-cert-sources-3.mjs --dry
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry')

const FIXES = [
  // ── A. RIKTHIM I MBI-KORRIGJIMIT TIM ─────────────────────────────────────
  // ISO, FSSC dhe BRCGS janë PRONARË TË STANDARDIT, jo organe që shesin certifikim.
  // Për një standard vullnetar, pronari i skemës ËSHTË burimi i saktë. I hoqa gabimisht.
  { cc: 'ZA', match: 'FSSC 22000', set: {
      sourceUrl: 'https://www.fssc.com', sourceVerified: 'indeks',
      sourceNote: 'Pronari i skemës FSSC 22000. Standard vullnetar, i kërkuar nga blerësit, jo detyrim ligjor.' },
    why: 'Rikthim: FSSC është pronar i skemës, burim i saktë.' },
  { cc: 'DE', match: 'FSSC 22000 / BRC', set: {
      sourceUrl: 'https://www.brcgs.com', sourceVerified: 'curl',
      sourceNote: 'Pronari i skemës BRCGS. Standard vullnetar i kërkuar nga zinxhirët e shitjes, jo detyrim ligjor gjerman.' },
    why: 'Rikthim: brcgs.com verifikuar 200; brcglobalstandards.com ridrejton te ky.' },
  { cc: 'AE', match: 'ISO 22000 / HACCP', set: {
      sourceUrl: 'https://www.iso.org/standard/45324.html', sourceVerified: 'indeks',
      sourceNote: 'ISO është pronari i standardit. Vullnetar, i kërkuar nga blerësit.' },
    why: 'Rikthim: ISO është pronar standardi.' },
  { cc: 'AE', match: 'ISO 9001', set: {
      sourceUrl: 'https://www.iso.org/standard/62085.html', sourceVerified: 'indeks',
      sourceNote: 'ISO është pronari i standardit. Vullnetar.' },
    why: 'Rikthim: ISO është pronar standardi.' },
  { cc: 'QA', match: 'ISO 22000 or HACCP', set: {
      sourceUrl: 'https://www.iso.org/standard/45324.html', sourceVerified: 'indeks',
      sourceNote: 'ISO është pronari i standardit.' },
    why: 'Rikthim: ISO është pronar standardi.' },
  { cc: 'BG', match: 'REACH', set: {
      sourceUrl: 'https://echa.europa.eu/regulations/reach/understanding-reach', sourceVerified: 'indeks',
      sourceNote: null },
    why: 'ECHA është agjencia e BE-së për REACH; domeni përdoret 8 herë tjetër në platformë.' },
  { cc: 'SA', match: 'ISPM-15', set: {
      sourceUrl: 'https://www.ippc.int', sourceVerified: 'curl',
      sourceNote: 'ISPM-15 është standard i IPPC (Konventa Ndërkombëtare për Mbrojtjen e Bimëve). Certifikata lëshohet nga AUV në Kosovë.' },
    why: 'IPPC është pronari i standardit ISPM-15, verifikuar 200.' },

  // ── B. AUTORITETE ZYRTARE, DESHMI PREJ INDEKSIT ──────────────────────────
  { cc: 'AE', match: 'MOHAP', set: {
      sourceUrl: 'https://mohap.gov.ae/en/home', sourceVerified: 'indeks', sourceNote: null },
    why: 'MOHAP, ministria kompetente. Domeni bllokon serverin tim por faqet janë të indeksuara.' },
  { cc: 'IN', match: 'Legal Metrology', set: {
      sourceUrl: 'https://foodregulatory.fssai.gov.in/legal-metrology', sourceVerified: 'indeks', sourceNote: null },
    why: 'Portali rregullator indian për metrologjinë ligjore.' },
  { cc: 'IL', match: 'Etiquetage', set: {
      sourceUrl: 'https://www.health.gov.il/English', sourceVerified: 'indeks', sourceNote: null },
    why: 'Ministria e Shëndetësisë e Izraelit; kthen 202 (mbrojtje boti), e gjallë për njerëz.' },
  { cc: 'IL', match: 'Halal Certification', set: {
      sourceUrl: 'https://www.health.gov.il/English', sourceVerified: 'indeks',
      sourceNote: 'ZËRI NË RISHIKIM: emri thotë Halal ndërsa autoriteti është Rabinati Kryesor (kosher). Dy skema të ndryshme që duhen ndarë.' },
    why: 'Burim te ministria; ngatërresa halal/kosher mbetet e shënuar për rishikim.' },

  // ── C. GABIM FAKTIK I ZBULUAR: LIGJI JAPONEZ U RIEMERTUA ME 2014 ─────────
  { cc: 'JP', match: 'Pharmaceutical Affairs Law', set: {
      name: 'PMD Act — Akti për Cilësinë, Efikasitetin dhe Sigurinë e Produkteve Farmaceutike dhe Pajisjeve Mjekësore (ish Pharmaceutical Affairs Law)',
      sourceUrl: 'https://www.japaneselawtranslation.go.jp/en/laws/view/3213/en', sourceVerified: 'curl',
      authority: 'Ministry of Health, Labour and Welfare (MHLW) — përkthim zyrtar nga Ministria e Drejtësisë e Japonisë',
      sourceNote: null,
      description: {
        en: 'The Pharmaceutical Affairs Law was amended and renamed in November 2014 to the Act on Securing Quality, Efficacy and Safety of Products Including Pharmaceuticals and Medical Devices (PMD Act). Cosmetics, pharmaceuticals and medical devices placed on the Japanese market fall under this Act, administered by MHLW. The official English translation is published by the Japanese Ministry of Justice.',
        sq: 'Pharmaceutical Affairs Law u amendua dhe u riemërtua në nëntor 2014 në Aktin për Sigurimin e Cilësisë, Efikasitetit dhe Sigurisë së Produkteve përfshirë Farmaceutikat dhe Pajisjet Mjekësore (PMD Act). Kozmetika, farmaceutikat dhe pajisjet mjekësore që vendosen në tregun japonez i nënshtrohen këtij Akti, të administruar nga MHLW. Përkthimi zyrtar në anglisht publikohet nga Ministria e Drejtësisë e Japonisë.',
      } },
    why: 'GABIM FAKTIK: ligji u riemërtua në 2014; zëri citonte emrin e vjetër 12 vjeçar.' },

  // ── D. ZERA QE NUK KANE BURIM LIGJOR SEPSE NUK JANE DETYRIM LIGJOR ───────
  { cc: 'EE', match: 'Halal', set: {
      mandatory: false, sourceVerified: 'pa-burim-ligjor',
      sourceNote: 'Halal nuk është kërkesë ligjore e BE-së. Është pritshmëri e blerësit dhe certifikohet nga organe private. Për Kosovën, certifikimin e lëshon Bashkësia Islame e Kosovës.' },
    why: 'Nuk ekziston burim ligjor sepse nuk është detyrim ligjor; e thotë hapur.' },
  { cc: 'GH', match: 'Halal', set: {
      mandatory: false, sourceVerified: 'pa-burim-ligjor',
      sourceNote: 'Certifikim vullnetar i lëshuar nga Ghana Muslim Mission; kërkesë e blerësit, nuk është detyrim ligjor ganez.' },
    why: 'Njësoj: detyrim tregtar, jo ligjor.' },
  { cc: 'KE', match: 'Halal SUPKEM', set: {
      mandatory: false, sourceVerified: 'pa-burim-ligjor',
      sourceNote: 'Certifikim vullnetar i lëshuar nga SUPKEM; kërkesë e blerësit, nuk është detyrim ligjor kenian.' },
    why: 'Njësoj.' },
  { cc: 'KW', match: 'Halal', set: {
      sourceUrl: 'https://www.pai.gov.kw', sourceVerified: 'curl',
      sourceNote: 'Për mishin, Kuvajti kërkon certifikatë therjeje islame. Autoriteti i standardeve është PAI.' },
    why: 'PAI verifikuar 200.' },

  // ── E. ZERA QE DUHEN HEQUR: NUK APLIKOHEN NE ATE TREG ────────────────────
  { cc: 'EE', match: 'GOST', set: {
      mandatory: false, sourceVerified: 'per-heqje',
      sourceNote: 'PËR HEQJE: GOST nuk është kërkesë e tregut estonez. Estonia zbaton legjislacionin e BE-së. Zëri është i pasaktë për këtë treg.' },
    why: 'GABIM: GOST për një treg të BE-së.' },

  // ── F. TURQIA: ASNJE BURIM ZYRTAR I ARRITSHEM ────────────────────────────
  { cc: 'TR', match: 'KKDIK', set: {
      sourceVerified: 'ne-verifikim',
      sourceNote: 'KKDIK administrohet nga Ministria e Mjedisit, Urbanizimit dhe Ndryshimeve Klimatike e Turqisë (csb.gov.tr). Domeni nuk u arrit për verifikim; linku do të shtohet pas konfirmimit.' },
    why: 'csb.gov.tr i paarritshëm; autoriteti i emërtuar saktë.' },
  { cc: 'PT', match: 'Textile Labeling', set: {
      sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1007', sourceVerified: 'indeks',
      sourceNote: null },
    why: 'Rregullorja (BE) 1007/2011; i njëjti model URL përdoret në 83 rregulla që punojnë.' },
]

const norm = (s) => String(s || '').toLowerCase()

async function main() {
  const guides = await prisma.exportGuide.findMany({
    where: { deletedAt: null, isPublished: true },
    select: { id: true, countryCode: true, country: true, certifications: true },
  })
  let changed = 0, missing = 0
  for (const f of FIXES) {
    const g = guides.find((x) => x.countryCode === f.cc)
    if (!g || !Array.isArray(g.certifications)) { missing++; console.log(`[MUNGON] ${f.cc} ${f.match}`); continue }
    const certs = g.certifications
    const i = certs.findIndex((c) => c && typeof c === 'object' && norm(c.name).includes(norm(f.match)))
    if (i < 0) { missing++; console.log(`[MUNGON] ${f.cc} / ${f.match}`); continue }
    const before = String(certs[i].sourceUrl ?? 'null').slice(0, 40)
    certs[i] = { ...certs[i], ...f.set }
    if (!DRY) await prisma.exportGuide.update({ where: { id: g.id }, data: { certifications: certs } })
    changed++
    console.log(`[OK] ${g.country} / ${String(certs[i].name).slice(0, 40)}`)
    console.log(`     ${f.why}`)
    console.log(`     ${before} -> ${String(certs[i].sourceUrl ?? 'null').slice(0, 56)} [${certs[i].sourceVerified}]`)
  }
  console.log(`\n${DRY ? '[THATE] ' : ''}ndryshuar: ${changed}, nuk u gjetën: ${missing}`)
}
main().finally(() => prisma.$disconnect())
