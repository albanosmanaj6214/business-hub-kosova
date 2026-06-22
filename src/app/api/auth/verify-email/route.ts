import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/verify-email?token=...
 *
 * Looks up the VerificationToken, sets the user's emailVerified=now,
 * deletes the token row. Returns JSON consumed by /verify-email page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Mungon tokeni i verifikimit.' }, { status: 400 })
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record) {
    return NextResponse.json(
      { ok: false, error: 'Linku është i pavlefshëm ose është përdorur tashmë.' },
      { status: 400 }
    )
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.json(
      { ok: false, error: 'Linku ka skaduar. Kërko një email të ri verifikimi.' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } })
  if (!user) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.json(
      { ok: false, error: 'Përdoruesi nuk u gjet.' },
      { status: 400 }
    )
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ])

  return NextResponse.json({ ok: true, email: user.email })
}
