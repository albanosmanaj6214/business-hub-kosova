import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  generateCountryGuide,
  validateCountryGuide,
  persistCountryGuide,
} from '@/lib/generators/country-guide'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Generation can take 5-10 min with web_search.
export const maxDuration = 900

interface GenerateBody {
  countryCode?: string
  countryNameSq?: string
  countryNameEn?: string
  flag?: string
  maxSearches?: number
}

interface PublishBody {
  id?: string
  isPublished?: boolean
  reviewedBy?: string
}

async function requireAdmin(): Promise<true | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return true
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (auth !== true) return auth

  const url = new URL(req.url)
  const action = url.searchParams.get('action') ?? 'generate'

  if (action === 'publish') {
    const body = (await req.json().catch(() => ({}))) as PublishBody
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const guide = await prisma.exportGuide.update({
      where: { id: body.id },
      data: {
        isPublished: !!body.isPublished,
        reviewedBy: body.reviewedBy ?? null,
        reviewedAt: body.isPublished ? new Date() : null,
        generatedBy: body.isPublished ? 'reviewed' : 'claude',
      },
    })
    return NextResponse.json({ ok: true, id: guide.id, isPublished: guide.isPublished })
  }

  // Default: generate
  const body = (await req.json().catch(() => ({}))) as GenerateBody
  if (!body.countryCode || body.countryCode.length !== 2) {
    return NextResponse.json({ error: 'countryCode (ISO-2) required' }, { status: 400 })
  }
  if (!body.countryNameSq || !body.countryNameEn || !body.flag) {
    return NextResponse.json({ error: 'countryNameSq, countryNameEn, flag required' }, { status: 400 })
  }

  try {
    const result = await generateCountryGuide({
      countryCode: body.countryCode.toUpperCase(),
      countryNameSq: body.countryNameSq,
      countryNameEn: body.countryNameEn,
      flag: body.flag,
      maxSearches: body.maxSearches,
    })
    const errors = validateCountryGuide(result.guide)
    const persisted = await persistCountryGuide(prisma, result.guide)
    return NextResponse.json({
      ok: true,
      id: persisted.id,
      created: persisted.created,
      validation: errors,
      usage: result.usage,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth !== true) return auth
  const guides = await prisma.exportGuide.findMany({
    select: {
      id: true,
      title: true,
      country: true,
      countryCode: true,
      flag: true,
      isPublished: true,
      generatedBy: true,
      lastResearchedAt: true,
      reviewedBy: true,
      reviewedAt: true,
      updatedAt: true,
    },
    orderBy: [{ updatedAt: 'desc' }],
  })
  return NextResponse.json({ guides })
}
