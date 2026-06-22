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
      }
      return session
    },
  },
}
