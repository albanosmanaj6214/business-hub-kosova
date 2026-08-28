import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const gs = await p.exportGuide.findMany({ where: { deletedAt: null },
  select: { countryCode:true, customs:true, requiredDocs:true, certifications:true, labeling:true, sectorRules:true, tradeAgreements:true } })

// Fushat qe faqja i vizaton si femije te papershtatur React: DUHET varg i thjeshte.
const VARG = [
  ['customs.vat',              g => [g.customs?.vat]],
  ['customs.authority.name',   g => [g.customs?.authority?.name]],
  ['requiredDocs[].issuedBy',  g => (g.requiredDocs||[]).map(d=>d.issuedBy)],
  ['certifications[].name',    g => (g.certifications||[]).map(c=>c.name)],
  ['certifications[].authority',g => (g.certifications||[]).map(c=>c.authority)],
  ['sectorRules[].sector',     g => (g.sectorRules||[]).map(s=>s.sector)],
  ['tradeAgreements[].name',   g => (g.tradeAgreements||[]).map(a=>a.name)],
]
// Fushat qe kalojne neper bi(): duhet {sq,en} ose bosh
const BI = [
  ['customs.importDuties',        g => [g.customs?.importDuties]],
  ['requiredDocs[].name',         g => (g.requiredDocs||[]).map(d=>d.name)],
  ['requiredDocs[].description',  g => (g.requiredDocs||[]).map(d=>d.description)],
  ['certifications[].description',g => (g.certifications||[]).map(c=>c.description)],
  ['labeling.rules[].rule',       g => (g.labeling?.rules||[]).map(r=>r.rule)],
  ['sectorRules[].rules[].rule',  g => (g.sectorRules||[]).flatMap(s=>(s.rules||[]).map(r=>r.rule))],
  ['tradeAgreements[].benefit',   g => (g.tradeAgreements||[]).map(a=>a.benefit)],
]
const prishur = []
for (const g of gs) {
  for (const [emri, f] of VARG)
    for (const v of f(g)) if (v != null && typeof v !== 'string')
      prishur.push({ vend:g.countryCode, fusha:emri, lloji:typeof v, kritike:true, mostra:JSON.stringify(v).slice(0,70) })
  for (const [emri, f] of BI)
    for (const v of f(g)) if (v != null && (typeof v !== 'object' || Array.isArray(v)))
      prishur.push({ vend:g.countryCode, fusha:emri, lloji:typeof v, kritike:false, mostra:JSON.stringify(v).slice(0,70) })
}
const k = prishur.filter(x=>x.kritike), s = prishur.filter(x=>!x.kritike)
console.log('KRITIKE (objekt aty ku faqja pret varg, jep gabim ne vizatim): ' + k.length)
for (const x of k.slice(0,25)) console.log('  [' + x.vend + '] ' + x.fusha + ' = ' + x.lloji + '  ' + x.mostra)
console.log('\nJO KRITIKE (varg aty ku pritet {sq,en}; bi() kthen "" dmth teksti HUMBET): ' + s.length)
const perFushe = {}
for (const x of s) perFushe[x.fusha] = (perFushe[x.fusha]||0)+1
for (const [f,c] of Object.entries(perFushe).sort((a,b)=>b[1]-a[1])) console.log('  ' + String(c).padStart(4) + '  ' + f)
for (const x of s.slice(0,12)) console.log('   · [' + x.vend + '] ' + x.fusha + ' = ' + x.mostra)
await p.$disconnect()
