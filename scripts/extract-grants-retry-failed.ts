/**
 * Retry only the grants that failed or returned null deadline in /tmp/grants-extracted.json.
 * Merges new results back into the same file.
 */
import 'dotenv/config'
import {
  extractFromPdf,
  extractFromHtmlPage,
  fetchTextTolerant,
  deadlineToDate,
  type ExtractedGrantFields,
} from '../src/lib/extractors/claude-pdf'
import * as fs from 'node:fs'

const REPORT_PATH = '/tmp/grants-extracted.json'
const NOISE = [/flamuri/i, /logo/i, /banner/i, /stema/i]

interface Result {
  id: string; title: string; provider: string; url: string | null
  pdfUrl: string | null; extracted: ExtractedGrantFields | null
  error?: string; isActiveDecision: boolean; daysLeft: number | null
}

async function findPdfUrl(pageUrl: string): Promise<string | null> {
  if (pageUrl.toLowerCase().endsWith('.pdf')) return pageUrl
  try {
    const html = await fetchTextTolerant(pageUrl)
    const matches = [...html.matchAll(/href="([^"]*\.pdf)"/gi)].map(m => m[1])
    const real = matches.find(m => !NOISE.some(p => p.test(m)))
    if (!real) return null
    return real.startsWith('http') ? real : new URL(real, pageUrl).toString()
  } catch { return null }
}

async function processOne(r: Result): Promise<void> {
  if (!r.url) { r.error = 'no url'; return }
  try {
    delete r.error
    const pdf = await findPdfUrl(r.url)
    r.pdfUrl = pdf
    let extracted: ExtractedGrantFields
    if (pdf) {
      extracted = await extractFromPdf({ pdfUrl: pdf, context: `Grant call from ${r.provider}.` })
    } else {
      extracted = await extractFromHtmlPage({ pageUrl: r.url, context: `Grant call from ${r.provider}.` })
    }
    r.extracted = extracted
    const dl = deadlineToDate(extracted.deadline)
    r.daysLeft = dl ? Math.round((dl.getTime() - Date.now()) / 86400000) : null
    r.isActiveDecision = r.daysLeft !== null && r.daysLeft >= 0
  } catch (e) {
    r.error = (e as Error).message.slice(0, 120)
  }
}

async function main(): Promise<void> {
  const results: Result[] = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'))
  const targets = results.filter(r => r.error || (r.extracted && !r.extracted.deadline))
  console.log(`\nRetrying ${targets.length} grants (failed or null-deadline)\n`)
  let i = 0
  for (const r of targets) {
    i++
    process.stdout.write(`[${i}/${targets.length}] ${r.provider.slice(0, 25).padEnd(25)} ${r.title.slice(0, 50)}...  `)
    await processOne(r)
    if (r.error) console.log(`STILL FAIL: ${r.error}`)
    else console.log(`deadline=${r.extracted?.deadline ?? 'null'} conf=${r.extracted?.confidence} ${r.isActiveDecision ? 'ACTIVE' : 'EXPIRED/UNKNOWN'}`)
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2))
  const active = results.filter(r => r.isActiveDecision).length
  const expired = results.filter(r => r.extracted?.deadline && !r.isActiveDecision).length
  const noDeadline = results.filter(r => r.extracted && !r.extracted.deadline).length
  const errors = results.filter(r => r.error).length
  console.log(`\n=== updated ${REPORT_PATH} ===`)
  console.log(`active:    ${active}\nexpired:   ${expired}\nno-dl:     ${noDeadline}\nerrors:    ${errors}`)
  console.log('\n=== ACTIVE (final) ===')
  for (const r of results.filter(x => x.isActiveDecision))
    console.log(`  [+${r.daysLeft}d]  ${r.extracted!.deadline}  ${r.title.slice(0, 80)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
