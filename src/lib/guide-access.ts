import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { entitlementsFor } from '@/lib/tier-entitlements'
import { currentBusinessProfile } from '@/lib/audience-server'

// Gate-et e perbashketa te udhezuesve, te lidhura me tier-entitlements.ts.
// Me pare cdo faqe (ARBK/ATK/Dogana/AUV) mbante kopjen e vet te hardkoduar
// ['PROFESSIONAL','ENTERPRISE'], dhe kufijte e konfiguruar s'zbatoheshin askund.

async function sessionTierRole(): Promise<{ tier: string; role: string }> {
  const session = await getServerSession(authOptions)
  return {
    tier: String((session?.user as { tier?: string })?.tier ?? 'FREE'),
    role: String((session?.user as { role?: string })?.role ?? ''),
  }
}

const isAdmin = (role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role)

// Udhezuesit qeveritare: pakot me guides='full' shohin gjithcka; te tjerat
// shohin 2 procedurat e para per seksion (LockedCard per pjesen tjeter).
export async function fullAccessForSession(): Promise<boolean> {
  const { tier, role } = await sessionTierRole()
  return isAdmin(role) || entitlementsFor(tier).guides === 'full'
}

// Udhezuesit e eksportit: 'none' = i mbyllur (upsell), 'limited' = vetem sektori
// i vet + universalet, 'full' = te gjithe. Adminet gjithmone 'full'.
export async function exportGuideAccess(): Promise<{ mode: 'none' | 'limited' | 'full'; entitled: string[] }> {
  const { tier, role } = await sessionTierRole()
  if (isAdmin(role)) return { mode: 'full', entitled: [] }
  const g = entitlementsFor(tier).guides
  if (g === 'full') return { mode: 'full', entitled: [] }
  if (g === 'none') return { mode: 'none', entitled: [] }
  const profile = await currentBusinessProfile()
  return { mode: 'limited', entitled: profile?.entitledSectors ?? [] }
}

// Checklistat e eksportit: vetem pakot qe e kane te aktivizuar.
export async function checklistAllowed(): Promise<boolean> {
  const { tier, role } = await sessionTierRole()
  return isAdmin(role) || entitlementsFor(tier).checklists
}
