// Kontroll shendeti i permbajtjes. Ekzekutohet DITOR (cron ne CT109).
//
// Faqja publike premton mundesi financimi. Nese numri i granteve aktive bie nen
// prag, ose nese nje burim i deklaruar si aktiv nuk sjell asgje me dite te tera,
// duhet ta dime NE para se ta veje re nje biznes. Pa API te jashtme, pa AI.
//
//   pnpm tsx scripts/content-health-check.ts
//   pnpm tsx scripts/content-health-check.ts --json
import { PrismaClient } from '@prisma/client'
import { countActiveGrants } from '@/lib/active-grants'

const prisma = new PrismaClient()
const JSON_OUT = process.argv.includes('--json')

// Njoftim operacional. `notify.ts` ekspozon vetem notifyNewLead() me payload te
// tipizuar per lead-e, prandaj nuk e keqperdorim; perdorim te njejten konvente
// (Telegram nese eshte konfiguruar, perndryshe log). Cron-i e ruan daljen ne file.
async function alert(subject: string, body: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) {
    console.warn(`[health] Telegram i pakonfiguruar — alarmi vetem ne log.\n${subject}\n${body}`)
    return
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `${subject}\n\n${body}`, disable_web_page_preview: true }),
    })
    if (!res.ok) console.error('[health] Telegram deshtoi:', res.status)
  } catch (e) {
    console.error('[health] Telegram gabim:', (e as Error).message)
  }
}

// Pragjet. Nen keto, faqja publike premton me shume sesa jep.
const MIN_ACTIVE_GRANTS = 5
const MIN_UPCOMING_FAIRS = 5
const MAX_SOURCE_SILENCE_DAYS = 3

interface Alarm { nivel: 'KRITIK' | 'PARALAJMERIM'; teksti: string }

async function main() {
  const alarms: Alarm[] = []
  const now = new Date()
  const today = new Date(now); today.setUTCHours(0, 0, 0, 0)

  const activeGrants = await countActiveGrants()
  if (activeGrants < MIN_ACTIVE_GRANTS) {
    alarms.push({
      nivel: activeGrants === 0 ? 'KRITIK' : 'PARALAJMERIM',
      teksti: `Vetem ${activeGrants} grante aktive (pragu ${MIN_ACTIVE_GRANTS}). Faqja publike premton mundesi financimi.`,
    })
  }

  const upcomingFairs = await prisma.tradeFair.count({
    where: { isActive: true, deletedAt: null, startDate: { gte: today } },
  })
  if (upcomingFairs < MIN_UPCOMING_FAIRS) {
    alarms.push({ nivel: 'PARALAJMERIM', teksti: `Vetem ${upcomingFairs} panaire te ardhshme (pragu ${MIN_UPCOMING_FAIRS}).` })
  }

  // Burimet e deklaruara aktive duhet te sjellin diçka; heshtja e gjate eshte defekt.
  const sources = await prisma.source.findMany({
    where: { isActive: true },
    select: { code: true, name: true, health: { select: { lastSuccessAt: true, consecutiveFailures: true } } },
  })
  for (const s of sources) {
    const last = s.health?.lastSuccessAt ?? null
    const fails = s.health?.consecutiveFailures ?? 0
    if (!last) {
      alarms.push({ nivel: 'KRITIK', teksti: `Burimi ${s.code} eshte aktiv por s'ka pasur KURRE nje sukses (${fails} deshtime radhazi).` })
      continue
    }
    const days = Math.floor((now.getTime() - last.getTime()) / 86_400_000)
    if (days > MAX_SOURCE_SILENCE_DAYS) {
      alarms.push({
        nivel: days > 14 ? 'KRITIK' : 'PARALAJMERIM',
        teksti: `Burimi ${s.code} pa sukses prej ${days} ditesh (${fails} deshtime radhazi), por numerohet publikisht si i monitoruar.`,
      })
    }
  }

  // Provenanca: nje shifer tregu pa burim ose pa date marrjeje s'guxon te ekzistoje.
  const badProvenance = await prisma.marketStat.count({
    where: { OR: [{ sourceName: '' }, { sourceUrl: null }] },
  })
  if (badProvenance > 0) {
    alarms.push({ nivel: 'KRITIK', teksti: `${badProvenance} shifra tregu pa burim ose pa URL burimi.` })
  }

  // Rregullat detyruese pa akt ligjor: shkelin premtimin e citueshmerise.
  const unsourcedRules = await prisma.marketRequirement.count({
    where: { status: 'VERIFIED', legalActUrl: null, requirementType: { in: ['BLOCKED', 'MANDATORY'] } },
  })
  if (unsourcedRules > 0) {
    alarms.push({ nivel: 'PARALAJMERIM', teksti: `${unsourcedRules} rregulla BLOCKED/MANDATORY te verifikuara pa link te aktit ligjor.` })
  }

  const summary = {
    grante_aktive: activeGrants,
    panaire_te_ardhshme: upcomingFairs,
    burime_aktive: sources.length,
    alarme: alarms.length,
    kritike: alarms.filter((a) => a.nivel === 'KRITIK').length,
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ ...summary, detaje: alarms }, null, 1))
  } else {
    console.log(`[health] ${new Date().toISOString()} ${JSON.stringify(summary)}`)
    for (const a of alarms) console.log(`  ${a.nivel}: ${a.teksti}`)
  }

  // Njofto vetem kur ka diçka per te thene, qe alarmi te mos behet zhurme.
  if (alarms.length > 0) {
    const critical = alarms.filter((a) => a.nivel === 'KRITIK')
    await alert(
      `KBH shendeti i permbajtjes: ${alarms.length} alarme (${critical.length} kritike)`,
      alarms.map((a) => `${a.nivel}: ${a.teksti}`).join('\n'),
    )
  }
}

main().finally(() => prisma.$disconnect())
