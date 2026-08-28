import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
for (const cc of ['CH','BG']) {
  const g = await p.exportGuide.findFirst({ where: { countryCode: cc, deletedAt: null }, select: { tradeAgreements: true } })
  console.log('===== ' + cc + ' (gjendja e rikthyer) =====')
  for (const a of (g.tradeAgreements||[])) {
    if (!/CEFTA/i.test(a.name)) continue
    console.log('  TITULLI : ' + a.name)
    console.log('  TEKSTI  : ' + (a.benefit?.en || a.benefit))
    console.log('  BURIMI  : ' + a.sourceUrl)
  }
}
await p.$disconnect()
