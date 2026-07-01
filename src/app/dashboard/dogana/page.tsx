import { Truck } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Udhëzuesi Doganor"
      subtitle="Eksport, import, re-eksport, HS Code, Incoterms, dokumente doganore."
      description={`Udhëzime për: eksport, import, re-eksport, HS Code (i lidhur me finder-in ekzistues), Incoterms (glossary), fatura eksportuese, packing list, dokumente transporti, certifikatë origjine EUR.1, AUV/fitocertifikatë (kur aplikohet), shpediter (listë e provuar), dokumente cilësie.

Checklist të veçantë sipas sektorit + produktit + shtetit të destinacionit. Për çdo procedurë: dogana e Kosovës si burim zyrtar + data e verifikimit.`}
      icon={Truck}
      phase="Faza 6"
      relatedLinks={[
        { label: 'HS Code Finder (ekziston)', href: '/dashboard/terma/hs-code' },
        { label: 'Incoterms glossary (ekziston)', href: '/dashboard/terma/incoterms' },
        { label: 'Portal Dogana e Kosovës', href: 'https://dogana.rks-gov.net' },
      ]}
    />
  )
}
