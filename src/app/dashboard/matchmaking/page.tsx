import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchesForCompany, MATCH_TYPE_LABEL } from '@/lib/matchmaking'
import { Card, CardContent } from '@/components/ui/card'
import {
  Compass, Award, ArrowRight, Lock, Info, Building2, Rocket,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Matchmaking (V5 §6): rekomandime automatike sipas produktit, sektorit,
// interesit, vendit dhe statusit verified — me arsyet e qarta për secilin match.

const TYPE_CLS: Record<string, string> = {
  BUYER: 'bg-green-100 text-green-700',
  SUPPLIER: 'bg-[#1B4F72]/10 text-[#1B4F72]',
  DISTRIBUTOR: 'bg-purple-100 text-purple-700',
  INVESTOR: 'bg-amber-100 text-amber-700',
  INVESTMENT: 'bg-amber-100 text-amber-700',
  PARTNER: 'bg-[#2E86C1]/10 text-[#2E86C1]',
}

export default async function MatchmakingPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) redirect('/login')
  const tier = String((session?.user as { tier?: string })?.tier ?? 'FREE')
  const tierAllows = tier === 'PROFESSIONAL' || tier === 'ENTERPRISE'

  const company = await prisma.company.findUnique({
    where: { ownerUserId: userId },
    select: { id: true, roleType: true, profileStatus: true, sectors: true, interests: true },
  })

  if (!company) {
    return (
      <div className="space-y-6">
        <Header />
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-600">
            Matchmaking punon mbi profilin e biznesit — roli yt aktual s&apos;ka profil biznesi.
          </CardContent>
        </Card>
      </div>
    )
  }

  const matches = await matchesForCompany(company.id, 25)
  const visible = tierAllows ? matches : matches.slice(0, 3)
  const locked = tierAllows ? 0 : Math.max(0, matches.length - 3)

  return (
    <div className="space-y-6">
      <Header />

      {company.profileStatus !== 'APPROVED' && (
        <Card className="border-amber-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              Profili yt s&apos;është ende i aprovuar — ti i sheh rekomandimet, por bizneset e tjera
              s&apos;të gjejnë dot. Plotësoje dhe dorëzoje te{' '}
              <Link href="/dashboard/profili-kompanise" className="underline font-medium">Profili i Kompanisë</Link>.
            </p>
          </CardContent>
        </Card>
      )}

      {matches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Compass className="h-10 w-10 text-gray-300 mx-auto" />
            <p className="text-sm font-medium text-gray-700">Ende s&apos;ka rekomandime për profilin tënd</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Rekomandimet krijohen nga produktet e listuara dhe interesat e bashkëpunimit.
              {company.roleType === 'DIASPORA'
                ? ' Shto produktet që kërkon nga Kosova te profili yt.'
                : ' Lista produktet e tua dhe zgjidh çka kërkon (blerës, distributor, investitor) te profili.'}
            </p>
            <Link
              href="/dashboard/profili-kompanise"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4F72] hover:text-[#2E86C1]"
            >
              Plotëso profilin <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((m) => (
            <Card key={m.company.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {m.company.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.company.logoUrl} alt={m.company.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
                      {m.company.roleType === 'STARTUP'
                        ? <Rocket className="h-5 w-5 text-[#1B4F72]" />
                        : m.company.roleType === 'DIASPORA'
                          ? <Compass className="h-5 w-5 text-[#1B4F72]" />
                          : <Building2 className="h-5 w-5 text-[#1B4F72]" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{m.company.name}</h3>
                      <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${TYPE_CLS[m.matchType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {MATCH_TYPE_LABEL[m.matchType]}
                      </span>
                      {m.company.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-100 rounded-full px-1.5 py-0.5">
                          <Award className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.company.municipality || m.company.country || ''}
                    </p>

                    {/* Pse ky rekomandim (§14.6) */}
                    <ul className="mt-2 space-y-0.5">
                      {m.reasons.slice(0, 3).map((r, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                          <span className="text-[#27AE60] mt-0.5">✓</span> {r}
                        </li>
                      ))}
                    </ul>

                    {m.company.offerings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.company.offerings.map((o, i) => (
                          <span key={i} className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">
                            {o.categoryName ?? o.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="text-xs font-bold text-[#1B4F72]">{m.score} pikë</span>
                    <Link
                      href={`/dashboard/directory/${m.company.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-xs font-medium"
                    >
                      Shiko profilin <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {locked > 0 && (
            <Card className="border-[#F39C12]/40">
              <CardContent className="p-5 flex items-start gap-3">
                <Lock className="h-5 w-5 text-[#B37400] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Edhe {locked} rekomandime të tjera me pakon Professional
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Pako Free tregon 3 rekomandimet kryesore. Me Professional i sheh të gjitha
                    dhe dërgon kërkesa kontakti direkt.
                  </p>
                  <Link href="/dashboard/subscription" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-[#1B4F72] hover:text-[#2E86C1]">
                    Shiko pakot <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 max-w-3xl">
        Rekomandimet rifreskohen automatikisht nga profilet dhe produktet e platformës. Renditja:
        përputhja e saktë e produktit peshon më shumë se sektori, interesi, vendi dhe verifikimi.
      </p>
    </div>
  )
}

function Header() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-[#1B4F72] p-2">
          <Compass className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Matchmaking</h1>
      </div>
      <p className="text-gray-500 mt-2 max-w-3xl">
        Bizneset që përputhen me profilin tënd — me arsyen e qartë pse. Sa më i plotë profili
        dhe produktet, aq më të sakta rekomandimet.
      </p>
    </div>
  )
}
