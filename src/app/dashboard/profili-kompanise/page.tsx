import { Building2 } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Profili i Kompanisë"
      subtitle="Bosht i ri i platformës për prezantim, directory dhe matchmaking."
      description={`Këtu do të kesh profilin e biznesit tënd me logo, foto, katalog, produkte/shërbime, certifikime dhe kapacitete. Profili do të jetë burimi për t'u shfaqur në Kompani Kosovare dhe për të pranuar Kërkesa për Ofertë nga buyer-ët e diasporës.

Fazë 3 është duke u ndërtuar: fusha mandatore dhe opsionale, progress bar 0-100%, upload i logos dhe katalogut, approval workflow para publikimit.`}
      icon={Building2}
      phase="Faza 3"
      relatedLinks={[
        { label: 'Cilësimet aktuale (aktivitet + sektor + punëtorë)', href: '/dashboard/settings' },
      ]}
    />
  )
}
