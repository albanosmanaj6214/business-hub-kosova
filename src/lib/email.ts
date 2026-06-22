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
    // Dev/staging fallback — log the URL so it can be copied from PM2 output.
    // eslint-disable-next-line no-console
    console.warn(
      `[email] RESEND_API_KEY not set. Verification email NOT sent.\n` +
        `        To: ${to}\n` +
        `        Subject: ${subject}\n` +
        `        URL: ${verifyUrl}`
    )
    return { ok: true, provider: 'console' }
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
