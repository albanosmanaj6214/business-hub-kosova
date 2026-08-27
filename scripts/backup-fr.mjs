import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync } from 'fs'
const p = new PrismaClient()
const g = await p.exportGuide.findFirst({ where: { countryCode: 'FR', deletedAt: null }, select: { id: true, labeling: true } })
mkdirSync('/root/backups-labeling', { recursive: true })
const f = '/root/backups-labeling/FR-labeling-para-2026-08-26.json'
writeFileSync(f, JSON.stringify(g.labeling, null, 2))
console.log('u ruajt: ' + f)
await p.$disconnect()
