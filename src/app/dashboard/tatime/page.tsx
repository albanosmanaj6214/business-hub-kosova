import Link from 'next/link'
import NextLink from 'next/link'
import { Lock as LockIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Receipt, FileText, Calendar, ExternalLink, AlertTriangle, ChevronRight,
  CheckCircle2, TrendingUp, Users, Coins, FileCheck, Bell, Wallet, Info,
  Monitor, Globe, Building, Phone,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

import { fullAccessForSession } from '@/lib/guide-access'


const LAST_VERIFIED = '2026-07-01'
const OFFICIAL_URL = 'https://www.atk-ks.org'
const EDI_URL = 'https://edeklarimi.atk-ks.org'
const EKOSOVA_URL = 'https://ekosova.rks-gov.net'

interface Topic {
  icon: React.ComponentType<{ className?: string }>
  title: string
  intro: string
  content: {
    section: string
    text?: string
    list?: string[]
  }[]
  goodToKnow?: string[]
  officialLink?: string
  lawRef?: string
}

const OFFICES = [
  { region: 'Prishtinë (Qendra)', address: 'Rruga UÇK, Prishtinë' },
  { region: 'Prizren', address: 'Zyra Rajonale ATK, Prizren' },
  { region: 'Pejë', address: 'Zyra Rajonale ATK, Pejë' },
  { region: 'Ferizaj', address: 'Zyra Rajonale ATK, Ferizaj' },
  { region: 'Gjilan', address: 'Zyra Rajonale ATK, Gjilan' },
  { region: 'Mitrovicë', address: 'Zyra Rajonale ATK, Mitrovicë' },
  { region: 'Gjakovë', address: 'Zyra Rajonale ATK, Gjakovë' },
]

const TOPICS: Topic[] = [
  {
    icon: FileCheck,
    title: 'Regjistrim dhe aktivizim në EDI',
    intro: 'EDI, ose "e-Deklarimi", është sistemi elektronik i ATK-së ku bëhen të gjitha deklarimet dhe pagesat tatimore. Pas certifikatës ARBK, ti je automatikisht i regjistruar te ATK — por qasja online në EDI duhet të aktivizohet veçmas. Pa këtë, s\'mund të deklarosh asgjë.',
    content: [
      {
        section: 'Kur ta bësh',
        text: 'Menjëherë pas marrjes së certifikatës nga ARBK. Sa më shpejt aq më mirë sepse deklarimet fillojnë brenda muajve të parë edhe nëse s\'ke ende qarkullim (deklaron "zero aktivitet").',
      },
      {
        section: 'Ku mund të bëhet',
        list: [
          'Online direkt te ' + EDI_URL,
          'Përmes portalit qeveritar eKosova (' + EKOSOVA_URL + ')',
          'Fizikisht në zyrat rajonale të ATK-së, të cilat i kemi listuar më poshtë',
        ],
      },
      {
        section: 'Hap pas hapi (online)',
        list: [
          'Shko te ' + EDI_URL,
          'Kliko "Regjistrohu" ose "Kërko qasje"',
          'Fut numrin fiskal nga certifikata ARBK dhe të dhënat e biznesit',
          'Krijo fjalëkalimin dhe konfirmo email-in',
          'Prit verifikimin nga ATK — zakonisht 1-3 ditë pune, të vjen konfirmim me email',
          'Kur llogaria të jetë aktive, mund të kyçesh dhe të fillon të deklarosh',
        ],
      },
      {
        section: 'Nëse aktivizimi online s\'punon',
        text: 'Ka raste ku ATK kërkon të vish personalisht për verifikim (kryesisht nëse s\'ka përputhje mes të dhënave). Në atë rast, shko te zyra rajonale e ATK me certifikatën ARBK dhe letërnjoftim. Aktivizimin manual e bëjnë menjëherë dhe të japin kredencialet.',
      },
    ],
    goodToKnow: [
      'EDI-t nuk mund t\'i shmangesh — çdo deklarim tatimor bëhet përmes tij tani.',
      'Nëse do të përdorësh kontabilist të jashtëm, edhe ai do t\'i duhet qasje me autorizim — shiko temën më poshtë.',
      'Ruaje fjalëkalimin në një vend të sigurt. Rikuperimi është procedurë me identifikim personal.',
    ],
    officialLink: EDI_URL,
    lawRef: 'Ligji Nr. 03/L-222 për Administratën Tatimore dhe Procedurat',
  },
  {
    icon: Users,
    title: 'Autorizim i kontabilistit',
    intro: 'Nëse s\'do t\'i bësh vetë deklarimet tatimore (shumica e bizneseve nuk e bëjnë vetë), kontabilisti yt duhet të jetë i autorizuar zyrtarisht te ATK për të vepruar në emrin tënd. Pa autorizim, ai s\'mund të hyjë në sistemin tënd EDI.',
    content: [
      {
        section: 'Kush mund të autorizohet',
        text: 'Kontabilist i licencuar zyrtarisht, i regjistruar te SHKÇAK (Shoqata e Kontabilistëve dhe Auditorëve të Certifikuar të Kosovës). Verifikoje licencën para se të nënshkruash — mund të kërkosh dëshmi ose ta gjesh online.',
      },
      {
        section: 'Dokumentet',
        list: [
          'Formulari i autorizimit (shkarkohet nga faqja e ATK-së ose merret te zyra)',
          'Kontratë ndihmëse mes biznesit tënd dhe kontabilistit (opsionale por rekomandohet)',
          'Letërnjoftimi i pronarit ose drejtorit të biznesit',
          'Letërnjoftimi i kontabilistit + numri i tij fiskal',
        ],
      },
      {
        section: 'Hap pas hapi',
        list: [
          'Plotëso formularin e autorizimit me të dhënat e të dyja palëve',
          'Nënshkruaje ti (si pronar/drejtor) dhe kontabilisti',
          'Dorëzoje te ATK — mund të bëhet fizikisht në zyrë ose online përmes EDI-t nëse llogaria jote është aktive',
          'ATK-ja verifikon dhe aktivizon autorizimin (zakonisht 1-3 ditë pune)',
          'Pas aktivizimit, kontabilisti mund të hyjë me kredencialet e tij në sistemin tënd EDI dhe të deklarojë për ty',
        ],
      },
      {
        section: 'Kur don ta ndryshosh kontabilistin',
        text: 'Nëse ndërron kontabilist, ti duhet të heqësh autorizimin e të vjetrit para se t\'i japësh autorizim të riut. Kjo bëhet me kërkesë të thjeshtë te ATK ose përmes EDI-t. Kontabilisti i vjetër humb qasjen menjëherë kur autorizimi hiqet.',
      },
    ],
    goodToKnow: [
      'Autorizimi nuk i jep kontabilistit të drejtë të bëjë çdo veprim — vetëm ato tatimore. Nuk mund të hapë llogari bankare ose të firmosë kontrata në emrin tënd.',
      'Nëse ke dyshime për punën e kontabilistit, kërko qasje te llogaria jote EDI dhe kontrollo deklarimet vetë ose me ndihmë të pavarur.',
    ],
    officialLink: OFFICIAL_URL,
  },
  {
    icon: TrendingUp,
    title: 'TVSH — Tatimi mbi Vlerën e Shtuar',
    intro: 'TVSH-ja është tatimi që bizneset i mbledhin nga blerësit dhe ia paguajnë ATK-së. Ligjërisht, ti duhet të regjistrohesh për TVSH kur qarkullimi vjetor kalon 30,000 euro. Nëse je nën këtë prag, mund të regjistrohesh vullnetarisht — kjo është e dobishme kur furnizuesit e tu janë biznese të mëdha që lëshojnë fatura me TVSH.',
    content: [
      {
        section: 'Kush duhet të regjistrohet detyrimisht',
        text: 'Çdo biznes që parashikon të kalojë ose ka kaluar 30,000 euro qarkullim gjatë 12 muajve. Vini re: bëhet fjalë për qarkullimin (të gjitha shitjet), jo për fitimin. Nëse e kalon pragun gjatë vitit, duhet të regjistrohesh menjëherë brenda 15 ditësh.',
      },
      {
        section: 'Regjistrimi vullnetar (opsional)',
        text: 'Nëse je nën 30,000 euro qarkullim, mund të regjistrohesh vullnetarisht. Kjo është zgjedhje strategjike: ti mund të kërkosh mbrapa TVSH-në që ke paguar në blerje. Për biznese që blejnë shumë me TVSH (materiale prodhimi, pajisje), regjistrimi vullnetar shpesh është i dobishëm.',
      },
      {
        section: 'Normat aktuale',
        list: [
          'Norma standarde: 18% (shumica e mallrave dhe shërbimeve)',
          'Norma e reduktuar: 8% (ushqime bazike, produkte bujqësore, shërbime hotelierie/turizëm, medikamente, libra)',
          'Norma zero: 0% (eksporti dhe disa transporte ndërkombëtare)',
          'Pa TVSH: shërbime bankare, sigurime, arsim, shëndetësi publike',
        ],
      },
      {
        section: 'Si deklarohet',
        list: [
          'Formulari mujor DPD (Deklarata Personale Deklarative) përmes EDI-t',
          'Afati: deri më datën 20 të muajit pasues (p.sh. TVSH e janarit deklarohet deri më 20 shkurt)',
          'Kontabilisti të ndihmon me kalkulimin — TVSH mbi shitjet minus TVSH mbi blerjet = TVSH për t\'u paguar (ose për t\'u kthyer)',
          'Nëse blerjet me TVSH ishin më të mëdha se shitjet, atëherë ke "kredit" për muajin e ardhshëm ose mund të kërkosh rimbursim',
        ],
      },
      {
        section: 'Faturat me TVSH',
        text: 'Kur je i regjistruar për TVSH, faturat e tua duhet të jenë me format specifik: numër serik unik, datë, të dhënat e tua + të blerësit (me numër fiskal), përshkrimi i mallit/shërbimit, sasia, çmimi pa TVSH, TVSH-ja, dhe totali. Faturat elektronike janë duke u bërë standarde — verifiko me kontabilistin nëse duhet të përdorësh sistem elektronik fatuirimi.',
      },
    ],
    goodToKnow: [
      'Kalimi i pragut 30,000 euro llogaritet për 12 muaj rrotullues, jo vetëm për vitin kalendarik. Kujdes kur je afër pragut.',
      'Nëse eksporton, TVSH-ja në faturat e tua duhet të jetë 0% dhe fatura duhet të thotë qartë: "0% TVSH — eksport i liruar sipas Ligjit 05/L-037".',
      'Pas kalimit të pragut, s\'mund të "dalësh" nga TVSH-ja lehtë. Është vendim afatgjatë.',
    ],
    officialLink: OFFICIAL_URL,
    lawRef: 'Ligji Nr. 05/L-037 për TVSH-në',
  },
  {
    icon: TrendingUp,
    title: 'Tatimi në fitim (korporativ) — 10%',
    intro: 'Nëse ke SH.P.K. ose Sh.A. ose degë të huaj, mbi fitimin neto të biznesit paguan tatim 10%. Kjo është një nga normat më të ulëta në Evropë — për krahasim, Gjermania ka rreth 30%, Austria 25%, Zvicra 15-20%. Kjo është arsyeja pse Kosova është destinacion tërheqës për investime.',
    content: [
      {
        section: 'Kush paguan',
        text: 'SH.P.K., Sh.A., degët e huaja, dhe disa lloje ortakërish (nën kushte specifike). Bizneset Individuale nuk paguajnë "tatim korporativ" — ato paguajnë tatim personal mbi të ardhurat e biznesit.',
      },
      {
        section: 'Si llogaritet',
        list: [
          '10% mbi fitimin neto (të ardhurat totale minus shpenzimet e njohura tatimore)',
          'Fitimi neto NUK është qarkullimi — është ajo çka mbetet pas zbritjes së shpenzimeve legjitime',
          'Shpenzime të njohura: pagat e punonjësve, kontributet, blerjet me faturë, qiraja, energjia, marketingu, amortizimi i pajisjeve, etj.',
          'Shpenzime të panjohura: dhurata të mëdha pa dokumentim, gjoba, tatime, shpenzime pa faturë',
        ],
      },
      {
        section: 'Deklarimi + afatet',
        list: [
          'Deklarime tremujore (parapagesa) — 15 prill / 15 korrik / 15 tetor / 15 janar',
          'Deklarim vjetor përfundimtar — deri më 31 mars të vitit pasues',
          'Bëhet përmes EDI-t nga kontabilisti yt',
          'Nëse fitimi vjetor rezulton më i vogël se parapagesat gjatë vitit, atëherë ke "kredit tatimor" për vitin tjetër ose mund të kërkosh rimbursim',
        ],
      },
    ],
    goodToKnow: [
      'Nëse biznesi është në humbje gjatë vitit, humbja mund të "bartet" për deri në 6 vjet — pra vjet tjetër kur ke fitim, mund të zbresësh humbjet e vjeteve të mëparshme.',
      'Ki një faturë për çdo shpenzim që deklaron. Kontrolli tatimor nuk pranon "kam paguar cash". Është për të mbrojtur ty vetë.',
      'Nëse ke shpenzime të mëdha personale që s\'lidhen me biznesin, mos i deklaro si biznesore. Në kontroll, ATK i verifikon dhe të gjobit me interes për shpenzime të pambështetura.',
    ],
    officialLink: OFFICIAL_URL,
    lawRef: 'Ligji Nr. 05/L-029 për Tatimin në të Ardhurat e Korporatave',
  },
  {
    icon: Users,
    title: 'Tatimi në paga + kontributet pensionale',
    intro: 'Për çdo punonjës që punëson, ke detyrim të llogaritësh dhe të derdhësh: tatimin në paga (progresiv) + kontributet pensionale në Trust. Këto bëhen çdo muaj deri më datën 15.',
    content: [
      {
        section: 'Tatimi në paga (progresiv)',
        text: 'Norma varet nga niveli i pagës. Deri në 960 euro të ardhura vjetore (rreth 80 euro/muaj) është zero. Pastaj rritet me shkallë:',
        list: [
          '0 – 80 EUR/muaj (0 – 960 EUR/vit): 0%',
          '80 – 250 EUR/muaj: 4% mbi pjesën që kalon 80',
          '250 – 450 EUR/muaj: 8% mbi pjesën që kalon 250',
          'Mbi 450 EUR/muaj: 10% mbi pjesën që kalon 450',
        ],
      },
      {
        section: 'Kontributet pensionale (Trusti)',
        text: 'Sistemi pensional i Kosovës është "3-shtyllash": kontributi obligator + shtesa vullnetare. Për kontributin obligator, ti si punëdhënës derdh 5% + punonjësi derdh 5% mbi pagën bruto. Totali 10% shkon në Trustin e Kursimeve Pensionale të Kosovës — një llogari personale që ai/ajo do ta marrë kur të dalë në pension.',
      },
      {
        section: 'Deklarimi mujor',
        list: [
          'Formulari mujor për paga përmes EDI-t',
          'Afati kritik: deri më datën 15 të muajit pasues (p.sh. paga e janarit deklarohet deri më 15 shkurt)',
          'Pagesa e tatimit dhe kontributeve online përmes EDI-t ose bankës',
          'Ne të njëjtin dokument deklaron edhe emrin/ID-në e punonjësit dhe pagën bruto',
        ],
      },
      {
        section: 'Regjistrimi i punonjësit',
        text: 'Përpara pagesës së parë, punonjësi duhet të jetë i regjistruar te ATK me kontratë pune. Regjistrimi bëhet brenda 5 ditësh pune nga fillimi i punës. Nëse kontrolli i inspektimit të punës kap punonjës të papërregjistruar, gjobat janë të konsiderueshme — dhe punonjësi humb të drejtat pensionale për atë periudhë.',
      },
    ],
    goodToKnow: [
      'Paga minimale në Kosovë ndryshon me vendim të Qeverisë. Verifikoje aktualen para se të nënshkruash kontratë. Ligji parasheh që s\'mund të paguash më pak se paga minimale.',
      'Kontratën e punës duhet ta regjistrosh edhe te Inspektorati i Punës, jo vetëm te ATK.',
      'Nëse punonjësi jep dorëheqjen ose largohet, duhet ta çregjistrosh menjëherë te ATK. Përndryshe, tatimet dhe kontributet vazhdojnë të llogariten.',
    ],
    officialLink: OFFICIAL_URL,
    lawRef: 'Ligji Nr. 05/L-028 për Tatimin në të Ardhurat Personale + Ligji Nr. 04/L-101 për Fondet Pensionale të Kosovës',
  },
  {
    icon: Calendar,
    title: 'Kalendari i afateve tatimore',
    intro: 'Afatet janë strikte dhe gjobat për vonesa fillojnë nga 5% të shumës së papaguar dhe rriten çdo muaj. Ja afatet kryesore që s\'duhet t\'i harrosh:',
    content: [
      {
        section: 'Afate mujore (të përsëritshme çdo muaj)',
        list: [
          'Data 15: Deklarim + pagesë e tatimit në paga + kontributeve pensionale për muajin paraardhës',
          'Data 20: Deklarim + pagesë e TVSH-së (nëse je i regjistruar) për muajin paraardhës',
        ],
      },
      {
        section: 'Afate tremujore (parapagesa e tatimit vjetor)',
        list: [
          '15 prill: Parapagesa për tremujorin e parë (janar-mars)',
          '15 korrik: Parapagesa për tremujorin e dytë (prill-qershor)',
          '15 tetor: Parapagesa për tremujorin e tretë (korrik-shtator)',
          '15 janar: Parapagesa për tremujorin e katërt (tetor-dhjetor)',
        ],
      },
      {
        section: 'Afate vjetore',
        list: [
          '31 mars: Deklarim përfundimtar i tatimit në fitim për vitin paraprak (SH.P.K./Sh.A. si CD)',
          '31 mars: Bilanci vjetor për SH.P.K./Sh.A.',
          '31 mars: Deklarimi personal (PD) për Biznes Individual dhe ortakëri',
          'Marsi është muaj i ngjeshur për kontabilistët — mos prit fund të muajit',
        ],
      },
      {
        section: 'Nëse vonoheni',
        text: 'Gjobat për vonesë të deklarimit fillojnë nga 5% të shumës së papaguar dhe rriten. Interes gjyqësor mbi shumën e papaguar shtohet gjithashtu. Nëse harron një afat, dërgo deklarimin dhe pagesën sa më shpejt që të jetë e mundur — sa më herët e paguan, aq më pak gjobë.',
      },
    ],
    goodToKnow: [
      'Data 15 dhe data 20 janë datat kryesore. Rezervoji në kalendar me alarm 2 ditë para.',
      'Nëse data 15 ose 20 është fundjavë, afati zhvendoset te dita e parë e punës.',
      'Kontabilisti është përgjegjës për afatet, por përgjegjësia tatimore ligjore mbetet e jotja si pronar/drejtor.',
    ],
  },
  {
    icon: FileText,
    title: 'Dokumentet që duhen ruajtur në arkiv',
    intro: 'Ligji tatimor kërkon që të ruash dokumentet për një kohë të gjatë — normalisht 6 vjet, disa kategori 10 vjet. Kontrolli tatimor mund të vijë në çdo moment brenda kësaj periudhe, dhe nëse s\'ke dokumentet, konsiderohesh sikur nuk i ke pasur ato transaksione — me pasoja financiare të mëdha.',
    content: [
      {
        section: 'Dokumente të detyrueshme',
        list: [
          'Të gjitha faturat e blerjes dhe të shitjes (origjinale ose kopje elektronike me firmë)',
          'Fletë-udhëtimet dhe fletë-hyrjet e mallrave',
          'Kontratat e furnizimit dhe të shitjes',
          'Vërtetime pagese dhe fletë-arka',
          'Dokumentet e importit/eksportit + deklaratat doganore',
          'Kontratat e punës + fletë-paga + regjistri i punonjësve',
          'Deklaratat tatimore dhe konfirmimet e pagesave (ekstrakte nga EDI)',
          'Bilancet vjetore + raportet e kontabilistit',
          'Dëshmi për amortizimin e pajisjeve',
          'Vendime të Kuvendit ose drejtorit që kanë efekt kontabilitar',
        ],
      },
      {
        section: 'Sa vjet duhen ruajtur',
        text: 'Rregulli i përgjithshëm: 6 vjet nga viti financiar në të cilin i përkasin. Për dokumente të lidhura me pasuri të paluajtshme ose transaksione komplekse, apo në raste dyshimi për mashtrim tatimor — 10 vjet. Për punonjës (kontrata, fletë-paga), 10 vjet pas përfundimit të marrëdhënies.',
      },
      {
        section: 'Formati',
        text: 'Mund t\'i ruash fizikisht (letër) ose elektronikisht (PDF të firmosur, backup i sigurt). Nëse elektronike, sigurohu që janë të lexueshëm dhe të backup-uar. Faturat elektronike me firmë dixhitale janë tërësisht të pranueshme dhe pak nga pak po bëhen standarde.',
      },
      {
        section: 'Kontrolli tatimor',
        text: 'ATK ka të drejtë të kontrollojë çdo dokumentacion brenda 6 vjetve pas dorëzimit të deklarimit vjetor. Nëse gjenden mashtrime tatimore, afati zgjatet në 10 vjet. Nëse s\'mund të gjesh një dokument gjatë kontrollit, ATK e konsideron shpenzimin si "të pambështetur" dhe të tarifon tatim + gjobë + interes për të.',
      },
    ],
    goodToKnow: [
      'Organizoji dokumentet sipas muajit dhe llojit. Kur vjen kontrolli, koha e kërkimit të një dokumenti është kritike.',
      'Bëj backup elektronik për të gjitha dokumentet e letrës. Zjarr, ujë, humbje — s\'ka justifikime.',
      'Nëse mbyll biznesin, ke detyrim ligjor t\'i ruash dokumentet edhe pas mbylljes — deri sa të mbarojë afati.',
    ],
  },
  {
    icon: Bell,
    title: 'Arka fiskale — kur aplikohet',
    intro: 'Nëse shet direkt te konsumatori final (jo bizneseve tjera), duhet të kesh arkë fiskale. Kjo aplikohet për dyqane, restorante, kafe, sallone, servisë, farmaci — çdo biznes B2C. Nëse shet vetëm B2B me fatura, arka fiskale s\'kërkohet.',
    content: [
      {
        section: 'Kush duhet të ketë',
        text: 'Bizneset me shitje direkte drejt konsumatorit final. Këto janë kryesisht restorante, kafe, dyqane, sallone bukurimi, servisë të vetuarave, farmaci, dyqane veshjesh — çdo pikë ku klienti individual paguan në momentin e shërbimit.',
      },
      {
        section: 'Procesi hap pas hapi',
        list: [
          'Bli arkën fiskale nga shitës i licencuar (kosto zakonisht 200-400 euro sipas modelit)',
          'Regjistro arkën te ATK me formularin përkatës',
          'ATK e verifikon dhe e "sigilon" (aktivizon)',
          'Për çdo shitje kah konsumatori, arka gjeneron kupon fiskal',
          'Në fund të ditës, arka gjeneron një "Z-raport" (raport ditor)',
          'Raporti mujor total dërgohet automatikisht te ATK përmes lidhjes së arkës',
        ],
      },
      {
        section: 'Detyrimi ligjor',
        text: 'Sipas ligjit, kupon fiskal duhet të jepet TE ÇDO shitje edhe nëse klienti s\'e kërkon. Kontrollet e papritura nga ATK-ja janë të shpeshta — arka pa kupon fiskal ose shitje pa kupon ka gjoba të konsiderueshme.',
      },
    ],
    goodToKnow: [
      'Nëse arka prishet, njoftoji menjëherë ATK-në. Në raste emergjence, ka procedura të përkohshme.',
      'Kupon fiskal ka informata të kërkuara: emri i biznesit, numri fiskal, data, artikujt, TVSH-ja, totali.',
      'Nëse shet edhe online (e-commerce), verifiko me kontabilistin nëse duhet arkë fiskale online (fatura elektronike shpesh mjafton).',
    ],
    officialLink: OFFICIAL_URL,
  },
]

function TopicCard({ t }: { t: Topic }) {
  const Icon = t.icon
  return (
    <details className="rounded-xl border border-gray-200 border-l-4 border-l-[#1B4F72] bg-white group">
      <summary className="cursor-pointer p-4 flex items-start gap-3 hover:bg-gray-50 rounded-xl">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
          <Icon className="h-5 w-5 text-[#1B4F72]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{t.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{t.intro}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 mt-1" />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
        <div>
          <p className="text-sm text-gray-700 leading-relaxed">{t.intro}</p>
        </div>

        {t.content.map((sec, i) => (
          <div key={i}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{sec.section}</h4>
            {sec.text && <p className="text-sm text-gray-700 leading-relaxed">{sec.text}</p>}
            {sec.list && (
              <ul className="space-y-1.5 mt-2">
                {sec.list.map((item, j) => (
                  <li key={j} className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed">
                    <span className="text-[#1B4F72] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {t.goodToKnow && t.goodToKnow.length > 0 && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="h-4 w-4 text-blue-700" />
              <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Mirë të dish</h4>
            </div>
            <ul className="space-y-1.5">
              {t.goodToKnow.map((tip, i) => (
                <li key={i} className="text-xs text-blue-900 leading-relaxed flex items-start gap-1.5">
                  <span className="text-blue-700 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(t.officialLink || t.lawRef) && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2">
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

export default async function TatimeGuidePage() {
  const fullAccess = await fullAccessForSession()
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Udhëzuesit ATK</h1>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ky udhëzues është përmbledhje ndihmëse dhe është në proces verifikimi zyrtar hap pas hapi.
          Para se të veprosh, konfirmoji hapat te burimi zyrtar:{' '}
          <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="font-semibold underline hover:no-underline">
            {OFFICIAL_URL.replace('https://', '')}
          </a>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl leading-relaxed">
          Administrata Tatimore e Kosovës (ATK) është institucioni ku kalojnë të gjitha detyrimet tatimore
          të biznesit tënd. Këtu do të gjesh të gjitha temat kryesore — EDI, TVSH, tatim në fitim, paga,
          kontribute, dhe kalendarin e afateve — me shpjegime praktike hap-pas-hapi.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ku dhe si mund të deklarosh</h2>
        <p className="text-sm text-gray-700 mb-4 max-w-3xl leading-relaxed">
          Ke tri mënyra për të kryer detyrimet tatimore. E gjithë platforma e deklarimeve tani është elektronike
          (EDI) — pra edhe kur shkon fizikisht në zyrë, prapë ndihmoheni për të plotësuar sistemin online.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
                <Monitor className="h-5 w-5 text-[#1B4F72]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">EDI — e-Deklarimi</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                Sistemi kryesor për të gjitha deklarimet dhe pagesat tatimore. Nga shtëpia ose zyra, në çdo kohë.
                Aktualisht është obligative për shumicën e deklarimeve.
              </p>
              <a href={EDI_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
                edeklarimi.atk-ks.org <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
                <Globe className="h-5 w-5 text-[#1B4F72]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Përmes eKosova</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                Portali qeveritar që bashkon shumë shërbime shtetërore. Përfshin edhe disa shërbime të ATK-së.
                E njëjta llogari eKosova punon për ARBK dhe të tjera.
              </p>
              <a href={EKOSOVA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
                ekosova.rks-gov.net <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
                <Building className="h-5 w-5 text-[#1B4F72]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fizikisht në zyrat ATK</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                Nëse ke pyetje komplekse ose të duhet asistencë personale, mund të shkosh fizikisht në zyrën
                qendrore në Prishtinë ose në zyrat rajonale.
              </p>
              <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
                atk-ks.org <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Temat kryesore</h2>
          <span className="text-xs text-gray-500">{TOPICS.length} tema</span>
        </div>
        <div className="space-y-2">
          {TOPICS.map((t, i) => fullAccess || i < 2 ? <TopicCard key={t.title} t={t} /> : <LockedCard key={t.title} title={t.title} summary={t.intro} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Kontrolli tatimor — çka të presësh</h2>
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              ATK-ja ka të drejtë të bëjë kontroll tatimor te çdo biznes, të planifikuar ose të papritur.
              Kontrollet e papritura ndodhin — sidomos në sektorët retail, gastronomi, dhe tregti. Ja çka duhet
              ta kesh gjithmonë të organizuar:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                'Të gjitha faturat e blerjes dhe shitjes, të organizuara sipas muajit/periudhës',
                'Deklarimet tatimore dhe konfirmimet e pagesave (nga EDI-t)',
                'Kontratat e punës + fletë-paga + fletë-paguese',
                'Regjistër i inventarit dhe pajisjeve',
                'Bilanci dhe llogaria e fitim-humbjes për periudhën në kontroll',
                'Për arkat fiskale: Z-raportet ditore + raportet mujore',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 leading-relaxed">
              <strong>Këshillë praktike:</strong> Kontrolli tatimor s\'është për ta pasur frikë nëse punon me
              rregull. Kontabilisti të ndihmon të përgatitesh. Nëse inspektori kërkon dokument që s\'e ke pranë,
              mund të kërkosh 3-5 ditë afat për ta sjellë — por vetëm nëse s\'është nën detyrimin e mbajtjes në selië.
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Verifiko normat dhe afatet aktuale</p>
          <p className="leading-relaxed">
            Të gjitha të dhënat në këtë udhëzues janë verifikuar deri më <strong>{LAST_VERIFIED}</strong>{' '}
            me faqet zyrtare (atk-ks.org, gzk.rks-gov.net) dhe ligjet aktualë. Normat mund të ndryshohen
            nga Kuvendi — verifikoji te{' '}
            <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="underline font-medium">atk-ks.org</a>{' '}
            para vendimeve të mëdha.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#1B4F72]" />
          Zyrat rajonale të ATK
        </h2>
        <Card>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {OFFICES.map((o) => (
                <div key={o.region} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{o.region}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{o.address}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Numrat e kontaktit dhe oraret e punës verifikoji te{' '}
              <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline">
                atk-ks.org
              </a>{' '}para se të shkosh.
            </p>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
        Ky udhëzues nuk zëvendëson këshillën e kontabilistit të licencuar. Për situata specifike (raste komplekse,
        kontrolle, gjoba), konsulto profesionist. Baza ligjore kryesore: Ligji Nr. 03/L-222 (Administrata Tatimore),
        Ligji Nr. 05/L-037 (TVSH), Ligji Nr. 05/L-029 (Tatimi Korporativ), Ligji Nr. 05/L-028 (Tatimi Personal),
        Ligji Nr. 04/L-101 (Fondet Pensionale). Data e verifikimit: {LAST_VERIFIED}.
      </p>
    </div>
  )
}

function LockedCard({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="rounded-xl border border-gray-200 border-l-4 border-l-gray-300 bg-gray-50/60 p-4 flex items-start gap-3">
      <div className="rounded-lg bg-gray-200 p-2 shrink-0">
        <LockIcon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-500">{title}</h3>
        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{summary}</p>
        <NextLink href="/dashboard/subscription" className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[#1B4F72] hover:text-[#2E86C1]">
          Hapet me pakon Professional →
        </NextLink>
      </div>
    </div>
  )
}
