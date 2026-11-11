import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { entitlementsFor } from '@/lib/tier-entitlements'
import { currentBusinessProfile } from '@/lib/audience-server'

// Gate-et e perbashketa te udhezuesve, te lidhura me tier-entitlements.ts.
// Me pare cdo faqe (ARBK/ATK/Dogana/AUV) mbante kopjen e vet te hardkoduar
// ['PROFESSIONAL','ENTERPRISE'], dhe kufijte e konfiguruar s'zbatoheshin askund.

async function sessionTierRole(): Promise<{ tier: string; role: string; email: string }> {
  const session = await getServerSession(authOptions)
  return {
    tier: String((session?.user as { tier?: string })?.tier ?? 'FREE'),
    role: String((session?.user as { role?: string })?.role ?? ''),
    email: String((session?.user as { email?: string })?.email ?? '').toLowerCase(),
  }
}

// Llogaria DEMO per komisionin vleresues: sheh si funksionon platforma, por
// jo te gjitha te dhenat e mbledhura. Tregjet e plota: vetem DEMO_MARKETS;
// listat (grante, panaire, certifikime) prehen ne DEMO_LIST_LIMIT zera.
// Shto email-e te tjera demo me DEMO_ACCOUNT_EMAILS (te ndara me presje).
const DEMO_EMAILS = new Set(
  ['demo@kosovabusinesses.aiaohub.com', ...(process.env.DEMO_ACCOUNT_EMAILS ?? '').split(',')]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
)
export const DEMO_MARKETS = ['AT', 'DE']
export const DEMO_LIST_LIMIT = 3

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && DEMO_EMAILS.has(email.toLowerCase())
}

export async function isDemoSession(): Promise<boolean> {
  const { email, role } = await sessionTierRole()
  return !isAdmin(role) && isDemoEmail(email)
}

// Kthen nje funksion qe e pret listen per demo dhe e le te paprekur per te tjeret.
export async function demoLimiter(): Promise<<T>(items: T[], n?: number) => T[]> {
  const demo = await isDemoSession()
  return <T,>(items: T[], n = DEMO_LIST_LIMIT) => (demo ? items.slice(0, n) : items)
}

const isAdmin = (role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role)

// Udhezuesit qeveritare: pakot me guides='full' shohin gjithcka; te tjerat
// shohin 2 procedurat e para per seksion (LockedCard per pjesen tjeter).
export async function fullAccessForSession(): Promise<boolean> {
  const { tier, role, email } = await sessionTierRole()
  if (!isAdmin(role) && isDemoEmail(email)) return false
  return isAdmin(role) || entitlementsFor(tier).guides === 'full'
}

// Udhezuesit e eksportit: 'none' = i mbyllur (upsell), 'limited' = vetem sektori
// i vet + universalet, 'full' = te gjithe, 'demo' = vetem DEMO_MARKETS.
// Adminet gjithmone 'full'.
export async function exportGuideAccess(): Promise<{ mode: 'none' | 'limited' | 'full' | 'demo'; entitled: string[] }> {
  const { tier, role, email } = await sessionTierRole()
  if (isAdmin(role)) return { mode: 'full', entitled: [] }
  if (isDemoEmail(email)) return { mode: 'demo', entitled: [] }
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
