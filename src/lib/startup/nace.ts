// Kode aktivitetesh NACE Rev.2 (seed minimal i verifikuar). Lista e plotë zyrtare
// e ARBK (https://arbk.rks-gov.net/Page/24) merret në Fazën 1c. Pa kode të sajuara.

export interface NaceCode {
  code: string
  name: { sq: string; en?: string }
  section?: string
  parent?: string
  variants?: string[]
  sectorSlug?: string
}

export const NACE_CODES: NaceCode[] = [
  { code: '01.11', name: { sq: 'Kultivimi i drithërave, bishtajoreve dhe farave vajore' }, section: 'A', variants: ['bujqësi', 'drithëra', 'grurë', 'misër'], sectorSlug: 'bujqesi-blegtori' },
  { code: '10.71', name: { sq: 'Prodhimi i bukës dhe i produkteve të freskëta të pastiçerisë' }, section: 'C', variants: ['bukë', 'furrë', 'pastiçeri', 'simite'], sectorSlug: 'ushqim-dhe-pije' },
  { code: '11.02', name: { sq: 'Prodhimi i verës nga rrushi' }, section: 'C', variants: ['verë', 'vresht', 'rrush'], sectorSlug: 'ushqim-dhe-pije' },
  { code: '16.23', name: { sq: 'Prodhimi i artikujve të zdrukthtarisë për ndërtim' }, section: 'C', variants: ['zdrukthtari', 'dru', 'dyer', 'dritare'], sectorSlug: 'druri-mobilje' },
  { code: '31.09', name: { sq: 'Prodhimi i mobiljeve të tjera' }, section: 'C', variants: ['mobilje', 'mobilier', 'tavolina', 'karrige'], sectorSlug: 'druri-mobilje' },
  { code: '41.20', name: { sq: 'Ndërtimi i ndërtesave banesore dhe jobanesore' }, section: 'F', variants: ['ndërtim', 'ndërtimtari', 'objekte'], sectorSlug: 'ndertim-materiale' },
  { code: '47.11', name: { sq: 'Tregti me pakicë në dyqane jo të specializuara, kryesisht ushqime' }, section: 'G', variants: ['market', 'dyqan', 'tregti', 'shitje me pakicë'] },
  { code: '49.41', name: { sq: 'Transport rrugor i mallrave' }, section: 'H', variants: ['transport', 'kamion', 'logjistikë', 'mallra'] },
  { code: '56.10', name: { sq: 'Restorante dhe veprimtari të shërbimit ushqimor' }, section: 'I', variants: ['restorant', 'gastronomi', 'ushqim', 'lokal'] },
  { code: '62.01', name: { sq: 'Programim kompjuterik' }, section: 'J', variants: ['softuer', 'zhvillim softueri', 'web', 'aplikacione', 'programim'], sectorSlug: 'tik' },
  { code: '62.02', name: { sq: 'Veprimtari konsulence në teknologji informacioni' }, section: 'J', variants: ['konsulencë it', 'teknologji', 'ti'], sectorSlug: 'tik' },
  { code: '68.20', name: { sq: 'Dhënia me qira e pasurive të paluajtshme' }, section: 'L', variants: ['qira', 'patundshmëri', 'prona'] },
  { code: '69.20', name: { sq: 'Veprimtari kontabiliteti, auditimi dhe konsulencë tatimore' }, section: 'M', variants: ['kontabilitet', 'financa', 'auditim', 'tatime'] },
  { code: '70.22', name: { sq: 'Konsulencë biznesi dhe menaxhimi' }, section: 'M', variants: ['konsulencë', 'menaxhim', 'biznes plan'] },
  { code: '96.02', name: { sq: 'Veprimtari të parukerisë dhe trajtimit të bukurisë' }, section: 'S', variants: ['parukeri', 'sallon', 'bukuri', 'estetikë'], sectorSlug: 'kozmetike' },
]

export function searchNace(query: string, limit = 10): NaceCode[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored: { c: NaceCode; score: number }[] = []
  for (const c of NACE_CODES) {
    let score = 0
    if (c.code.toLowerCase().startsWith(q)) score = 100
    else if (c.code.toLowerCase().includes(q)) score = 80
    else if (c.name.sq.toLowerCase().includes(q)) score = 60
    else if ((c.variants ?? []).some((v) => v.toLowerCase().includes(q))) score = 40
    if (score > 0) scored.push({ c, score })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.c)
}
