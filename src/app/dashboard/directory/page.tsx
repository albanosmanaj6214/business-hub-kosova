import { Users } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Kompani Kosovare"
      subtitle="Directory i bizneseve me kërkim sipas sektorit, produktit, komunës dhe certifikimeve."
      description={`Do të mund t'i shfletosh të gjitha bizneset që janë të regjistruara në KBH. Filtrimi do të bëhet sipas sektorit, produktit/shërbimit, komunës, statusit verified, kërkesës për buyer/distributor/investitor.

Kontaktet nuk do të shfaqen direkt: do të kalojnë përmes butonit "Kërko Kontakt" ose "Kërko Ofertë", me miratim nga pronari i profilit. Kjo mbron cilësinë e platformës dhe respekton privatësinë.`}
      icon={Users}
      phase="Faza 4"
      relatedLinks={[
        { label: 'Kërko Ofertë (i lidhur)', href: '/dashboard/kerko-oferte' },
      ]}
    />
  )
}
