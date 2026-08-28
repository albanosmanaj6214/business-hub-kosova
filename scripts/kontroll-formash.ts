/**
 * Kontroll i formës mbi të gjithë udhëzuesit e gjallë në bazë.
 * Vetëm lexim. Del me kod 1 nëse gjen qoftë edhe një shkelje.
 *
 *   npx tsx scripts/kontroll-formash.ts
 */
import { PrismaClient } from '@prisma/client'
import { validateGuideShape } from '../src/lib/export-guide-shape'

const prisma = new PrismaClient()

async function main() {
  const gs = await prisma.exportGuide.findMany({ where: { deletedAt: null } })
  let gjithsej = 0
  let prishje = 0

  for (const g of gs) {
    const v = validateGuideShape(g)
    if (!v.length) continue
    gjithsej += v.length
    prishje += v.filter((x) => x.severity === 'RENDER_BREAK').length
    console.log(`\n${g.countryCode ?? g.id}  (${g.country})`)
    for (const x of v) {
      console.log(`  [${x.severity}] ${x.path}: pritej ${x.expected}, erdhi ${x.got}`)
      console.log(`      ${x.sample}`)
    }
  }

  console.log(`\nUdhëzues të kontrolluar: ${gs.length}`)
  if (gjithsej === 0) {
    console.log('Shkelje: asnjë. Të gjitha fushat përputhen me atë që vizaton faqja.')
  } else {
    console.log(`Shkelje: ${gjithsej}, prej tyre ${prishje} që e prishin vizatimin e faqes.`)
  }
  await prisma.$disconnect()
  process.exit(gjithsej === 0 ? 0 : 1)
}
main()
