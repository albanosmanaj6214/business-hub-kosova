'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Loader2, Calendar } from 'lucide-react'

export default function BookingsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ date: '', time: '', topic: '', notes: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)
    setSuccess(true)
    setForm({ date: '', time: '', topic: '', notes: '' })
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Konsultime</h1>
        <p className="text-gray-500 mt-1">Rezervoni nje konsultim me eksperte te eksportit.</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Konsultimi u rezervua me sukses! Do te kontaktoheni se shpejti.
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Rezervo Konsultim</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input id="date" label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <Input id="time" label="Ora" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
            <Input id="topic" label="Tema" placeholder="p.sh. Eksporti ne Gjermani" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required />
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Shenime</label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] min-h-[100px]"
                placeholder="Pershkruani nevojat tuaja..."
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
              Rezervo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
