import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'
import { verifyTurnstile, checkLoginRateLimit } from './turnstile'

// Auditimi i autentikimit. Shkruhet drejtpërdrejt te AuditLog (jo përmes logAudit),
// që të shmanget varësia rrethore audit.ts -> auth.ts. Fire-and-forget: një dështim
// i logimit nuk e bllokon kurrë hyrjen.
async function auditLogin(p: {
  ok: boolean
  email: string
  userId?: string | null
  ip?: string
  userAgent?: string
  reason?: string
}): Promise<void> {
  try {
    if (p.ok && p.userId) {
      await prisma.user.update({
        where: { id: p.userId },
        data: { lastLoginAt: new Date(), lastLoginIp: p.ip ?? null },
      })
    }
    await prisma.auditLog.create({
      data: {
        actorId: p.userId ?? null,
        actorEmail: p.email.slice(0, 200),
        action: p.ok ? 'LOGIN' : 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: p.userId ?? null,
        summary: p.ok ? 'Hyrje e suksesshme' : `Hyrje e dështuar: ${p.reason ?? 'e panjohur'}`,
        meta: { ip: p.ip ?? null, userAgent: p.userAgent ?? null },
      },
    })
  } catch (err) {
    console.error('[auth] auditimi i hyrjes dështoi:', (err as Error).message)
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // Turnstile token forwarded by the client login form. NextAuth lists
        // it here so it shows up in `credentials` for verification.
        turnstileToken: { label: 'Turnstile', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dhe fjalëkalimi janë të detyrueshme')
        }

        // CAPTCHA gate. Verify before any DB work so we cannot be used as a
        // password-oracle by skipping the widget.
        const ip =
          (req?.headers?.['cf-connecting-ip'] as string | undefined) ||
          (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
          (req?.headers?.['x-real-ip'] as string | undefined) ||
          undefined
        const userAgent = (req?.headers?.['user-agent'] as string | undefined)?.slice(0, 300)
        // Independent login rate limit (before Turnstile + any bcrypt/DB work). Generic
        // response; does not disclose whether the account exists.
        const loginRate = checkLoginRateLimit(ip ?? 'unknown')
        if (!loginRate.ok) {
          await auditLogin({ ok: false, email: credentials.email, ip, userAgent, reason: 'shumë përpjekje hyrjeje' })
          throw new Error('Shumë përpjekje hyrjeje nga ky rrjet. Provo më vonë.')
        }

        const captcha = await verifyTurnstile(credentials.turnstileToken, ip)
        if (!captcha.success) {
          throw new Error(captcha.error || 'Verifikimi i sigurisë dështoi.')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true },
        })

        if (!user) {
          await auditLogin({ ok: false, email: credentials.email, ip, userAgent, reason: 'përdoruesi nuk u gjet' })
          throw new Error('Përdoruesi nuk u gjet')
        }

        if (!user.isActive) {
          await auditLogin({ ok: false, email: user.email, userId: user.id, ip, userAgent, reason: 'llogari e çaktivizuar' })
          throw new Error('Kjo llogari është çaktivizuar.')
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          await auditLogin({ ok: false, email: user.email, userId: user.id, ip, userAgent, reason: 'fjalëkalim i gabuar' })
          throw new Error('Fjalëkalimi nuk është i saktë')
        }

        if (!user.emailVerified) {
          await auditLogin({ ok: false, email: user.email, userId: user.id, ip, userAgent, reason: 'email i paverifikuar' })
          // Surface a specific code so the login UI can show the "send again" button.
          throw new Error('Email-i nuk është verifikuar. Kontrollo kutinë postare.')
        }

        await auditLogin({ ok: true, email: user.email, userId: user.id, ip, userAgent })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          language: user.language,
          companyName: user.companyName,
          tier: user.subscription?.tier || 'FREE',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.language = (user as any).language
        token.companyName = (user as any).companyName
        token.tier = (user as any).tier
        ;(token as any).refreshedAt = Date.now()
      }

      // Rifresko role/tier nga DB çdo 5 minuta, që ndryshimet e adminit
      // (rol, pako, çaktivizim) të kapen pa pritur ri-login 30-ditor.
      const refreshedAt = (token as any).refreshedAt as number | undefined
      const STALE_MS = 5 * 60 * 1000
      if (token.id && (!refreshedAt || Date.now() - refreshedAt > STALE_MS || (token as any).employeeCount === undefined || (token as any).sectors === undefined || (token as any).entitledSectors === undefined)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            language: true,
            companyName: true,
            employeeCount: true,
            entitledSectors: true,
            isActive: true,
            subscription: { select: { tier: true } },
            company: { select: { employeeCount: true, activityType: true, sectors: true } },
          },
        })
        // Revokim i sesionit: nese perdoruesi s'ekziston me ose eshte caktivizuar,
        // e zbrazim token-in. Middleware kerkon token.id, prandaj qasja bie.
        if (!fresh || !fresh.isActive) return {} as typeof token

        token.role = fresh.role
        token.language = fresh.language
        token.companyName = fresh.companyName
        token.tier = fresh.subscription?.tier || 'FREE'
        ;(token as any).employeeCount = fresh.company?.employeeCount ?? fresh.employeeCount ?? null
        ;(token as any).activityType = fresh.company?.activityType ?? null
        ;(token as any).sectors = fresh.company?.sectors ?? []
        ;(token as any).entitledSectors = fresh.entitledSectors ?? []
        ;(token as any).refreshedAt = Date.now()
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).language = token.language
        ;(session.user as any).companyName = token.companyName
        ;(session.user as any).tier = token.tier
        ;(session.user as any).employeeCount = (token as any).employeeCount ?? null
        ;(session.user as any).activityType = (token as any).activityType ?? null
        ;(session.user as any).sectors = (token as any).sectors ?? []
        ;(session.user as any).entitledSectors = (token as any).entitledSectors ?? []
      }
      return session
    },
  },
}
