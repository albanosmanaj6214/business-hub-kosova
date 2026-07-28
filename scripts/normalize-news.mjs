#!/usr/bin/env node
/*
 * One-time, reversible cleanup of encoded text in existing NewsItem records.
 *
 *   node scripts/normalize-news.mjs              # dry-run (default): no writes
 *   node scripts/normalize-news.mjs --apply      # writes a backup, then updates
 *   node scripts/normalize-news.mjs --revert <backup.json>   # restores originals
 *
 * The normalizer below MIRRORS src/lib/text/normalize.ts (a .mjs script cannot
 * import the TS module directly). It decodes named + numeric HTML entities,
 * strips invisible/replacement characters, and collapses whitespace. It never
 * turns text into HTML and never changes factual meaning.
 */
import { PrismaClient } from '@prisma/client'
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const NUMERIC_OVERRIDES = {
  160: ' ', 173: '', 8211: '-', 8212: '-', 8216: '‘', 8217: '’',
  8218: '‚', 8220: '"', 8221: '"', 8230: '...', 65279: '', 65533: '',
}
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ',
  thinsp: ' ', shy: '', hellip: '...', mdash: '-', ndash: '-', lsquo: '‘',
  rsquo: '’', sbquo: '‚', ldquo: '"', rdquo: '"', bdquo: '"', laquo: '«',
  raquo: '»', middot: '·', bull: '•', deg: '°', euro: '€',
  pound: '£', cent: '¢', copy: '©', reg: '®', trade: '™',
  times: '×', divide: '÷',
  euml: 'ë', Euml: 'Ë', ccedil: 'ç', Ccedil: 'Ç', eacute: 'é',
  Eacute: 'É', egrave: 'è', Egrave: 'È', agrave: 'à', Agrave: 'À',
  aacute: 'á', Aacute: 'Á', iacute: 'í', Iacute: 'Í', oacute: 'ó',
  Oacute: 'Ó', uacute: 'ú', Uacute: 'Ú', ouml: 'ö', Ouml: 'Ö',
  uuml: 'ü', Uuml: 'Ü', auml: 'ä', Auml: 'Ä', ntilde: 'ñ',
  Ntilde: 'Ñ', szlig: 'ß', scaron: 'š', Scaron: 'Š', zcaron: 'ž',
  Zcaron: 'Ž',
}
const INVISIBLE = new RegExp('[\\u200B-\\u200D\\uFEFF\\u00AD\\uFFFD]', 'g')
const CONTROL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]', 'g')

function decodeNumeric(code, hex) {
  const cp = parseInt(code, hex ? 16 : 10)
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return ''
  if (cp in NUMERIC_OVERRIDES) return NUMERIC_OVERRIDES[cp]
  try { return String.fromCodePoint(cp) } catch { return '' }
}
function decodeHtmlEntities(input) {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => decodeNumeric(h, true))
    .replace(/&#(\d+);/g, (_m, d) => decodeNumeric(d, false))
    .replace(/&([a-zA-Z][a-zA-Z0-9]{1,31});/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(NAMED, name) ? NAMED[name] : m)
}
function normalizeText(input) {
  if (input == null) return input
  let s = String(input)
  for (let i = 0; i < 3; i++) { const d = decodeHtmlEntities(s); if (d === s) break; s = d }
  s = s.replace(INVISIBLE, '').replace(CONTROL, '')
  return s.replace(/\s+/g, ' ').trim()
}

const FIELDS = ['title', 'titleSq', 'summary', 'body']
const prisma = new PrismaClient()

async function revert(file) {
  const backup = JSON.parse(readFileSync(file, 'utf8'))
  let n = 0
  for (const row of backup.records) {
    await prisma.newsItem.update({ where: { id: row.id }, data: row.original })
    n++
  }
  console.log(`Reverted ${n} records from ${file}`)
}

async function main() {
  const args = process.argv.slice(2)
  const revertIdx = args.indexOf('--revert')
  if (revertIdx !== -1) {
    const file = args[revertIdx + 1]
    if (!file) { console.error('Usage: --revert <backup.json>'); process.exit(1) }
    await revert(file)
    return
  }
  const apply = args.includes('--apply')

  const items = await prisma.newsItem.findMany({
    select: { id: true, title: true, titleSq: true, summary: true, body: true },
  })

  const changes = []
  for (const it of items) {
    const original = {}
    const next = {}
    let changed = false
    for (const f of FIELDS) {
      const cur = it[f]
      const norm = normalizeText(cur)
      if (typeof cur === 'string' && norm !== cur) {
        original[f] = cur
        next[f] = norm
        changed = true
      }
    }
    if (changed) changes.push({ id: it.id, original, next })
  }

  console.log(`Scanned ${items.length} NewsItem records. ${changes.length} would change.\n`)
  const sample = changes.slice(0, 8)
  for (const c of sample) {
    for (const f of Object.keys(c.next)) {
      console.log(`  [${c.id}] ${f}`)
      console.log(`    - ${JSON.stringify(c.original[f]).slice(0, 140)}`)
      console.log(`    + ${JSON.stringify(c.next[f]).slice(0, 140)}`)
    }
  }

  if (!apply) {
    console.log('\nDRY-RUN. No records were modified. Re-run with --apply to write (a backup is saved first).')
    return
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `scripts/backups/news-normalize-${stamp}.json`
  if (!existsSync(dirname(backupFile))) mkdirSync(dirname(backupFile), { recursive: true })
  writeFileSync(
    backupFile,
    JSON.stringify({ createdAt: stamp, records: changes.map((c) => ({ id: c.id, original: c.original })) }, null, 2),
  )
  console.log(`\nBackup written: ${backupFile}`)

  let updated = 0
  for (const c of changes) {
    await prisma.newsItem.update({ where: { id: c.id }, data: c.next })
    updated++
  }
  console.log(`Updated ${updated} records. Revert with: node scripts/normalize-news.mjs --revert ${backupFile}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
