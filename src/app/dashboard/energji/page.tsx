import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { isEnergyEligible, isProducerActivity, energySourceLabel, energyKindLabel, ENERGY_SOURCES, ENERGY_EXCHANGES } from '@/lib/energy'
import {
  Zap, AlertTriangle, ExternalLink, Info, CheckCircle2, Clock, Building2, Tag,
  TrendingUp, TrendingDown, Minus, Euro,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const KIND_STYLE: Record<string, string> = {
  NEWS: 'bg-blue-50 text-blue-700 border-blue-200',
  ALERT: 'bg-amber-50 text-amber-800 border-amber-200',
  OFFER: 'bg-green-50 text-green-700 border-green-200',
}

export default async function EnergyMarketPage() {
  const session = await getServerSession(authOptions)
  const u = session?.user as { id?: string; role?: string; employeeCount?: string | null; activityType?: string | null } | undefined
  if (!u?.id) redirect('/login')

  const isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
  const eligible = isEnergyEligible(u.employeeCount) || isAdmin

  // Jo i kualifikuar: mesazh miqësor, jo 404. Moduli hapet automatikisht kur zgjerohet.
  if (!eligible) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2"><Zap className="h-5 w-5 text-white" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Tregu i Energjisë</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#1B4F72] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">Ky modul është aktualisht për bizneset e mëdha</h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Deri tani, në tregun e hapur të energjisë kanë kaluar bizneset me mbi 50 punëtorë ose mbi
                  10 milionë euro qarkullim. Kur liberalizimi të zgjerohet edhe te bizneset më të vogla,
                  ky modul do të aktivizohet automatikisht për ty — pa asnjë veprim shtesë.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Nëse biznesi yt ka 50+ punëtorë por s\'po e sheh modulin, përditëso numrin e punëtorëve te{' '}
                  Profili i Kompanisë.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isProducer = isProducerActivity(u.activityType)
  const [notices, kosovoPrices, supplierOffers] = await Promise.all([
    prisma.energyNotice.findMany({
      where: { deletedAt: null, ...(isProducer ? {} : { forProducers: false }) },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    }),
    prisma.energyPrice.findMany({
      where: { market: 'ALPEX_KOSOVO', deletedAt: null },
      orderBy: { refDate: 'desc' },
      take: 2,
    }),
    prisma.energyPrice.findMany({
      where: { market: 'SUPPLIER_OFFER', deletedAt: null },
      orderBy: { refDate: 'desc' },
      take: 3,
    }),
  ])
  const latestKosovo = kosovoPrices[0] ?? null
  const prevKosovo = kosovoPrices[1] ?? null
  const trend = latestKosovo && prevKosovo ? latestKosovo.price - prevKosovo.price : null

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2"><Zap className="h-5 w-5 text-white" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Tregu i Energjisë</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Çka është tregu i hapur</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Nga 1 prilli 2026, bizneset me mbi 50 punëtorë ose mbi 10 milionë euro qarkullim dalin nga
              furnizimi universal me tarifa të rregulluara dhe duhet të zgjedhin vetë furnizuesin e energjisë.
            </p>
          </div>
          <div className="md:border-l md:border-gray-100 md:pl-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Pse ka rëndësi për ty</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Biznesi yt bie në këtë kategori. Nëse s\'ke zgjedhur furnizues, kalon te Furnizuesi i Mundësisë
              së Fundit për deri 60 ditë; pa kontratë brenda afatit, furnizimi ndërpritet.
            </p>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Çmimi i tregut</h2>
          <a href="https://alpex.al/day-ahead-market-2/" target="_blank" rel="noreferrer" className="text-sm text-[#2E86C1] hover:underline inline-flex items-center gap-1">
            Çmimet live te ALPEX <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-[#1B4F72]/25">
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 mb-1">ALPEX — Kosovë (Day-Ahead)</p>
              {latestKosovo ? (
                <>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900 tabular-nums">{latestKosovo.price}</span>
                    <span className="text-sm text-gray-500 mb-1">{latestKosovo.unit}</span>
                    {trend !== null && (
                      <span className={`mb-1 inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-1.5 py-0.5 ${trend > 0 ? 'text-red-700 bg-red-50' : trend < 0 ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
                        {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {(trend > 0 ? '+' : '') + trend.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Për {new Date(latestKosovo.refDate).toLocaleDateString('sq-AL')} · burimi ALPEX</p>
                  {latestKosovo.note && <p className="text-xs text-gray-500 mt-1">{latestKosovo.note}</p>}
                </>
              ) : (
                <div className="flex items-start gap-2 mt-1">
                  <Euro className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500">Çmimi i fundit s\'është vendosur ende. Shikoje live te ALPEX me lidhjen lart.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 mb-2">Oferta çmimi nga furnizuesit</p>
              {supplierOffers.length === 0 ? (
                <p className="text-sm text-gray-500">Ende s\'ka oferta nga furnizuesit. Kur KESCO/KEK të dërgojnë ofertë, do të shfaqet këtu dhe do të njoftohesh.</p>
              ) : (
                <div className="space-y-2">
                  {supplierOffers.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-2.5">
                      <div>
                        <span className="text-xs font-semibold text-[#1B4F72] bg-[#1B4F72]/10 rounded-full px-2 py-0.5">{o.supplier || 'Furnizues'}</span>
                        {o.note && <span className="text-xs text-gray-500 ml-2">{o.note}</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-gray-900 tabular-nums">{o.price}</span>
                        <span className="text-xs text-gray-500 ml-1">{o.unit}</span>
                        <p className="text-[11px] text-gray-400">{new Date(o.refDate).toLocaleDateString('sq-AL')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          {ENERGY_EXCHANGES.map((ex) => (
            <a key={ex.url} href={ex.url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-white p-3 hover:border-[#2E86C1]/40 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{ex.label}</p>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{ex.desc}</p>
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Çmimet e mësipërme janë referencë e verifikuar nga administrata. Për vlerën e saktë në kohë reale, hape lidhjen e ALPEX.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Çka duhet të bësh</h2>
        <Card>
          <CardContent className="p-5">
            <ol className="space-y-2.5">
              {[
                'Verifiko statusin e furnizimit të biznesit tënd te KESCO (a je ende në shërbim universal apo ke kaluar).',
                'Kërko oferta nga furnizues të licencuar — listën e furnizuesve të licencuar e gjen te ZRRE.',
                'Krahaso çmimin, kushtet dhe kohëzgjatjen e kontratës.',
                'Nënshkruaj kontratën me furnizuesin e zgjedhur para se të mbarojë afati.',
                'Ruaj kontratën dhe njofto ndryshimin nëse kërkohet.',
              ].map((step, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Njoftimet e fundit</h2>
          <span className="text-xs text-gray-500">Nga KOSTT, KESCO, KEK, ZRRE</span>
        </div>
        {notices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Zap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Ende s\'ka njoftime. Do të njoftohesh kur të ketë të reja nga tregu i energjisë.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4F72] bg-[#1B4F72]/10 rounded-full px-2 py-0.5">
                        <Building2 className="h-3 w-3" /> {energySourceLabel(n.source)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 border ${KIND_STYLE[n.kind] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        <Tag className="h-3 w-3" /> {energyKindLabel(n.kind)}
                      </span>
                      {n.forProducers && (
                        <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Për prodhues</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" /> {new Date(n.publishedAt).toLocaleDateString('sq-AL')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mt-1 whitespace-pre-line">{n.body}</p>
                  {n.url && (
                    <a href={n.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[#2E86C1] hover:underline mt-2">
                      Më shumë <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Aktorët e tregut</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ENERGY_SOURCES.filter((s) => s.key !== 'OTHER').map((s) => (
            <div key={s.key} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 text-sm">{s.label}</p>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:text-[#1B4F72]">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{s.role}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
        <div className="text-sm text-green-900">
          <p className="font-semibold mb-1">Këshillë</p>
          <p className="leading-relaxed">
            Mos prit afatin e fundit. Sa më herët të kërkosh oferta, aq më mirë mund të negociosh çmimin.
            Nëse s\'je i sigurt, konsulto një ekspert të energjisë ose kontabilistin.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Verifiko te burimet zyrtare</p>
          <p className="leading-relaxed">
            Afatet, tarifat dhe kushtet e tregut të energjisë ndryshojnë. Për vendime konkrete, verifikoji
            te faqet zyrtare të KESCO, KOSTT dhe ZRRE, ose direkt me furnizuesin.
          </p>
        </div>
      </div>
    </div>
  )
}
