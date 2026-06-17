/**
 * One-shot batch: generate ALL missing country guides for Kosovo exporters.
 * Runs 4 in parallel to balance speed vs API rate limits.
 * Auto-publishes if Haiku output passes validateCountryGuide().
 *
 * Run:  node_modules/.bin/tsx --tsconfig tsconfig.json scripts/generate-missing-guides.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import {
  generateCountryGuide,
  persistCountryGuide,
  validateCountryGuide,
} from '@/lib/generators/country-guide'

const prisma = new PrismaClient()

interface Preset { code: string; sq: string; en: string; flag: string; region: string }

const PRESETS: Preset[] = [
  // CEFTA
  { code: 'AL', sq: 'Shqipëri', en: 'Albania', flag: '🇦🇱', region: 'cefta' },
  { code: 'MK', sq: 'Maqedonia e Veriut', en: 'North Macedonia', flag: '🇲🇰', region: 'cefta' },
  { code: 'ME', sq: 'Mali i Zi', en: 'Montenegro', flag: '🇲🇪', region: 'cefta' },
  { code: 'BA', sq: 'Bosnja dhe Hercegovina', en: 'Bosnia and Herzegovina', flag: '🇧🇦', region: 'cefta' },
  { code: 'RS', sq: 'Serbi', en: 'Serbia', flag: '🇷🇸', region: 'cefta' },
  { code: 'MD', sq: 'Moldavi', en: 'Moldova', flag: '🇲🇩', region: 'cefta' },
  // EU 27
  { code: 'DE', sq: 'Gjermani', en: 'Germany', flag: '🇩🇪', region: 'eu' },
  { code: 'AT', sq: 'Austri', en: 'Austria', flag: '🇦🇹', region: 'eu' },
  { code: 'IT', sq: 'Itali', en: 'Italy', flag: '🇮🇹', region: 'eu' },
  { code: 'FR', sq: 'Francë', en: 'France', flag: '🇫🇷', region: 'eu' },
  { code: 'NL', sq: 'Holandë', en: 'Netherlands', flag: '🇳🇱', region: 'eu' },
  { code: 'BE', sq: 'Belgjikë', en: 'Belgium', flag: '🇧🇪', region: 'eu' },
  { code: 'LU', sq: 'Luksemburg', en: 'Luxembourg', flag: '🇱🇺', region: 'eu' },
  { code: 'ES', sq: 'Spanjë', en: 'Spain', flag: '🇪🇸', region: 'eu' },
  { code: 'PT', sq: 'Portugali', en: 'Portugal', flag: '🇵🇹', region: 'eu' },
  { code: 'IE', sq: 'Irlandë', en: 'Ireland', flag: '🇮🇪', region: 'eu' },
  { code: 'GR', sq: 'Greqi', en: 'Greece', flag: '🇬🇷', region: 'eu' },
  { code: 'HR', sq: 'Kroaci', en: 'Croatia', flag: '🇭🇷', region: 'eu' },
  { code: 'SI', sq: 'Slloveni', en: 'Slovenia', flag: '🇸🇮', region: 'eu' },
  { code: 'PL', sq: 'Poloni', en: 'Poland', flag: '🇵🇱', region: 'eu' },
  { code: 'CZ', sq: 'Çeki', en: 'Czechia', flag: '🇨🇿', region: 'eu' },
  { code: 'SK', sq: 'Sllovaki', en: 'Slovakia', flag: '🇸🇰', region: 'eu' },
  { code: 'HU', sq: 'Hungari', en: 'Hungary', flag: '🇭🇺', region: 'eu' },
  { code: 'RO', sq: 'Rumani', en: 'Romania', flag: '🇷🇴', region: 'eu' },
  { code: 'BG', sq: 'Bullgari', en: 'Bulgaria', flag: '🇧🇬', region: 'eu' },
  { code: 'DK', sq: 'Danimarkë', en: 'Denmark', flag: '🇩🇰', region: 'eu' },
  { code: 'SE', sq: 'Suedi', en: 'Sweden', flag: '🇸🇪', region: 'eu' },
  { code: 'FI', sq: 'Finlandë', en: 'Finland', flag: '🇫🇮', region: 'eu' },
  { code: 'EE', sq: 'Estoni', en: 'Estonia', flag: '🇪🇪', region: 'eu' },
  { code: 'LV', sq: 'Letoni', en: 'Latvia', flag: '🇱🇻', region: 'eu' },
  { code: 'LT', sq: 'Lituani', en: 'Lithuania', flag: '🇱🇹', region: 'eu' },
  { code: 'MT', sq: 'Maltë', en: 'Malta', flag: '🇲🇹', region: 'eu' },
  { code: 'CY', sq: 'Qipro', en: 'Cyprus', flag: '🇨🇾', region: 'eu' },
  // EEA / diaspora
  { code: 'CH', sq: 'Zvicra', en: 'Switzerland', flag: '🇨🇭', region: 'eea' },
  { code: 'NO', sq: 'Norvegji', en: 'Norway', flag: '🇳🇴', region: 'eea' },
  { code: 'IS', sq: 'Islandë', en: 'Iceland', flag: '🇮🇸', region: 'eea' },
  { code: 'GB', sq: 'Mbretëria e Bashkuar', en: 'United Kingdom', flag: '🇬🇧', region: 'eea' },
  { code: 'US', sq: 'Shtetet e Bashkuara të Amerikës', en: 'United States of America', flag: '🇺🇸', region: 'eea' },
  { code: 'CA', sq: 'Kanada', en: 'Canada', flag: '🇨🇦', region: 'eea' },
  { code: 'AU', sq: 'Australi', en: 'Australia', flag: '🇦🇺', region: 'eea' },
  // MENA
  { code: 'TR', sq: 'Turqi', en: 'Turkey', flag: '🇹🇷', region: 'mena' },
  { code: 'AE', sq: 'Emiratet e Bashkuara Arabe', en: 'United Arab Emirates', flag: '🇦🇪', region: 'mena' },
  { code: 'SA', sq: 'Arabia Saudite', en: 'Saudi Arabia', flag: '🇸🇦', region: 'mena' },
  { code: 'QA', sq: 'Katar', en: 'Qatar', flag: '🇶🇦', region: 'mena' },
  { code: 'KW', sq: 'Kuvajt', en: 'Kuwait', flag: '🇰🇼', region: 'mena' },
  { code: 'EG', sq: 'Egjipt', en: 'Egypt', flag: '🇪🇬', region: 'mena' },
  { code: 'IL', sq: 'Izrael', en: 'Israel', flag: '🇮🇱', region: 'mena' },
  // Asia
  { code: 'CN', sq: 'Kinë', en: 'China', flag: '🇨🇳', region: 'asia' },
  { code: 'IN', sq: 'Indi', en: 'India', flag: '🇮🇳', region: 'asia' },
  { code: 'JP', sq: 'Japoni', en: 'Japan', flag: '🇯🇵', region: 'asia' },
  { code: 'KR', sq: 'Korea e Jugut', en: 'South Korea', flag: '🇰🇷', region: 'asia' },
  // SE Asia
  { code: 'SG', sq: 'Singapor', en: 'Singapore', flag: '🇸🇬', region: 'asia' },
  { code: 'VN', sq: 'Vietnam', en: 'Vietnam', flag: '🇻🇳', region: 'asia' },
  { code: 'TH', sq: 'Tajlandë', en: 'Thailand', flag: '🇹🇭', region: 'asia' },
  { code: 'ID', sq: 'Indonezi', en: 'Indonesia', flag: '🇮🇩', region: 'asia' },
  { code: 'MY', sq: 'Malajzi', en: 'Malaysia', flag: '🇲🇾', region: 'asia' },
  // Africa
  { code: 'ZA', sq: 'Afrika e Jugut', en: 'South Africa', flag: '🇿🇦', region: 'africa' },
  { code: 'GH', sq: 'Ganë', en: 'Ghana', flag: '🇬🇭', region: 'africa' },
  { code: 'NG', sq: 'Nigeri', en: 'Nigeria', flag: '🇳🇬', region: 'africa' },
  { code: 'MA', sq: 'Marok', en: 'Morocco', flag: '🇲🇦', region: 'africa' },
  { code: 'KE', sq: 'Kenia', en: 'Kenya', flag: '🇰🇪', region: 'africa' },
  // Americas (LatAm)
  { code: 'BR', sq: 'Brazil', en: 'Brazil', flag: '🇧🇷', region: 'latam' },
  { code: 'MX', sq: 'Meksikë', en: 'Mexico', flag: '🇲🇽', region: 'latam' },
  { code: 'AR', sq: 'Argjentinë', en: 'Argentina', flag: '🇦🇷', region: 'latam' },
  { code: 'CL', sq: 'Kili', en: 'Chile', flag: '🇨🇱', region: 'latam' },
  // Oceania
  { code: 'NZ', sq: 'Zelanda e Re', en: 'New Zealand', flag: '🇳🇿', region: 'oceania' },
]

const PARALLEL = 4   // 4 concurrent Haiku+web_search streams; gentle to rate limits

async function generateOne(p: Preset) {
  const start = Date.now()
  try {
    const result = await generateCountryGuide({
      countryCode: p.code,
      countryNameSq: p.sq,
      countryNameEn: p.en,
      flag: p.flag,
    })
    const errors = validateCountryGuide(result.guide)
    const persisted = await persistCountryGuide(prisma as any, result.guide)
    // Auto-publish if Haiku produced a valid structure
    if (errors.length === 0) {
      await prisma.exportGuide.update({
        where: { id: persisted.id },
        data: { isPublished: true, reviewedBy: 'auto-batch', reviewedAt: new Date() },
      })
    }
    const elapsed = Math.round((Date.now() - start) / 1000)
    console.log(
      `${p.flag} ${p.code.padEnd(3)} ${p.sq.padEnd(30)} ` +
      `${persisted.created ? 'CREATED' : 'updated'} ${elapsed}s ` +
      `in=${result.usage.input_tokens} out=${result.usage.output_tokens} ` +
      `web=${result.usage.web_search_requests ?? '?'} ` +
      `${errors.length === 0 ? 'published' : 'DRAFT (' + errors.length + ' errors)'}`
    )
  } catch (e: any) {
    const elapsed = Math.round((Date.now() - start) / 1000)
    console.log(`${p.flag} ${p.code.padEnd(3)} ${p.sq.padEnd(30)} FAILED ${elapsed}s — ${e.message?.slice(0, 100)}`)
  }
}

async function main() {
  const have = new Set((await prisma.exportGuide.findMany({
    where: { deletedAt: null },
    select: { countryCode: true },
  })).map((g) => g.countryCode))

  const missing = PRESETS.filter((p) => !have.has(p.code))
  console.log(`Existing: ${have.size}  |  To generate: ${missing.length}  |  Parallel: ${PARALLEL}`)
  console.log(`Estimated time: ~${Math.ceil(missing.length / PARALLEL * 8)} min`)
  console.log(`---`)

  // Run in batches of PARALLEL
  for (let i = 0; i < missing.length; i += PARALLEL) {
    const batch = missing.slice(i, i + PARALLEL)
    console.log(`\n# Batch ${Math.floor(i / PARALLEL) + 1}/${Math.ceil(missing.length / PARALLEL)}: ${batch.map((p) => p.code).join(' ')}`)
    await Promise.allSettled(batch.map(generateOne))
  }

  const final = await prisma.exportGuide.count({ where: { deletedAt: null } })
  console.log(`\n=== Done. Total guides in DB: ${final} ===`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
