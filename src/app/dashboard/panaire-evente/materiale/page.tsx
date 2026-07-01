import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Package, FileText, Users, Award, Sparkles, ArrowRight, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TEMPLATES = [
  {
    icon: FileText,
    title: 'Checklist para-panairit',
    summary: 'Të gjitha çka duhet të përgatitesh 30, 15, 7 dhe 3 ditë para panairit.',
    items: [
      '30 ditë: Rezervim stand, biletave dhe hotelit',
      '15 ditë: Përgatitje broshurash + katalog',
      '7 ditë: Prova finale prezantimi + traineri i stafit',
      '3 ditë: Ambalazhim + dërgim materialesh',
    ],
  },
  {
    icon: Award,
    title: 'Etiketa standi dhe banner',
    summary: 'Design template për profesionalizim vizual në panair.',
    items: [
      'Banner kryesor (2m × 1m) me logo dhe slogan',
      'Rroll-up (85cm × 200cm) me produktet kryesore',
      'Etiketa standi me numër dhe emrin e biznesit',
      'Backdrop për fotografim',
    ],
  },
  {
    icon: Package,
    title: 'Broshurë biznesi',
    summary: 'Katalog i shkurtër (4-6 faqe) i produkteve/shërbimeve për t\'i shpërndarë vizitorëve.',
    items: [
      'Faqja 1: Kush jemi + logo + kontakti',
      'Faqja 2-3: Produkte/shërbime kryesore me foto',
      'Faqja 4: Referenca, certifikime, kualifikime',
      'Faqja 5-6: Kontakti dhe QR code për katalogun online',
    ],
  },
  {
    icon: Users,
    title: 'Kartelë takimi B2B',
    summary: 'Template për ndjekjen e takimeve gjatë panairit.',
    items: [
      'Emri i kompanisë + kontakti i personit',
      'Interesat e diskutuara',
      'Produkte të prezantuara',
      'Hapi tjetër: email, mostër, ofertë, follow-up',
      'Prioritet: A/B/C',
    ],
  },
]

export default function MaterialePanairiPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Materiale për panair</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Template dhe checklist për të përgatitur pjesëmarrjen tënde në panair profesionalisht.
          Këto janë udhëzime konceptuale për tani; PDF-të e gatshme për shkarkim vijnë me Fazën 5.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <Card key={t.title}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
                  <t.icon className="h-5 w-5 text-[#1B4F72]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{t.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t.summary}</p>
                  <ul className="mt-3 space-y-1.5">
                    {t.items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-[#1B4F72] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <Download className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Po vijnë: PDF të gatshëm për shkarkim</p>
          <p>
            Në Fazën e ardhshme, do të mund të shkarkosh direkt PDF-të template të pambushur.
            Deri atëherë, përdor këto udhëzime konceptuale me designer-in tënd ose në Canva/Figma.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Rrjet i lidhur</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/dashboard/panaire-evente" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B4F72]">Panairet aktive</p>
            <p className="text-xs text-gray-600 mt-1">Ndërkombëtare + vendore</p>
            <ArrowRight className="h-4 w-4 text-[#1B4F72] mt-2 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/dashboard/eksporti" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B4F72]">Eksporti</p>
            <p className="text-xs text-gray-600 mt-1">Udhëzues sipas shtetit</p>
            <ArrowRight className="h-4 w-4 text-[#1B4F72] mt-2 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/dashboard/bookings" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B4F72]">Konsultim panair</p>
            <p className="text-xs text-gray-600 mt-1">Bisedë me eksperte</p>
            <ArrowRight className="h-4 w-4 text-[#1B4F72] mt-2 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  )
}
