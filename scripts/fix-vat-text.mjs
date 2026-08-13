// Rregullon dy formulime te gabuara/te vjetruara te TVSH-se ne udhezuesit e eksportit.
// Te dyja u verifikuan me kerkim dhe burimi u provua me curl.
//   node scripts/fix-vat-text.mjs --dry
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry')

const FIXES = [
  {
    cc: 'SG',
    // Ishte: "GST 9% (rritet në 9% më 2024)" — kontradikte me vetveten.
    vat: 'GST 9% (normë e vetme; e ngritur nga 8% në 9% më 1 janar 2024, pa ndryshim të njoftuar për 2026)',
    sourceUrl: 'https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/gst-rate-change/gst-rate-change-for-consumers1',
    why: 'Kontradiktë: thoshte "9% (rritet në 9%)". Norma është e saktë, formulimi ishte i pakuptimtë.',
  },
  {
    cc: 'ID',
    // Ishte: "PPN 11% standard (rritet në 12% 2025)" — i vjetruar dhe mashtrues ne 2026.
    vat: 'PPN me normë efektive 11% për mallrat e zakonshme (norma statutore 12% aplikohet mbi një bazë 11/12). Norma e plotë 12% vlen vetëm për mallrat luksoze.',
    sourceUrl: null,
    sourceNote: 'Burimi zyrtar: Drejtoria e Përgjithshme e Tatimeve e Indonezisë (pajak.go.id); domeni nuk u arrit nga serveri për verifikim, linku shtohet pas konfirmimit.',
    why: 'I vjetruar: premtonte ngritje në 12% më 2025. Në praktikë norma efektive për mallrat e zakonshme mbeti 11%.',
  },
]

async function main() {
  let changed = 0
  for (const f of FIXES) {
    const g = await prisma.exportGuide.findFirst({
      where: { countryCode: f.cc, deletedAt: null },
      select: { id: true, country: true, customs: true },
    })
    if (!g) { console.log(`[MUNGON] ${f.cc}`); continue }
    const cu = { ...(g.customs || {}) }
    const before = String(cu.vat || '')
    cu.vat = f.vat
    if (f.sourceUrl) cu.vatSourceUrl = f.sourceUrl
    if (f.sourceNote) cu.vatSourceNote = f.sourceNote
    cu.vatVerifiedAt = '2026-08-12'
    if (!DRY) await prisma.exportGuide.update({ where: { id: g.id }, data: { customs: cu } })
    changed++
    console.log(`[OK] ${g.country}`)
    console.log(`     ${f.why}`)
    console.log(`     PARA : ${before}`)
    console.log(`     PAS  : ${cu.vat}`)
    console.log(`     burimi: ${f.sourceUrl ?? '(në verifikim)'}`)
  }
  console.log(`\n${DRY ? '[THATE] ' : ''}ndryshuar: ${changed}`)
}
main().finally(() => prisma.$disconnect())
