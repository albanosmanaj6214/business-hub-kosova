import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'Kosova Business Hub <noreply@kosovabusinesses.aiaohub.com>'
const APP_URL = process.env.NEXTAUTH_URL || 'https://kosovabusinesses.aiaohub.com'

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export interface SendResult {
  ok: boolean
  provider: 'resend' | 'console'
  id?: string
  error?: string
}

function verificationEmailHtml(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="sq">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aktivizo llogarinë</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f6f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 4px 16px rgba(15,23,42,0.06);overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#1B4F72,#2E86C1);padding:24px 32px;color:#ffffff;">
                <div style="font-size:18px;font-weight:600;">Kosova Business Hub</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Aktivizo llogarinë</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                  Faleminderit që u regjistrove në Kosova Business Hub. Për të vazhduar, kliko butonin më poshtë për të aktivizuar llogarinë.
                </p>
                <p style="margin:24px 0;text-align:center;">
                  <a href="${verifyUrl}" style="display:inline-block;background:#2E86C1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
                    Aktivizo llogarinë
                  </a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
                  Nëse butoni nuk funksionon, kopjo linkun në shfletues:
                </p>
                <p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
                  <a href="${verifyUrl}" style="color:#2E86C1;">${verifyUrl}</a>
                </p>
                <p style="margin:0;font-size:13px;color:#94a3b8;">
                  Ky link skadon brenda 24 orësh. Nëse nuk je ti që e ke nisur këtë regjistrim, mund ta injorosh këtë email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
                Kosova Business Hub — kosovabusinesses.aiaohub.com
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function verificationEmailText(verifyUrl: string): string {
  return `Kosova Business Hub

Aktivizo llogarinë

Faleminderit që u regjistrove në Kosova Business Hub. Për të vazhduar, hap linkun më poshtë për të aktivizuar llogarinë:

${verifyUrl}

Ky link skadon brenda 24 orësh. Nëse nuk je ti që e ke nisur këtë regjistrim, mund ta injorosh këtë email.

Kosova Business Hub
kosovabusinesses.aiaohub.com`
}

export function buildVerificationUrl(token: string): string {
  return `${APP_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`
}

export async function sendVerificationEmail(to: string, token: string): Promise<SendResult> {
  const verifyUrl = buildVerificationUrl(token)
  const subject = 'Aktivizo llogarinë në Kosova Business Hub'

  if (!resend) {
    // Pa transport, email-i NUK dergohet. Kthejme ok:false — me pare kthehej
    // ok:true dhe regjistrimi raportonte sukses ndersa asnje email nuk ikte,
    // deshtim i heshtur me te keq sesa nje gabim i dukshem.
    // URL-ja shtypet ne log qe zhvillimi lokal te vazhdoje pa Resend.
    // eslint-disable-next-line no-console
    console.warn(
      `[email] RESEND_API_KEY not set. Verification email NOT sent.\n` +
        `        To: ${to}\n` +
        `        Subject: ${subject}\n` +
        `        URL: ${verifyUrl}`
    )
    return {
      ok: false,
      provider: 'console',
      error: 'Transporti i email-it nuk eshte konfiguruar (RESEND_API_KEY mungon).',
    }
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html: verificationEmailHtml(verifyUrl),
      text: verificationEmailText(verifyUrl),
    })
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error('[email] Resend error:', result.error)
      return { ok: false, provider: 'resend', error: String(result.error.message || result.error) }
    }
    return { ok: true, provider: 'resend', id: result.data?.id }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] Resend exception:', err)
    return { ok: false, provider: 'resend', error: err instanceof Error ? err.message : String(err) }
  }
}

export interface NewsEmail {
  title: string
  summary: string | null
  // Path-i brenda platformes (p.sh. /dashboard/lajme) ose URL e plote.
  link: string
}

function absoluteUrl(link: string): string {
  if (/^https?:\/\//i.test(link)) return link
  return `${APP_URL.replace(/\/$/, '')}${link.startsWith('/') ? '' : '/'}${link}`
}

function newsEmailHtml(n: NewsEmail, url: string): string {
  const summary = n.summary
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${n.summary}</p>`
    : ''
  return `<!DOCTYPE html>
<html lang="sq">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${n.title}</title></head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f6f8;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.06);">
          <tr><td style="background:linear-gradient(135deg,#1B4F72,#2E86C1);padding:20px 32px;color:#ffffff;font-size:16px;font-weight:600;">Kosova Business Hub</td></tr>
          <tr><td style="padding:32px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;margin-bottom:8px;">Lajme dhe Informata</div>
            <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;line-height:1.35;">${n.title}</h1>
            ${summary}
            <p style="margin:24px 0;text-align:center;">
              <a href="${url}" style="display:inline-block;background:#2E86C1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:10px;font-weight:600;font-size:15px;">Lexo në platformë</a>
            </p>
          </td></tr>
          <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">Kosova Business Hub. kosovabusinesses.aiaohub.com</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

function newsEmailText(n: NewsEmail, url: string): string {
  return `Kosova Business Hub. Lajme dhe Informata

${n.title}
${n.summary ? `\n${n.summary}\n` : ''}
Lexo në platformë: ${url}

Kosova Business Hub
kosovabusinesses.aiaohub.com`
}

// Newsletter per nje lajm te dispeçuar. Thirret vetem kur admini zgjedh email-in (opt-in).
export async function sendNewsEmail(to: string, n: NewsEmail): Promise<SendResult> {
  const url = absoluteUrl(n.link)
  const subject = `Lajm i ri: ${n.title}`.slice(0, 120)

  if (!resend) {
    // Njesoj si te verifikimi: pa transport => ok:false, jo sukses i shtirur.
    // eslint-disable-next-line no-console
    console.warn(`[email] RESEND_API_KEY not set. News email NOT sent.\n        To: ${to}\n        Subject: ${subject}`)
    return {
      ok: false,
      provider: 'console',
      error: 'Transporti i email-it nuk eshte konfiguruar (RESEND_API_KEY mungon).',
    }
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html: newsEmailHtml(n, url),
      text: newsEmailText(n, url),
    })
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error('[email] Resend news error:', result.error)
      return { ok: false, provider: 'resend', error: String(result.error.message || result.error) }
    }
    return { ok: true, provider: 'resend', id: result.data?.id }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] Resend news exception:', err)
    return { ok: false, provider: 'resend', error: err instanceof Error ? err.message : String(err) }
  }
}
