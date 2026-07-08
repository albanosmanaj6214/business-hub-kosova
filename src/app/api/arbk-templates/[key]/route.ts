import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isArbkTemplateKey } from '@/lib/arbk-templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Shkarkim i një template-i. Kërkon vetëm të jesh i kyçur (udhëzuesi është
// pjesë e platformës për bizneset e regjistruara).
export async function GET(_req: Request, { params }: { params: { key: string } }) {
  const session = await getServerSession(authOptions)
  if (!(session?.user as { id?: string })?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!isArbkTemplateKey(params.key)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const tpl = await prisma.arbkTemplate.findUnique({ where: { key: params.key } })
  if (!tpl) return NextResponse.json({ error: 'Template-i s\'është ngarkuar ende.' }, { status: 404 })

  return new NextResponse(new Uint8Array(tpl.data), {
    status: 200,
    headers: {
      'Content-Type': tpl.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(tpl.fileName)}"`,
      'Content-Length': String(tpl.size),
      'Cache-Control': 'private, no-store',
    },
  })
}
