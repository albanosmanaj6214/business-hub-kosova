import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync } from 'fs'
const p = new PrismaClient()
const gs = await p.exportGuide.findMany({ where: { deletedAt: null } })
mkdirSync('/root/backups-labeling', { recursive: true })
const f = '/root/backups-labeling/export-guides-2026-08-26.json'
writeFileSync(f, JSON.stringify(gs, null, 1))
console.log('ruajtur ' + gs.length + ' udhëzues → ' + f)
await p.$disconnect()
