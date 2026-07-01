import { Compass } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Matchmaking"
      subtitle="Rekomandime automatike të partnerëve dhe klientëve që përputhen me profilin tënd."
      description={`Motori i matchmaking-ut do të përdorë profilin tënd (rol + sektor + produkt + interes + vend) për të propozuar kompani ose Diaspora buyer/investor që përputhen. Prioriteti do të jetë: përputhja e saktë e produktit > sektorit > interesit > shtetit > profilit të verifikuar.

Për raste kritike (investime të mëdha, Enterprise), admini KBH do të bëjë matching manual me due diligence bazik.`}
      icon={Compass}
      phase="Faza 4"
    />
  )
}
