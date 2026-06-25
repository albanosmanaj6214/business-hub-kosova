import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sectorBySlug, sectorsLabel } from '@/lib/sectors'
import { isActivityType } from '@/lib/activity'
import { isEmployeeCount, activityNeedsSector } from '@/lib/employee-count'
import { sendVerificationEmail } from '@/lib/email'
import {
  verifyTurnstile,
  getClientIp,
  checkRegistrationRateLimit,
} from '@/lib/turnstile'

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24h

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)

    // Rate limit BEFORE doing any work: protects DB + email provider from
    // burst abuse even if the attacker has a valid Turnstile token.
    const rate = checkRegistrationRateLimit(ip)
    if (!rate.ok) {
      return NextResponse.json(
        {
          error:
            'Shumë regjistrime nga ky rrjet. Provo prap pas një ore.',
        },
        { status: 429 },
      )
    }

    const body = await req.json()
    const {
      email,
      password,
      name,
      companyName,
      sector,
      sectors,
      activityType,
      employeeCount,
      interests,
      language,
      femaleOwnership,
      turnstileToken,
    } = body

    // CAPTCHA gate. Reject with 400 if token missing/invalid.
    const captcha = await verifyTurnstile(turnstileToken, ip)
    if (!captcha.success) {
      return NextResponse.json(
        { error: captcha.error || 'Verifikimi i sigurisë dështoi.' },
        { status: 400 },
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dhe fjalëkalimi janë të detyrueshme' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Shkruaj emrin dhe mbiemrin' },
        { status: 400 }
      )
    }
    if (typeof companyName !== 'string' || !companyName.trim()) {
      return NextResponse.json(
        { error: 'Shkruaj emrin e kompanisë' },
        { status: 400 }
      )
    }
    if (!isEmployeeCount(employeeCount)) {
      return NextResponse.json(
        { error: 'Zgjidh madhësinë e ndërmarrjes' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ky email është i regjistruar tashmë' },
        { status: 409 }
      )
    }

    // sectors[] is the new canonical input. Accept the legacy `sector` string
    // as a fallback for old clients but always store the canonical slug array.
    const normalisedSectors: string[] = Array.isArray(sectors)
      ? Array.from(new Set(sectors.filter((s: unknown): s is string => typeof s === "string" && !!sectorBySlug(s)))).slice(0, 1)
      : []
    // Lloji i aktivitetit eshte i detyrueshem dhe boshti kryesor i targetimit.
    if (typeof activityType !== 'string' || !isActivityType(activityType)) {
      return NextResponse.json(
        { error: 'Zgjidh llojin e aktivitetit të biznesit' },
        { status: 400 }
      )
    }

    // Sektori kerkohet vetem per aktivitete qe e kane sektorin si dimension shtese
    // (prodhues-perpunues, sherbime). Tregti / bujqesi nuk e kerkojne.
    if (activityNeedsSector(activityType) && normalisedSectors.length === 0) {
      return NextResponse.json(
        { error: 'Zgjidh sektorin e biznesit' },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName,
        // Keep legacy sector populated with a human-readable label for any old
        // code paths still reading it. Will be removed in a follow-up migration.
        sector: typeof sector === 'string' && sector ? sector : sectorsLabel(normalisedSectors),
        sectors: normalisedSectors,
        activityType,
        employeeCount,
        // Baza falas jep qasje ne sektorin e deklaruar. Sektore shtese hapen nga admini (Faza E).
        entitledSectors: activityNeedsSector(activityType) ? normalisedSectors : [],
        interests: interests || [],
        language: language || 'sq',
        // Tri-state: only persist boolean if explicitly true/false; otherwise leave NULL
        // so we can distinguish "user did not declare" from "user said no".
        femaleOwnership: typeof femaleOwnership === 'boolean' ? femaleOwnership : null,
        // emailVerified intentionally left null — user must click email link.
        subscription: {
          create: {
            tier: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
    })

    // Generate verification token + persist + send email.
    const token = randomBytes(32).toString('hex')
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    })

    const sendResult = await sendVerificationEmail(user.email, token)

    return NextResponse.json(
      {
        message: 'Regjistrimi u krye me sukses. Kontrollo email-in për aktivizimin e llogarisë.',
        userId: user.id,
        email: user.email,
        emailProvider: sendResult.provider,
        emailSent: sendResult.ok,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Gabim gjatë regjistrimit' },
      { status: 500 }
    )
  }
}
