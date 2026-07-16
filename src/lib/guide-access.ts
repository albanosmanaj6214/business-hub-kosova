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

// Udhezuesit e eksportit: 'limited' = vetem udhezuesit e sektorit tend
// (+ ata universale me targetSectors bosh); 'full' = te gjithe.
export async function exportGuideAccess(): Promise<{ limited: boolean; entitled: string[] }> {
  const { tier, role } = await sessionTierRole()
  if (isAdmin(role) || entitlementsFor(tier).guides === 'full') return { limited: false, entitled: [] }
  const profile = await currentBusinessProfile()
  return { limited: true, entitled: profile?.entitledSectors ?? [] }
}

// Checklistat e eksportit: vetem pakot qe e kane te aktivizuar.
export async function checklistAllowed(): Promise<boolean> {
  const { tier, role } = await sessionTierRole()
  return isAdmin(role) || entitlementsFor(tier).checklists
}
