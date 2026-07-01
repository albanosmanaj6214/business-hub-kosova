'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

interface Props {
  initial: {
    q?: string
    role?: string
    activity?: string
    sector?: string
    country?: string
    municipality?: string
    verified?: string
  }
  sectors: { value: string; label: string }[]
}

export function DirectoryFilters({ initial, sectors }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initial.q ?? '')
  const [role, setRole] = useState(initial.role ?? '')
  const [activity, setActivity] = useState(initial.activity ?? '')
  const [sector, setSector] = useState(initial.sector ?? '')
  const [country, setCountry] = useState(initial.country ?? '')
  const [verified, setVerified] = useState(initial.verified === '1')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const apply = () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (role) params.set('role', role)
    if (activity) params.set('activity', activity)
    if (sector) params.set('sector', sector)
    if (country) params.set('country', country)
    if (verified) params.set('verified', '1')
    router.push('/dashboard/directory' + (params.toString() ? '?' + params.toString() : ''))
  }

  const clear = () => {
    setQ(''); setRole(''); setActivity(''); setSector(''); setCountry(''); setVerified(false)
    router.push('/dashboard/directory')
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Kërko emrin e kompanisë ose përshkrimin..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />
        </div>
        <button
          onClick={apply}
          className="px-4 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium"
        >
          Kërko
        </button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
        >
          Filtrat <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-gray-100">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          >
            <option value="">Të gjitha rolet</option>
            <option value="KOSOVO_BUSINESS">Biznes Kosovar</option>
            <option value="STARTUP">Start Up</option>
            <option value="DIASPORA">Diaspora</option>
          </select>

          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          >
            <option value="">Të gjitha aktivitetet</option>
            <option value="prodhues-perpunues">Prodhues / Përpunues</option>
            <option value="sherbime">Shërbime</option>
            <option value="tregti">Tregti</option>
            <option value="bujqesi">Bujqësi</option>
          </select>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          >
            <option value="">Të gjithë sektorët</option>
            {sectors.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <input
            type="text"
            placeholder="Shteti/Komuna"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="rounded border-gray-300"
            />
            Vetëm Verified
          </label>

          <button
            onClick={apply}
            className="col-span-1 sm:col-span-2 h-10 px-4 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium"
          >
            Apliko filtrat
          </button>
          <button
            onClick={clear}
            className="h-10 px-4 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1 justify-center"
          >
            <X className="h-4 w-4" /> Pastro
          </button>
        </div>
      )}
    </div>
  )
}
