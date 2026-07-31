// Shared text-normalization utility (Phase 1).
//
// Decodes named + numeric HTML entities, removes unsafe invisible characters
// (zero-width spaces, BOM, soft hyphen, replacement char), and collapses
// whitespace. It NEVER converts trusted plain text into HTML and never alters
// factual meaning: it only turns already-escaped or corrupted text back into
// the plain Unicode a human would read.
//
// Dash and quote normalization matches the pre-existing convention in the news
// scraper (em/en dashes -> "-", curly quotes preserved) so behavior is stable.

// Codepoints we normalize deliberately rather than emit verbatim.
const NUMERIC_OVERRIDES: Record<number, string> = {
  160: ' ', // non-breaking space -> normal space (collapsed later)
  173: '', // soft hyphen -> drop
  8211: '-', // en dash
  8212: '-', // em dash
  8216: '‘', // left single quote
  8217: '’', // right single quote / apostrophe
  8218: '‚',
  8220: '"', // left double quote -> straight
  8221: '"', // right double quote -> straight
  8230: '...', // horizontal ellipsis
  65279: '', // BOM
  65533: '', // replacement char
}

// Named entities. Case matters for the accented letters (euml vs Euml), so we
// list both cases explicitly. ASCII/punctuation names are lowercase.
const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', ensp: ' ', emsp: ' ', thinsp: ' ', shy: '',
  hellip: '...', mdash: '-', ndash: '-',
  lsquo: '‘', rsquo: '’', sbquo: '‚',
  ldquo: '"', rdquo: '"', bdquo: '"',
  laquo: '«', raquo: '»', middot: '·', bull: '•',
  deg: '°', euro: '€', pound: '£', cent: '¢',
  copy: '©', reg: '®', trade: '™', times: '×', divide: '÷',
  // Latin accented letters common in Albanian / regional sources.
  euml: 'ë', Euml: 'Ë', ccedil: 'ç', Ccedil: 'Ç',
  eacute: 'é', Eacute: 'É', egrave: 'è', Egrave: 'È',
  agrave: 'à', Agrave: 'À', aacute: 'á', Aacute: 'Á',
  iacute: 'í', Iacute: 'Í', oacute: 'ó', Oacute: 'Ó',
  uacute: 'ú', Uacute: 'Ú', ouml: 'ö', Ouml: 'Ö',
  uuml: 'ü', Uuml: 'Ü', auml: 'ä', Auml: 'Ä',
  ntilde: 'ñ', Ntilde: 'Ñ', szlig: 'ß',
  scaron: 'š', Scaron: 'Š', zcaron: 'ž', Zcaron: 'Ž',
}

function decodeNumeric(code: string, hex: boolean): string {
  const cp = parseInt(code, hex ? 16 : 10)
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return ''
  if (cp in NUMERIC_OVERRIDES) return NUMERIC_OVERRIDES[cp]
  try {
    return String.fromCodePoint(cp)
  } catch {
    return ''
  }
}

/** Decode HTML entities (named + numeric). Unknown named entities are left as-is. */
export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => decodeNumeric(h, true))
    .replace(/&#(\d+);/g, (_m, d) => decodeNumeric(d, false))
    .replace(/&([a-zA-Z][a-zA-Z0-9]{1,31});/g, (m, name: string) =>
      Object.prototype.hasOwnProperty.call(NAMED, name) ? NAMED[name] : m,
    )
}

// Zero-width space/joiners, BOM, soft hyphen, replacement char. Built from an
// ASCII-only source string so no invisible characters live in this file.
const INVISIBLE = new RegExp('[\\u200B-\\u200D\\uFEFF\\u00AD\\uFFFD]', 'g')
// C0 control chars except tab/newline/carriage-return (whitespace-collapse handles those).
const CONTROL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]', 'g')

/**
 * Normalize a piece of user-visible text:
 * decode entities (including one level of double-encoding like `&amp;euml;`),
 * strip invisible/control characters, collapse whitespace, and trim.
 * Returns the input unchanged when it is null/undefined.
 */
export function normalizeText<T extends string | null | undefined>(input: T): T {
  if (input == null) return input
  let s = String(input)
  for (let i = 0; i < 3; i++) {
    const decoded = decodeHtmlEntities(s)
    if (decoded === s) break
    s = decoded
  }
  s = s.replace(INVISIBLE, '').replace(CONTROL, '')
  s = s.replace(/\s+/g, ' ').trim()
  return s as T
}
