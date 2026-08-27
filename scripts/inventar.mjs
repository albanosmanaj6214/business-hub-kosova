import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const gs = await p.exportGuide.findMany({
  where: { deletedAt: null },
  select: { countryCode: true, country: true, isPublished: true, customs: true, requiredDocs: true, certifications: true, labeling: true, sectorRules: true, tradeAgreements: true, citations: true },
})
const ZYRTARE = /(europa\.eu|\.gouv\.fr|\.gov(\.[a-z]{2})?\/|\.gov$|\.gv\.at|\.admin\.ch|\.bund\.de|\.overheid\.nl|\.gob\.es|\.governo\.it|\.regeringen|\.gc\.ca|who\.int|fao\.org|codexalimentarius|unece\.org|wto\.org|iso\.org|iec\.ch|efsa\.europa|echa\.europa)/i
const NDALUAR = /(blog|wordpress|medium\.com|bgfashion|consulting|compliancegate|wikipedia|quora|reddit|linkedin|facebook|youtube|shopify|alibaba)/i

const AKTE = [
  { emri: 'ushqim (FIC)', re: /\b(food|ushqim|prepacked|allerg|nutriti|ingredient)/i,
    akt: 'Rregullorja (BE) nr. 1169/2011 (FIC)', url: 'https://food.ec.europa.eu/food-safety/labelling-and-nutrition/food-information-consumers-legislation_en' },
  { emri: 'tekstil', re: /\b(textile|tekstil|fibre|fiber composition)/i,
    akt: 'Rregullorja (BE) nr. 1007/2011', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1007' },
  { emri: 'kozmetikë', re: /\b(cosmetic|kozmetik|INCI)/i,
    akt: 'Rregullorja (KE) nr. 1223/2009, neni 19', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1223' },
  { emri: 'siguri produkti', re: /(manufacturer.{0,30}(name|address)|importer.{0,30}address|responsible person)/i,
    akt: 'Rregullorja (BE) 2023/988 (GPSR)', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R0988' },
  { emri: 'njësi matëse', re: /\b(metric unit|njësi metrike|SI unit)/i,
    akt: 'Direktiva 80/181/KEE', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:31980L0181' },
  { emri: 'CE', re: /\bCE\s*mark/i,
    akt: 'Rregullorja (KE) nr. 765/2008 + direktivat sektoriale', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32008R0765' },
]
const stat = { total: 0, zyrtare: 0, ndaluar: 0, tjeter: 0, paBurim: 0, mandNdaluar: 0 }
const perVend = {}, mapueshme = {}, mbetje = []
function shqyrto(o, vend, fusha) {
  if (Array.isArray(o)) return o.forEach((v) => shqyrto(v, vend, fusha))
  if (!o || typeof o !== 'object') return
  const teksti = o.rule || o.name || o.requirement || o.title
  if (teksti) {
    stat.total++
    perVend[vend] = perVend[vend] || { total: 0, keq: 0 }
    perVend[vend].total++
    const u = o.sourceUrl || o.source || ''
    const mand = o.mandatory === true
    const txt = typeof teksti === 'string' ? teksti : (teksti.en || teksti.sq || '')
    let keq = false
    if (!u) { stat.paBurim++; keq = true }
    else if (NDALUAR.test(u)) { stat.ndaluar++; keq = true; if (mand) stat.mandNdaluar++ }
    else if (ZYRTARE.test(u)) stat.zyrtare++
    else { stat.tjeter++; keq = true }
    if (keq) {
      perVend[vend].keq++
      const a = AKTE.find((x) => x.re.test(txt))
      if (a) { mapueshme[a.emri] = (mapueshme[a.emri] || 0) + 1 }
      else mbetje.push({ vend, fusha, txt: txt.replace(/\s+/g,' ').slice(0,70), u: u.slice(0,44), mand })
    }
  }
  for (const v of Object.values(o)) if (v && typeof v === 'object') shqyrto(v, vend, fusha)
}
for (const g of gs) for (const f of ['customs','requiredDocs','certifications','labeling','sectorRules','tradeAgreements'])
  shqyrto(g[f], g.countryCode, f)

console.log('=== INVENTARI I BURIMEVE NË UDHËZUESIT E EKSPORTIT ===')
console.log('Udhëzues: ' + gs.length + ' | pretendime me tekst: ' + stat.total)
console.log('  burim zyrtar        : ' + stat.zyrtare)
console.log('  burim i ndaluar     : ' + stat.ndaluar + '  (prej tyre të shënuara si të detyrueshme: ' + stat.mandNdaluar + ')')
console.log('  burim i paklasifikuar: ' + stat.tjeter)
console.log('  pa burim fare       : ' + stat.paBurim)
console.log('\n--- Sa prej të dobëtave i takojnë një akti të harmonizuar të BE-së ---')
for (const [k,v] of Object.entries(mapueshme).sort((a,b)=>b[1]-a[1])) console.log('  ' + k.padEnd(20) + v)
const totMap = Object.values(mapueshme).reduce((a,b)=>a+b,0)
console.log('  ' + 'GJITHSEJ'.padEnd(20) + totMap + '  → korrigjohen në mënyrë deterministike')
console.log('  ' + 'MBESIN'.padEnd(20) + mbetje.length + '  → kërkojnë burim të veçantë')
console.log('\n--- Vendet me më shumë pretendime pa burim zyrtar ---')
for (const [k,v] of Object.entries(perVend).sort((a,b)=>b[1].keq-a[1].keq).slice(0,12))
  console.log('  ' + k.padEnd(4) + String(v.keq).padStart(4) + ' / ' + v.total)
console.log('\n--- Mostër nga ato që mbeten (të detyrueshme para së gjithash) ---')
for (const m of mbetje.filter(x=>x.mand).slice(0,15)) console.log('  [' + m.vend + '/' + m.fusha + '] ' + m.txt + '  ← ' + (m.u||'PA BURIM'))
console.log('  ... gjithsej të detyrueshme pa burim zyrtar: ' + mbetje.filter(x=>x.mand).length)
await p.$disconnect()
