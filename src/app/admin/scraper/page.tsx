'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'

interface SourceHealth {
  code: string
  name: string
  homepage: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  consecutiveFailures: number
  avgDurationMs: number | null
  totalItemsLifetime: number
}

interface AttemptLog {
  id: string
  sourceCode: string
  sourceName: string
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL'
  itemsFound: number
  itemsNew: number
  itemsUpdated: number
  durationMs: number | null
  errorMessage: string | null
  startedAt: string
  finishedAt: string | null
  triggeredBy: string
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'asnjëherë'
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'tani'
  if (min < 60) return `${min} min më parë`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} orë më parë`
  return `${Math.floor(h / 24)} ditë më parë`
}

export default function ScraperPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [logs, setLogs] = useState<AttemptLog[]>([])
  const [health, setHealth] = useState<SourceHealth[]>([])

  const refresh = useCallback(async () => {
    const r = await fetch('/api/admin/scraper-logs')
    const data = await r.json()
    setLogs(data.logs || [])
    setHealth(data.health || [])
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, result])

  const runScraper = async (source?: string) => {
    setLoading(source || 'ALL')
    setResult(null)
    try {
      const res = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source ? { source } : {}),
      })
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ error: String(e?.message || e) })
    } finally {
      setLoading(null)
      await refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scraper i të dhënave</h1>
          <p className="text-gray-500 text-sm mt-1">
            Burime aktive: {health.length}. Cron ditor në 03:00 (CET).
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Rifresko
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Burime aktive</h2>
        </CardHeader>
        <CardContent>
          {health.length === 0 ? (
            <p className="text-gray-500 text-sm">Nuk ka burime aktive.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {health.map((s) => {
                const ok = s.consecutiveFailures === 0 && !!s.lastSuccessAt
                return (
                  <div
                    key={s.code}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {ok ? (
                            <CheckCircle2 className="h-4 w-4 text-[#27AE60] flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-[#F39C12] flex-shrink-0" />
                          )}
                          <p className="font-semibold text-gray-900">{s.code}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.name}</p>
                      </div>
                      {s.homepage && (
                        <a
                          href={s.homepage}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-[#2E86C1]"
                          title="Hap burimin"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        Sukses i fundit:{' '}
                        <span className="font-medium text-gray-900">
                          {timeAgo(s.lastSuccessAt)}
                        </span>
                      </div>
                      <div>
                        Total artikuj: <span className="font-medium">{s.totalItemsLifetime}</span>
                        {s.avgDurationMs ? <> · ~{s.avgDurationMs}ms/run</> : null}
                      </div>
                      {s.consecutiveFailures > 0 && (
                        <div className="text-[#E74C3C]">
                          {s.consecutiveFailures} dështime me radhë
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => runScraper(s.code)}
                      disabled={!!loading}
                      size="sm"
                      className="w-full"
                    >
                      {loading === s.code ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Bot className="h-4 w-4 mr-2" />
                      )}
                      Ekzekuto {s.code}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              onClick={() => runScraper()}
              disabled={!!loading}
              variant="success"
              size="lg"
              className="w-full md:w-auto"
            >
              {loading === 'ALL' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Ekzekuto të gjitha burimet
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Rezultati i fundit</h2>
          </CardHeader>
          <CardContent>
            {result.totals && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Stat label="Artikuj" value={result.totals.items} />
                <Stat label="Të rinj" value={result.totals.itemsNew} highlight />
                <Stat label="Përditësuar" value={result.totals.itemsUpdated} />
                <Stat
                  label="Grante (krijuar)"
                  value={result.totals.grantsCreated}
                />
              </div>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                Përgjigja e plotë (JSON)
              </summary>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto mt-2">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Histori (30 të fundit)</h2>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">Nuk ka ende histori.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2 pr-4">Burimi</th>
                    <th className="text-right py-2 pr-4">Artikuj</th>
                    <th className="text-right py-2 pr-4">Të rinj</th>
                    <th className="text-right py-2 pr-4">Kohëzgjatje</th>
                    <th className="text-left py-2 pr-4">Trigger</th>
                    <th className="text-right py-2">Filloi</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 pr-4">
                        {log.status === 'SUCCESS' ? (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : log.status === 'FAILED' ? (
                          <Badge variant="danger">
                            <XCircle className="h-3 w-3 mr-1" />
                            Dështoi
                          </Badge>
                        ) : (
                          <Badge variant="warning">{log.status}</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 font-medium text-gray-900">
                        {log.sourceCode}
                      </td>
                      <td className="py-2 pr-4 text-right">{log.itemsFound}</td>
                      <td className="py-2 pr-4 text-right text-[#27AE60]">
                        {log.itemsNew > 0 ? `+${log.itemsNew}` : '0'}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-500">
                        {log.durationMs ? `${log.durationMs}ms` : '—'}
                      </td>
                      <td className="py-2 pr-4 text-gray-500 text-xs">
                        {log.triggeredBy}
                      </td>
                      <td className="py-2 text-right text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.startedAt).toLocaleString('sq-AL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-2xl font-bold ${
          highlight ? 'text-[#27AE60]' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
