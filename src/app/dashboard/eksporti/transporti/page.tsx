import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Truck, MailQuestion, Snowflake, Container, Plane } from 'lucide-react'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'

export const dynamic = 'force-dynamic'

const PLANNED_CATEGORIES = [
  { icon: Snowflake, name: 'Transport frigo', desc: 'Për ushqim të freskët, mish, qumësht, vera, farmaceutikë (2-8°C ose -18°C).' },
  { icon: Container, name: 'Transport kontejnerësh', desc: 'FCL/LCL drejt portave të Durrësit, Bar, Pireas, Trieste, Hamburg.' },
  { icon: Truck, name: 'Transport rrugor', desc: 'Kamionë të plotë (FTL) ose pjesërisht (LTL) drejt BE, CEFTA, Turqi.' },
  { icon: Plane, name: 'Transport ajror', desc: 'Express ose air freight për dërgesa urgjente ose me vlerë të lartë.' },
]

export default function TransportiPage() {
  return (
    <div className="space-y-6">
      <Link href="/dashboard/eksporti" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> Eksporti
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transporti</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Kompani transporti të verifikuara me specifika: kategoria e mallit, tregjet që mbulojnë, dokumentet që përfshijnë.
        </p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Truck className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm text-amber-900">
              <p><strong>Ky seksion është në ndërtim.</strong></p>
              <p>Po kontaktojmë kompanitë e transportit në Kosovë dhe regjion. Për secilën do të kemi: kategoria (frigo/kontejner/rrugor/ajror), tregjet destinacion, çmime indikative, kontakti direkt.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Kategoritë që po përgatisim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLANNED_CATEGORIES.map((c) => {
            const Icon = c.icon
            return (
              <Card key={c.name}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
                    <Icon className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{c.name}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{c.desc}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <MailQuestion className="h-5 w-5 text-[#1B4F72] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-900">A je kompani transporti ose ke një rekomandim?</h2>
              <p className="text-sm text-gray-600 mt-1">Na e dërgo dhe e shtojmë në listë sipas specifikave që mbulon.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExpertContactCard variant="OTHER" source="dashboard-transporti-placeholder" />
    </div>
  )
}
