import { DefaultSession } from 'next-auth'
import { Role, SubscriptionTier } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      language: string
      companyName: string | null
      tier: SubscriptionTier
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    language: string
    companyName: string | null
    tier: SubscriptionTier
  }
}
