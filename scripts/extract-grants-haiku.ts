/**
 * Extract structured fields for ALL active grants using Claude Haiku 4.5.
 * Mode 1 (default): --report → writes results to /tmp/grants-extracted.json, NO DB writes
 * Mode 2:           --apply  → reads /tmp/grants-extracted.json, applies to DB
 *
 * Rational usage: one Haiku call per grant, no retries on schema fail.
 * Estimated cost for 24 grants: ~$0.10-0.20.
 */
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import {
  extractFromPdf,
  extractFromHtmlPage,
  fetchTextTolerant,
  deadlineToDate,
  type ExtractedGrantFields,
} from '../src/lib/extractors/claude-pdf'
import * as fs from 'node:fs'

const REPORT_PATH = '/tmp/grants-extracted.json'

interface Result {
  id: string
  title: string
  provider: string
  url: string | null
  pdfUrl: string | null
  extracted: ExtractedGrantFields | null
  error?: string
  isActiveDecision: boolean
  daysLeft: number | null
}

const NOISE_PDF_PATTERNS = [/flamuri/i, /logo/i, /banner/i, /header/i, /stema/i]

function isNoisePdf(href: string): boolean {
  return NOISE_PDF_PATTERNS.some(p => p.test(href))
}

async function findPdfUrl(pageUrl: string): Promise<string | null> {
  if (pageUrl.toLowerCase().endsWith('.pdf')) return pageUrl
  try {
    const html = await fetchTextTolerant(pageUrl)
    const matches = [...html.matchAll(/href="([^"]*\.pdf)"/gi)].map(m => m[1])
    const real = matches.find(m => !isNoisePdf(m))
    if (!real) return null
    return real.startsWith('http') ? real : new URL(real, pageUrl).toString()
  } catch {
    return null
  }
}

async function report(): Promise<void> {
  const grants = await prisma.grant.findMany({
    where: { isActive: true },
    orderBy: [{ provider: 'asc' }, { title: 'asc' }],
  })
  console.log(`\nProcessing ${grants.length} active grants with Haiku 4.5\n`)

  const results: Result[] = []
  let i = 0
  for (const g of grants) {
    i++
    process.stdout.write(`[${i}/${grants.length}] ${g.provider.slice(0, 25).padEnd(25)} ${g.title.slice(0, 50)}...  `)
    const r: Result = {
      id: g.id, title: g.title, provider: g.provider, url: g.url,
      pdfUrl: null, extracted: null, isActiveDecision: false, daysLeft: null,
    }
    if (!g.url) {
      r.error = 'no url'
      console.log('SKIP no url')
      results.push(r); continue
    }
    try {
      const pdf = await findPdfUrl(g.url)
      r.pdfUrl = pdf
      let extracted: ExtractedGrantFields
      if (pdf) {
        extracted = await extractFromPdf({ pdfUrl: pdf, context: `Grant call from ${g.provider}.` })
      } else {
        extracted = await extractFromHtmlPage({ pageUrl: g.url, context: `Grant call from ${g.provider}.` })
      }
      r.extracted = extracted
      const dl = deadlineToDate(extracted.deadline)
      if (dl) {
        const days = Math.round((dl.getTime() - Date.now()) / 86400000)
        r.daysLeft = days
        r.isActiveDecision = days >= 0
      }
      console.log(`deadline=${extracted.deadline ?? 'null'} conf=${extracted.confidence} ${r.isActiveDecision ? 'ACTIVE' : 'EXPIRED/UNKNOWN'}`)
    } catch (e) {
      r.error = (e as Error).message.slice(0, 120)
      console.log(`FAIL ${r.error}`)
    }
    results.push(r)
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2))
  console.log(`\n\n=== Saved to ${REPORT_PATH} ===\n`)

  const activeCount = results.filter(r => r.isActiveDecision).length
  const expiredCount = results.filter(r => r.extracted && !r.isActiveDecision).length
  const errCount = results.filter(r => r.error).length
  const noDeadlineCount = results.filter(r => r.extracted && !r.extracted.deadline).length
  console.log(`active (deadline >= today):  ${activeCount}`)
  console.log(`expired (deadline in past):  ${expiredCount}`)
  console.log(`no-deadline (kept active):    ${noDeadlineCount}`)
  console.log(`errors:                       ${errCount}`)

  console.log('\n=== ACTIVE GRANTS (would stay isActive=true) ===')
  for (const r of results.filter(x => x.isActiveDecision)) {
    console.log(`  [${r.daysLeft! >= 0 ? '+' : ''}${r.daysLeft}d] ${r.extracted!.deadline}  ${r.title.slice(0, 80)}`)
  }
  console.log('\n=== EXPIRED GRANTS (would become isActive=false) ===')
  for (const r of results.filter(x => x.extracted && !x.isActiveDecision && x.extracted.deadline)) {
    console.log(`  [${r.daysLeft}d ago] ${r.extracted!.deadline}  ${r.title.slice(0, 80)}`)
  }
}

async function apply(): Promise<void> {
  if (!fs.existsSync(REPORT_PATH)) throw new Error(`No report file at ${REPORT_PATH}. Run --report first.`)
  const results: Result[] = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'))
  console.log(`Applying ${results.length} extractions to DB\n`)
  let updated = 0, expired = 0, skipped = 0
  for (const r of results) {
    if (!r.extracted) { skipped++; continue }
    const data: any = {}
    const e = r.extracted
    const dl = deadlineToDate(e.deadline)
    if (dl) data.deadline = dl
    if (e.summary) data.descriptionSq = e.summary
    if (e.eligibility) data.eligibility = e.eligibility
    if (e.sectors?.length) data.sectors = e.sectors
    if (e.amountMin !== null || e.amountMax !== null) {
      const min = e.amountMin, max = e.amountMax
      data.amount = (min && max && min !== max) ? `€${min.toLocaleString()}–€${max.toLocaleString()}` :
                    min ? `€${min.toLocaleString()}` :
                    max ? `€${max.toLocaleString()}` : undefined
      if (!data.amount) delete data.amount
    }
    if (dl && dl.getTime() < Date.now()) { data.isActive = false; expired++ }
    if (Object.keys(data).length === 0) { skipped++; continue }
    await prisma.grant.update({ where: { id: r.id }, data })
    updated++
  }
  console.log(`updated:    ${updated}`)
  console.log(`expired:    ${expired}`)
  console.log(`skipped:    ${skipped}`)
}

const mode = process.argv[2] || '--report'
;(mode === '--apply' ? apply() : report())
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
