import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Receipt, FileText, Calendar, ClipboardCheck, ExternalLink, AlertTriangle,
  ChevronRight, CheckCircle2, TrendingUp, Users, Coins, FileCheck, Bell, Wallet,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const LAST_VERIFIED = '2026-06-15'
const OFFICIAL_URL = 'https://atk-ks.org'
const EDI_URL = 'https://edeklarimi.atk-ks.org'

interface Topic {
  icon: React.ComponentType<{ className?: string }>
  title: string
  summary: string
  content: {
    section: string
    text?: string
    list?: string[]
  }[]
  officialLink?: string
  lawRef?: string
}

const TOPICS: Topic[] = [
  {
    icon: FileCheck,
    title: 'Regjistrim dhe aktivizim në EDI',
    summary: 'EDI = e-Deklarimi. Portali online i ATK-së për të gjitha deklarimet dhe pagesat tatimore.',
    content: [
      {
        section: 'Cka është EDI',
        text: 'Sistemi elektronik i ATK-së. Aty deklaron TVSH-në, tatimin në fitim, tatimin në paga, kontributet pensionale, dhe paguan online. Aktualisht çdo biznes ligjërisht duhet të përdorë EDI (nuk pranohen më deklarime letër).',
      },
      {
        section: 'Kur të regjistrohesh',
        text: 'Menjëherë pas marrjes së certifikatës ARBK. Zakonisht brenda 15 ditëve nga fillimi i aktivitetit.',
      },
      {
        section: 'Si të regjistrohesh',
        list: [
          'Shko te ' + EDI_URL,
          'Kliko "Regjistrohu" dhe zgjidh "Tatimpagues i ri"',
          'Fut numrin fiskal (nga certifikata ARBK)',
          'Plotëso të dhënat e kontaktit dhe fjalëkalimin',
          'Konfirmo email-in dhe fillon procesi i verifikimit nga ATK',
          'ATK-ja verifikon dhe aktivizon llogarinë tënde (zakonisht 1-3 ditë pune)',
          'Kur llogaria të jetë aktive, mund të logohesh dhe fillon të deklarosh',
        ],
      },
      {
        section: 'Nëse ke probleme me aktivizimin',
        text: 'Shko fizikisht te zyra rajonale e ATK-së me certifikatën ARBK dhe letërnjoftim. Aty do të bëjnë aktivizimin manualisht dhe do të t\'i japin kredencialet fillestare.',
      },
    ],
    officialLink: EDI_URL,
    lawRef: 'Ligji Nr. 03/L-222 për Administratën Tatimore dhe Procedurat',
  },
  {
    icon: Users,
    title: 'Autorizim i kontabilistit',
    summary: 'Nëse kontabilisti do të deklarojë në emrin tënd, duhet të ketë autorizim të regjistruar te ATK.',
    content: [
      {
        section: 'Kush mund të autorizohet',
        text: 'Kontabilist i licencuar (i regjistruar te SHKÇAK — Shoqata e Kontabilistëve dhe Auditorëve). Verifikoje licencën para se të nënshkruajsh.',
      },
      {
        section: 'Dokumentet për autorizimin',
        list: [
          'Formulari i autorizimit (shkarkohet nga faqja e ATK-së ose merret te zyra)',
          'Kontrata mes biznesit dhe kontabilistit (opsionale por rekomandohet)',
          'Letërnjoftim i pronarit/drejtorit të biznesit',
          'Letërnjoftim + licenca e kontabilistit',
        ],
      },
      {
        section: 'Hap pas hapi',
        list: [
          'Përgatit formularin e autorizimit i plotësuar me të dhënat e të dyja palëve',
          'Nënshkruaje ti + kontabilisti',
          'Dërgoje te ATK — mund të dorëzohet fizikisht ose përmes EDI-t (nëse llogaria jote është aktive)',
          'ATK-ja verifikon dhe aktivizon autorizimin (1-3 ditë)',
          'Kontabilisti tani mund të kyçet në EDI me kredencialet e tij dhe të deklarojë për ty',
        ],
      },
      {
        section: 'Heqja e autorizimit',
        text: 'Nëse ndërron kontabilist ose s\'e do më, dërgo një kërkesë te ATK për "heqje autorizimi". Kontabilisti i vjetër humb qasjen menjëherë. Rekomandohet kjo para se t\'i japësh autorizimin të riut.',
      },
    ],
    officialLink: OFFICIAL_URL,
  },
  {
    icon: TrendingUp,
    title: 'TVSH (Tatimi mbi Vlerën e Shtuar)',
    summary: 'Aktualisht norma standarde 18%, e reduktuar 8% për disa mallra. Pragu i regjistrimit është 30,000 EUR qarkullim/vit.',
    content: [
      {
        section: 'Kush duhet të regjistrohet për TVSH',
        text: 'Çdo biznes që parashikon të kalojë 30,000 EUR qarkullim (jo fitim, por qarkullim total) në 12 muajt e ardhshëm. Nëse e kalon pragun gjatë vitit, regjistrohesh menjëherë. Ka edhe regjistrim vullnetar për biznese që janë nën pragun por duan të lëshojnë fatura me TVSH.',
      },
      {
        section: 'Normat e TVSH-së',
        list: [
          'Standarde: 18% (shumica e mallrave dhe shërbimeve)',
          'E reduktuar: 8% (produkte ushqimore bazike, medikamente, libra, energji, disa shërbime turistike)',
          'Zero: 0% (eksporti, disa transporte ndërkombëtare)',
          'Pa TVSH: shërbime bankare, sigurime, arsim, shëndetësi publike, spitalet',
        ],
      },
      {
        section: 'Deklarimi',
        list: [
          'Formulari mujor DPD (Deklarata Personale Deklarative)',
          'Afati: deri më datën 20 të muajit pasues (p.sh. TVSH e janarit → deri më 20 shkurt)',
          'Bëhet përmes EDI-t; kontabilisti të ndihmon',
          'Nëse ke dalje > hyrje (rimburzim), kërkohet një procedurë specifike me ATK',
        ],
      },
      {
        section: 'Faturat me TVSH',
        text: 'Fatura duhet të ketë: numër serik, datë, emrin dhe numrin fiskal të lëshuesit dhe të blerësit, përshkrimin, sasinë, çmimin pa TVSH, TVSH-në, dhe totalin. Faturat elektronike po bëhen gjithnjë e më standarde.',
      },
    ],
    officialLink: OFFICIAL_URL,
    lawRef: 'Ligji Nr. 05/L-037 për TVSH-në',
  },
  {
    icon: TrendingUp,
    title: 'Tatimi në fitim (korporativ)',
    summary: 'Aktualisht 10% mbi fitimin neto për shoqëritë tregtare (SH.P.K., Sh.A., dega e huaj).',
    content: [
      {
        section: 'Kush paguan',
        text: 'SH.P.K., Sh.A., dega e huaj, ortakëritë (nën disa kushte). Biznes Individual paguan tatim personal, jo korporativ.',
      },
      {
        section: 'Norma',
        text: '10% mbi fitimin neto (të ardhurat minus shpenzimet e njohura tatimore).',
      },
      {
        section: 'Deklarimi',
        list: [
          'Deklaratë tremujore paraprake (parapagesa)',
          'Deklaratë vjetore përfundimtare deri më 31 mars të vitit pasues',
          'Bëhet përmes EDI-t',
          'Nëse fitimi vjetor rezulton më i vogël se parapagesat, do të kesh kredit tatimor',
        ],
      },
      {
        section: 'Shpenzime të njohura vs të panjohura',
        text: 'Shpenzimet operative direkte, pagat, kontributet, blerjet me faturë origjinale — njihen. Shpenzime pa dokumentim, dhurata të mëdha, tatime dhe gjoba — nuk njihen. Konsulto kontabilistin për raste specifike.',
      },
    ],
    officialLink: OFFICIAL_URL,
    lawRef: 'Ligji Nr. 05/L-029 për Tatimin në të Ardhurat e Korporatave',
  },
  {
    icon: Users,
    title: 'Tatimi në paga + kontributet',
    summary: 'Sistemi progresiv: 0-4-8-10% për paga. Kontribute pensionale 5%+5% (punëdhënës + punonjës).',
    content: [
      {
        section: 'Tatimi në paga (progresive)',
        list: [
          '0 – 80 EUR/muaj: 0%',
          '80 – 250 EUR/muaj: 4%',
          '250 – 450 EUR/muaj: 8%',
          'Mbi 450 EUR/muaj: 10%',
        ],
      },
      {
        section: 'Kontributet pensionale (Trust)',
        text: 'Aktualisht 5% nga punëdhënësi + 5% nga punonjësi = 10% totale mbi pagën bruto. Kontributi shkon në Trustin e Kursimeve Pensionale të Kosovës.',
      },
      {
        section: 'Deklarimi dhe pagesa',
        list: [
          'Formular mujor për paga (DPP)',
          'Afati: deri më datën 15 të muajit pasues',
          'Pagesa e tatimit dhe kontributeve online përmes EDI-t',
          'Punonjësi duhet të jetë i regjistruar te ATK me kontratë pune para pagesës së parë',
        ],
      },
      {
        section: 'Kontrata e punës',
        text: 'Sipas Ligjit të Punës, çdo punonjës duhet të ketë kontratë me shkrim. Regjistroje kontratën te Inspektorati i Punës brenda 5 ditëve. Nëse kontrolli kap punonjës pa kontratë ose regjistrim, gjobat janë të konsiderueshme.',
      },
    ],
    officialLink: OFFICIAL_URL,
    lawRef: 'Ligji Nr. 05/L-028 për Tatimin në të Ardhurat Personale + Ligji për Trustin',
  },
  {
    icon: Calendar,
    title: 'Kalendari i afateve tatimore',
    summary: 'Afatet kryesore që s\'duhet t\'i humbësh — gjobat për vonesa janë ndëshkuese.',
    content: [
      {
        section: 'Afate mujore',
        list: [
          'Data 15: Deklarim + pagesë tatimi në paga + kontribute (për muajin paraardhës)',
          'Data 15: Deklarim + pagesë e kontributeve pensionale',
          'Data 20: Deklarim + pagesë TVSH (nëse je i regjistruar)',
        ],
      },
      {
        section: 'Afate tremujore',
        list: [
          '15 prill / 15 korrik / 15 tetor / 15 janar: Parapagesa e tatimit në fitim (për SH.P.K./Sh.A.)',
          '15 prill / 15 korrik / 15 tetor / 15 janar: Parapagesa e tatimit personal (për Biznes Individual)',
        ],
      },
      {
        section: 'Afate vjetore',
        list: [
          '31 mars: Deklarim përfundimtar i tatimit në fitim (për vitin paraprak)',
          '31 mars: Bilanci vjetor për SH.P.K./Sh.A.',
          '31 mars: Deklarimi personal për Biznes Individual dhe ortakëri',
          '30 prill: Regjistrim/rinovim i licencave sektoriale (kur aplikohet)',
        ],
      },
      {
        section: 'Nëse vonoheni',
        text: 'Gjobat për vonesë deklarimi fillojnë nga 5% të tatimit të papaguar dhe rriten çdo muaj. Interes gjyqësor mbi shumën e papaguar shtohet gjithashtu. Nëse harron një afat, dërgoje deklarimin dhe pagesën sa më shpejt për të minimizuar gjobat.',
      },
    ],
  },
  {
    icon: FileText,
    title: 'Dokumentet që duhen ruajtur në arkiv',
    summary: 'Ligji tatimor kërkon ruajtje 7 vjet (disa dokumente 10 vjet). Kontrolli tatimor mund të kërkohet çdo moment.',
    content: [
      {
        section: 'Dokumente të detyrueshme për ruajtje',
        list: [
          'Të gjitha faturat e blerjes dhe të shitjes (origjinale ose kopje elektronike të firmosura)',
          'Fletë-udhëtimet dhe fletë-hyrjet e mallrave',
          'Kontratat e furnizimit dhe të shitjes',
          'Vërtetime pagese dhe fletë-arka',
          'Dokumentet e importit/eksportit + deklaratat doganore',
          'Kontratat e punës + fletë-paga + regjistri i punonjësve',
          'Deklaratat tatimore dhe konfirmimet e pagesave (EDI ekstrakti)',
          'Bilancet vjetore + raportet e kontabilistit',
          'Dëshmi për amortizim të mjeteve',
          'Vendimet e Kuvendit / drejtorit që kanë efekt kontabilitar',
        ],
      },
      {
        section: 'Sa vjet',
        text: 'Rregulli i përgjithshëm: 7 vjet nga viti financiar në të cilin i përkasin. Për dokumente të lidhura me pasuri të paluajtshme ose transaksione komplekse: 10 vjet. Për punonjës (fletë-paga, kontrata): 10 vjet pas përfundimit të marrëdhënies.',
      },
      {
        section: 'Format i lejuar',
        text: 'Fizikisht (letër) ose elektronikisht (PDF të firmosur, backup i sigurt). Nëse i ruan elektronikisht, sigurohu që janë të lexueshëm dhe backup-uar. Faturat elektronike me firmë dixhitale janë tërësisht të pranueshme.',
      },
      {
        section: 'Kontrolli tatimor',
        text: 'ATK ka të drejtë të kontrollojë çdo dokumentacion brenda 6 vjetve pas dorëzimit të deklarimit vjetor (10 vjet në raste dyshimi për mashtrim tatimor). Nëse nuk mund të gjesh një dokument, gjoba mund të jetë e madhe — përderisa ATK e konsideron shpenzimin si "të pambështetur me dokument".',
      },
    ],
  },
  {
    icon: Bell,
    title: 'Arka fiskale — kur aplikohet',
    summary: 'Bizneset me shitje direkte kah konsumatori (retail, gastronomi, shërbime B2C) duhet të kenë arka fiskale.',
    content: [
      {
        section: 'Kush detyrohet',
        text: 'Bizneset që shesin direkt te konsumatori final (jo B2B) — dyqane, restorante, kafe, sallone, servisë auto, farmaci. Nëse shet vetëm B2B me fatura, arka fiskale nuk kërkohet.',
      },
      {
        section: 'Procesi',
        list: [
          'Bli arkën fiskale nga shitës i licencuar (~200-400 EUR sipas modelit)',
          'Regjistro arkën te ATK me formularin përkatës',
          'ATK e verifikon dhe e "sigilon" (aktivizon)',
          'Për çdo shitje kah konsumatori, lësho kupon fiskal nga arka',
          'Në fund të ditës, arka gjeneron një raport ditor (Z-raport)',
          'Raporti mujor total dërgohet automatikisht te ATK',
        ],
      },
      {
        section: 'Shkelja',
        text: 'Shitje pa lëshim të kuponit fiskal → gjobë. Kontrolle të papritura nga ATK janë të shpeshta te bizneset retail. Kupon fiskal duhet t\'i jepet blerësit edhe nëse s\'e kërkon.',
      },
    ],
    officialLink: OFFICIAL_URL,
  },
  {
    icon: Wallet,
    title: 'Pagesat dhe rimbursimet',
    summary: 'Si dhe kur paguhen tatimet + kur mund të kërkosh rimbursim (TVSH, tatim i mbipaguar).',
    content: [
      {
        section: 'Mënyra e pagesës',
        list: [
          'Përmes EDI-t: sistemi gjeneron urdhëresën, ti e paguan online ose te banka me kodin e barit',
          'Përmes bankës direkt me referencë tatimore (kërkon numrin fiskal + periudhën)',
          'Data e pagesës konsiderohet dita kur fondet mbërrijnë në llogarinë e ATK-së, jo dita kur ke dërguar',
        ],
      },
      {
        section: 'Rimbursim i TVSH-së',
        text: 'Nëse TVSH e paguar në hyrje (blerje) është më e madhe se TVSH e mbledhur në dalje (shitje), mund të kërkohet rimbursim ose të merret si kredit për muajin e ardhshëm. Kërkesa për rimbursim kaluar drejtpërdrejt kërkon dokumentim të plotë dhe zakonisht bëhet me ndihmën e kontabilistit.',
      },
      {
        section: 'Nëse ke mbipaguar',
        text: 'Kërkon kompensim me tatimet e ardhshme (më e thjeshtë) ose rimbursim në llogari bankare (kërkon më shumë kohë dhe dokumentim). Të dyja kërkohen përmes EDI-t.',
      },
    ],
    officialLink: OFFICIAL_URL,
  },
]

function TopicCard({ t }: { t: Topic }) {
  const Icon = t.icon
  return (
    <details className="rounded-xl border border-gray-200 bg-white group">
      <summary className="cursor-pointer p-4 flex items-start gap-3 hover:bg-gray-50 rounded-xl">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
          <Icon className="h-5 w-5 text-[#1B4F72]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{t.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{t.summary}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 mt-1" />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
        {t.content.map((sec, i) => (
          <div key={i}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{sec.section}</h4>
            {sec.text && <p className="text-sm text-gray-700 leading-relaxed">{sec.text}</p>}
            {sec.list && (
              <ul className="space-y-1.5 mt-2">
                {sec.list.map((item, j) => (
                  <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-[#1B4F72] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {(t.officialLink || t.lawRef) && (
          <div className="rounded-lg bg-[#1B4F72]/5 border border-[#1B4F72]/10 p-3 space-y-2">
            {t.officialLink && (
              <a href={t.officialLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#1B4F72] font-medium hover:text-[#2E86C1]">
                Portal zyrtar ATK <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {t.lawRef && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Bazë ligjore:</span> {t.lawRef}
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  )
}

export default function TatimeGuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Udhëzuesi Tatimor (ATK)</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Administrata Tatimore e Kosovës. EDI (e-Deklarimi), TVSH, tatim në fitim, tatim në paga,
          kontribute pensionale, arkat fiskale, arkiva dhe kalendari i afateve. Portali zyrtar:{' '}
          <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline">atk-ks.org</a>.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Verifiko normat dhe pragjet aktuale</p>
          <p>
            Udhëzuesi bazohet në rregullimet deri më <strong>{LAST_VERIFIED}</strong>. Normat dhe pragjet mund të
            ndryshohen me ligj. Për vendime tatimore konkrete, konsulto{' '}
            <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="underline font-medium">portalin zyrtar</a>{' '}
            ose kontabilistin tënd.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Temat kryesore</h2>
          <span className="text-xs text-gray-500">{TOPICS.length} tema</span>
        </div>
        <div className="space-y-2">
          {TOPICS.map((t) => <TopicCard key={t.title} t={t} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Kontrolli tatimor — çka të presësh</h2>
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-gray-700">
              ATK-ja ka të drejtë të bëjë kontroll tatimor te çdo biznes, të planifikuar ose të papritur.
              Ja çka duhet të kesh gati:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                'Të gjitha faturat (blerje + shitje) të organizuara sipas periudhës',
                'Deklarimet tatimore dhe konfirmimet e pagesave',
                'Kontratat e punës + fletë-paga',
                'Regjistër i inventarit',
                'Bilanci dhe llogaria e fitim-humbjes për periudhën në kontroll',
                'Për arkat fiskale: Z-raportet ditore + raportet mujore',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
              <strong>Këshillë praktike:</strong> Kontrollet e papritura ndodhin. Ki dokumentacionin e organizuar
              gjithmonë. Nëse inspektori kërkon një dokument që s&apos;e ke menjëherë, mund të kërkosh afat 3-5 ditë
              për ta sjellë — por vetëm nëse s&apos;është nën detyrimin e mbajtjes në vend.
            </div>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-gray-400 max-w-3xl">
        Ky udhëzues nuk zëvendëson këshillën e kontabilistit. Për situata specifike (raste komplekse, kontrolle,
        gjoba), konsulto profesionist të licencuar. Baza ligjore kryesore: Ligji Nr. 03/L-222 (Administrata),
        Ligji Nr. 05/L-037 (TVSH), Ligji Nr. 05/L-029 (Tatimi Korporativ), Ligji Nr. 05/L-028 (Tatimi Personal).
        Data e verifikimit: {LAST_VERIFIED}.
      </p>
    </div>
  )
}
