// Skript për krijim/reset të 13 llogarive testuese sipas §14.1 e master promptit.
// Ekzekutohet përmes API-t /api/admin/test-users/reset ose CLI: `pnpm ts-node scripts/seed-test-roles.ts`.
// Fjalëkalimi për të gjitha: TestKBH2026!

import { PrismaClient, Role, DiasporaSubRole, SubscriptionTier } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()
export const TEST_PASSWORD = 'TestKBH2026!'
const TEST_DOMAIN_SUFFIX = '@kbh.test'

interface TestUserSpec {
  email: string
  name: string
  role: Role
  tier: SubscriptionTier
  language?: string
  company?: {
    name: string
    activityType?: string
    sectors?: string[]
    employeeCount?: string
    femaleOwnership?: boolean | null
    country?: string
    interests?: string[]
    startup?: { stage: string; intendedLegalForm?: string; needs?: string[] }
    diaspora?: {
      countryOfOperation: string
      city: string
      countriesActive?: string[]
      subRoles: DiasporaSubRole[]
      sectorsOfInterest?: string[]
      productsSought?: string[]
      productsOffered?: string[]
    }
  }
}

const TEST_USERS: TestUserSpec[] = [
  {
    email: 'test.kb.prodhues' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Prodhues',
    role: 'KOSOVO_BUSINESS',
    tier: 'PROFESSIONAL',
    company: {
      name: 'Fabrika Test Druri',
      activityType: 'prodhues-perpunues',
      sectors: ['druri-mobilje'],
      employeeCount: 'MID_10_49',
      femaleOwnership: false,
      country: 'Kosovë',
      interests: ['grants', 'fairs', 'guides'],
    },
  },
  {
    email: 'test.kb.sherbime' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Shërbime',
    role: 'KOSOVO_BUSINESS',
    tier: 'PROFESSIONAL',
    company: {
      name: 'Test Software Studio',
      activityType: 'sherbime',
      sectors: ['tik'],
      employeeCount: 'SMALL_1_9',
      femaleOwnership: false,
      interests: ['grants', 'certifications'],
    },
  },
  {
    email: 'test.kb.tregti' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Tregtar',
    role: 'KOSOVO_BUSINESS',
    tier: 'FREE',
    company: {
      name: 'Test Tregti SHPK',
      activityType: 'tregti',
      sectors: [],
      employeeCount: 'SMALL_1_9',
      interests: ['news'],
    },
  },
  {
    email: 'test.kb.bujqesi' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Bujqësi',
    role: 'KOSOVO_BUSINESS',
    tier: 'FREE',
    company: {
      name: 'Ferma Test',
      activityType: 'bujqesi',
      sectors: [],
      employeeCount: 'SMALL_1_9',
      femaleOwnership: true,
      interests: ['grants'],
    },
  },
  {
    email: 'test.startup.ide' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Ideator',
    role: 'STARTUP',
    tier: 'FREE',
    company: {
      name: 'Ideja Ime StartUp',
      activityType: 'sherbime',
      sectors: ['tik'],
      employeeCount: 'SMALL_1_9',
      interests: ['grants', 'consultations'],
      startup: {
        stage: 'IDEA',
        intendedLegalForm: 'SHPK',
        needs: ['ARBK', 'NACE', 'statut', 'banke', 'ATK_EDI', 'kontabilist', 'grant', 'mentorim'],
      },
    },
  },
  {
    email: 'test.startup.registered' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Registered Startup',
    role: 'STARTUP',
    tier: 'PROFESSIONAL',
    company: {
      name: 'Registered Test StartUp',
      activityType: 'prodhues-perpunues',
      sectors: ['ushqim-dhe-pije'],
      employeeCount: 'SMALL_1_9',
      interests: ['grants', 'investitor', 'fairs'],
      startup: {
        stage: 'REGISTERED_NO_REVENUE',
        intendedLegalForm: 'SHPK',
        needs: ['investitor', 'buyer', 'grant', 'mentorim'],
      },
    },
  },
  {
    email: 'test.diaspora.buyer' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Diaspora Buyer',
    role: 'DIASPORA',
    tier: 'PROFESSIONAL',
    company: {
      name: 'Test German Buyer GmbH',
      country: 'Gjermani',
      interests: ['buyer', 'importer'],
      diaspora: {
        countryOfOperation: 'Gjermani',
        city: 'Berlin',
        countriesActive: ['Gjermani', 'Austri'],
        subRoles: ['BUYER', 'IMPORTER'],
        sectorsOfInterest: ['druri-mobilje', 'ushqim-dhe-pije'],
        productsSought: ['karriga', 'tavolina', 'dyer-dritare'],
      },
    },
  },
  {
    email: 'test.diaspora.investor' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Diaspora Investor',
    role: 'DIASPORA',
    tier: 'PROFESSIONAL',
    company: {
      name: 'Test Investor Zurich',
      country: 'Zvicër',
      interests: ['investor', 'partner'],
      diaspora: {
        countryOfOperation: 'Zvicër',
        city: 'Zurich',
        countriesActive: ['Zvicër', 'Austri'],
        subRoles: ['INVESTOR', 'PARTNER'],
        sectorsOfInterest: ['bujqesi-blegtori', 'turizem-mikpritje'],
        productsSought: [],
      },
    },
  },
  {
    email: 'test.diaspora.distributor' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Diaspora Distributor',
    role: 'DIASPORA',
    tier: 'PROFESSIONAL',
    company: {
      name: 'Test Distributor Wien',
      country: 'Austri',
      interests: ['distributor'],
      diaspora: {
        countryOfOperation: 'Austri',
        city: 'Wien',
        subRoles: ['DISTRIBUTOR'],
        sectorsOfInterest: ['ushqim-dhe-pije'],
        productsSought: ['produkte-ushqimore', 'lengje'],
      },
    },
  },
  {
    email: 'test.diaspora.multi' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Diaspora Multi',
    role: 'DIASPORA',
    tier: 'ENTERPRISE',
    company: {
      name: 'Test Multi-Role Diaspora Group',
      country: 'Gjermani',
      interests: ['buyer', 'investor', 'distributor'],
      diaspora: {
        countryOfOperation: 'Gjermani',
        city: 'Hamburg',
        countriesActive: ['Gjermani', 'Zvicër', 'Austri'],
        subRoles: ['BUYER', 'INVESTOR', 'DISTRIBUTOR'],
        sectorsOfInterest: ['druri-mobilje', 'ushqim-dhe-pije', 'tik'],
        productsSought: ['karriga', 'lengje', 'software-development'],
      },
    },
  },
  {
    email: 'test.individ' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Individ',
    role: 'INDIVIDUAL',
    tier: 'FREE',
    // No company
  },
  {
    email: 'test.admin' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Admin',
    role: 'ADMIN',
    tier: 'FREE',
  },
  {
    email: 'test.superadmin' + TEST_DOMAIN_SUFFIX,
    name: 'Testi Super Admin',
    role: 'SUPER_ADMIN',
    tier: 'FREE',
  },
]

export async function seedTestRoles(): Promise<{ created: string[]; skipped: string[] }> {
  const passwordHash = await hash(TEST_PASSWORD, 12)
  const created: string[] = []
  const skipped: string[] = []

  for (const spec of TEST_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: spec.email } })
    if (existing) {
      skipped.push(spec.email)
      continue
    }

    const user = await prisma.user.create({
      data: {
        email: spec.email,
        password: passwordHash,
        name: spec.name,
        role: spec.role,
        language: spec.language ?? 'sq',
        companyName: spec.company?.name ?? null,
        activityType: spec.company?.activityType ?? null,
        sectors: spec.company?.sectors ?? [],
        employeeCount: spec.company?.employeeCount ?? null,
        femaleOwnership: spec.company?.femaleOwnership ?? null,
        entitledSectors: spec.company?.sectors ?? [],
        interests: spec.company?.interests ?? [],
        emailVerified: new Date(),
        subscription: { create: { tier: spec.tier, status: 'ACTIVE' } },
      },
    })

    if (spec.company && spec.role !== 'INDIVIDUAL' && spec.role !== 'ADMIN' && spec.role !== 'SUPER_ADMIN') {
      const company = await prisma.company.create({
        data: {
          ownerUserId: user.id,
          roleType: spec.role,
          name: spec.company.name,
          activityType: spec.company.activityType ?? null,
          sectors: spec.company.sectors ?? [],
          employeeCount: spec.company.employeeCount ?? null,
          femaleOwnership: spec.company.femaleOwnership ?? null,
          country: spec.company.country ?? 'Kosovë',
          email: spec.email,
          visibilityLevel: 'MEMBERS',
          profileStatus: 'APPROVED',
          approvedAt: new Date(),
          interests: spec.company.interests ?? [],
        },
      })

      if (spec.company.startup) {
        await prisma.startupProfile.create({
          data: {
            companyId: company.id,
            stage: spec.company.startup.stage as any,
            intendedLegalForm: (spec.company.startup.intendedLegalForm as any) ?? null,
            needs: spec.company.startup.needs ?? [],
            hasProduct: false,
          },
        })
      }
      if (spec.company.diaspora) {
        await prisma.diasporaProfile.create({
          data: {
            companyId: company.id,
            countryOfOperation: spec.company.diaspora.countryOfOperation,
            city: spec.company.diaspora.city,
            countriesActive: spec.company.diaspora.countriesActive ?? [],
            subRoles: spec.company.diaspora.subRoles,
            sectorsOfInterest: spec.company.diaspora.sectorsOfInterest ?? [],
            productsSought: spec.company.diaspora.productsSought ?? [],
            productsOffered: spec.company.diaspora.productsOffered ?? [],
          },
        })
      }
    }

    created.push(spec.email)
  }

  return { created, skipped }
}

export async function resetTestRoles(): Promise<{ deleted: number; created: string[] }> {
  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: TEST_DOMAIN_SUFFIX } },
    select: { id: true, email: true },
  })
  const ids = testUsers.map((u) => u.id)
  // Cascade delete via User.onDelete = Cascade (Company + Subscription follow)
  const del = await prisma.user.deleteMany({ where: { id: { in: ids } } })
  const seed = await seedTestRoles()
  return { deleted: del.count, created: seed.created }
}

export function listTestUserSpecs(): { email: string; name: string; role: string; tier: string }[] {
  return TEST_USERS.map((u) => ({ email: u.email, name: u.name, role: u.role, tier: u.tier }))
}

// CLI entry point
if (require.main === module) {
  seedTestRoles()
    .then((res) => {
      console.log('Created:', res.created.length)
      res.created.forEach((e) => console.log('  +', e))
      console.log('Skipped (already exist):', res.skipped.length)
      res.skipped.forEach((e) => console.log('  -', e))
      return prisma.$disconnect()
    })
    .catch((e) => {
      console.error(e)
      return prisma.$disconnect().finally(() => process.exit(1))
    })
}
