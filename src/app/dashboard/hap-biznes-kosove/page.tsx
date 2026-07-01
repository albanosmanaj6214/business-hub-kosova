import { Rocket } from 'lucide-react'
import { ComingSoon } from '@/components/dashboard/ComingSoon'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ComingSoon
      title="Si të hap biznes në Kosovë"
      subtitle="Për diasporën që dëshiron të hapë biznes në atdhe."
      description={`Do të kesh udhëzim të plotë specifik për diasporën: çka dokumente duhen kur je jashtë Kosovës, kur nevojitet autorizim me firmë të noterizuar, kur mund të bëhet online dhe kur duhet prezencë fizike, si zgjidhet forma ligjore (SH.P.K. është më e zakonshme për diasporën), si hapet llogaria bankare, si aktivizohet EDI.

Marrëveshjet për eliminimin e tatimit të dyfishtë me vendet ku operon diaspora do të jenë të renditura këtu.`}
      icon={Rocket}
      phase="Faza 6"
      relatedLinks={[
        { label: 'Udhëzuesi ARBK', href: '/dashboard/arbk' },
        { label: 'Udhëzuesi Tatimor', href: '/dashboard/tatime' },
      ]}
    />
  )
}
