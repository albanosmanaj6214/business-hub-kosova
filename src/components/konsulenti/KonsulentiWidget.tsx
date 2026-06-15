'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Çfarë grantesh aktive kam tash?',
  'Cilët panaire i përshtaten sektorit tim këtë vit?',
  'Si eksportoj produkte ushqimore në Gjermani?',
  'Çfarë certifikimesh më duhen për BE?',
]

interface KonsulentiContextValue {
  open: () => void
  close: () => void
  toggle: () => void
}

const ctxRef: { current: KonsulentiContextValue | null } = { current: null }

export function openKonsulenti() {
  ctxRef.current?.open()
}

interface Props {
  userName?: string | null
}

function firstName(name?: string | null): string {
  if (!name) return ''
  return name.trim().split(/\s+/)[0] || ''
}

export function KonsulentiWidget({ userName }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ used: number; limit: number; tier: string | null } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const name = firstName(userName)

  useEffect(() => {
    ctxRef.current = {
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((v) => !v),
    }
    return () => { ctxRef.current = null }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('konsulenti.sessionId')
    if (saved) setSessionId(saved)
  }, [])

  useEffect(() => {
    if (!open || !sessionId || historyLoaded) return
    setHistoryLoaded(true)
    fetch(`/api/konsulenti/chat?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.messages) {
          setMessages(data.messages.map((m: { id: string; role: string; content: string }) => ({
            id: m.id, role: m.role === 'user' ? 'user' : 'assistant', content: m.content,
          })))
        }
      })
      .catch(() => {})
  }, [open, sessionId, historyLoaded])

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const appendUnique = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === m.role && last.content === m.content) return prev
      return [...prev, m]
    })
  }, [])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setErrorMsg(null)
    appendUnique({ id: `u-${Date.now()}`, role: 'user', content: trimmed })
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/konsulenti/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setErrorMsg(data.message || 'Ke arritur limitin këtë muaj.')
        } else {
          setErrorMsg(data.error || 'Diçka shkoi keq. Provo prap.')
        }
        return
      }
      if (data.sessionId) {
        setSessionId(data.sessionId)
        if (typeof window !== 'undefined') window.localStorage.setItem('konsulenti.sessionId', data.sessionId)
      }
      if (data.usage) setUsage(data.usage)
      appendUnique({ id: `a-${Date.now()}`, role: 'assistant', content: data.reply || '' })
    } catch {
      setErrorMsg('Lidhja u prish. Provo prap.')
    } finally {
      setSending(false)
    }
  }, [sessionId, sending, appendUnique])

  const startNewSession = () => {
    setMessages([])
    setSessionId(null)
    setHistoryLoaded(true)
    setErrorMsg(null)
    if (typeof window !== 'undefined') window.localStorage.removeItem('konsulenti.sessionId')
  }

  const welcomeName = name ? `, ${name}` : ''

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Mbyll Asistentin KBH' : 'Hap Asistentin KBH'}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#1B4F72] text-white shadow-lg hover:bg-[#143a55] flex items-center justify-center transition group"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
        )}
      </button>

      <div
        className={cn(
          'fixed inset-y-0 right-0 z-30 w-full sm:w-[420px] bg-white border-l border-gray-200 shadow-xl flex flex-col transition-transform duration-200',
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        <header className="h-16 px-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#1B4F72] to-[#2E86C1] text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <div>
              <h2 className="text-sm font-semibold leading-tight">Asistenti KBH</h2>
              <p className="text-[11px] opacity-90 leading-tight">Pyetje për grante, panaire, eksport</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={startNewSession} className="text-[11px] px-2 py-1 rounded hover:bg-white/10" title="Bisedë e re">E re</button>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10" aria-label="Mbyll">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 text-sm text-gray-700">
                <p className="font-medium text-gray-900 mb-1">Mirë se erdhe{welcomeName}.</p>
                <p>Më pyet për grantet aktive, panairet ndërkombëtare, certifikime ose si të eksportosh në një shtet. Të përgjigjem me të dhënat nga platforma direkt këtu.</p>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Provo</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-sm bg-white border border-gray-200 hover:border-[#1B4F72] hover:bg-[#1B4F72]/5 rounded-xl px-3 py-2 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-[#1B4F72] text-white rounded-br-sm whitespace-pre-wrap'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm',
                  )}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:text-gray-900 prose-a:text-[#1B4F72] prose-a:font-medium prose-headings:text-gray-900 prose-headings:font-semibold prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} className="text-[#1B4F72] underline underline-offset-2 hover:text-[#143a55]" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>{children}</a>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Po mendoj...
              </div>
            </div>
          )}
          {errorMsg && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}
        </div>

        <footer className="border-t border-gray-200 p-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Shkruaj pyetjen tënde..."
              className="flex-1 resize-none rounded-xl border border-gray-300 focus:border-[#1B4F72] focus:ring-1 focus:ring-[#1B4F72] outline-none text-sm px-3 py-2 max-h-32"
            />
            <button
              type="button"
              disabled={sending || !input.trim()}
              onClick={() => send(input)}
              className="h-10 w-10 rounded-xl bg-[#1B4F72] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#143a55] transition"
              aria-label="Dërgo"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          {usage && (
            <p className="mt-2 text-[10px] text-gray-500 text-right">
              {usage.used}/{usage.limit === 9999 ? '∞' : usage.limit} mesazhe këtë muaj
            </p>
          )}
        </footer>
      </div>
    </>
  )
}
