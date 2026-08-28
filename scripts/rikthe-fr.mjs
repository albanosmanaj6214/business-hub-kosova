import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
const p = new PrismaClient()
const lab = JSON.parse(readFileSync('/root/backups-labeling/FR-labeling-para-2026-08-26.json','utf8'))
const g = await p.exportGuide.findFirst({ where: { countryCode: 'FR', deletedAt: null }, select: { id: true } })
await p.exportGuide.update({ where: { id: g.id }, data: { labeling: lab } })
const v = await p.exportGuide.findFirst({ where: { countryCode: 'FR', deletedAt: null }, select: { labeling: true } })
const r = v.labeling.rules || []
console.log('FR: rregulla=' + r.length + '  me fushat e mia=' + r.filter(x => x.publicationStatus || x.correction).length)
console.log('burimi i pare tani: ' + r[0].sourceUrl)
await p.$disconnect()
