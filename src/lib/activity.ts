// Lloji i aktivitetit te biznesit. Boshti kryesor per targetimin e granteve.
// Ruhet si slug string (njesoj si sektoret), jo si Prisma enum.
export const ACTIVITY_TYPES = [
  'prodhues-perpunues',
  'sherbime',
  'bujqesi',
  'tregti',
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const ACTIVITY_LABELS: Record<ActivityType, { sq: string; en: string; de: string }> = {
  'prodhues-perpunues': { sq: 'Prodhues / Perpunues', en: 'Producer / Processor', de: 'Hersteller / Verarbeiter' },
  'sherbime': { sq: 'Sherbime', en: 'Services', de: 'Dienstleistungen' },
  'bujqesi': { sq: 'Bujqesi', en: 'Agriculture', de: 'Landwirtschaft' },
  'tregti': { sq: 'Tregti', en: 'Trade', de: 'Handel' },
}

export function isActivityType(v: string): v is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(v)
}
