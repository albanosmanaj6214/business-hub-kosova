import { Building2 } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Investo në Kosovë"
      subtitle="Zona ekonomike, parqe industriale, mundësi investimi për diasporën."
      description={`Do të kesh informata për: Zonat Ekonomike (Mitrovicë, Suharekë, Prizren, etj.), Parqet Industriale, sektorë me potencial të lartë investimi (agro-përpunim, energji e rinovueshme, TIK, turizëm), Start-Up që kërkojnë investitor, kompani të mëdha që kërkojnë partner strategjik.

Për të filluar një investim serioz, do të mund të kërkosh konsultim ose Matchmaking me admin KBH për due diligence bazik.

Shënim ligjor: KBH është shtresë njohjeje/matching-u; nuk mban fonde, nuk fasiliton transaksione financiare. Vendimet finale merren mes palëve me këshilltarë juridikë profesionalë.`}
      icon={Building2}
      phase="Faza 4-5"
      relatedLinks={[
        { label: 'Matchmaking (kur të hapet)', href: '/dashboard/matchmaking' },
      ]}
    />
  )
}
