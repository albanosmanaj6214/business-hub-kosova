// Market Pulse gate: render ONLY genuinely verified, active statistical data.
// ASKdata is DRAFT/inactive/absent from production, so this returns [] and the
// section is hidden. Defensive: any error (e.g. the Phase 4 tables absent in an
// environment that has not applied the migration) yields [] — never an error.
import { prisma } from '@/lib/prisma'
import type { MarketPulseRow } from './types'

export async function loadEligibleMarketPulse(): Promise<MarketPulseRow[]> {
  try {
    const rows = await prisma.statisticalObservation.findMany({
      where: {
        qualityStatus: 'ok',
        valueOriginal: { not: null },
        unitOriginal: { not: null },
        sourceCitationId: { not: null },
        dataset: { source: { isActive: true, lifecycle: 'ACTIVE' } },
      },
      orderBy: [{ referenceYear: 'desc' }],
      take: 6,
      include: { dataset: { select: { title: true, source: { select: { institutionName: true } } } } },
    })
    return rows.map((o) => ({
      datasetTitle: o.dataset.title,
      measureLabel: o.measureLabel,
      referencePeriod: o.referencePeriod,
      value: o.valueOriginal == null ? '' : o.valueOriginal.toString(),
      unit: o.unitOriginal,
      institution: o.dataset.source?.institutionName ?? null,
    }))
  } catch {
    return []
  }
}
