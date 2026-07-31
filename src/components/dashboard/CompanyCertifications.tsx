'use client'

import { useEffect, useState } from 'react'
import { Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CertificationPicker, type CertItem } from '@/components/certifications/CertificationPicker'

// Seksioni "Certifikimet" i profilit të kompanisë: ngarkon certifikimet ekzistuese,
// lejon tick/toggle + vit + skadencë dhe i ruan te /api/company/certifications.
export function CompanyCertifications({ sectors }: { sectors: string[] }) {
  const [items, setItems] = useState<CertItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/company/certifications')
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.items) ? d.items.map((i: CertItem) => ({ code: i.code, obtainedYear: i.obtainedYear ?? null, validUntil: i.validUntil ?? null })) : []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true))
  }, [])

  async function save() {
    setSaving(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/company/certifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Ruajtja dështoi'); return }
      setMsg('Certifikimet u ruajtën.')
      setTimeout(() => setMsg(null), 3000)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-[#2E86C1]" />
          <h2 className="text-lg font-semibold text-gray-900">Certifikimet</h2>
        </div>
        {loaded ? (
          <>
            <CertificationPicker sectors={sectors} value={items} onChange={setItems} showValidity />
            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex h-10 items-center rounded-lg bg-[#2E86C1] px-4 text-sm font-medium text-white hover:bg-[#2874A6] disabled:opacity-60"
              >
                {saving ? 'Duke ruajtur…' : 'Ruaj certifikimet'}
              </button>
              {msg && <span className="text-sm text-green-700">{msg}</span>}
              {err && <span className="text-sm text-red-600">{err}</span>}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">Duke ngarkuar…</p>
        )}
      </CardContent>
    </Card>
  )
}
