import { Card, CardContent } from '@/components/ui/card'
import { Wallet, Landmark, ExternalLink, CreditCard, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

const BANKS = [
  { name: 'BPB', full: 'Banka për Biznes', focus: 'SME dhe biznes komercial', url: 'https://bpbbank.com' },
  { name: 'NLB Prishtina', full: 'NLB Banka Sh.A.', focus: 'Universale, e madhe, e njohur në diasporë', url: 'https://nlb-prish.com' },
  { name: 'ProCredit', full: 'ProCredit Bank Kosovo', focus: 'SME me projekte të gjelbra dhe fabrikave', url: 'https://procreditbank-kos.com' },
  { name: 'Raiffeisen Bank', full: 'Raiffeisen Bank Kosovo', focus: 'SME dhe eksportues', url: 'https://raiffeisen-kosovo.com' },
  { name: 'TEB', full: 'TEB Banka Sh.A.', focus: 'Universale, kredi hipotekare, kartat premium', url: 'https://teb-kos.com' },
  { name: 'BKT', full: 'Banka Kombëtare Tregtare', focus: 'Prezencë e fortë nga Shqipëria, praktike për diasporën shqiptare', url: 'https://bkt-ks.com' },
]

const LOAN_TYPES = [
  { title: 'Kredi investive', desc: 'Për blerje pajisjesh, hapje fabrike, zgjerim. Afati 3-10 vjet. Interes 4-8%.' },
  { title: 'Kredi kapital qarkullues', desc: 'Për blerje malli, pagesa furnizuesve. Afati 6-18 muaj. Interes 5-9%.' },
  { title: 'Overdraft biznesi', desc: 'Rezervë e menjëhershme për fluks kesh. Interes më i lartë por fleksibël.' },
  { title: 'Kredi për eksportues', desc: 'Terms preferencial për bizneset që eksportojnë. Në disa raste me subvencion nga MZHR ose EU4Business.' },
  { title: 'Kredi mikro', desc: 'Për start-up dhe biznese të vogla. Shuma deri 25,000 EUR. Rregulla më të thjeshta.' },
  { title: 'Kredi me garanci FKGK', desc: 'Fondi Kosovar për Garantim garanton deri 80% të kredisë — kërkesa më të vogla për kolateral, interes më i ulët.' },
]

export default function BankaPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bankat</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Bankat komerciale kryesore në Kosovë dhe llojet e kredive që ofrojnë për SME. Krahaso ofertat
          para se të vendosësh.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Bankat komerciale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BANKS.map((b) => (
            <a key={b.name} href={b.url} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
              <div className="flex items-start gap-3">
                <Landmark className="h-5 w-5 text-[#1B4F72] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B4F72]">{b.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{b.full}</p>
                  <p className="text-xs text-gray-600 mt-2">{b.focus}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-[#2E86C1] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Llojet e kredive për biznes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {LOAN_TYPES.map((l) => (
            <Card key={l.title}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-[#1B4F72] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{l.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{l.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Këshilla praktike</p>
          <ul className="space-y-1 list-disc pl-5">
            <li>Kërko oferta nga të paktën 3 banka para se të nënshkruajsh</li>
            <li>Për SME, FKGK-ja mund të reduktojë interesin dhe kolateralin — pyet bankën</li>
            <li>Nëse ke qarkullim eksporti, thuaji bankës — shpesh ka terms preferenciale</li>
            <li>Kujdes nga komisionet e fshehura: pagesa vjetore, komision për shlyerje të hershme, sigurim</li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-400 max-w-3xl">
        Informatat mbi interesin dhe kushtet ndryshojnë shpesh — verifikoji direkt me bankën. KBH nuk është
        agjent bankar dhe nuk merr komision për referime.
      </p>
    </div>
  )
}
