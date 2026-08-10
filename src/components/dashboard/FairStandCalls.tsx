import { prisma } from '@/lib/prisma'
import { currentBusinessProfile } from '@/lib/audience-server'
import {
  isFairStandCall, filterFairStandCalls, fairStandSectorLabel, daysLeft,
  type FairStandCallRow,
} from '@/lib/fair-stand-calls'
import { CalendarClock, ExternalLink, Tag } from 'lucide-react'

// Thirrjet e hapura për stendën shtetërore, filtruar sipas sektorit të biznesit.
// Renderohet vetëm kur ka çka të shfaqet — pa kuti bosh.
export async function FairStandCalls() {
  const profile = await currentBusinessProfile()
  if (!profile) return null

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Marrim kandidatët e hapur nga `Grant`, pastaj e zbulojmë modelin në kod:
  // titulli nuk mund t'i filtrohet me besueshmëri në SQL (rrënjët me diakritikë
  // sillen ndryshe në `~*` sesa në RegExp-in e JS-së).
  const rows = (await prisma.grant.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [{ isOngoing: true }, { deadline: { gte: today } }],
      NOT: { tags: { has: 'legacy_synthetic' } },
    },
    select: {
      id: true, title: true, titleSq: true, provider: true, deadline: true, url: true,
      sectors: true, isOngoing: true, isGeneral: true, targetActivityTypes: true,
      forFemaleOwned: true,
    },
  })) as FairStandCallRow[]

  const calls = filterFairStandCalls(profile, rows.filter(isFairStandCall))
  if (calls.length === 0) return null

  return (
    <section className="rounded-xl border border-[#F39C12]/40 bg-amber-50/50 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-lg bg-[#F39C12]/15 p-2.5 shrink-0">
          <CalendarClock className="h-5 w-5 text-[#B9770E]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Thirrje të hapura për stendën shtetërore</h2>
          <p className="text-sm text-gray-600 mt-0.5 max-w-2xl leading-relaxed">
            KIESA bashkëfinancon pjesëmarrjen e bizneseve kosovare në stendën shtetërore të Kosovës
            në panaire ndërkombëtare. Këto janë thirrjet që i takojnë sektorit tënd.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {calls.map((c) => {
          const title = c.titleSq ?? c.title
          const left = c.deadline ? daysLeft(c.deadline, today) : null
          const urgent = left !== null && left <= 7
          return (
            <li key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  {c.classification.fairName && (
                    <span className="inline-block text-xs font-semibold text-[#1B4F72] bg-[#1B4F72]/10 rounded px-2 py-0.5 mb-1.5">
                      {c.classification.fairName}
                    </span>
                  )}
                  <p className="font-medium text-gray-900 leading-snug">{title}</p>
                  <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 text-xs text-gray-500">
                    <span>{c.provider}</span>
                    <span className="inline-flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      {fairStandSectorLabel(c.classification.sectors)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {c.deadline ? (
                    <>
                      <div className={`text-sm font-semibold ${urgent ? 'text-[#E74C3C]' : 'text-gray-900'}`}>
                        {c.deadline.toISOString().slice(0, 10)}
                      </div>
                      <div className={`text-xs ${urgent ? 'text-[#E74C3C] font-medium' : 'text-gray-500'}`}>
                        {left === 0 ? 'skadon sot' : left === 1 ? '1 ditë' : `${left} ditë`}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">e vazhdueshme</div>
                  )}
                </div>
              </div>

              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-sm text-[#2E86C1] font-medium mt-3 hover:underline">
                  Shiko thirrjen dhe apliko
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
