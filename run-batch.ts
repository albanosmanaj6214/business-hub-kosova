import { generateCountryGuide, persistCountryGuide, validateCountryGuide } from './src/lib/generators/country-guide'
import { prisma } from './src/lib/prisma'
import * as fs from 'node:fs'

interface Target {
  countryCode: string
  countryNameSq: string
  countryNameEn: string
  flag: string
}

const TARGETS: Target[] = [
  { countryCode: 'GB', countryNameSq: 'Mbretëria e Bashkuar', countryNameEn: 'United Kingdom', flag: '🇬🇧' },
  { countryCode: 'IT', countryNameSq: 'Itali', countryNameEn: 'Italy', flag: '🇮🇹' },
  { countryCode: 'AT', countryNameSq: 'Austri', countryNameEn: 'Austria', flag: '🇦🇹' },
  { countryCode: 'FR', countryNameSq: 'Francë', countryNameEn: 'France', flag: '🇫🇷' },
  { countryCode: 'NL', countryNameSq: 'Holandë', countryNameEn: 'Netherlands', flag: '🇳🇱' },
  { countryCode: 'TR', countryNameSq: 'Turqi', countryNameEn: 'Turkey', flag: '🇹🇷' },
  { countryCode: 'AL', countryNameSq: 'Shqipëri', countryNameEn: 'Albania', flag: '🇦🇱' },
  { countryCode: 'AE', countryNameSq: 'Emiratet e Bashkuara Arabe', countryNameEn: 'United Arab Emirates', flag: '🇦🇪' },
  { countryCode: 'SA', countryNameSq: 'Arabia Saudite', countryNameEn: 'Saudi Arabia', flag: '🇸🇦' },
]

const RAW_DIR = '/tmp/guides-raw'
fs.mkdirSync(RAW_DIR, { recursive: true })

async function runOne(t: Target): Promise<{ ok: boolean; ms: number; tokens?: any; id?: string; error?: string }> {
  const t0 = Date.now()
  console.log(`[${t.countryCode}] start (${t.flag} ${t.countryNameEn})`)
  try {
    const result = await generateCountryGuide(t)
    // Save raw JSON to disk first so we never lose successful generations
    fs.writeFileSync(`${RAW_DIR}/${t.countryCode}.json`, JSON.stringify(result.guide, null, 2))
    const errors = validateCountryGuide(result.guide)
    if (errors.length) console.warn(`[${t.countryCode}] validation warnings:`, errors.slice(0, 3))
    const persisted = await persistCountryGuide(prisma, result.guide)
    const elapsed = Date.now() - t0
    console.log(`[${t.countryCode}] OK ${persisted.created ? 'created' : 'updated'} ${(elapsed / 1000).toFixed(0)}s in=${result.usage.input_tokens} out=${result.usage.output_tokens}`)
    return { ok: true, ms: elapsed, tokens: result.usage, id: persisted.id }
  } catch (err) {
    const msg = (err as Error).message
    console.error(`[${t.countryCode}] FAIL ${((Date.now() - t0) / 1000).toFixed(0)}s — ${msg.slice(0, 200)}`)
    return { ok: false, ms: Date.now() - t0, error: msg }
  }
}

async function runBatch(items: Target[], concurrency: number) {
  const results: Array<Awaited<ReturnType<typeof runOne>>> = []
  // simple chunked parallelism
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)
    console.log(`\n--- batch ${Math.floor(i / concurrency) + 1}: ${chunk.map(c => c.countryCode).join(', ')} ---`)
    const r = await Promise.all(chunk.map(runOne))
    results.push(...r)
  }
  return results
}

async function main() {
  const t0 = Date.now()
  // Anthropic concurrent request limit is typically 4-5 on default tier; chunk by 4.
  const results = await runBatch(TARGETS, 4)
  const totalSec = ((Date.now() - t0) / 1000).toFixed(0)

  console.log('\n=== SUMMARY ===')
  let ok = 0, totalIn = 0, totalOut = 0
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const t = TARGETS[i]
    if (r.ok) {
      ok++
      totalIn += r.tokens?.input_tokens || 0
      totalOut += r.tokens?.output_tokens || 0
      console.log(`${t.flag} ${t.countryCode}: OK  ${(r.ms / 1000).toFixed(0)}s`)
    } else {
      console.log(`${t.flag} ${t.countryCode}: FAIL — ${r.error?.slice(0, 120)}`)
    }
  }
  const cost = (totalIn / 1_000_000) * 3 + (totalOut / 1_000_000) * 15
  console.log(`\n${ok}/${TARGETS.length} succeeded in ${totalSec}s`)
  console.log(`Tokens: ${totalIn} in / ${totalOut} out · approx $${cost.toFixed(2)} (excl. search fees)`)
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch((e) => { console.error(e); prisma.$disconnect().finally(() => process.exit(1)) })
