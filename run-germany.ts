import { generateCountryGuide, validateCountryGuide } from './src/lib/generators/country-guide'
import * as fs from 'node:fs'

async function main() {
  console.log('Generating Germany guide via Claude Sonnet 4.6 + web_search...')
  const t0 = Date.now()
  const result = await generateCountryGuide({
    countryCode: 'DE',
    countryNameSq: 'Gjermani',
    countryNameEn: 'Germany',
    flag: '🇩🇪',
    maxSearches: 7,
  })
  const elapsed = Date.now() - t0
  console.log(`Elapsed: ${(elapsed / 1000).toFixed(1)}s`)
  console.log(`Tokens: ${result.usage.input_tokens} in, ${result.usage.output_tokens} out`)
  console.log(`Web searches: ${result.usage.web_search_requests ?? 'unknown'}`)

  const errors = validateCountryGuide(result.guide)
  if (errors.length) {
    console.log('\n--- VALIDATION ERRORS ---')
    errors.forEach((e) => console.log('  - ' + e))
  } else {
    console.log('\n✓ Validation passed')
  }

  console.log(`\n--- Summary ---`)
  console.log(`country: ${result.guide.country} (${result.guide.flag})`)
  console.log(`requiredDocs: ${result.guide.requiredDocs?.length}`)
  console.log(`certifications: ${result.guide.certifications?.length}`)
  console.log(`labeling.rules: ${result.guide.labeling?.rules?.length}`)
  console.log(`sectorRules: ${result.guide.sectorRules?.length} sectors`)
  console.log(`tradeAgreements: ${result.guide.tradeAgreements?.length}`)
  console.log(`contacts: ${result.guide.contacts?.length}`)
  console.log(`citations: ${result.guide.citations?.length}`)

  fs.writeFileSync('/tmp/germany-guide.json', JSON.stringify(result.guide, null, 2))
  console.log('\nFull guide JSON saved to /tmp/germany-guide.json')

  // Spot-check 3 entries to print
  console.log('\n--- Spot-check: first 3 requiredDocs ---')
  for (const d of result.guide.requiredDocs.slice(0, 3)) {
    console.log(`  ${d.mandatory ? '[M]' : '[O]'} ${d.name?.sq} / ${d.name?.en}`)
    console.log(`      → ${d.sourceUrl}`)
  }
  console.log('\n--- Spot-check: first 3 certifications ---')
  for (const c of result.guide.certifications.slice(0, 3)) {
    console.log(`  ${c.mandatory ? '[M]' : '[O]'} ${c.name} (applies to: ${c.appliesTo?.join(', ')})`)
    console.log(`      → ${c.sourceUrl}`)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
