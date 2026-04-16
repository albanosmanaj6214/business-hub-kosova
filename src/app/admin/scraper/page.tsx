'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Loader2, Search, Calendar, RefreshCw } from 'lucide-react'

export default function ScraperPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/scraper-logs')
      .then((r) => r.json())
      .then((data) => setLogs(data.logs || []))
  }, [result])

  const runScraper = async (type: string) => {
    setLoading(type)
    setResult(null)

    const res = await fetch('/api/scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })

    const data = await res.json()
    setResult(data)
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <Search className="h-8 w-8 text-[#1B4F72] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Scrape Grante</h3>
            <Button onClick={() => runScraper('grants')} disabled={!!loading} className="w-full">
              {loading === 'grants' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
              Fillo
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <Calendar className="h-8 w-8 text-[#2E86C1] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Scrape Panaire</h3>
            <Button onClick={() => runScraper('fairs')} disabled={!!loading} variant="secondary" className="w-full">
              {loading === 'fairs' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
              Fillo
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <RefreshCw className="h-8 w-8 text-[#27AE60] mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Scrape Te Gjitha</h3>
            <Button onClick={() => runScraper('all')} disabled={!!loading} variant="success" className="w-full">
              {loading === 'all' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
              Fillo
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-2">Rezultati</h3>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><h2 className="font-semibold">Scraper Logs</h2></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">Nuk ka logs.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.status}
                    </span>
                    <span>{log.type} - {log.message}</span>
                    <span className="text-gray-400">({log.itemsFound} items, {log.duration}ms)</span>
                  </div>
                  <span className="text-gray-400">{new Date(log.createdAt).toLocaleString('sq-AL')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
