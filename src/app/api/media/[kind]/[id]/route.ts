import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Sherben bytes-in e imazheve nga MediaAsset. Publik (imazhet jane per shfaqje).
const KINDS: Record<string, string> = {
  'company-logo': 'COMPANY_LOGO',
  'offering-image': 'OFFERING_IMAGE',
}

export async function GET(_req: Request, { params }: { params: { kind: string; id: string } }) {
  const kind = KINDS[params.kind]
  if (!kind) return new NextResponse('not found', { status: 404 })

  const asset = await prisma.mediaAsset.findUnique({
    where: { kind_refId: { kind, refId: params.id } },
    select: { data: true, mime: true },
  })
  if (!asset) return new NextResponse('not found', { status: 404 })

  const bytes = new Uint8Array(asset.data)
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'private, max-age=60',
    },
  })
}
