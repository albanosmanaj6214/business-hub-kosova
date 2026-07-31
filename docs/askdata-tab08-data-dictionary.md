# ASKdata tab08.px — Data Dictionary (pilot)

- **Institution:** Kosovo Agency of Statistics (ASK).
- **API:** PxWeb, `https://askdata.rks-gov.net/api/v1/en/ASKdata/External trade/Yearly indicators/tab08.px`.
- **Dataset identifier:** `tab08.px` (stored first-class, not only in the URL).
- **Title:** "Turnover of goods by Viti and Variabla".
- **Frequency:** yearly. **Geo:** XK (Kosovo). **Temporal:** 2001–2025.

## Dimensions
| Code | Meaning | Values |
|---|---|---|
| `Viti` | Year (time) | 2001 … 2025 |
| `Variabla` | Indicator | `0`=Export, `1`=Import, `2`=Trade balance |

## Measure
- **Unit:** thousand EUR. **Currency:** EUR.
- **Value type:** integer thousands of EUR (exact NUMERIC). Trade balance can be negative.

## Pilot query
- POST body: `{"query":[{"code":"Viti","selection":{"filter":"item","values":["2025","2024","2023"]}},{"code":"Variabla","selection":{"filter":"item","values":["0","1","2"]}}],"response":{"format":"json-stat2"}}`
- Result: 9 observations.

## Exact raw values (JSON-stat, row-major)
`[942137, 7055838, -6113701, 941508, 6370372, -5428864, 863141, 5917027, -5053886]`

| Year | Export | Import | Trade balance |
|---|---|---|---|
| 2025 | 942137 | 7055838 | -6113701 |
| 2024 | 941508 | 6370372 | -5428864 |
| 2023 | 863141 | 5917027 | -5053886 |

## Display-formatting rule
Albanian display uses a period as the thousands separator: 942137 → "942.137".
This is presentation only. The stored `valueOriginal` is the exact integer
`942137` (NUMERIC). No thousands separator is ever parsed as a decimal separator.
