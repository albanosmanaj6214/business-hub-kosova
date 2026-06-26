// Segmenti i biznesit. Ruhet si slug string (njesoj si aktiviteti/sektoret), jo enum Prisma.
export const BUSINESS_SEGMENTS = ['STANDARD', 'STARTUP', 'DIASPORA'] as const
export type BusinessSegment = (typeof BUSINESS_SEGMENTS)[number]

export const SEGMENT_LABELS: Record<BusinessSegment, { sq: string; en: string; de: string }> = {
  STANDARD: { sq: 'Biznes Kosovar', en: 'Kosovo Business', de: 'Kosovarisches Unternehmen' },
  STARTUP: { sq: 'Start Up', en: 'Start Up', de: 'Start-up' },
  DIASPORA: { sq: 'Biznes nga Diaspora', en: 'Diaspora Business', de: 'Diaspora-Unternehmen' },
}

export function isBusinessSegment(v: unknown): v is BusinessSegment {
  return typeof v === 'string' && (BUSINESS_SEGMENTS as readonly string[]).includes(v)
}

export const DIASPORA_ROLES = ['investor', 'buyer', 'distributor', 'importer', 'partner', 'service'] as const
export type DiasporaRole = (typeof DIASPORA_ROLES)[number]
export function isDiasporaRole(v: unknown): v is DiasporaRole {
  return typeof v === 'string' && (DIASPORA_ROLES as readonly string[]).includes(v)
}

export const STARTUP_STAGES = ['idea', 'registered', 'early', 'growth'] as const
export type StartupStage = (typeof STARTUP_STAGES)[number]
export function isStartupStage(v: unknown): v is StartupStage {
  return typeof v === 'string' && (STARTUP_STAGES as readonly string[]).includes(v)
}

export const LOOKING_FOR = ['buyer', 'distributor', 'investor', 'partner', 'supplier'] as const
export type LookingFor = (typeof LOOKING_FOR)[number]
export function isLookingFor(v: unknown): v is LookingFor {
  return typeof v === 'string' && (LOOKING_FOR as readonly string[]).includes(v)
}

export const DIASPORA_ROLE_LABELS: Record<DiasporaRole, { sq: string; en: string; de: string }> = {
  investor:    { sq: 'Investitor',  en: 'Investor',    de: 'Investor' },
  buyer:       { sq: 'Blerës',      en: 'Buyer',       de: 'Käufer' },
  distributor: { sq: 'Distributor', en: 'Distributor', de: 'Distributor' },
  importer:    { sq: 'Importues',   en: 'Importer',    de: 'Importeur' },
  partner:     { sq: 'Partner',     en: 'Partner',     de: 'Partner' },
  service:     { sq: 'Ofrues shërbimi', en: 'Service provider', de: 'Dienstleister' },
}

export const STARTUP_STAGE_LABELS: Record<StartupStage, { sq: string; en: string; de: string }> = {
  idea:       { sq: 'Ide',            en: 'Idea',           de: 'Idee' },
  registered: { sq: 'I regjistruar',  en: 'Registered',     de: 'Registriert' },
  early:      { sq: 'Fazë e hershme', en: 'Early stage',    de: 'Frühphase' },
  growth:     { sq: 'Në rritje',      en: 'Growth',         de: 'Wachstum' },
}

// Shtetet kryesore të diasporës kosovare (ISO2). Listë e kuruar, jo shteruese.
export const DIASPORA_COUNTRIES: readonly { code: string; sq: string; en: string; de: string }[] = [
  { code: 'DE', sq: 'Gjermani',     en: 'Germany',       de: 'Deutschland' },
  { code: 'CH', sq: 'Zvicër',       en: 'Switzerland',   de: 'Schweiz' },
  { code: 'AT', sq: 'Austri',       en: 'Austria',       de: 'Österreich' },
  { code: 'IT', sq: 'Itali',        en: 'Italy',         de: 'Italien' },
  { code: 'FR', sq: 'Francë',       en: 'France',        de: 'Frankreich' },
  { code: 'BE', sq: 'Belgjikë',     en: 'Belgium',       de: 'Belgien' },
  { code: 'NL', sq: 'Holandë',      en: 'Netherlands',   de: 'Niederlande' },
  { code: 'SE', sq: 'Suedi',        en: 'Sweden',        de: 'Schweden' },
  { code: 'NO', sq: 'Norvegji',     en: 'Norway',        de: 'Norwegen' },
  { code: 'DK', sq: 'Danimarkë',    en: 'Denmark',       de: 'Dänemark' },
  { code: 'FI', sq: 'Finlandë',     en: 'Finland',       de: 'Finnland' },
  { code: 'LU', sq: 'Luksemburg',   en: 'Luxembourg',    de: 'Luxemburg' },
  { code: 'SI', sq: 'Slloveni',     en: 'Slovenia',      de: 'Slowenien' },
  { code: 'GB', sq: 'Mbretëri e Bashkuar', en: 'United Kingdom', de: 'Vereinigtes Königreich' },
  { code: 'US', sq: 'SHBA',         en: 'United States', de: 'USA' },
  { code: 'CA', sq: 'Kanada',       en: 'Canada',        de: 'Kanada' },
  { code: 'AU', sq: 'Australi',     en: 'Australia',     de: 'Australien' },
]

export function countryLabel(code: string): string {
  const c = DIASPORA_COUNTRIES.find((x) => x.code === code)
  return c ? c.sq : code
}
