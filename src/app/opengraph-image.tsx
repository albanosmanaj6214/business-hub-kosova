import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Kosova Business Hub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Imazhi i ndarjes ne rrjete sociale. Gjenerohet nga vete aplikacioni, pa asete te jashtme.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #1B4F72 0%, #2E86C1 100%)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 6, opacity: 0.75 }}>
          KOSOVA BUSINESS HUB
        </div>
        <div style={{ display: 'flex', fontSize: 68, fontWeight: 700, lineHeight: 1.15, marginTop: 28 }}>
          Financim, panaire dhe tregje eksporti
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#F39C12', marginTop: 16 }}>
          per bizneset kosovare, ne nje platforme te vetme.
        </div>
        <div style={{ display: 'flex', fontSize: 26, opacity: 0.7, marginTop: 44 }}>
          kosovabusinesses.aiaohub.com
        </div>
      </div>
    ),
    size,
  )
}
