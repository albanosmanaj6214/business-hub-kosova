import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const g = await p.exportGuide.findFirst({ where: { countryCode: 'FR', deletedAt: null }, select: { labeling: true } })
const rules = g.labeling.rules || []
let ok = 0, warn = 0, nuk = 0
for (const r of rules) {
  const s = r.publicationStatus || '(pa status)'
  if (s === 'PUBLISH') ok++; else if (s.startsWith('PUBLISH')) warn++; else nuk++
  const t = (r.rule?.en || '').replace(/\s+/g, ' ').slice(0, 52)
  console.log('• ' + t)
  console.log('  akti      : ' + (r.legalAct || '—'))
  console.log('  burimi    : ' + (r.sourceUrl || '—'))
  console.log('  citim     : ' + (r.sourceExcerpt ? 'PO (' + r.sourceExcerpt.length + ' shkronja)' : 'jo'))
  console.log('  besueshm  : ' + (r.confidence || '—') + ' | rrezik: ' + (r.riskIfWrong || '—') +
              ' | verifikim njerëzor: ' + (r.humanVerification ? 'kërkohet' : 'jo') + ' | ' + s)
  if (r.correction) console.log('  KORRIGJIM : ' + r.correction)
}
console.log('\nGjithsej ' + rules.length + ' rregulla | PUBLISH: ' + ok + ' | ME PARALAJMËRIM: ' + warn + ' | jo-gati: ' + nuk)
const paBurim = rules.filter(r => !r.sourceUrl).length
const jozyrtare = rules.filter(r => r.sourceUrl && !/\.(gouv\.fr|europa\.eu|ec\.europa\.eu)/.test(r.sourceUrl)).length
console.log('Pa burim: ' + paBurim + ' | burim jo nga gouv.fr/europa.eu: ' + jozyrtare)
await p.$disconnect()
