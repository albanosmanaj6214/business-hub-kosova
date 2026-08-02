import { FileText, ShieldCheck, Globe, Lightbulb, PenTool, MapPin, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import NextLink from 'next/link'

export const dynamic = 'force-dynamic'

// Udhëzuesi i pronësisë industriale (KIPA). PËRMBAJTJA: kornizë orientuese; hapat,
// tarifat dhe afatet e sakta plotësohen VETËM nga burimet zyrtare të KIPA-s (rregulli
// i platformës: procedurat vetëm nga burime zyrtare). Deri atëherë, çdo hap mban
// shënimin e verifikimit dhe faqja e thotë hapur këtë.

const EKOSOVA_URL = 'https://ekosova.rks-gov.net'

interface IpKind {
  icon: typeof FileText
  title: string
  what: string
  example: string
}

const IP_KINDS: IpKind[] = [
  {
    icon: ShieldCheck,
    title: 'Marka tregtare',
    what: 'Mbron emrin, logon ose shenjën që dallon produktet/shërbimet e tua nga të tjerët. Mbrojtja është territoriale dhe rinovohet periodikisht.',
    example: 'P.sh. emri dhe logoja e produktit tënd ushqimor, linja e veshjeve, apo emri i software-it.',
  },
  {
    icon: Lightbulb,
    title: 'Patenta',
    what: 'Mbron një shpikje teknike të re (produkt ose proces) për një periudhë të kufizuar, në këmbim të publikimit të saj.',
    example: 'P.sh. një mekanizëm i ri prodhimi, një përbërje apo pajisje që e ke zhvilluar vetë.',
  },
  {
    icon: PenTool,
    title: 'Dizajni industrial',
    what: 'Mbron pamjen e jashtme të produktit: formën, konturet, ngjyrat, teksturën.',
    example: 'P.sh. dizajni i një mobiljeje, i një ambalazhi ose i një këpuce.',
  },
  {
    icon: MapPin,
    title: 'Treguesit gjeografikë',
    what: 'Mbrojnë emërtimet e produkteve që lidhen me një origjinë të caktuar dhe cilësinë që vjen prej saj.',
    example: 'P.sh. produkte tradicionale me origjinë të njohur rajonale.',
  },
]

// Korniza e mbrojtjes së markës — hapat standardë; detajet e sakta (formularët,
// tarifat, afatet e kundërshtimit) verifikohen te KIPA para publikimit final.
const TRADEMARK_STEPS: { title: string; text: string }[] = [
  { title: 'Kërkimi paraprak', text: 'Para se të aplikosh, kontrollo a ekziston një markë e njëjtë ose e ngjashme në regjistrin e markave. Kjo shmang refuzimin dhe konfliktet e mëvonshme.' },
  { title: 'Përgatitja e aplikimit', text: 'Përcakto saktë shenjën (fjalë, logo, ose kombinim) dhe listën e mallrave/shërbimeve që do të mbulojë marka, të grupuara sipas klasave ndërkombëtare të Nicës.' },
  { title: 'Dorëzimi i aplikimit në KIPA', text: 'Aplikimi dorëzohet në Agjencinë e Pronësisë Industriale me formularin përkatës dhe pagesën e tarifës.' },
  { title: 'Shqyrtimi', text: 'KIPA kontrollon formalisht aplikimin (dokumentet, klasat) dhe pastaj substancialisht (a mund të regjistrohet shenja).' },
  { title: 'Publikimi dhe kundërshtimet', text: 'Marka publikohet në buletinin zyrtar; palët e treta kanë një afat për kundërshtim nëse pretendojnë të drejta më të hershme.' },
  { title: 'Regjistrimi dhe rinovimi', text: 'Pas kalimit të afatit të kundërshtimeve lëshohet certifikata. Marka rinovohet periodikisht — shëno afatin që të mos humbësh mbrojtjen.' },
]

export default function KipaGuidePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Prona industriale — KIPA</h1>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ky udhëzues është kornizë orientuese dhe është në proces verifikimi zyrtar hap pas hapi me
          burimet e KIPA-s (Agjencia e Pronësisë Industriale). Para se të veprosh, konfirmoji hapat,
          tarifat dhe afatet te burimi zyrtar — përfshirë shërbimet në{' '}
          <a href={EKOSOVA_URL} target="_blank" rel="noreferrer" className="font-semibold underline hover:no-underline">
            eKosova
          </a>.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Çka është KIPA</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Agjencia e Pronësisë Industriale (nën ministrinë përgjegjëse për industrinë dhe tregtinë)
              regjistron dhe administron markat tregtare, patentat, dizajnet industriale dhe treguesit
              gjeografikë në Kosovë.
            </p>
          </div>
          <div className="md:border-l md:border-gray-100 md:pl-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Pse të intereson</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Emri dhe logoja janë pasuri e biznesit. Pa regjistrim, kushdo mund t&apos;i përdorë — dhe
              në eksport, blerësit seriozë presin markë të mbrojtur. Mbrojtja në Kosovë është hapi i parë;
              për tregjet e BE-së dhe më gjerë ka rrugë të veçanta.
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Çka mund të mbrosh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IP_KINDS.map((k) => (
            <Card key={k.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <k.icon className="h-4 w-4 text-[#1B4F72]" />
                  <h3 className="text-sm font-semibold text-gray-900">{k.title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{k.what}</p>
                <p className="text-xs text-gray-500 mt-1.5">{k.example}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Si mbrohet marka tregtare — korniza hap pas hapi</h2>
          <span className="text-xs text-gray-500">{TRADEMARK_STEPS.length} hapa</span>
        </div>
        <Card>
          <CardContent className="p-5">
            <ol className="space-y-3">
              {TRADEMARK_STEPS.map((s, i) => (
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
              Formularët, tarifat dhe afatet e sakta: në proces verifikimi me burimet zyrtare të KIPA-s.
              Do të plotësohen këtu sapo të konfirmohen.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Mbrojtja jashtë Kosovës</h2>
        <Card>
          <CardContent className="p-5 space-y-2 text-sm text-gray-600 leading-relaxed">
            <p>
              Marka e regjistruar në Kosovë vlen vetëm në Kosovë. Nëse eksporton, shiko mbrojtjen edhe në
              tregjet ku shet: në BE përmes markës së Bashkimit Evropian (EUIPO), dhe ndërkombëtarisht
              përmes sistemeve shumëpalëshe të regjistrimit.
            </p>
            <p className="flex items-center gap-1.5 text-gray-700">
              <Globe className="h-4 w-4 text-[#1B4F72]" />
              Rrugën e saktë për secilin treg — dhe a mund të aplikosh nga Kosova — verifikoje me KIPA-n
              ose një përfaqësues të autorizuar të pronësisë industriale.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Lidhje me pjesën tjetër të platformës</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <NextLink href="/dashboard/arbk" className="inline-flex items-center gap-1 text-[#1B4F72] hover:underline">
            Regjistrimi i biznesit (ARBK) <ArrowRight className="h-3.5 w-3.5" />
          </NextLink>
          <span className="text-gray-300">·</span>
          <NextLink href="/dashboard/profili-kompanise" className="inline-flex items-center gap-1 text-[#1B4F72] hover:underline">
            Shëno mbrojtjen IP te certifikimet e profilit <ArrowRight className="h-3.5 w-3.5" />
          </NextLink>
        </div>
      </section>
    </div>
  )
}
