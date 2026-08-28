/**
 * Porta e vetme përmes së cilës lejohet shkrimi në udhëzuesit e eksportit.
 *
 * Çdo skript që ndryshon `ExportGuide` duhet ta përdorë këtë, jo `prisma.update`
 * drejtpërdrejt. Porta bën katër gjëra në këtë rend dhe ndalet te e para që dështon:
 *
 *   1. Ruan gjendjen e plotë të udhëzuesit në disk, me vulë kohe.
 *   2. Kontrollon formën kundrejt kontratës së vizatimit para se të prekë bazën.
 *   3. Shkruan.
 *   4. E rilexon nga baza dhe e kontrollon sërish, se mos serializimi ka ndryshuar diçka.
 *
 * Hapi 2 ekziston sepse më 26 gusht 2026 një skript zëvendësoi një varg me objekt
 * te `tradeAgreements[].name` dhe tre faqe udhëzuesish do të kishin dhënë gabim.
 *
 *   import { shkruajUdhezues } from './lib/shkrim-i-sigurt'
 *   await shkruajUdhezues(prisma, 'FR', (g) => { g.labeling.rules[0].sourceUrl = '...' })
 */
import { mkdirSync, writeFileSync } from 'fs'
import { assertGuideShape, validateGuideShape } from '../../src/lib/export-guide-shape'

const FUSHAT_JSON = [
  'customs', 'requiredDocs', 'certifications', 'labeling',
  'sectorRules', 'tradeAgreements', 'contacts', 'citations',
  'marketStats', 'marketOverview',
] as const

export const DREJTORIA_E_REZERVAVE = '/root/backups-guides'

export interface RezultatiShkrimit {
  vendi: string
  skedariIRezerves: string
  ndryshoi: boolean
}

/**
 * @param prisma  klienti
 * @param vendi   kodi ISO, p.sh. 'FR'
 * @param ndrysho funksion që e modifikon kopjen e thellë në vend
 * @param opsione dryRun e kthen rezultatin pa prekur bazën
 */
export async function shkruajUdhezues(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any,
  vendi: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ndrysho: (guide: any) => void,
  opsione: { dryRun?: boolean; vula?: string } = {},
): Promise<RezultatiShkrimit> {
  const g = await prisma.exportGuide.findFirst({
    where: { countryCode: vendi, deletedAt: null },
  })
  if (!g) throw new Error(`Nuk u gjet udhëzuesi për ${vendi}.`)

  // 1. rezerva, gjithmonë, edhe kur është vetëm provë
  const vula = opsione.vula ?? new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  mkdirSync(DREJTORIA_E_REZERVAVE, { recursive: true })
  const skedariIRezerves = `${DREJTORIA_E_REZERVAVE}/${vendi}-${vula}.json`
  writeFileSync(skedariIRezerves, JSON.stringify(g, null, 1))

  // 2. ndryshimi mbi kopje të thellë, pastaj porta
  const para = JSON.stringify(pickJson(g))
  const i_ri = JSON.parse(JSON.stringify(g))
  ndrysho(i_ri)
  assertGuideShape(i_ri, `udhëzuesi ${vendi}`)

  const pas = JSON.stringify(pickJson(i_ri))
  const ndryshoi = para !== pas
  if (!ndryshoi || opsione.dryRun) return { vendi, skedariIRezerves, ndryshoi }

  // 3. shkrimi
  await prisma.exportGuide.update({ where: { id: g.id }, data: pickJson(i_ri) })

  // 4. kontrolli pas shkrimit, drejtpërdrejt nga baza
  const kontroll = await prisma.exportGuide.findFirst({ where: { id: g.id } })
  const shkelje = validateGuideShape(kontroll)
  if (shkelje.length) {
    await prisma.exportGuide.update({ where: { id: g.id }, data: pickJson(g) })
    throw new Error(
      `Pas shkrimit, ${vendi} shkeli kontratën në ${shkelje.length} vende. ` +
        `Gjendja u kthye. Rezerva: ${skedariIRezerves}\n` +
        shkelje.map((s) => `  ${s.path}: ${s.got}`).join('\n'),
    )
  }
  return { vendi, skedariIRezerves, ndryshoi }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickJson(g: any): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of FUSHAT_JSON) out[f] = g[f]
  return out
}
