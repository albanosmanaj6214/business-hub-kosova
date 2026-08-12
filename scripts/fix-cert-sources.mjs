// Rregullimi i gabimeve te konfirmuara ne certifikimet e udhezuesve.
//
// RREGULL: shkruhet vetem URL e verifikuar me 200/30x. Ku burimi zyrtar nuk u
// verifikua, sourceUrl behet null dhe shtohet `sourceNote` — zeri mbetet i dukshem
// si "PA_BURIM" te /admin/burimet, jo i fshehur pas nje linku te gabuar.
//
//   node scripts/fix-cert-sources.mjs --dry
//   node scripts/fix-cert-sources.mjs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry')

// URL te verifikuara me curl me 2026-08-12 (200 ose 30x).
const V = {
  ROHS: 'https://environment.ec.europa.eu/topics/waste-and-recycling/rohs-directive_en',
  CE_EU: 'https://single-market-economy.ec.europa.eu/single-market/ce-marking_en',
  ENERGY_LABEL: 'https://energy-efficient-products.ec.europa.eu/ecodesign-and-energy-label_en',
  AUV: 'https://auvk.rks-gov.net',
  GOEIC: 'https://www.goeic.gov.eg',
  EOS_EG: 'https://www.eos.org.eg',
  MOIAT_AE: 'https://moiat.gov.ae',
  SII_IL: 'https://www.sii.org.il/en/',
  BDA_BG: 'https://www.bda.bg/en/',
  MOPH_QA: 'https://www.moph.gov.qa',
  CNCA_CN: 'https://www.cnca.gov.cn',
}

const NOTE_UNVERIFIED = 'Burimi zyrtar në verifikim. Burimi i mëparshëm u hoq sepse nuk ishte autoriteti kompetent.'

/** Ndryshimet, sipas vendit dhe emrit të certifikimit (përputhje me nënvargë). */
const FIXES = [
  // ── A. GABIME FAKTIKE: CE i shënuar detyrim jashtë BE-së ──────────────────
  { cc: 'CN', match: 'CE Marking', set: {
      mandatory: false,
      sourceUrl: V.CNCA_CN,
      authority: 'CNCA — Certification and Accreditation Administration of China (për CCC)',
      description: {
        en: 'CE marking is NOT a Chinese market requirement. It applies to the European Economic Area. For placing products on the Chinese market the relevant scheme is CCC (China Compulsory Certification), administered by CNCA. A Kosovo exporter who already holds CE marking may use the CE technical file as supporting evidence during CCC testing, but CE itself does not grant market access to China.',
        sq: 'Shënimi CE NUK është kërkesë e tregut kinez. Ai vlen për Hapësirën Ekonomike Europiane. Për vendosjen e produkteve në tregun kinez skema përkatëse është CCC (China Compulsory Certification), e administruar nga CNCA. Një eksportues kosovar që ka CE mund të përdorë dosjen teknike të CE-së si dëshmi mbështetëse gjatë testimit CCC, por CE-ja në vetvete nuk jep qasje në tregun kinez.',
      },
    }, why: 'CE ishte mandatory=true për Kinën; CE nuk është detyrim kinez, CCC është.' },

  { cc: 'IL', match: 'CE Marking', set: {
      mandatory: false,
      sourceUrl: V.SII_IL,
      authority: 'Standards Institution of Israel (SII)',
      description: {
        en: 'CE marking is not an Israeli legal requirement. Mandatory conformity in Israel is the SII mark under Israeli standards. SII may accept CE test reports from an EU notified body as part of the evidence, which shortens the process, but CE alone does not authorise placing the product on the Israeli market.',
        sq: 'Shënimi CE nuk është kërkesë ligjore izraelite. Konformiteti i detyrueshëm në Izrael është shenja SII sipas standardeve izraelite. SII-ja mund të pranojë raporte testimi CE nga një organ i njoftuar i BE-së si pjesë e dëshmisë, çka e shkurton procesin, por CE-ja në vetvete nuk autorizon vendosjen e produktit në tregun izraelit.',
      },
    }, why: 'CE ishte mandatory=true për Izraelin; detyrimi izraelit është SII.' },

  // Ngatërresë Halal/Kosher: autoriteti i shënuar është Rabinati (kosher), burimi USDA.
  { cc: 'IL', match: 'Halal Certification', set: {
      sourceUrl: null,
      sourceNote: 'ZËRI NË RISHIKIM: emri thotë Halal ndërsa autoriteti i shënuar është Rabinati Kryesor (kosher). Dy skema të ndryshme. Duhet ndarë dhe verifikuar te Ministria e Shëndetësisë e Izraelit.',
    }, why: 'Ngatërrim Halal/Kosher; burimi ishte fsis.usda.gov.' },

  // ── B. BURIME TE SHFUQIZUARA ─────────────────────────────────────────────
  { cc: 'BG', match: 'REACH', set: { sourceUrl: null, sourceNote: 'Burimi i mëparshëm export.gov është i mbyllur. Autoriteti është ECHA; linku i drejtpërdrejtë në verifikim.' }, why: 'export.gov i mbyllur.' },
  { cc: 'BG', match: 'RoHS', set: { sourceUrl: V.ROHS }, why: 'export.gov i mbyllur -> Komisioni Europian, direktiva RoHS.' },
  { cc: 'BG', match: 'Certificates of Conformity', set: { sourceUrl: V.BDA_BG }, why: 'export.gov i mbyllur -> Agjencia Bullgare e Barnave.' },
  { cc: 'PT', match: 'Textile Labeling', set: { sourceUrl: null, sourceNote: 'Burimi i mëparshëm export.gov është i mbyllur. Akti është Rregullorja (BE) 1007/2011; linku EUR-Lex në verifikim.' }, why: 'export.gov i mbyllur.' },
  { cc: 'IL', match: 'Etiquetage', set: { sourceUrl: null, sourceNote: 'Burimi i mëparshëm export.gov është i mbyllur. Autoriteti është Ministria e Shëndetësisë e Izraelit; linku në verifikim.' }, why: 'legacy.export.gov i mbyllur.' },
  { cc: 'SK', match: 'CE Marking', set: { sourceUrl: V.CE_EU }, why: 'privacyshield.gov i shfuqizuar -> Komisioni Europian, CE marking.' },
  { cc: 'SK', match: 'Efikasitetit Energjetik', set: { sourceUrl: V.ENERGY_LABEL }, why: 'privacyshield.gov i shfuqizuar -> Komisioni Europian, etiketa energjetike.' },

  // ── C. AUTORITET I GABUAR -> AUTORITETI I SAKTE ──────────────────────────
  { cc: 'DE', match: 'Fitosanitare', set: { sourceUrl: V.AUV }, why: 'Dogana e Kosovës -> AUV, që e lëshon certifikatën fitosanitare.' },
  { cc: 'DE', match: 'Zoonozash', set: { sourceUrl: V.AUV }, why: 'Dogana e Kosovës -> AUV, inspektorati veterinar.' },
  { cc: 'EG', match: 'GOEIC', set: { sourceUrl: V.GOEIC }, why: 'Ministria e Tregtisë e Pakistanit -> GOEIC, autoriteti egjiptian.' },
  { cc: 'EG', match: 'Halal', set: { sourceUrl: V.EOS_EG }, why: 'Intertek (privat) -> EOS, organizata egjiptiane e standardeve.' },
  { cc: 'AE', match: 'ESMA/ECAS', set: { sourceUrl: V.MOIAT_AE }, why: 'wwbridge-cert (privat) -> MOIAT, ministria kompetente.' },
  { cc: 'AE', match: 'MOHAP', set: { sourceUrl: V.MOIAT_AE }, why: 'wwbridge-cert (privat) -> MOIAT; mohap.gov.ae nuk u përgjigj.' },
  { cc: 'AE', match: 'Shënimi CE', set: { sourceUrl: V.CE_EU }, why: 'wwbridge-cert (privat) -> Komisioni Europian (CE është instrument i BE-së).' },
  { cc: 'QA', match: 'Certificate of Conformity (Food)', set: { sourceUrl: V.MOPH_QA }, why: 'SGS (privat) -> Ministria e Shëndetësisë Publike e Katarit.' },
  { cc: 'IL', match: 'SII (Standards Institution', set: { sourceUrl: V.SII_IL }, why: 'Konsulencë private -> SII, autoriteti izraelit.' },

  // ── D. BURIME PRIVATE PA AUTORITET TE VERIFIKUAR -> PA BURIM + SHENIM ────
  { cc: 'ZA', match: 'FSSC 22000', set: { sourceUrl: null, sourceNote: NOTE_UNVERIFIED }, why: 'fssc.com është skema private, jo autoritet.' },
  { cc: 'SA', match: 'ISPM-15', set: { sourceUrl: null, sourceNote: NOTE_UNVERIFIED }, why: 'gistnet.com privat.' },
  { cc: 'AE', match: 'ISO 22000 / HACCP', set: { sourceUrl: null, sourceNote: NOTE_UNVERIFIED }, why: 'productregistrationuae.com privat.' },
  { cc: 'AE', match: 'ISO 9001', set: { sourceUrl: null, sourceNote: NOTE_UNVERIFIED }, why: 'wwbridge-cert privat.' },
  { cc: 'DE', match: 'FSSC 22000 / BRC', set: { sourceUrl: null, sourceNote: NOTE_UNVERIFIED }, why: 'brcglobalstandards.com skemë private.' },
  { cc: 'QA', match: 'ISO 22000 or HACCP', set: { sourceUrl: null, sourceNote: NOTE_UNVERIFIED }, why: 'intertek.com privat.' },
  { cc: 'JP', match: 'Pharmaceutical Affairs Law', set: { sourceUrl: null, sourceNote: 'Burimi i mëparshëm ishte faqe amerikane për imigracion. Autoriteti është MHLW i Japonisë; linku në verifikim.' }, why: 'uscisguide.com pa lidhje.' },
  { cc: 'EE', match: 'Halal', set: { sourceUrl: null, sourceNote: 'Halal nuk është kërkesë ligjore e BE-së; është pritshmëri e blerësit. Burimi i mëparshëm ishte autoriteti malajzian.' }, why: 'halal.gov.my për treg të BE-së.' },
  { cc: 'EE', match: 'GOST', set: { sourceUrl: null, sourceNote: 'GOST nuk është kërkesë e tregut të BE-së. Zëri duhet rishikuar ose hequr.' }, why: 'GOST për Estoninë, treg i BE-së.' },
  { cc: 'IS', match: 'EC DoC', set: { sourceUrl: V.CE_EU }, why: 'manufacturingsafety.com privat -> Komisioni Europian.' },
  { cc: 'IN', match: 'Legal Metrology', set: { sourceUrl: null, sourceNote: NOTE_UNVERIFIED }, why: 'tigerpug.com privat; consumeraffairs.nic.in nuk u përgjigj.' },
  { cc: 'GH', match: 'Halal', set: { sourceNote: 'Pa burim: certifikim halal i lëshuar nga Ghana Muslim Mission; linku në verifikim.' }, why: 'pa burim fare.' },
  { cc: 'KE', match: 'Halal SUPKEM', set: { sourceNote: 'Pa burim: certifikim halal i lëshuar nga SUPKEM; linku në verifikim.' }, why: 'pa burim fare.' },
]

function norm(s) { return String(s || '').toLowerCase() }

async function main() {
  const guides = await prisma.exportGuide.findMany({
    where: { deletedAt: null, isPublished: true },
    select: { id: true, countryCode: true, country: true, certifications: true },
  })

  let changed = 0, notFound = 0
  const log = []

  for (const f of FIXES) {
    const g = guides.find((x) => x.countryCode === f.cc)
    if (!g || !Array.isArray(g.certifications)) { notFound++; log.push(`[MUNGON] ${f.cc} ${f.match}`); continue }
    const certs = g.certifications
    const i = certs.findIndex((c) => c && typeof c === 'object' && norm(c.name).includes(norm(f.match)))
    if (i < 0) { notFound++; log.push(`[MUNGON] ${f.cc} / ${f.match}`); continue }

    const before = { mandatory: certs[i].mandatory, sourceUrl: certs[i].sourceUrl }
    certs[i] = { ...certs[i], ...f.set }
    if (!DRY) {
      await prisma.exportGuide.update({ where: { id: g.id }, data: { certifications: certs } })
    }
    changed++
    log.push(`[OK] ${g.country} / ${certs[i].name?.slice(0, 44)}\n      arsyeja : ${f.why}` +
             `\n      mandatory: ${before.mandatory} -> ${certs[i].mandatory}` +
             `\n      burimi   : ${String(before.sourceUrl).slice(0, 46)} -> ${String(certs[i].sourceUrl).slice(0, 46)}`)
  }

  console.log(log.join('\n'))
  console.log(`\n${DRY ? '[THATE] ' : ''}ndryshuar: ${changed}, nuk u gjetën: ${notFound}, gjithsej rregulla: ${FIXES.length}`)
}

main().finally(() => prisma.$disconnect())
