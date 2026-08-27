/**
 * Auditim i plotë i burimeve në udhëzuesit e eksportit, mbi regjistrin e kuruar
 * të autoriteteve. Vetëm lexim — nuk shkruan asgjë në bazë.
 *
 *   npx tsx scripts/auditim-burimesh.ts            # përmbledhje
 *   npx tsx scripts/auditim-burimesh.ts --plot     # lista e plotë e problemeve
 *   npx tsx scripts/auditim-burimesh.ts --csv > /tmp/auditim.csv
 */
import { PrismaClient } from '@prisma/client'
import { assessClaim, canPublishAsMandatory, type AuthorityLevel } from '../src/lib/provenance/authorities'

const prisma = new PrismaClient()
const PLOT = process.argv.includes('--plot')
const CSV = process.argv.includes('--csv')

const BE = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'])
const EEA = new Set([...BE, 'NO', 'IS', 'LI'])

const FUSHAT = ['customs','requiredDocs','certifications','labeling','sectorRules','tradeAgreements'] as const

interface Rresht {
  vend: string; fusha: string; teksti: string; url: string | null; detyrues: boolean
  nivel: AuthorityLevel; nivelEfektiv: AuthorityLevel; autoriteti: string
  pershtatet: boolean; arsyeja?: string; shenim?: string
}

function tekstiI(o: any): string | null {
  const t = o?.rule ?? o?.name ?? o?.requirement ?? o?.title ?? o?.benefit
  if (!t) return null
  if (typeof t === 'string') return t
  return t.en || t.sq || t.de || null
}

function mbledh(o: any, vend: string, fusha: string, out: Rresht[]) {
  if (Array.isArray(o)) { o.forEach((v) => mbledh(v, vend, fusha, out)); return }
  if (!o || typeof o !== 'object') return
  const teksti = tekstiI(o)
  if (teksti) {
    const url: string | null = o.sourceUrl || o.source || null
    const detyrues = o.mandatory === true
    const euM = BE.has(vend) || EEA.has(vend)
    const a = assessClaim(url, vend, euM)
    out.push({ vend, fusha, teksti: String(teksti).replace(/\s+/g, ' ').slice(0, 90),
      url, detyrues, nivel: a.level, nivelEfektiv: a.effectiveLevel,
      autoriteti: a.authorityName, pershtatet: a.fitsJurisdiction, arsyeja: a.reason, shenim: a.note })
  }
  for (const v of Object.values(o)) if (v && typeof v === 'object') mbledh(v, vend, fusha, out)
}

async function main() {
  const gs = await prisma.exportGuide.findMany({
    where: { deletedAt: null },
    select: { countryCode: true, country: true, isPublished: true,
      customs: true, requiredDocs: true, certifications: true, labeling: true,
      sectorRules: true, tradeAgreements: true },
  })
  const rreshtat: Rresht[] = []
  for (const g of gs) {
    const vend = g.countryCode || '??'
    for (const f of FUSHAT) mbledh((g as any)[f], vend, f, rreshtat)
  }

  if (CSV) {
    console.log('﻿vendi,fusha,pretendimi,burimi,detyrues,nivel,nivel_efektiv,autoriteti,pershtatet_juridiksioni,arsyeja')
    for (const r of rreshtat) {
      const q = (s: any) => '"' + String(s ?? '').replace(/"/g, '""') + '"'
      console.log([r.vend, r.fusha, r.teksti, r.url, r.detyrues, r.nivel, r.nivelEfektiv,
        r.autoriteti, r.pershtatet, r.arsyeja || ''].map(q).join(','))
    }
    await prisma.$disconnect(); return
  }

  const n = (f: (r: Rresht) => boolean) => rreshtat.filter(f).length
  const detyruese = rreshtat.filter((r) => r.detyrues)

  console.log('╔══════════════════════════════════════════════════════════════════════════╗')
  console.log('║  AUDITIM I BURIMEVE — UDHËZUESIT E EKSPORTIT                             ║')
  console.log('╚══════════════════════════════════════════════════════════════════════════╝')
  console.log('Udhëzues: ' + gs.length + ' (të publikuar: ' + gs.filter((g) => g.isPublished).length + ')')
  console.log('Pretendime me tekst: ' + rreshtat.length + ' | të shënuara si të detyrueshme: ' + detyruese.length)

  console.log('\n── NIVELI I BURIMIT (para kontrollit të juridiksionit) ──')
  for (const L of ['A','B','C','D','FORBIDDEN','UNKNOWN'] as AuthorityLevel[]) {
    const c = n((r) => r.nivel === L)
    if (c) console.log('  ' + L.padEnd(10) + String(c).padStart(5) + '  (' + (c * 100 / rreshtat.length).toFixed(1) + '%)')
  }

  console.log('\n── NIVELI EFEKTIV (pasi kontrollohet nëse burimi vlen për atë vend) ──')
  for (const L of ['A','B','C','D','FORBIDDEN','UNKNOWN'] as AuthorityLevel[]) {
    const c = n((r) => r.nivelEfektiv === L)
    if (c) console.log('  ' + L.padEnd(10) + String(c).padStart(5) + '  (' + (c * 100 / rreshtat.length).toFixed(1) + '%)')
  }

  const ulur = rreshtat.filter((r) => r.nivel === 'A' && r.nivelEfektiv !== 'A')
  console.log('\n── PRETENDIME ME BURIM ZYRTAR, POR TË GABUAR PËR ATË JURIDIKSION: ' + ulur.length + ' ──')
  const perDomen: Record<string, number> = {}
  for (const r of ulur) { const h = new URL(r.url!).hostname.replace(/^www\./, ''); perDomen[h] = (perDomen[h] || 0) + 1 }
  for (const [h, c] of Object.entries(perDomen).sort((a, b) => b[1] - a[1]).slice(0, 12))
    console.log('  ' + String(c).padStart(5) + '  ' + h)

  console.log('\n── RREGULLA TË SHËNUARA SI TË DETYRUESHME QË NUK KALOJNË PRAGUN ──')
  const keq = detyruese.filter((r) => !canPublishAsMandatory(r.nivelEfektiv))
  console.log('  ' + keq.length + ' nga ' + detyruese.length + ' ('
    + (keq.length * 100 / detyruese.length).toFixed(1) + '%) nuk kanë burim parësor për juridiksionin e vet.')
  const perVend: Record<string, { keq: number; tot: number }> = {}
  for (const r of detyruese) {
    perVend[r.vend] = perVend[r.vend] || { keq: 0, tot: 0 }
    perVend[r.vend].tot++
    if (!canPublishAsMandatory(r.nivelEfektiv)) perVend[r.vend].keq++
  }
  console.log('\n  Vendet më të prekura:')
  for (const [v, s] of Object.entries(perVend).sort((a, b) => b[1].keq - a[1].keq).slice(0, 15))
    console.log('    ' + v.padEnd(4) + String(s.keq).padStart(4) + ' / ' + String(s.tot).padStart(3)
      + '   ' + '█'.repeat(Math.round(s.keq / 2)))

  const ndaluar = rreshtat.filter((r) => r.nivel === 'FORBIDDEN')
  console.log('\n── BURIME TË NDALUARA NGA PROTOKOLLI: ' + ndaluar.length + ' ──')
  for (const r of ndaluar) console.log('  [' + r.vend + '/' + r.fusha + '] ' + r.teksti.slice(0, 58) + '  ← ' + r.autoriteti)

  const paBurim = rreshtat.filter((r) => !r.url)
  console.log('\n── PA ASNJË BURIM: ' + paBurim.length + ' (prej tyre të detyrueshme: '
    + paBurim.filter((r) => r.detyrues).length + ') ──')

  const paklas = rreshtat.filter((r) => r.nivel === 'UNKNOWN' && r.url)
  const hosts: Record<string, number> = {}
  for (const r of paklas) { const h = new URL(r.url!).hostname.replace(/^www\./, ''); hosts[h] = (hosts[h] || 0) + 1 }
  console.log('\n── DOMENE TË PAKLASIFIKUARA NË REGJISTËR: ' + Object.keys(hosts).length
    + ' domene, ' + paklas.length + ' referenca ──')
  for (const [h, c] of Object.entries(hosts).sort((a, b) => b[1] - a[1]).slice(0, 20))
    console.log('  ' + String(c).padStart(4) + '  ' + h)

  if (PLOT) {
    console.log('\n╔═══ LISTA E PLOTË E RREGULLAVE TË DETYRUESHME PA BURIM PARËSOR ═══╗')
    for (const r of keq) {
      console.log('[' + r.vend + '/' + r.fusha + '] ' + r.teksti)
      console.log('   burimi: ' + (r.url || 'ASNJË') + '  → ' + r.nivel + '/' + r.nivelEfektiv)
      if (r.arsyeja) console.log('   arsyeja: ' + r.arsyeja)
      if (r.shenim) console.log('   shënim : ' + r.shenim)
    }
  }
  await prisma.$disconnect()
}
main()
