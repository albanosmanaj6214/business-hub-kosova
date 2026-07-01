import { Handshake } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Kërko Ofertë"
      subtitle="Dërgo kërkesa për oferta te bizneset relevante që kanë produktin/shërbimin që kërkon."
      description={`Do të krijosh kërkesë me: titullin, përshkrimin, sektorin, produktin/shërbimin, sasinë, vendin e dërgesës, afatin dhe specifikimet. Sistemi do të gjejë kompanitë që përputhen dhe u dërgon njoftim automatikisht.

Bizneset kosovare do të përgjigjen me oferta, ti i shortliston dhe zgjedh më të mirën. Të gjitha ndërveprimet do të jenë të audituara.`}
      icon={Handshake}
      phase="Faza 4"
    />
  )
}
