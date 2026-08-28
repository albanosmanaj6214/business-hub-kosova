import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
const p = new PrismaClient()
const backup = JSON.parse(readFileSync('/root/backups-labeling/export-guides-2026-08-26.json','utf8'))
let n = 0
for (const g of backup) {
  await p.exportGuide.update({
    where: { id: g.id },
    data: {
      customs: g.customs, requiredDocs: g.requiredDocs, certifications: g.certifications,
      labeling: g.labeling, sectorRules: g.sectorRules, tradeAgreements: g.tradeAgreements,
      contacts: g.contacts, citations: g.citations, marketStats: g.marketStats,
      marketOverview: g.marketOverview,
    },
  })
  n++
}
console.log('u rikthyen ' + n + ' udhëzues në gjendjen para ndryshimeve të mia')
// verifikim
for (const cc of ['CH','BG','IL','FR']) {
  const g = await p.exportGuide.findFirst({ where: { countryCode: cc, deletedAt: null }, select: { tradeAgreements: true, labeling: true } })
  const emraObjekt = (g.tradeAgreements||[]).filter(a => typeof a.name === 'object').length
  const rregullaLab = (g.labeling?.rules||[]).length
  const meFushaTeMijat = (g.labeling?.rules||[]).filter(r => r.publicationStatus || r.correction).length
  console.log('  ' + cc + ': name-objekt=' + emraObjekt + '  rregulla etiketimi=' + rregullaLab + '  me fushat e mia=' + meFushaTeMijat)
}
await p.$disconnect()
