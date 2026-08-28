import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
for (const cc of ['CH','BG','MD','IL']) {
  const g = await p.exportGuide.findFirst({ where: { countryCode: cc, deletedAt: null }, select: { tradeAgreements: true } })
  console.log('===== ' + cc + ' =====')
  for (const a of (g.tradeAgreements||[])) {
    console.log('  name    :', typeof a.name, JSON.stringify(a.name).slice(0,150))
    console.log('  benefit :', typeof a.benefit, JSON.stringify(a.benefit).slice(0,90))
  }
}
await p.$disconnect()
