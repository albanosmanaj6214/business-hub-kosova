import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { legalFormBySlug } from '@/lib/startup/legal-forms'
import { roadmapFor } from '@/lib/startup/roadmap'
import { countryLabel } from '@/lib/segments'
import { treatyForCountry } from '@/lib/diaspora/treaties'
import { zonesByMunicipality } from '@/lib/diaspora/zones'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, ChevronRight, ExternalLink, Info, Landmark, MapPin, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DISCLAIMER = 'Ky informacion është udhëzues, jo këshillë ligjore ose tatimore. Verifiko gjithmonë me ARBK, ATK dhe Ministrinë e Financave.'

const TREATY_STATUS: Record<string, string> = {
  in_force: 'Në fuqi',
  signed: 'Nënshkruar',
  negotiating: 'Në negociim',
  none: 'Pa marrëveshje',
}

function DisclaimerNote() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{DISCLAIMER}</span>
    </div>
  )
}

export default async function DiasporaPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { diasporaCountry: true } })
    : null
  const country = user?.diasporaCountry ?? null
  const countryName = country ? countryLabel(country) : null

  const dega = legalFormBySlug('dega')
  const degaSteps = roadmapFor('dega')
  const treaty = country ? treatyForCountry(country) : undefined
  const zoneGroups = zonesByMunicipality()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="h-6 w-6 text-[#1B4F72]" /> KBH Diaspora
        </h1>
        <p className="text-gray-500 mt-1">
          {countryName
            ? `Si të bësh biznes ose të investosh në Kosovë nga ${countryName}.`
            : 'Udhëzues për diasporën: si të bësh biznes ose të investosh në Kosovë.'}
        </p>
      </div>

      {!country && (
        <div className="flex items-start gap-2 rounded-lg bg-[#1B4F72]/5 border border-[#1B4F72]/20 px-3 py-2 text-sm text-[#1B4F72]">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Cakto shtetin tënd te <Link href="/dashboard/settings" className="font-medium underline">Cilësimet</Link> për informacion të personalizuar mbi tatimin e dyfishtë.</span>
        </div>
      )}

      <DisclaimerNote />

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1B4F72]" />
            <h2 className="font-semibold text-gray-900">Si të hapësh biznes ose degë në Kosovë</h2>
          </div>
          {dega && <p className="text-sm text-gray-600">{dega.tagline.sq}</p>}
          <ol className="space-y-1.5">
            {degaSteps.slice(0, 6).map((s, i) => (
              <li key={s.id} className="flex items-start gap-2 text-sm text-gray-800">
                <span className="shrink-0 h-5 w-5 rounded-full bg-[#1B4F72]/10 text-[#1B4F72] text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                {s.title.sq}
              </li>
            ))}
          </ol>
          <Link href="/dashboard/startup?forma=dega" className="inline-flex items-center gap-1 text-sm text-[#2E86C1] hover:underline">
            Shiko udhërrëfyesin e plotë <ChevronRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-[#1B4F72]" />
            <h2 className="font-semibold text-gray-900">
              Tatimi i dyfishtë{countryName ? ` (${countryName})` : ''}
            </h2>
          </div>
          {!country ? (
            <p className="text-sm text-gray-500">Cakto shtetin tënd te Cilësimet për të parë statusin e marrëveshjes së tatimit të dyfishtë.</p>
          ) : treaty ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={treaty.hasTreaty ? 'default' : 'secondary'}>{TREATY_STATUS[treaty.status] ?? treaty.status}</Badge>
                {treaty.inForce && <span className="text-gray-500">Në fuqi: {treaty.inForce}</span>}
              </div>
              {treaty.note?.sq && <p className="text-gray-600">{treaty.note.sq}</p>}
              <a href={treaty.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
                Burimi zyrtar <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Lista zyrtare e marrëveshjeve po përgatitet. Do të shtohet së shpejti.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#1B4F72]" />
            <h2 className="font-semibold text-gray-900">Zonat ekonomike</h2>
          </div>
          {zoneGroups.length === 0 ? (
            <p className="text-sm text-gray-500">Lista zyrtare e zonave ekonomike po përgatitet. Do të shtohet së shpejti.</p>
          ) : (
            <div className="space-y-3">
              {zoneGroups.map((g) => (
                <div key={g.municipality}>
                  <p className="text-sm font-medium text-gray-900">{g.municipality}</p>
                  <ul className="mt-1 space-y-1">
                    {g.zones.map((z) => (
                      <li key={z.id} className="text-sm text-gray-700">
                        {z.url ? (
                          <a href={z.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[#1B4F72]">
                            {z.name} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : z.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Bazat e investimit</h2>
          <ul className="space-y-1.5 text-sm text-gray-800">
            <li>Regjistro biznesin ose degën te ARBK dhe merr numrin fiskal.</li>
            <li>Aktivizohu te ATK dhe njihu me detyrimet tatimore baze.</li>
            <li>Hap llogari bankare biznesi në një bankë të licencuar nga BQK.</li>
            <li>Informohu për transferimin e fitimit dhe tatimin e dyfishtë sipas shtetit ku jeton.</li>
          </ul>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="https://arbk.rks-gov.net" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">ARBK <ExternalLink className="h-3.5 w-3.5" /></a>
            <a href="https://www.atk-ks.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">ATK <ExternalLink className="h-3.5 w-3.5" /></a>
            <a href="https://bqk-kos.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">BQK <ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
