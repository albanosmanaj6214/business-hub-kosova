import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './src/lib/prisma'

const client = new Anthropic({ timeout: 10 * 60 * 1000, maxRetries: 1 })
const MODEL = 'claude-sonnet-4-6'

interface VerifyResult {
  fairId: string
  name: string
  storedStart: string
  storedEnd: string
  storedWebsite: string
  verifiedStart: string | null
  verifiedEnd: string | null
  verifiedWebsite: string | null
  status: 'match' | 'date_diff' | 'site_diff' | 'unverified' | 'error'
  notes: string
}

const PROMPT_TEMPLATE = (name: string, location: string, website: string) =>
  `Use web_search to verify the OFFICIAL dates for the trade fair "${name}" in ${location}.
Visit the organizer's website (${website} is the URL we have on file — confirm or correct it).

Return STRICT JSON exactly:
{
  "verifiedStart": "YYYY-MM-DD" | null,
  "verifiedEnd": "YYYY-MM-DD" | null,
  "verifiedWebsite": "<canonical organizer URL>" | null,
  "notes": "<one sentence: which page on the organizer's site you used; if no upcoming edition is published, say so>"
}

Only output the JSON object. No markdown fences. Use null if you cannot find an authoritative answer.`

async function verifyOne(fair: any): Promise<VerifyResult> {
  const stored = {
    start: new Date(fair.startDate).toISOString().slice(0, 10),
    end: new Date(fair.endDate).toISOString().slice(0, 10),
    website: fair.website,
  }
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 800,
      tools: [{ type: 'web_search_20250305' as any, name: 'web_search', max_uses: 3 } as any],
      messages: [{ role: 'user', content: PROMPT_TEMPLATE(fair.name, fair.location, fair.website) }],
    })
    const resp = await stream.finalMessage()
    const text = resp.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('No JSON in response')
    const parsed = JSON.parse(m[0])

    const sameStart = parsed.verifiedStart === stored.start
    const sameEnd = parsed.verifiedEnd === stored.end
    const sameSite = !parsed.verifiedWebsite || parsed.verifiedWebsite.includes(new URL(fair.website).hostname.replace(/^www\./, ''))

    let status: VerifyResult['status']
    if (!parsed.verifiedStart || !parsed.verifiedEnd) status = 'unverified'
    else if (!sameStart || !sameEnd) status = 'date_diff'
    else if (!sameSite) status = 'site_diff'
    else status = 'match'

    return {
      fairId: fair.id, name: fair.name,
      storedStart: stored.start, storedEnd: stored.end, storedWebsite: stored.website,
      verifiedStart: parsed.verifiedStart, verifiedEnd: parsed.verifiedEnd, verifiedWebsite: parsed.verifiedWebsite,
      status, notes: parsed.notes ?? '',
    }
  } catch (err: any) {
    return {
      fairId: fair.id, name: fair.name,
      storedStart: stored.start, storedEnd: stored.end, storedWebsite: stored.website,
      verifiedStart: null, verifiedEnd: null, verifiedWebsite: null,
      status: 'error', notes: (err.message || String(err)).slice(0, 200),
    }
  }
}

async function main() {
  const fairs = await prisma.tradeFair.findMany({ where: { isActive: true }, orderBy: { startDate: 'asc' } })
  console.log(`Verifying ${fairs.length} trade fairs against organizer sites...\n`)
  const results: VerifyResult[] = []
  // 3 at a time to stay under tokens-per-minute limit
  for (let i = 0; i < fairs.length; i += 3) {
    const chunk = fairs.slice(i, i + 3)
    process.stdout.write(`batch ${Math.floor(i / 3) + 1}: ${chunk.map(c => c.name.slice(0, 20)).join(', ')}... `)
    const r = await Promise.all(chunk.map(verifyOne))
    results.push(...r)
    process.stdout.write(`done\n`)
  }

  const groups: Record<string, VerifyResult[]> = { match: [], date_diff: [], site_diff: [], unverified: [], error: [] }
  for (const r of results) groups[r.status].push(r)

  console.log(`\n=== SUMMARY ===`)
  console.log(`✓ exact match:   ${groups.match.length}`)
  console.log(`⚠ date diff:     ${groups.date_diff.length}`)
  console.log(`⚠ site diff:     ${groups.site_diff.length}`)
  console.log(`? unverified:    ${groups.unverified.length}`)
  console.log(`✗ error:         ${groups.error.length}`)

  for (const [g, label] of [['date_diff', 'DATE DISCREPANCIES'], ['site_diff', 'WEBSITE DISCREPANCIES'], ['unverified', 'UNVERIFIED'], ['error', 'ERRORS']] as const) {
    if (groups[g].length === 0) continue
    console.log(`\n--- ${label} ---`)
    for (const r of groups[g]) {
      console.log(`\n• ${r.name}`)
      console.log(`  stored:   ${r.storedStart} → ${r.storedEnd}  (${r.storedWebsite})`)
      console.log(`  verified: ${r.verifiedStart ?? '?'} → ${r.verifiedEnd ?? '?'}  (${r.verifiedWebsite ?? '?'})`)
      console.log(`  notes: ${r.notes}`)
    }
  }
  if (groups.match.length > 0) {
    console.log(`\n--- MATCHES ---`)
    for (const r of groups.match) {
      console.log(`  ✓ ${r.name}: ${r.storedStart} → ${r.storedEnd}`)
    }
  }

  // Write JSON for downstream fixing
  const fs = await import('node:fs')
  fs.writeFileSync('/tmp/fair-verify.json', JSON.stringify(results, null, 2))
  console.log(`\nDetails saved to /tmp/fair-verify.json`)
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch((e) => { console.error(e); prisma.$disconnect().finally(() => process.exit(1)) })
