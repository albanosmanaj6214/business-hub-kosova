import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const gs = await p.exportGuide.findMany({ where: { deletedAt: null },
  select: { countryCode: true, customs: true, requiredDocs: true, certifications: true, labeling: true, sectorRules: true, tradeAgreements: true } })
const d = {}
function walk(o) {
  if (Array.isArray(o)) return o.forEach(walk)
  if (!o || typeof o !== 'object') return
  const u = o.sourceUrl || o.source || o.url
  if (typeof u === 'string' && u.startsWith('http')) {
    try { const h = new URL(u).hostname.replace(/^www\./, ''); d[h] = (d[h] || 0) + 1 } catch {}
  }
  for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v)
}
gs.forEach((g) => ['customs','requiredDocs','certifications','labeling','sectorRules','tradeAgreements'].forEach((f) => walk(g[f])))
const rend = Object.entries(d).sort((a,b)=>b[1]-a[1])
console.log('Domene unike: ' + rend.length + ' | referenca gjithsej: ' + rend.reduce((a,b)=>a+b[1],0))
for (const [h,n] of rend) console.log(String(n).padStart(5) + '  ' + h)
await p.$disconnect()
