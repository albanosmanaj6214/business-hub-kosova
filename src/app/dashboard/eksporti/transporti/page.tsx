import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Truck, Snowflake, Container, Route, Plane, ExternalLink, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  {
    icon: Snowflake,
    title: 'Transport frigo',
    summary: 'Për produkte që kërkojnë temperaturë të kontrolluar: ushqim i freskët, medikamente, produkte të përpunimit të mishit.',
    tips: [
      'Kontrollo çertifikatën ATP (Agreement on Transport of Perishable foodstuffs) të kamionit',
      'Përcakto qartë temperaturën në kontratë (0-4°C për fresh, -18°C për të ngrirë)',
      'Zgjidh kompani me GPS tracking në kohë reale',
    ],
  },
  {
    icon: Container,
    title: 'Transport kontejnerësh',
    summary: 'Për ngarkesa të mëdha ndërkombëtare — përdoret me transport detar ose rrugor multi-modal.',
    tips: [
      '20 ft = ~28 m³ / 22 ton, 40 ft = ~58 m³ / 26 ton',
      'Për BE: përmes portit të Durrësit ose Selanikut',
      'Kërkohet kontratë e qartë për ambalazhimin (packing list) dhe sigurimin',
    ],
  },
  {
    icon: Truck,
    title: 'Transport rrugor (LTL/FTL)',
    summary: 'Më i përdoruri për destinacione në Ballkan dhe në BE. LTL = ngarkesë e ndarë, FTL = kamion i plotë.',
    tips: [
      'Kosovë-Gjermani rrugor: 5-7 ditë',
      'Kosovë-Zvicër/Austri: 3-5 ditë',
      'CMR (fletë-udhëtimi rrugor) është dokument i detyrueshëm',
    ],
  },
  {
    icon: Plane,
    title: 'Transport ajror',
    summary: 'Për ngarkesa urgjente ose të vogla me vlerë të lartë. Aeroporti kryesor: Prishtinë.',
    tips: [
      'Kosto 5-10x më e lartë se rrugori, por 1-3 ditë',
      'Ideal për teknologji, medikamente, dokumente kritike',
      'AWB (Air Waybill) është dokumenti kryesor',
    ],
  },
]

const SHPEDITERS_TIP = 'Zgjidh shpediter me licencë të verifikuar te dogana.rks-gov.net. Krahaso 2-3 oferta për të njëjtën rrugë. Referenca nga biznese të tjera në sektorin tënd janë tregues i mirë i cilësisë.'

export default function TransportiPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Route className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Transporti</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Kategoritë kryesore të transportit për bizneset kosovare që eksportojnë ose importojnë,
          dhe këshilla praktike për zgjedhjen e shpediterit të duhur.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {CATEGORIES.map((c) => (
          <Card key={c.title}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
                  <c.icon className="h-5 w-5 text-[#1B4F72]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{c.summary}</p>
                  <ul className="mt-3 space-y-1">
                    {c.tips.map((t, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-[#1B4F72] mt-1">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Si të zgjedhësh shpediterin</h3>
          <p className="text-sm text-gray-700">{SHPEDITERS_TIP}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/dogana" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
              Shiko Udhëzuesin Doganor <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/dashboard/terma/incoterms" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
              Incoterms Glossary <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a href="https://dogana.rks-gov.net" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
              Portal Dogana e Kosovës <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
