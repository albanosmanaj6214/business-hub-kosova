// Convert a KIESA detail HTML page to BLOCK-structured plain text: block-level elements
// become newline-separated lines so the chunker can treat paragraphs/list items/table
// rows as separate scan units (the parser's collapsed bodyText loses this structure).
import * as cheerio from 'cheerio'

export function htmlToBlockText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, nav, header, footer').remove()
  // Insert newlines at block boundaries and <br>.
  $('br').replaceWith('\n')
  $('p, div, li, tr, h1, h2, h3, h4, h5, h6').each((_, el) => {
    $(el).append('\n')
  })
  // Table cells within a row separated by " | " to preserve label|value adjacency.
  $('td, th').each((_, el) => { $(el).append(' | ') })
  const root = $('.content-inner').first()
  const text = (root.length ? root.text() : $('body').text())
  return text
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').replace(/\s*\|\s*$/,'').trim())
    .filter(Boolean)
    .join('\n')
}
