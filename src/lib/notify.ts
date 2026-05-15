/**
 * Send notifications about new leads / newsletter subscriptions.
 * Today: Telegram (env-gated) + console log.
 * Email transport added later when SMTP/Resend is chosen.
 */

interface LeadPayload {
  type: 'consultation' | 'newsletter'
  name?: string
  email: string
  phone?: string
  company?: string
  category?: string
  context?: string
  message?: string
  source?: string
  sector?: string
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? 'albanosmanaj@gmail.com'

export async function notifyNewLead(payload: LeadPayload): Promise<void> {
  const lines = formatLead(payload)
  const text = lines.join('\n')

  console.log(`\n=== NEW LEAD (${payload.type}) ===\n${text}\n=================\n`)

  if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      })
      if (!res.ok) {
        console.error('[notify] Telegram send failed:', res.status, await res.text())
      }
    } catch (err) {
      console.error('[notify] Telegram error:', (err as Error).message)
    }
  } else {
    console.log(`[notify] Telegram skipped (set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID to enable). Notify-to: ${NOTIFY_EMAIL}`)
  }
}

function formatLead(p: LeadPayload): string[] {
  if (p.type === 'newsletter') {
    return [
      '<b>📬 Newsletter abonim i ri</b>',
      '',
      `Email: <code>${escape(p.email)}</code>`,
      p.name ? `Emër: ${escape(p.name)}` : '',
      p.sector ? `Sektor: ${escape(p.sector)}` : '',
      p.source ? `Burimi: ${escape(p.source)}` : '',
    ].filter(Boolean)
  }
  return [
    '<b>🔔 Kërkesë e re kontakti</b>',
    p.category ? `<b>Kategoria:</b> ${escape(p.category)}` : '',
    p.context ? `<b>Konteksti:</b> ${escape(p.context)}` : '',
    '',
    `<b>Emri:</b> ${escape(p.name || '—')}`,
    `<b>Email:</b> <code>${escape(p.email)}</code>`,
    p.phone ? `<b>Tel:</b> <code>${escape(p.phone)}</code>` : '',
    p.company ? `<b>Kompania:</b> ${escape(p.company)}` : '',
    '',
    p.message ? `<b>Mesazhi:</b>\n${escape(p.message)}` : '',
    '',
    p.source ? `<i>Nga: ${escape(p.source)}</i>` : '',
  ].filter(Boolean)
}

function escape(s: any): string {
  if (typeof s !== 'string') s = String(s ?? '')
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// helper exposed for test
export const _internal = { formatLead }
