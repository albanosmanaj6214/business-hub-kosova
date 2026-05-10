import { fetchTolerant } from '../src/lib/extractors/claude-pdf'
import { PDFParse } from 'pdf-parse'

const URL = process.argv[2]
if (!URL) { console.error('need a URL'); process.exit(1) }

async function main() {
  const buf = await fetchTolerant(URL)
  console.log(`fetched ${buf.length} bytes`)
  const parser = new PDFParse({ data: buf })
  const result = await parser.getText()
  const txt = result.text
  console.log(`text length: ${txt.length}`)
  console.log('\n--- first 300 chars ---')
  console.log(txt.slice(0, 300))
  console.log('\n--- date-like patterns found ---')
  const patterns = [
    /afati[^.\n]{0,100}/gi,
    /deri\s+(?:m[eë]\s+)?(?:dat[eë]n?\s+)?\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}/gi,
    /\b\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}\b/g,
    /\b\d{1,2}\s+(janar|shkurt|mars|prill|maj|qershor|korrik|gusht|shtator|tetor|n[eë]ntor|dhjetor)\s+\d{4}/gi,
  ]
  for (const p of patterns) {
    const matches = [...txt.matchAll(p)].map(m => m[0]).slice(0, 8)
    if (matches.length) {
      console.log(`pattern ${p.source.slice(0, 50)}…  →`)
      matches.forEach(m => console.log(`  • ${m}`))
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
