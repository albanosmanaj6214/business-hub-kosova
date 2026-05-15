import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notifyNewLead } from '@/lib/notify'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const Body = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  company: z.string().max(120).optional().nullable(),
  type: z.enum([
    'GRANT_APPLICATION',
    'EXPORT_GUIDE',
    'FAIR_REGISTRATION',
    'CERTIFICATION',
    'CUSTOMS',
    'TRAINING',
    'INVESTOR_INQUIRY',
    'OTHER',
  ]),
  contextId: z.string().max(80).optional().nullable(),
  contextRef: z.string().max(220).optional().nullable(),
  message: z.string().min(5).max(4000),
  source: z.string().max(80).optional().nullable(),
})

const TYPE_LABEL: Record<string, string> = {
  GRANT_APPLICATION: 'Aplikim Grant-i',
  EXPORT_GUIDE: 'Këshilla Eksporti',
  FAIR_REGISTRATION: 'Regjistrim Panairi',
  CERTIFICATION: 'Certifikim',
  CUSTOMS: 'Doganat & Tarifat',
  TRAINING: 'Trajnim',
  INVESTOR_INQUIRY: 'Investitor i Huaj',
  OTHER: 'Tjetër',
}

export async function POST(req: Request) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload', issues: parsed.error.issues }, { status: 400 })

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id ?? null

  const created = await prisma.consultationRequest.create({
    data: { ...parsed.data, userId },
  })

  // fire-and-forget notification
  notifyNewLead({
    type: 'consultation',
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? undefined,
    company: parsed.data.company ?? undefined,
    category: TYPE_LABEL[parsed.data.type] ?? parsed.data.type,
    context: parsed.data.contextRef ?? undefined,
    message: parsed.data.message,
    source: parsed.data.source ?? undefined,
  }).catch((e) => console.error('notify error:', e))

  return NextResponse.json({ ok: true, id: created.id })
}
