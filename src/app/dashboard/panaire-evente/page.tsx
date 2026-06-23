import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { currentBusinessProfile } from '@/lib/audience-server'
import { feedFor } from '@/lib/audience'
import { Card, CardContent } from '@/components/ui/card'
import { Globe, Home, GraduationCap, Users, BookOpen, Mic, FolderArchive, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface HubCardProps {
  icon: any
  title: string
  description: string
  href: string
  count?: number | string
  status?: 'live' | 'coming-soon'
}

function HubCard({ icon: Icon, title, description, href, count, status = 'live' }: HubCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full hover:shadow-md hover:border-[#2E86C1]/40 transition-all">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="rounded-lg bg-[#1B4F72]/10 p-2.5 shrink-0">
              <Icon className="h-5 w-5 text-[#1B4F72]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-gray-900">{title}</h2>
                {status === 'coming-soon' && (
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Po vjen</span>
                )}
                {count !== undefined && status === 'live' && (
                  <span className="text-xs text-gray-400">{count}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <span className="inline-flex items-center text-sm text-[#2E86C1] font-medium group-hover:gap-1.5 gap-1 transition-all">
            Hape <ArrowRight className="h-4 w-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function PanaireDheEventePage() {
  const profile = await currentBusinessProfile()

  let cnt = { fairIntl: 0, fairLocal: 0, training: 0, matchmaking: 0, workshop: 0, conference: 0 }
  if (profile) {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0)
    const fairs = await prisma.tradeFair.findMany({
      where: { isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED', endDate: { gte: today } },
      select: {
        eventType: true, country: true,
        isGeneral: true, targetActivityTypes: true, targetSectors: true, forFemaleOwned: true,
      },
    })
    const visible = feedFor(profile, fairs)
    for (const f of visible) {
      const isKosovo = (f.country ?? '').toLowerCase().includes('kosov')
      if (f.eventType === 'FAIR') {
        if (isKosovo) cnt.fairLocal++; else cnt.fairIntl++
      } else if (f.eventType === 'TRAINING') cnt.training++
      else if (f.eventType === 'MATCHMAKING') cnt.matchmaking++
      else if (f.eventType === 'WORKSHOP') cnt.workshop++
      else if (f.eventType === 'CONFERENCE') cnt.conference++
    }
  }

  const fmt = (n: number) => n === 0 ? 'asnjë aktualisht' : `${n} aktive`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panaire dhe Ngjarje</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Panaire ndërkombëtare e vendore, trajnime, matchmaking, workshope dhe konferenca. Filtruar sipas sektorit tënd.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HubCard
          icon={Globe}
          title="Panaire ndërkombëtare"
          description="Tregjet kryesore globale: Hannover Messe, IFA, TUTTOFOOD, SIAL, Anuga e tjera."
          href="/dashboard/fairs?type=FAIR"
          count={fmt(cnt.fairIntl)}
        />
        <HubCard
          icon={Home}
          title="Panaire vendore"
          description="Panairet dhe ekspozitat e organizuara në Kosovë."
          href="/dashboard/fairs?type=FAIR&country=Kosovo"
          count={fmt(cnt.fairLocal)}
        />
        <HubCard
          icon={GraduationCap}
          title="Trajnime"
          description="Trajnime ndërkombëtare e vendore për eksportues, cilësi, certifikim, marketing."
          href="/dashboard/fairs?type=TRAINING"
          count={fmt(cnt.training)}
        />
        <HubCard
          icon={Users}
          title="Matchmaking"
          description="Takime B2B me blerës, distributorë dhe partnerë të mundshëm."
          href="/dashboard/fairs?type=MATCHMAKING"
          count={fmt(cnt.matchmaking)}
        />
        <HubCard
          icon={BookOpen}
          title="Workshope"
          description="Punëtori praktike: paketim, dizajn shtandi, dosja e eksportit, çertifikim."
          href="/dashboard/fairs?type=WORKSHOP"
          count={fmt(cnt.workshop)}
        />
        <HubCard
          icon={Mic}
          title="Konferenca"
          description="Konferenca biznesore e sektoriale për trendet e tregut dhe rrjetëzim."
          href="/dashboard/fairs?type=CONFERENCE"
          count={fmt(cnt.conference)}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Përgatitja për panair</h2>
        <div className="grid grid-cols-1 gap-3">
          <HubCard
            icon={FolderArchive}
            title="Materiale për panair"
            description="Template për dokumentet që duhen në panair: checklist, fletë informative, etiketë shtandi, broshura. Upload logon dhe gjenero PDF me brand-in tënd. Po e ndërtojmë."
            href="/dashboard/panaire-evente/materiale"
            status="coming-soon"
          />
        </div>
      </div>
    </div>
  )
}
