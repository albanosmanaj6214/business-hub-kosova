import { ShieldCheck, HardHat, ClipboardCheck, Users, AlertTriangle, Stethoscope, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import NextLink from 'next/link'

export const dynamic = 'force-dynamic'

// Udhëzuesi i Sigurisë dhe Shëndetit në Punë (SSHP). Kornizë orientuese: detyrimet
// standarde + nga t'ia nisësh. Referencat ligjore të sakta, shumat e gjobave dhe
// formularët plotësohen VETËM pas verifikimit nga burimet zyrtare (Inspektorati i
// Punës / ministria përgjegjëse) — deri atëherë faqja e thotë hapur këtë.

const EKOSOVA_URL = 'https://ekosova.rks-gov.net'

const OBLIGATIONS: { icon: typeof ShieldCheck; title: string; text: string }[] = [
  { icon: ClipboardCheck, title: 'Vlerësimi i rrezikut', text: 'Çdo punëdhënës duhet të identifikojë rreziqet e vendit të punës (makineritë, kimikatet, puna në lartësi, ergonomia...) dhe t’i dokumentojë masat mbrojtëse.' },
  { icon: Users, title: 'Personi përgjegjës + trajnimet', text: 'Caktohet personi përgjegjës për SSHP dhe punëtorët trajnohen për rreziqet e punës së tyre — në fillim dhe në mënyrë periodike.' },
  { icon: HardHat, title: 'Pajisjet personale mbrojtëse', text: 'Punëdhënësi siguron pajisjet mbrojtëse pa pagesë për punëtorin (helmeta, doreza, syze, mbrojtëse dëgjimi...) sipas rrezikut të vendit të punës.' },
  { icon: AlertTriangle, title: 'Raportimi i aksidenteve', text: 'Aksidentet në punë raportohen sipas procedurës ligjore. Mbajtja e evidencës është detyrim i punëdhënësit.' },
  { icon: Stethoscope, title: 'Kontrollet mjekësore', text: 'Për vende pune me rrezik të shtuar kërkohen kontrolle mjekësore periodike të punëtorëve.' },
]

const START_STEPS: { title: string; text: string }[] = [
  { title: 'Fillo me vlerësimin e rrezikut', text: 'Kalo vend pas vendi punën tënde: çka mund të lëndojë dikë? Dokumentoje çdo rrezik dhe masën që e zvogëlon.' },
  { title: 'Cakto përgjegjësin për SSHP', text: 'Në biznese të vogla mund të jetë vetë pronari; në më të mëdha, një person i trajnuar ose shërbim i jashtëm i licencuar.' },
  { title: 'Trajno punëtorët dhe dokumento', text: 'Trajnimi bëhet para fillimit të punës dhe përsëritet. Mbaj lista të nënshkruara — kjo është dëshmia jote në inspektim.' },
  { title: 'Siguro pajisjet mbrojtëse', text: 'Sipas vlerësimit të rrezikut. Kontrollo rregullisht që përdoren realisht.' },
  { title: 'Përgatitu për inspektim', text: 'Inspektorati i Punës kontrollon dokumentacionin dhe kushtet reale. Mangësitë sjellin vërejtje dhe gjoba sipas ligjit.' },
]

export default function SiguriaNePunePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Siguria dhe Shëndeti në Punë</h1>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ky udhëzues është kornizë orientuese dhe është në proces verifikimi zyrtar (Inspektorati i
          Punës dhe legjislacioni i SSHP-së). Referencat ligjore të sakta, shumat e gjobave dhe formularët
          do të shtohen vetëm nga burimet zyrtare. Shërbimet elektronike i gjen edhe në{' '}
          <a href={EKOSOVA_URL} target="_blank" rel="noreferrer" className="font-semibold underline hover:no-underline">
            eKosova
          </a>.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Pse është e detyrueshme</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Siguria dhe shëndeti në punë është detyrim ligjor për çdo punëdhënës në Kosovë, pavarësisht
              madhësisë. Përtej ligjit: aksidentet kushtojnë — njerëzisht dhe financiarisht — dhe blerësit
              seriozë të eksportit i kontrollojnë kushtet e punës (auditimet sociale BSCI/SMETA, SCC në ndërtim).
            </p>
          </div>
          <div className="md:border-l md:border-gray-100 md:pl-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Kush të kontrollon</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Inspektorati i Punës mbikëqyr zbatimin: kontrollon dokumentacionin (vlerësimin e rrezikut,
              trajnimet, evidencat) dhe kushtet reale në terren. Mos-përmbushja sjell vërejtje dhe gjoba
              sipas ligjit.
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Detyrimet kryesore të punëdhënësit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OBLIGATIONS.map((o) => (
            <Card key={o.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <o.icon className="h-4 w-4 text-[#1B4F72]" />
                  <h3 className="text-sm font-semibold text-gray-900">{o.title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{o.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Nga t&apos;ia nisësh — korniza praktike</h2>
          <span className="text-xs text-gray-500">{START_STEPS.length} hapa</span>
        </div>
        <Card>
          <CardContent className="p-5">
            <ol className="space-y-3">
              {START_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex-none flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4F72] text-white text-xs font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-4">
              Bazat ligjore të sakta, shumat e gjobave dhe formularët zyrtarë: në proces verifikimi me
              burimet zyrtare. Do të plotësohen këtu sapo të konfirmohen.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Lidhje me pjesën tjetër të platformës</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <NextLink href="/dashboard/profili-kompanise" className="inline-flex items-center gap-1 text-[#1B4F72] hover:underline">
            Shëno ISO 45001 / SCC te certifikimet e profilit <ArrowRight className="h-3.5 w-3.5" />
          </NextLink>
          <span className="text-gray-300">·</span>
          <NextLink href="/dashboard/tatime" className="inline-flex items-center gap-1 text-[#1B4F72] hover:underline">
            Detyrimet ndaj ATK-së <ArrowRight className="h-3.5 w-3.5" />
          </NextLink>
        </div>
      </section>
    </div>
  )
}
