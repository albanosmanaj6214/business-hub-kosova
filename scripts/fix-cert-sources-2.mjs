// Pasi 2 e rregullimit te burimeve. Njesoj si pasi 1: vetem URL te verifikuara.
//   node scripts/fix-cert-sources-2.mjs --dry
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry')

// Verifikuar me curl 2026-08-12, te gjitha 200.
const V = {
  CPR: 'https://single-market-economy.ec.europa.eu/sectors/construction/construction-products-regulation-cpr_en',
  MACHINERY: 'https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/machinery_en',
  LVD: 'https://single-market-economy.ec.europa.eu/sectors/electrical-and-electronic-engineering-industries-eei/low-voltage-directive-lvd_en',
  ROHS: 'https://environment.ec.europa.eu/topics/waste-and-recycling/rohs-directive_en',
  MFDS_KR: 'https://www.mfds.go.kr/eng/index.do',
  GSO: 'https://www.gso.org.sa/en/',
  PAI_KW: 'https://www.pai.gov.kw',
  SAMR_CN: 'https://www.samr.gov.cn',
}

const FIXES = [
  { cc: 'RO', match: 'produkteve të ndërtimit', set: { sourceUrl: V.CPR },
    why: 'SGS (privat) -> Komisioni Europian, Rregullorja e Produkteve të Ndërtimit.' },
  { cc: 'PT', match: 'RoHS', set: { sourceUrl: V.ROHS },
    why: 'blog.qima.com (blog privat) -> Komisioni Europian, RoHS.' },
  { cc: 'PT', match: 'Low Voltage Directive', set: { sourceUrl: V.LVD },
    why: 'blog.qima.com (blog privat) -> Komisioni Europian, LVD.' },
  { cc: 'PT', match: 'Machinery Directive', set: { sourceUrl: V.MACHINERY },
    why: 'manufacturingsafety.com (privat) -> Komisioni Europian, makineritë.' },
  { cc: 'KR', match: 'MFDS', set: { sourceUrl: V.MFDS_KR },
    why: 'santandertrade.com (portal banke) -> MFDS, autoriteti korean.' },
  { cc: 'KW', match: 'KUCAS', set: { sourceUrl: V.PAI_KW },
    why: 'middleeastbriefing.com -> Autoriteti Publik i Industrisë i Kuvajtit.' },
  { cc: 'KW', match: 'GSO Standards', set: { sourceUrl: V.GSO },
    why: 'tuv.com (privat) -> GSO, organizata e standardizimit e Gjirit.' },
  { cc: 'KW', match: 'Halal', set: { sourceUrl: null,
      sourceNote: 'Burimi i mëparshëm ishte inspektorati ushqimor amerikan. Autoriteti kuvajtian në verifikim.' },
    why: 'fsis.usda.gov pa lidhje me Kuvajtin.' },
  { cc: 'CN', match: 'Organic', set: { sourceUrl: V.SAMR_CN,
      authority: 'SAMR — State Administration for Market Regulation (certifikimi organik kinez)' },
    why: 'ttb.gov (byroja amerikane e alkoolit) -> SAMR, autoriteti kinez.' },
  { cc: 'TR', match: 'KKDIK', set: { sourceUrl: null,
      sourceNote: 'Burimi i mëparshëm SGS është kompani private. Autoriteti turk (Ministria e Mjedisit) në verifikim.' },
    why: 'sgs.com privat; csb.gov.tr nuk u përgjigj.' },
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
    const before = String(certs[i].sourceUrl).slice(0, 44)
    certs[i] = { ...certs[i], ...f.set }
    if (!DRY) await prisma.exportGuide.update({ where: { id: g.id }, data: { certifications: certs } })
    changed++
    console.log(`[OK] ${g.country} / ${String(certs[i].name).slice(0, 42)}\n     ${f.why}\n     ${before} -> ${String(certs[i].sourceUrl).slice(0, 60)}`)
  }
  console.log(`\n${DRY ? '[THATE] ' : ''}ndryshuar: ${changed}, nuk u gjetën: ${missing}`)
}
main().finally(() => prisma.$disconnect())
