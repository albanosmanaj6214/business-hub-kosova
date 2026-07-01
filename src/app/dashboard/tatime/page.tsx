import { Receipt } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Udhëzuesi Tatimor (ATK)"
      subtitle="EDI, TVSH, tatim në fitim, paga, kontribute dhe kalendari i afateve."
      description={`Udhëzime hap-pas-hapi për: regjistrim dhe aktivizim në EDI, autorizim kontabilisti, TVSH (kur aplikohet), tatim në fitim, tatim në paga, kontributet pensionale, deklarimet mujore/tremujore/vjetore, dokumentet që duhen ruajtur në arkiv, arka fiskale dhe pagesat.

Kalendari do të tregojë afatet e ardhshme sipas llojit të biznesit. Për çdo procedurë: linku zyrtar te atk-ks.org, formularët PDF, data e verifikimit dhe disclaimer për ndryshime rregullative.`}
      icon={Receipt}
      phase="Faza 6"
      relatedLinks={[
        { label: 'Portal zyrtar ATK', href: 'https://atk-ks.org' },
      ]}
    />
  )
}
