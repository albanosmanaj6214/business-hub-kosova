import { Landmark } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Udhëzuesi ARBK"
      subtitle="Hap pas hapi për regjistrim biznesi, ndryshim adresash, formularët dhe template."
      description={`Do të kesh udhëzime të plota për: regjistrim biznesi (BI/SH.P.K./Sh.A./Ortakëri/Degë e huaj), ndryshim emri, ndryshim adrese, aktiviteti, pronarë, drejtorë, kapital, çregjistrim, degë/njësi, autorizime, dublikat certifikate.

Për secilin veprim: formularët zyrtarë PDF për shkarkim, dokumentet që duhen, template statuti/vendimi, checklist post-regjistrim (vulë, bankë, ATK/EDI, kontabilist), linke direkte te arbk.rks-gov.net.

Zero API, zero AI: vetëm udhëzime të verifikuara nga ligji, të përditësuara periodikisht.`}
      icon={Landmark}
      phase="Faza 6"
      relatedLinks={[
        { label: 'Portal zyrtar ARBK', href: 'https://arbk.rks-gov.net' },
      ]}
    />
  )
}
