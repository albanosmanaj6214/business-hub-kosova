/**
 * Audit all isActive=true grants in DB:
 *   - fetch URL (page or PDF)
 *   - if page, find first linked PDF
 *   - parse PDF, extract latest date as candidate deadline
 *   - report: keep / expired / no-data
 * Does NOT write to DB. Pure read + analysis.
 */
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { fetchTolerant, fetchTextTolerant } from '../src/lib/extractors/claude-pdf'
import { PDFParse } from 'pdf-parse'

const DATE_RE = /\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})\b/g
const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

interface Report {
  id: string
  title: string
  provider: string
  url: string | null
  status: 'active' | 'expired' | 'no-pdf' | 'no-dates' | 'fetch-fail'
  deadline?: string
  daysLeft?: number
  notes?: string
  allDates?: string[]
}

function parseDate(d: number, m: number, y: number): Date | null {
  if (y < 100) y += 2000
  if (y < 2000 || y > 2030) return null
  if (m < 1 || m > 12) return null
  if (d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  return isNaN(dt.getTime()) ? null : dt
}

async function findPdfUrl(pageUrl: string): Promise<string | null> {
  if (pageUrl.toLowerCase().endsWith('.pdf')) return pageUrl
  try {
    const html = await fetchTextTolerant(pageUrl)
    const m = html.match(/href="([^"]*\.pdf)"/i)
    if (!m) return null
    return m[1].startsWith('http') ? m[1] : new URL(m[1], pageUrl).toString()
  } catch {
    return null
  }
}

async function extractDates(pdfUrl: string): Promise<Date[]> {
  const buf = await fetchTolerant(pdfUrl)
  const parser = new PDFParse({ data: buf })
  const result = await parser.getText()
  const txt = result.text
  const dates: Date[] = []
  for (const m of txt.matchAll(DATE_RE)) {
    const dt = parseDate(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]))
    if (dt) dates.push(dt)
  }
  return dates
}

async function audit(): Promise<Report[]> {
  const grants = await prisma.grant.findMany({
    where: { isActive: true },
    orderBy: [{ provider: 'asc' }, { title: 'asc' }],
  })
  const out: Report[] = []
  for (const g of grants) {
    const r: Report = { id: g.id, title: g.title.slice(0, 80), provider: g.provider, url: g.url, status: 'no-pdf' }
    if (!g.url) { r.notes = 'no url'; out.push(r); continue }
    try {
      const pdf = await findPdfUrl(g.url)
      if (!pdf) { r.status = 'no-pdf'; out.push(r); continue }
      const dates = await extractDates(pdf)
      if (dates.length === 0) { r.status = 'no-dates'; out.push(r); continue }
      const latest = dates.reduce((a, b) => (a > b ? a : b))
      r.allDates = [...new Set(dates.map(d => d.toISOString().slice(0, 10)))].sort()
      r.deadline = latest.toISOString().slice(0, 10)
      const days = Math.round((latest.getTime() - TODAY.getTime()) / 86400000)
      r.daysLeft = days
      r.status = days >= 0 ? 'active' : 'expired'
    } catch (e) {
      r.status = 'fetch-fail'
      r.notes = (e as Error).message.slice(0, 80)
    }
    out.push(r)
  }
  return out
}

audit().then(reports => {
  console.log(`\n=== ${reports.length} active grants in DB ===\n`)
  const byStatus: Record<string, Report[]> = {}
  for (const r of reports) (byStatus[r.status] ||= []).push(r)
  const order = ['active', 'expired', 'no-dates', 'no-pdf', 'fetch-fail']
  for (const s of order) {
    const list = byStatus[s] || []
    if (!list.length) continue
    console.log(`\n--- ${s.toUpperCase()} (${list.length}) ---`)
    for (const r of list) {
      const tail = r.deadline
        ? `→ ${r.deadline} (${r.daysLeft! >= 0 ? '+' : ''}${r.daysLeft}d)`
        : (r.notes ? `→ ${r.notes}` : '')
      console.log(`  [${r.id.slice(-6)}] ${r.provider.slice(0, 30).padEnd(30)} ${r.title.padEnd(70)} ${tail}`)
    }
  }
  console.log(`\n=== summary ===`)
  for (const s of order) {
    if (byStatus[s]?.length) console.log(`  ${s}: ${byStatus[s].length}`)
  }
  return prisma.$disconnect()
}).catch(e => { console.error(e); process.exit(1) })
