// Njoftimet per thirrjet e hapura te stendes shtetërore.
//
// KIESA bashkefinancon pjesemarrjen ne stenden shtetërore te Kosoves ne panaire
// nderkombetare. Thirrjet ruhen si `Grant` por permbajtja eshte panair; ky skript
// i njofton bizneset e sektorit perkates NJE here per (thirrje, prag), me dedup
// permes fushes `link` unike-semantike. Pa API te jashtme, pa AI.
//
//   pnpm tsx scripts/notify-fair-stand-calls.ts        (nga /var/www/businesshub)
//   pnpm tsx scripts/notify-fair-stand-calls.ts --dry  (vetem raporton, pa shkruar)
import { PrismaClient } from '@prisma/client'
import { matchesAudience } from '@/lib/audience'
import {
  isFairStandCall, classifyFairStandCall, fairStandSectorLabel, daysLeft,
} from '@/lib/fair-stand-calls'

const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry')

// Pragjet e njoftimit: njofto kur thirrja shfaqet, pastaj kujto para afatit.
function thresholdFor(left: number | null): string | null {
  if (left === null) return 'e-vazhdueshme'
  if (left < 0) return null
  if (left <= 3) return '3d'
  if (left <= 7) return '7d'
  if (left <= 21) return '21d'
  return 'e-re'
}

async function main() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const candidates = await prisma.grant.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [{ isOngoing: true }, { deadline: { gte: today } }],
      NOT: { tags: { has: 'legacy_synthetic' } },
    },
    select: {
      id: true, title: true, titleSq: true, provider: true, deadline: true, url: true,
      sectors: true, isGeneral: true, targetActivityTypes: true, forFemaleOwned: true,
    },
  })
  const calls = candidates.filter(isFairStandCall)

  // Vetem bizneset — individet nuk aplikojne per stende.
  const users = await prisma.user.findMany({
    where: { role: { in: ['KOSOVO_BUSINESS', 'STARTUP', 'DIASPORA'] } },
    select: {
      id: true, role: true, activityType: true, entitledSectors: true,
      femaleOwnership: true, interests: true,
      company: { select: { country: true, activityType: true, interests: true } },
    },
  })

  let created = 0, skipped = 0
  const report: Record<string, unknown>[] = []

  for (const c of calls) {
    const cls = classifyFairStandCall(c)
    const left = c.deadline ? daysLeft(c.deadline, today) : null
    const threshold = thresholdFor(left)
    if (!threshold) continue

    const dStr = c.deadline ? c.deadline.toISOString().slice(0, 10) : null
    const fair = cls.fairName ?? 'panair ndërkombëtar'
    const titleSq = dStr
      ? `Stenda shtetërore: ${fair} — afati ${dStr}`
      : `Stenda shtetërore: ${fair} — thirrje e hapur`
    const messageSq = [
      `KIESA ka hapur thirrjen për aplikim në stendën shtetërore të Kosovës në ${fair}.`,
      dStr ? `Afati i aplikimit: ${dStr}${left !== null ? ` (${left === 0 ? 'skadon sot' : left === 1 ? '1 ditë' : `${left} ditë`})` : ''}.` : 'Thirrja është e vazhdueshme.',
      `Sektori: ${fairStandSectorLabel(cls.sectors)}.`,
      c.url ? `Thirrja e plotë: ${c.url}` : '',
    ].filter(Boolean).join(' ')

    const link = `/dashboard/panaire-evente?thirrje=${c.id}&prag=${threshold}`
    const criteria = {
      isGeneral: c.isGeneral,
      targetActivityTypes: c.targetActivityTypes,
      targetSectors: cls.sectors,
      forFemaleOwned: c.forFemaleOwned,
    }

    const recipients = users.filter((u) =>
      matchesAudience(
        {
          role: u.role,
          activityType: u.company?.activityType ?? u.activityType,
          entitledSectors: u.entitledSectors,
          femaleOwnership: u.femaleOwnership,
          country: u.company?.country ?? null,
          interests: Array.from(new Set([...(u.interests ?? []), ...(u.company?.interests ?? [])])),
          productSlugs: [],
        },
        criteria,
      ),
    )

    const reason = cls.sectors.length
      ? `Po e shihni sepse sektori i biznesit tuaj përputhet me: ${fairStandSectorLabel(cls.sectors)}.`
      : 'Po e shihni sepse thirrja është e hapur për të gjithë sektorët.'

    let callCreated = 0
    for (const u of recipients) {
      const exists = await prisma.notification.findFirst({ where: { userId: u.id, link } })
      if (exists) { skipped++; continue }
      if (!DRY) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            type: 'FAIR',
            title: titleSq,
            titleSq,
            message: messageSq,
            messageSq,
            link,
            reason,
          },
        })
      }
      created++; callCreated++
    }

    report.push({
      thirrja: (c.titleSq ?? c.title).slice(0, 70),
      panairi: cls.fairName,
      sektoret: cls.sectors,
      burimi: cls.source,
      afati: dStr,
      dite: left,
      prag: threshold,
      marres: recipients.length,
      njoftime_te_reja: callCreated,
    })
  }

  console.log(JSON.stringify({ dry: DRY, thirrje: calls.length, created, skipped, detaje: report }, null, 1))
}

main().finally(() => prisma.$disconnect())
