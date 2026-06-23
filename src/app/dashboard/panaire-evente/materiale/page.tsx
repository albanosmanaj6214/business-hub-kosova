import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, FolderArchive, FileText, Image as ImageIcon, ListChecks, MailQuestion } from 'lucide-react'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'

export const dynamic = 'force-dynamic'

const PLANNED = [
  { icon: ListChecks, name: 'Checklist para-panairit', desc: 'PDF i personalizuar me të gjitha që duhen të bësh javë pas jave para panairit.' },
  { icon: ImageIcon, name: 'Etiketa shtandi & banner', desc: 'Template me logon dhe ngjyrat e biznesit tënd, e gatshme për printim në A2/A1.' },
  { icon: FileText, name: 'Broshura biznesi', desc: 'Profili kompani + produktet + çmime + kontakt, eksportuar në PDF dy-faqësh ose tre-fletësh.' },
  { icon: FileText, name: 'Kartele takimi (B2B Meeting Sheet)', desc: 'Formë e shtypur për të shënuar çdo takim me blerës: kompania, kontakti, interesi, ndjekja.' },
]

export default function MaterialePanairiPage() {
  return (
    <div className="space-y-6">
      <Link href="/dashboard/panaire-evente" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> Panaire dhe Ngjarje
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Materiale për panair</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Upload logon dhe ngjyrat e biznesit, dhe gjenero menjëherë në PDF dokumentet që të duhen për panair.
        </p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <FolderArchive className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm text-amber-900">
              <p><strong>Ky seksion është në ndërtim.</strong></p>
              <p>Po e ndërtojmë gjeneratorin PDF: tregon logon + ngjyrat tona, zgjedh template-in, dhe shkarko PDF-në e gatshme për printim ose dërgim te organizatori.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Materialet që po përgatisim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLANNED.map((p) => {
            const Icon = p.icon
            return (
              <Card key={p.name}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
                    <Icon className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{p.desc}</p>
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
              <h2 className="font-semibold text-gray-900">A të duhet template tjetër?</h2>
              <p className="text-sm text-gray-600 mt-1">Na thuaj çfarë lloj dokumenti përdor në panaire dhe e shtojmë në gjenerator.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExpertContactCard variant="FAIR_REGISTRATION" source="dashboard-materiale-placeholder" />
    </div>
  )
}
