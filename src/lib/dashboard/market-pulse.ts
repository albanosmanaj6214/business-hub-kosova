// Market Pulse gate. The statistical data layer (ASKdata / Phase-4 tables) is NOT part
// of this UI-only deployment and is absent from production, so there is no eligible,
// verified statistical data to show: this returns [] and the section stays hidden
// (DashboardMarketPulse renders null on an empty list). When the statistical data layer
// is later deployed, restore the verified-observation query that reads
// prisma.statisticalObservation (qualityStatus 'ok', active source, with a source citation).
import type { MarketPulseRow } from './types'

export async function loadEligibleMarketPulse(): Promise<MarketPulseRow[]> {
  return []
}
