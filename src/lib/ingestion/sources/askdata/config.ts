// ASKdata (Kosovo Agency of Statistics) PxWeb pilot config — external trade
// turnover (tab08.px): yearly Export / Import / Trade balance, 2001–2025.
export const ASKDATA_BASE = 'https://askdata.rks-gov.net/api/v1'

export interface AskdataDatasetConfig {
  code: string
  lang: string
  path: string // PxWeb folder/table path (spaces allowed; encoded per-segment)
  timeDim: string
  variableDim: string
  variableLabels: Record<string, string>
  unit: string
  currency: string
  country: string
  officialDomain: string
  institution: string
  datasetIdentifier: string
  frequency: string
}

export const ASKDATA_TRADE_TURNOVER: AskdataDatasetConfig = {
  code: 'ASKDATA_TRADE_TURNOVER',
  lang: 'en',
  path: 'ASKdata/External trade/Yearly indicators/tab08.px',
  timeDim: 'Viti',
  variableDim: 'Variabla',
  variableLabels: { '0': 'Export', '1': 'Import', '2': 'Trade balance' },
  unit: 'thousand EUR',
  currency: 'EUR',
  country: 'XK',
  officialDomain: 'askdata.rks-gov.net',
  institution: 'Kosovo Agency of Statistics (ASK)',
  datasetIdentifier: 'tab08.px',
  frequency: 'yearly',
}

/** Build the table URL, encoding each path segment (keeps spaces safe). */
export function tableUrl(cfg: AskdataDatasetConfig): string {
  const encoded = cfg.path.split('/').map(encodeURIComponent).join('/')
  return `${ASKDATA_BASE}/${cfg.lang}/${encoded}`
}

export interface PxWebQuery {
  query: { code: string; selection: { filter: string; values: string[] } }[]
  response: { format: string }
}

/** A PxWeb JSON query selecting the given years + all variables, as json-stat2. */
export function buildTradeQuery(cfg: AskdataDatasetConfig, years: string[], variables = Object.keys(cfg.variableLabels)): PxWebQuery {
  return {
    query: [
      { code: cfg.timeDim, selection: { filter: 'item', values: years } },
      { code: cfg.variableDim, selection: { filter: 'item', values: variables } },
    ],
    response: { format: 'json-stat2' },
  }
}

/** Recent N years as string codes, descending is fine (PxWeb returns by selection). */
export function recentYears(latest: number, count: number): string[] {
  const out: string[] = []
  for (let y = latest; y > latest - count; y--) out.push(String(y))
  return out
}
