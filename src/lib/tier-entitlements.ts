// Te drejtat sipas tarifes (Dimensioni B), ortogonale me sektorin (Dimensioni A).
// Pikenisje e ndryshueshme nga admini pa prekur gating-un — vlerat jane konfigurim,
// jo kushte te hardkoduara neper kod. Ref: spec §12.

export type TierKey = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'

export interface TierEntitlements {
  // Numri maksimal i sektoreve qe admini mund t'i aktivizoje per kete tarife.
  maxSectors: number
  // Njoftime grante/panaire brenda platformes.
  notifications: boolean
  // Alerte me email (newsletter + lajme).
  emailAlerts: boolean
  // Newsletter periodik.
  newsletter: boolean
  // Udhezues eksporti: te kufizuar (sektori + vendet kryesore) ose te plote.
  guides: 'limited' | 'full'
  // Checklista eksporti.
  checklists: boolean
  // Template per panaire.
  fairTemplates: boolean
  // Konsulenca/takime ne muaj. -1 = e pakufizuar.
  consultationsPerMonth: number
}

export const TIER_ENTITLEMENTS: Record<TierKey, TierEntitlements> = {
  FREE: {
    maxSectors: 1, notifications: true, emailAlerts: false, newsletter: true,
    guides: 'limited', checklists: false, fairTemplates: false, consultationsPerMonth: 0,
  },
  STARTER: {
    maxSectors: 1, notifications: true, emailAlerts: false, newsletter: true,
    guides: 'limited', checklists: false, fairTemplates: false, consultationsPerMonth: 0,
  },
  PROFESSIONAL: {
    maxSectors: 3, notifications: true, emailAlerts: true, newsletter: true,
    guides: 'full', checklists: true, fairTemplates: true, consultationsPerMonth: 1,
  },
  ENTERPRISE: {
    maxSectors: 6, notifications: true, emailAlerts: true, newsletter: true,
    guides: 'full', checklists: true, fairTemplates: true, consultationsPerMonth: -1,
  },
}

export const TIER_LABEL: Record<TierKey, string> = {
  FREE: 'Falas',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
}

export function isTierKey(v: unknown): v is TierKey {
  return typeof v === 'string' && v in TIER_ENTITLEMENTS
}

// Te drejtat per nje tarife; çdo vlere e panjohur/null trajtohet si FREE.
export function entitlementsFor(tier?: string | null): TierEntitlements {
  return TIER_ENTITLEMENTS[isTierKey(tier) ? tier : 'FREE']
}

export function maxSectorsFor(tier?: string | null): number {
  return entitlementsFor(tier).maxSectors
}

export type BooleanEntitlement = 'notifications' | 'emailAlerts' | 'newsletter' | 'checklists' | 'fairTemplates'

export function hasEntitlement(tier: string | null | undefined, key: BooleanEntitlement): boolean {
  return entitlementsFor(tier)[key] === true
}
