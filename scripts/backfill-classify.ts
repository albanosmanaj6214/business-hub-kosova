import { PrismaClient } from '@prisma/client'
import { classifyGrantDeadline, classifyResultToUpdate } from '@/lib/classifiers/deadline-classifier'

const prisma = new PrismaClient()

async function main() {
  const candidates = await prisma.grant.findMany({
    where: { deletedAt: null, classifiedAt: null },
    select: { id: true, title: true, titleSq: true, provider: true, url: true },
  })

  console.log(`Found ${candidates.length} candidates without deadline.\n`)

  let ongoing = 0, withDeadline = 0, deactivated = 0

  for (const g of candidates) {
    const label = (g.titleSq || g.title).slice(0, 55)
    process.stdout.write(`  ${label.padEnd(58)} `)
    const r = await classifyGrantDeadline(g)
    const update = classifyResultToUpdate(r)
    await prisma.grant.update({ where: { id: g.id }, data: update })

    let tag = ''
    if (r.deadline) { withDeadline++; tag = `-> AFAT ${r.deadline.toISOString().slice(0,10)}` }
    else if (r.isOngoing) { ongoing++; tag = '-> E VAZHDUESHME' }
    else { deactivated++; tag = '-> pa rishikim (isActive=false)' }

    console.log(`[${r.source}/${r.confidence}] ${tag}`)
    if (r.evidence) console.log(`     ${r.evidence}`)
  }

  console.log(`\nSummary: ${withDeadline} got deadlines · ${ongoing} ongoing · ${deactivated} deactivated/review`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
