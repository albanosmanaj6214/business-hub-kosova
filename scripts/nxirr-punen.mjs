import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
const p = new PrismaClient()
const gs = await p.exportGuide.findMany({ where: { deletedAt: null },
  select: { countryCode:true, country:true, customs:true, requiredDocs:true, certifications:true,
            labeling:true, sectorRules:true, tradeAgreements:true } })

const NDALUAR = /(wikipedia\.org|privacyshield\.gov|bgfashion\.net|vercel\.app|legacy\.export\.gov|^export\.gov)/i
const DOBET = /(ruleandlaw|bens-consulting|dutydecoder|gistnet|invoicedataextraction|deepbeez|chemlinked|internationalshippingusa|ripplellc|legalmetrologyindia|manufacturingsafety|franzosini|compliancegate|aramex|fedex|middleeastbriefing|china-briefing|india-briefing|visahq|corpenza|averydennison|taobe|freightamigo|ukcalculator|digicomply|growrk|tradecouncil|customssupport|ashbury|shipmondo|complir|gourmetpro|covue|tigerpug|iiiem|ficsi|gfi-india|uscisguide|foodsafety\.institute|wwbridge|certification-experts|certifiedcosmetics|measurlabs|product-certification|halalcertificationturkey|halalfoundation|santandertrade|taxsummaries\.pwc|kpmg\.com|avalara|marosavat|turkreach|ecommerce4all|morganshipping|export2gulf|carvo|vinciworks|instrktiv|nexreg|peko\.pl|lexology|polishtax|lloydsbanktrade|certifycomply)/i

const out = []
function shto(vend, vendEmri, fusha, rruga, o) {
  const t = o.rule ?? o.name ?? o.requirement ?? o.title ?? o.benefit
  if (!t) return
  const teksti = typeof t === 'string' ? t : (t.en || t.sq || '')
  const url = o.sourceUrl || o.source || null
  if (!url) return
  const klasa = NDALUAR.test(url) ? 'NDALUAR' : (DOBET.test(url) ? 'DOBET' : null)
  if (!klasa) return
  out.push({ vend, vendEmri, fusha, rruga, klasa, url,
    teksti: teksti.replace(/\s+/g,' '),
    tekstiSq: (typeof t === 'object' && t.sq) ? t.sq.replace(/\s+/g,' ') : null,
    detyrues: o.mandatory === true,
    formaTekstit: typeof t === 'string' ? 'varg' : 'dygjuhesh',
    fushaTekstit: ['rule','name','requirement','title','benefit'].find(k => k in o) })
}
for (const g of gs) {
  const v = g.countryCode, ve = g.country
  if (g.customs) shto(v, ve, 'customs', 'customs', { name:'Dogana/TVSH', ...g.customs })
  for (const d of (g.requiredDocs||[])) shto(v, ve, 'requiredDocs', 'requiredDocs[]', d)
  for (const c of (g.certifications||[])) shto(v, ve, 'certifications', 'certifications[]', c)
  for (const r of (g.labeling?.rules||[])) shto(v, ve, 'labeling', 'labeling.rules[]', r)
  for (const sg of (g.sectorRules||[])) for (const r of (sg.rules||[]))
    shto(v, ve, 'sectorRules', 'sectorRules[' + sg.sector + '].rules[]', r)
  for (const a of (g.tradeAgreements||[])) shto(v, ve, 'tradeAgreements', 'tradeAgreements[]', a)
}
writeFileSync('/tmp/puna.json', JSON.stringify(out, null, 1))
const nd = out.filter(x=>x.klasa==='NDALUAR')
console.log('GJITHSEJ: ' + out.length + '  (te ndaluara: ' + nd.length + ', te dobeta: ' + (out.length-nd.length) + ')')
console.log('te detyrueshme: ' + out.filter(x=>x.detyrues).length)
console.log('\n--- TE NDALUARA ---')
for (const x of nd) console.log('  [' + x.vend + '/' + x.fusha + '] ' + (x.detyrues?'DET ':'    ') + x.teksti.slice(0,62) + '  <- ' + new URL(x.url).hostname)
const perDom = {}
for (const x of out.filter(y=>y.klasa==='DOBET')) { const h=new URL(x.url).hostname.replace(/^www\./,''); perDom[h]=(perDom[h]||0)+1 }
console.log('\n--- TE DOBETA sipas domenit ---')
for (const [h,c] of Object.entries(perDom).sort((a,b)=>b[1]-a[1])) console.log('  ' + String(c).padStart(4) + '  ' + h)
await p.$disconnect()
