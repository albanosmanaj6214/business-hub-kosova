import 'dotenv/config'
import {
  extractFromHtmlPage,
  extractFromPdf,
  fetchTextTolerant,
} from '../src/lib/extractors/claude-pdf'

const URL_TO_TEST = process.argv[2] || 'https://kiesa.rks-gov.net/Page.aspx?id=2,5,1099'

async function main() {
  console.log(`\n=== TEST: ${URL_TO_TEST} ===\n`)

  // 1. HTML page extraction
  console.log('--- HTML page extraction (Haiku 4.5) ---')
  try {
    const htmlResult = await extractFromHtmlPage({
      pageUrl: URL_TO_TEST,
      context: 'KIESA grant call page. Detailed terms may be in linked PDFs.',
    })
    console.log(JSON.stringify(htmlResult, null, 2))
  } catch (err) {
    console.error('HTML extract failed:', (err as Error).message)
  }

  // 2. Find first PDF and try PDF extraction
  console.log('\n--- searching for first PDF link on page ---')
  const html = await fetchTextTolerant(URL_TO_TEST)
  const m = html.match(/href="([^"]*\.pdf)"/i)
  if (!m) {
    console.log('no PDF link found on page')
    return
  }
  const pdfHref = m[1].startsWith('http') ? m[1] : new URL(m[1], URL_TO_TEST).toString()
  console.log(`first PDF: ${pdfHref}`)

  console.log('\n--- PDF extraction (Haiku 4.5) ---')
  try {
    const pdfResult = await extractFromPdf({ pdfUrl: pdfHref, context: 'Linked from KIESA call page.' })
    console.log(JSON.stringify(pdfResult, null, 2))
  } catch (err) {
    console.error('PDF extract failed:', (err as Error).message)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
