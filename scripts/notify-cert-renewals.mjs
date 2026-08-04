// Kujtuesit e rinovimit te certifikimeve. Ekzekutohet DITOR (cron ne CT109).
// Gjen certifikimet e kompanive me skadence brenda 60/30/7 diteve (dhe te skaduarat
// deri 30 dite pas) dhe krijon Notification per pronarin — NJE here per (certifikim,
// skadence, prag): dedup permes fushes `link` unike-semantike. Pa API te jashtme.
//   node scripts/notify-cert-renewals.mjs   (nga /var/www/businesshub — merr .env vete)
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const DAY = 24 * 3600 * 1000
function bucketFor(daysLeft) {
  if (daysLeft < 0) return { key: 'skaduar', titleSq: (n, d) => `⚠️ ${n} ka skaduar`, msgSq: (n, d) => `Certifikimi "${n}" ka skaduar më ${d}. Rinovoje sa më parë — tregjet dhe blerësit e kërkojnë të vlefshëm.` }
  if (daysLeft <= 7) return { key: '7d', titleSq: (n) => `⏰ ${n} skadon brenda 7 ditësh`, msgSq: (n, d) => `Certifikimi "${n}" skadon më ${d}. Nis rinovimin tani që të mos mbetesh pa të.` }
  if (daysLeft <= 30) return { key: '30d', titleSq: (n) => `${n} skadon brenda 30 ditësh`, msgSq: (n, d) => `Certifikimi "${n}" skadon më ${d}. Planifiko rinovimin.` }
  if (daysLeft <= 60) return { key: '60d', titleSq: (n) => `${n} skadon brenda 60 ditësh`, msgSq: (n, d) => `Certifikimi "${n}" skadon më ${d}. Kujdes: disa rinovime kërkojnë auditim — planifiko herët.` }
  return null
}

async function main() {
  const now = new Date()
  const horizon = new Date(now.getTime() + 61 * DAY)
  const floor = new Date(now.getTime() - 31 * DAY)
  const rows = await prisma.companyCertification.findMany({
    where: { validUntil: { not: null, lte: horizon, gte: floor } },
    include: {
      certification: { select: { code: true, name: true } },
      company: { select: { ownerUserId: true, name: true } },
    },
  })
  let created = 0, skipped = 0
  for (const r of rows) {
    const exp = r.validUntil
    const daysLeft = Math.floor((exp.getTime() - now.getTime()) / DAY)
    const b = bucketFor(daysLeft)
    if (!b) continue
    const dStr = exp.toISOString().slice(0, 10)
    const link = `/dashboard/profili-kompanise?rinovim=${r.certification.code}&exp=${dStr}&prag=${b.key}`
    const exists = await prisma.notification.findFirst({ where: { userId: r.company.ownerUserId, link } })
    if (exists) { skipped++; continue }
    await prisma.notification.create({
      data: {
        userId: r.company.ownerUserId,
        type: 'SYSTEM',
        title: b.titleSq(r.certification.name, dStr),
        titleSq: b.titleSq(r.certification.name, dStr),
        message: b.msgSq(r.certification.name, dStr),
        messageSq: b.msgSq(r.certification.name, dStr),
        link,
        reason: 'Kujtues automatik: certifikim me skadencë të afërt në profilin tënd.',
      },
    })
    created++
  }
  console.log(JSON.stringify({ checked: rows.length, created, skipped }))
}

main().finally(() => prisma.$disconnect())
