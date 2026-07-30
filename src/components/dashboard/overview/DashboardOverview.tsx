import type { DashboardData } from '@/lib/dashboard/types'
import { sectionsFor, toolsFor } from '@/lib/dashboard/role-dashboard-config'
import { buildPriorities } from '@/lib/dashboard/dashboard-data'
import { DashboardGreeting } from './DashboardGreeting'
import { DashboardRestricted } from './DashboardRestricted'
import { DashboardPriorities } from './DashboardPriorities'
import { DashboardStartupJourney } from './DashboardStartupJourney'
import { DashboardOpportunities } from './DashboardOpportunities'
import { DashboardNetwork } from './DashboardNetwork'
import { DashboardDiasporaProducts } from './DashboardDiasporaProducts'
import { DashboardNews } from './DashboardNews'
import { DashboardIndividualCta } from './DashboardIndividualCta'
import { DashboardTools } from './DashboardTools'
import { DashboardMarketPulse } from './DashboardMarketPulse'

// One modular, role-aware Dashboard. Sections render in role order and hide when
// they carry no data / no useful action (no giant blank cards).
export function DashboardOverview({ data }: { data: DashboardData }) {
  const sections = sectionsFor(data.role)
  const priorities = buildPriorities(data)
  const tools = toolsFor(data)
  const opportunities = [...data.grants, ...data.fairs].slice(0, 6)

  return (
    <div className="space-y-6">
      {sections.map((s) => {
        switch (s) {
          case 'greeting': return <DashboardGreeting key={s} data={data} />
          case 'restricted': return data.restricted ? <DashboardRestricted key={s} /> : null
          case 'priorities': return <DashboardPriorities key={s} priorities={priorities} />
          case 'startupJourney': return <DashboardStartupJourney key={s} data={data} />
          case 'opportunities': return <DashboardOpportunities key={s} title="Mundësi për biznesin tënd" items={opportunities} emptyMessage="S'ka mundësi relevante për profilin tënd tani. Do të njoftohesh kur të publikohet diçka e re." emptyCta={{ label: 'Shiko financimet', href: '/dashboard/burime-financimi' }} />
          case 'trainings': return <DashboardOpportunities key={s} title="Trajnime dhe workshope" items={data.trainings} emptyMessage="S'ka trajnime të shpallura tani." emptyCta={{ label: 'Shiko ngjarjet', href: '/dashboard/panaire-evente' }} />
          case 'network': return <DashboardNetwork key={s} data={data} />
          case 'diasporaProducts': return <DashboardDiasporaProducts key={s} data={data} />
          case 'news': return <DashboardNews key={s} news={data.news} />
          case 'individualCta': return <DashboardIndividualCta key={s} />
          case 'tools': return <DashboardTools key={s} tools={tools} />
          case 'marketPulse': return <DashboardMarketPulse key={s} rows={data.marketPulse} />
          default: return null
        }
      })}
    </div>
  )
}
