import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { compare } from 'bcryptjs'
import { verifyTurnstile } from './turnstile'

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
        const captcha = await verifyTurnstile(credentials.turnstileToken, ip)
        if (!captcha.success) {
          throw new Error(captcha.error || 'Verifikimi i sigurisë dështoi.')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true },
        })

        if (!user) {
          throw new Error('Përdoruesi nuk u gjet')
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Fjalëkalimi nuk është i saktë')
        }

        if (!user.emailVerified) {
          // Surface a specific code so the login UI can show the "send again" button.
          throw new Error('Email-i nuk është verifikuar. Kontrollo kutinë postare.')
        }

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
      if (token.id && (!refreshedAt || Date.now() - refreshedAt > STALE_MS || (token as any).employeeCount === undefined || (token as any).sectors === undefined)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            language: true,
            companyName: true,
            employeeCount: true,
            subscription: { select: { tier: true } },
            company: { select: { employeeCount: true, activityType: true, sectors: true } },
          },
        })
        if (fresh) {
          token.role = fresh.role
          token.language = fresh.language
          token.companyName = fresh.companyName
          token.tier = fresh.subscription?.tier || 'FREE'
          ;(token as any).employeeCount = fresh.company?.employeeCount ?? fresh.employeeCount ?? null
          ;(token as any).activityType = fresh.company?.activityType ?? null
          ;(token as any).sectors = fresh.company?.sectors ?? []
        }
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
      }
      return session
    },
  },
}
