/**
 * Generate one country export guide via Claude Sonnet + web_search.
 * Usage:
 *   pnpm tsx scripts/generate-guide.ts <ISO2> "<Albanian name>" "<English name>" "<flag>"
 *
 * Example:
 *   pnpm tsx scripts/generate-guide.ts SE "Suedi" "Sweden" "🇸🇪"
 *
 * Cost: ~€0.50–1.50 per guide. Time: 5–10 minutes (web_search + 16k+ output).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import {
  generateCountryGuide,
  validateCountryGuide,
  persistCountryGuide,
} from '../src/lib/generators/country-guide'

const [, , code, nameSq, nameEn, flag] = process.argv

if (!code || !nameSq || !nameEn || !flag) {
  console.error('Usage: pnpm tsx scripts/generate-guide.ts <ISO2> "<sq>" "<en>" "<flag>"')
  process.exit(1)
}

if (code.length !== 2) {
  console.error(`countryCode must be ISO-2 (got "${code}")`)
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const start = Date.now()
  console.log(`▶ Generating guide for ${flag} ${nameSq} (${code.toUpperCase()})…`)
  console.log(`  Model: claude-haiku-4-5 + web_search. ETA 3–5 min.\n`)

  const result = await generateCountryGuide({
    countryCode: code.toUpperCase(),
    countryNameSq: nameSq,
    countryNameEn: nameEn,
    flag,
  })

  const errors = validateCountryGuide(result.guide)
  if (errors.length) {
    console.warn(`⚠ Validation warnings (${errors.length}):`)
    for (const e of errors) console.warn(`  • ${e}`)
  }

  const persisted = await persistCountryGuide(prisma, result.guide)
  const dur = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\n✓ Saved as ExportGuide id=${persisted.id} in ${dur}s.`)
  const g: any = result.guide
  const titleSq = typeof g.title === 'string' ? g.title : g.title?.sq
  console.log(`  Title: ${titleSq ?? '(missing)'}`)
  console.log(`  Sections: customs=${(g.customs ?? []).length} certs=${(g.certifications ?? []).length} contacts=${(g.contacts ?? []).length}`)
}

main()
  .catch((e) => {
    console.error('✗ Generation failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
