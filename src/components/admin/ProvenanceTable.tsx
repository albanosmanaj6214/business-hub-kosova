'use client'

import { useMemo, useState } from 'react'
import { Search, Copy, Check, ExternalLink, Download } from 'lucide-react'
import type { ProvenanceRow, SourceKind } from '@/lib/provenance/registry'

const KIND_LABEL: Record<SourceKind, string> = {
  PARESOR: 'Parësor',
  AUTORITET: 'Autoritet',
  STATISTIKE: 'Statistikë',
  DYTESOR: 'Dytësor',
  PRIVAT: 'Privat',
  PA_BURIM: 'Pa burim',
}

const KIND_CLS: Record<SourceKind, string> = {
  PARESOR: 'bg-green-50 text-green-800 border-green-300',
  AUTORITET: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  STATISTIKE: 'bg-sky-50 text-sky-800 border-sky-300',
  DYTESOR: 'bg-amber-50 text-amber-800 border-amber-300',
  PRIVAT: 'bg-orange-50 text-orange-800 border-orange-300',
  PA_BURIM: 'bg-red-50 text-red-800 border-red-300',
}

const ORDER: SourceKind[] = ['PARESOR', 'AUTORITET', 'STATISTIKE', 'DYTESOR', 'PRIVAT', 'PA_BURIM']

export function ProvenanceTable({
  rows, modules, counts, generatedAt,
}: {
  rows: ProvenanceRow[]
  modules: string[]
  counts: Record<string, number>
  generatedAt: string
}) {
  const [qs, setQs] = useState('')
  const [mod, setMod] = useState('')
  const [kind, setKind] = useState<'' | SourceKind>('')
  const [copied, setCopied] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const needle = qs.trim().toLowerCase()
    return rows.filter((r) => {
      if (mod && r.module !== mod) return false
      if (kind && r.kind !== kind) return false
      if (!needle) return true
      return (
        r.item.toLowerCase().includes(needle) ||
        r.source.toLowerCase().includes(needle) ||
        r.module.toLowerCase().includes(needle) ||
        (r.url ?? '').toLowerCase().includes(needle)
      )
    })
  }, [rows, qs, mod, kind])

  // Teksti që i dërgohet dikujt që pyet "prej ku e keni këtë".
  async function copyRow(r: ProvenanceRow, i: number) {
    const txt = [
      `${r.item}`,
      `Moduli: ${r.module}`,
      `Burimi: ${r.source}`,
      r.url ? `Link: ${r.url}` : 'Link: nuk ka',
      r.checkedAt ? `Kontrolluar: ${r.checkedAt}` : null,
    ].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(txt)
      setCopied(i)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      /* shfletuesi e bllokoi clipboard-in */
    }
  }

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const head = ['Moduli', 'Rruga', 'Zëri', 'Burimi', 'Link', 'Kontrolluar', 'Lloji', 'Shënim']
    const body = filtered.map((r) => [
      r.module, r.route, r.item, r.source, r.url ?? '', r.checkedAt ?? '',
      KIND_LABEL[r.kind], r.note ?? '',
    ].map((c) => esc(String(c))).join(','))
    // BOM që Excel-i t'i lexojë ë-të dhe ç-të si duhet.
    const blob = new Blob(['﻿' + [head.map(esc).join(','), ...body].join('\r\n')],
      { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `burimet-kbh-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-4">
      {/* Numëruesit sipas llojit — klikohen si filtër */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setKind('')}
          className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
            kind === '' ? 'bg-[#1B4F72] text-white border-[#1B4F72]' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          Të gjitha <span className="tabular-nums">{rows.length}</span>
        </button>
        {ORDER.filter((k) => counts[k]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(kind === k ? '' : k)}
            className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              kind === k ? 'ring-2 ring-offset-1 ring-[#1B4F72] ' : ''
            }${KIND_CLS[k]}`}
          >
            {KIND_LABEL[k]} <span className="tabular-nums">{counts[k]}</span>
          </button>
        ))}
      </div>

      {/* Kërkimi + moduli + eksporti */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={qs}
            onChange={(e) => setQs(e.target.value)}
            placeholder="Kërko: TVSH, CE Marking, Gjermani, EUR-Lex..."
            aria-label="Kërko në regjistrin e burimeve"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />
        </div>
        <select
          value={mod}
          onChange={(e) => setMod(e.target.value)}
          aria-label="Filtro sipas modulit"
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
        >
          <option value="">Të gjitha modulet</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:border-gray-400"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> CSV
        </button>
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length === rows.length
          ? `${rows.length} zëra · gjeneruar ${generatedAt}`
          : `${filtered.length} nga ${rows.length} zëra`}
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
        <table className="w-full text-sm min-w-[880px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2 font-semibold">Zëri</th>
              <th className="px-3 py-2 font-semibold">Moduli</th>
              <th className="px-3 py-2 font-semibold">Burimi</th>
              <th className="px-3 py-2 font-semibold">Kontrolluar</th>
              <th className="px-3 py-2 font-semibold">Lloji</th>
              <th className="px-3 py-2 font-semibold text-right">Veprim</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={`${r.module}-${r.item}-${i}`} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 align-top">
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{r.item}</div>
                  {r.note && <div className="text-xs text-amber-700 mt-0.5 max-w-xl">{r.note}</div>}
                </td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.module}</td>
                <td className="px-3 py-2 text-gray-700">
                  <div>{r.source}</div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-[#2E86C1] hover:underline inline-flex items-center gap-1 mt-0.5 break-all">
                      {r.url.replace(/^https?:\/\//, '').slice(0, 58)}
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-500 tabular-nums whitespace-nowrap">{r.checkedAt ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${KIND_CLS[r.kind]}`}>
                    {KIND_LABEL[r.kind]}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => copyRow(r, i)}
                    title="Kopjo burimin për ta dërguar"
                    aria-label={`Kopjo burimin për ${r.item}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 border border-gray-300 rounded text-xs hover:border-gray-400 whitespace-nowrap"
                  >
                    {copied === i
                      ? <><Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" /> U kopjua</>
                      : <><Copy className="h-3.5 w-3.5" aria-hidden="true" /> Kopjo</>}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-gray-500">
                Asnjë zë nuk përputhet me kërkimin.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
