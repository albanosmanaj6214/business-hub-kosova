'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Harta Leaflet + OpenStreetMap e Atlasit (si te Kosova Trade Connect): zoom/pan i lirë
// me maus, poligonet e 66 tregjeve + Kosovës të ngjyrosura sipas të dhënave reale.
// Gjeometria: Natural Earth 110m (public domain), /atlas-countries.json.

export interface LeafletMapProps {
  colorFor: (code: string) => string
  selected: string | null
  onSelect: (code: string) => void
  nameFor: (code: string) => string
}

export function AtlasLeafletMap({ colorFor, selected, onSelect, nameFor }: LeafletMapProps) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const layerRef = useRef<import('leaflet').GeoJSON | null>(null)
  const selectedRef = useRef<string | null>(selected)
  const propsRef = useRef({ colorFor, onSelect, nameFor })
  propsRef.current = { colorFor, onSelect, nameFor }

  useEffect(() => {
    let dead = false
    async function init() {
      if (!divRef.current || mapRef.current) return
      const L = (await import('leaflet')).default
      if (dead || !divRef.current) return

      const map = L.map(divRef.current, {
        center: [50, 12], zoom: 4, minZoom: 2, maxZoom: 8,
        worldCopyJump: true, attributionControl: true, zoomControl: true,
      })
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const res = await fetch('/atlas-countries.json')
      const geo = await res.json()
      if (dead) return

      const style = (feature?: { properties?: { code?: string } }) => {
        const code = feature?.properties?.code ?? ''
        if (code === 'XK') {
          return { fillColor: '#FFFFFF', fillOpacity: 0.9, color: '#E11D48', weight: 1.6, dashArray: '4 3' }
        }
        const isSel = selectedRef.current === code
        return {
          fillColor: propsRef.current.colorFor(code),
          fillOpacity: 0.78,
          color: isSel ? '#2E86C1' : '#FFFFFF',
          weight: isSel ? 2.6 : 1,
        }
      }

      const layer = L.geoJSON(geo, {
        style,
        onEachFeature: (feature, lyr) => {
          const code = feature.properties?.code as string
          lyr.bindTooltip(propsRef.current.nameFor(code), { sticky: true, direction: 'top' })
          if (code === 'XK') return
          lyr.on({
            click: () => { selectedRef.current = code; propsRef.current.onSelect(code); layer.setStyle(style) },
            mouseover: (e) => (e.target as import('leaflet').Path).setStyle({ weight: 2.2, color: '#2E86C1' }),
            mouseout: () => layer.setStyle(style),
          })
        },
      }).addTo(map)
      layerRef.current = layer
    }
    init()
    return () => {
      dead = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; layerRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Kur ndryshon selektimi nga jashtë, rifresko stilet
  useEffect(() => {
    selectedRef.current = selected
    if (layerRef.current) {
      layerRef.current.setStyle((feature?: { properties?: { code?: string } }) => {
        const code = feature?.properties?.code ?? ''
        if (code === 'XK') return { fillColor: '#FFFFFF', fillOpacity: 0.9, color: '#E11D48', weight: 1.6, dashArray: '4 3' }
        const isSel = selected === code
        return { fillColor: propsRef.current.colorFor(code), fillOpacity: 0.78, color: isSel ? '#2E86C1' : '#FFFFFF', weight: isSel ? 2.6 : 1 }
      })
    }
  }, [selected])

  function fitEurope() { mapRef.current?.setView([50, 12], 4) }
  function fitWorld() { mapRef.current?.setView([25, 10], 2) }

  return (
    <div className="relative">
      <div ref={divRef} className="w-full rounded-xl overflow-hidden" style={{ height: 'min(72vh, 640px)', minHeight: '440px', background: '#DCEAF5' }} />
      <div className="absolute top-3 right-3 z-[1000] flex gap-1.5">
        <button type="button" onClick={fitEurope} className="rounded-lg bg-white/95 border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 shadow hover:bg-gray-50">Evropa</button>
        <button type="button" onClick={fitWorld} className="rounded-lg bg-white/95 border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-700 shadow hover:bg-gray-50">Bota</button>
      </div>
    </div>
  )
}
