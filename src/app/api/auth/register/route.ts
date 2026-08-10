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
      municipality,
      address,
      activityType,
      employeeCount,
      turnoverBand,
      certifications,
      interests,
      role,
      countryOfOperation,
      city,
      diasporaSubRoles,
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
    const validRoles = ['KOSOVO_BUSINESS', 'STARTUP', 'DIASPORA', 'INDIVIDUAL'] as const
    if (typeof role !== 'string' || !(validRoles as readonly string[]).includes(role)) {
      return NextResponse.json(
        { error: 'Zgjidh rolin: Biznes Kosovar, Start Up, Diaspora ose Individ' },
        { status: 400 }
      )
    }
    const roleValue = role as (typeof validRoles)[number]

    // Fushat mandatore ndryshojnë sipas rolit.
    if (roleValue !== 'INDIVIDUAL') {
      if (typeof companyName !== 'string' || !companyName.trim()) {
        return NextResponse.json(
          { error: roleValue === 'DIASPORA' ? 'Shkruaj emrin e biznesit ose personit' : 'Shkruaj emrin e kompanisë' },
          { status: 400 }
        )
      }
    }
    if (roleValue === 'KOSOVO_BUSINESS' || roleValue === 'STARTUP') {
      if (!isEmployeeCount(employeeCount)) {
        return NextResponse.json(
          { error: 'Zgjidh madhësinë e ndërmarrjes' },
          { status: 400 }
        )
      }
      if (typeof municipality !== 'string' || !municipality.trim()) {
        return NextResponse.json({ error: 'Zgjidh komunën e biznesit' }, { status: 400 })
      }
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
    // Aktiviteti + sektori kërkohen vetëm për KOSOVO_BUSINESS + STARTUP.
    // Diaspora ka DiasporaProfile me fusha të veta. Individ nuk ka Company.
    if (roleValue === 'KOSOVO_BUSINESS' || roleValue === 'STARTUP') {
      if (typeof activityType !== 'string' || !isActivityType(activityType)) {
        return NextResponse.json(
          { error: 'Zgjidh llojin e aktivitetit të biznesit' },
          { status: 400 }
        )
      }
      if (activityNeedsSector(activityType) && normalisedSectors.length === 0) {
        return NextResponse.json(
          { error: 'Zgjidh sektorin e biznesit' },
          { status: 400 }
        )
      }
    }
    if (roleValue === 'DIASPORA') {
      if (typeof countryOfOperation !== 'string' || !countryOfOperation.trim()) {
        return NextResponse.json({ error: 'Shkruaj vendin ku operon' }, { status: 400 })
      }
      if (typeof city !== 'string' || !city.trim()) {
        return NextResponse.json({ error: 'Shkruaj qytetin' }, { status: 400 })
      }
      if (!Array.isArray(diasporaSubRoles) || diasporaSubRoles.length === 0) {
        return NextResponse.json({ error: 'Zgjidh të paktën një rol Diaspora' }, { status: 400 })
      }
    }

    const hashedPassword = await hash(password, 12)

    // Krijim User + Subscription. Company + profil-i rol-specifik krijohen menjëherë pas.
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName: roleValue === 'INDIVIDUAL' ? null : companyName,
        role: roleValue,
        sector: roleValue === 'INDIVIDUAL' || roleValue === 'DIASPORA' ? null : (typeof sector === 'string' && sector ? sector : sectorsLabel(normalisedSectors)),
        sectors: roleValue === 'INDIVIDUAL' || roleValue === 'DIASPORA' ? [] : normalisedSectors,
        activityType: roleValue === 'KOSOVO_BUSINESS' || roleValue === 'STARTUP' ? activityType : null,
        employeeCount: roleValue === 'KOSOVO_BUSINESS' || roleValue === 'STARTUP' ? employeeCount : null,
        entitledSectors: (roleValue === 'KOSOVO_BUSINESS' || roleValue === 'STARTUP') && activityNeedsSector(activityType) ? normalisedSectors : [],
        // Njoftimet aktive per te gjitha modulet si default; ngushtohen te Cilesimet.
        interests: Array.isArray(interests) && interests.length > 0
          ? interests
          : ['grants', 'fairs', 'guides', 'news', 'certifications', 'consultations'],
        language: language || 'sq',
        femaleOwnership: typeof femaleOwnership === 'boolean' ? femaleOwnership : null,
        subscription: {
          create: {
            tier: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
    })

    // Krijim Company për çdo rol biznesor (jo INDIVIDUAL, jo ADMIN).
    if (roleValue !== 'INDIVIDUAL') {
      const company = await prisma.company.create({
        data: {
          ownerUserId: user.id,
          roleType: roleValue,
          name: companyName,
          activityType: roleValue === 'DIASPORA' ? null : activityType,
          sectors: roleValue === 'DIASPORA' ? [] : normalisedSectors,
          employeeCount: roleValue === 'DIASPORA' ? null : employeeCount,
          turnoverBand: (roleValue === 'KOSOVO_BUSINESS' || roleValue === 'STARTUP') && ['UNDER_2M', 'FROM_2M_TO_10M', 'OVER_10M'].includes(turnoverBand) ? turnoverBand : null,
          municipality: roleValue === 'DIASPORA' ? null : (typeof municipality === 'string' && municipality.trim() ? municipality.trim() : null),
          address: roleValue === 'DIASPORA' ? null : (typeof address === 'string' && address.trim() ? address.trim() : null),
          femaleOwnership: typeof femaleOwnership === 'boolean' ? femaleOwnership : null,
          country: roleValue === 'DIASPORA' ? countryOfOperation : 'Kosovë',
          email: email,
          visibilityLevel: 'PRIVATE',
          profileStatus: 'DRAFT',
          interests: interests || [],
        },
      })


      // Certifikimet e shenuara ne regjistrim (tick + vit opsional). Kodet e panjohura
      // injorohen; skadenca vendoset me vone nga profili.
      if (Array.isArray(certifications) && certifications.length) {
        const codes = certifications.map((c: any) => c?.code).filter((c: unknown): c is string => typeof c === 'string').slice(0, 60)
        const found = await prisma.certification.findMany({ where: { code: { in: codes }, isActive: true }, select: { id: true, code: true } })
        const idByCode = new Map(found.map((f) => [f.code, f.id]))
        const rows = certifications
          .filter((c: any) => idByCode.has(c?.code))
          .map((c: any) => ({
            companyId: company.id,
            certificationId: idByCode.get(c.code) as string,
            obtainedYear: Number.isInteger(c?.obtainedYear) && c.obtainedYear >= 1950 && c.obtainedYear <= 2100 ? c.obtainedYear : null,
            validUntil: typeof c?.validUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.validUntil) ? new Date(c.validUntil + 'T00:00:00Z') : null,
          }))
        if (rows.length) await prisma.companyCertification.createMany({ data: rows, skipDuplicates: true })
      }

      if (roleValue === 'STARTUP') {
        await prisma.startupProfile.create({
          data: { companyId: company.id, stage: 'IDEA', needs: [], hasProduct: false },
        })
      }
      if (roleValue === 'DIASPORA') {
        await prisma.diasporaProfile.create({
          data: {
            companyId: company.id,
            countryOfOperation,
            city,
            subRoles: diasporaSubRoles.filter((r: unknown): r is string => typeof r === 'string') as any,
            sectorsOfInterest: [],
            productsSought: [],
            productsOffered: [],
            countriesActive: [],
          },
        })
      }
    }

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

    // Llogaria krijohet gjithsesi, por mesazhi nuk guxon te thote "kontrollo
    // email-in" kur email-i nuk iku — perndryshe perdoruesi pret pafundesisht.
    const message = sendResult.ok
      ? 'Regjistrimi u krye me sukses. Kontrollo email-in për aktivizimin e llogarisë.'
      : 'Llogaria u krijua, por email-i i aktivizimit nuk mund të dërgohej. Kontakto administratorin ose provo "Dërgo përsëri" më vonë.'

    return NextResponse.json(
      {
        message,
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
