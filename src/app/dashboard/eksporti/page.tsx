import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, GraduationCap, Truck, ArrowRight } from 'lucide-react'

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

export default async function EksportiPage() {
  const guidesCount = await prisma.exportGuide.count({
    where: { isPublished: true, deletedAt: null },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Eksporti</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Çdo gjë që të duhet për të eksportuar: udhëzuesit sipas tregut, termet doganore, dhe transporti.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HubCard
          icon={BookOpen}
          title="Udhëzues Eksporti"
          description="Udhëzues të strukturuar për çdo treg: tarifat, dokumentet e kërkuara, çertifikimet, etiketimi dhe kontaktet kyçe."
          href="/dashboard/guides"
          count={`${guidesCount} tregje`}
        />
        <HubCard
          icon={GraduationCap}
          title="Termet e Eksportit"
          description="Gjuha e tregtisë ndërkombëtare: Incoterms 2020, dokumentet doganore, pagesat, logjistika dhe HS Code Finder."
          href="/dashboard/terma"
        />
        <HubCard
          icon={Truck}
          title="Transporti"
          description="Kompani transporti me specifika (frigo, Benelux-only, container, ekspres) që sjellim oferta direkte. Po e ndërtojmë."
          href="/dashboard/eksporti/transporti"
          status="coming-soon"
        />
      </div>
    </div>
  )
}
