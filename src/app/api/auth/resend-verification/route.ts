import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24h

/**
 * POST /api/auth/resend-verification
 * Body: { email: string }
 *
 * Returns a generic success regardless of whether the email exists, so this
 * endpoint cannot be used to enumerate accounts.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json({ error: 'Email-i është i detyrueshëm.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Only act if the user exists AND is not yet verified. Always return the
    // same success payload to avoid leaking which emails are registered.
    if (user && !user.emailVerified) {
      // Wipe any existing tokens for this identifier so old links stop working.
      await prisma.verificationToken.deleteMany({ where: { identifier: user.email } })

      const token = randomBytes(32).toString('hex')
      await prisma.verificationToken.create({
        data: {
          identifier: user.email,
          token,
          expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        },
      })

      await sendVerificationEmail(user.email, token)
    }

    return NextResponse.json({
      ok: true,
      message: 'Nëse adresa ekziston dhe nuk është verifikuar, do të marrësh një email të ri.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Gabim gjatë dërgimit të email-it.' }, { status: 500 })
  }
}
