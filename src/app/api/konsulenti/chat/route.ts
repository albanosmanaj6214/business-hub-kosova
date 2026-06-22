import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenAI } from '@google/genai'
import { TOOL_DECLARATIONS, runTool, UserContext } from '@/lib/konsulenti/tools'
import { userSectorSlugs, sectorsLabel } from '@/lib/sectors'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const MAX_USER_MSG_LEN = 2000
const MAX_TOOL_ROUNDS = 4
const MONTHLY_LIMIT_FREE = 10
const MONTHLY_LIMIT_STARTER = 30
const MONTHLY_LIMIT_PROFESSIONAL = 200

function firstName(name?: string | null): string {
  if (!name) return ''
  return name.trim().split(/\s+/)[0] || ''
}

function systemInstruction(ctx: UserContext, userName: string | null): string {
  const fn = firstName(userName)
  return [
    'Ti je "Asistenti KBH" i Kosova Business Hub: partner praktik për grante, panaire, eksport dhe certifikime për bizneset e Kosovës.',
    'Përgjigju gjithmonë në gjuhën në të cilën të drejtohet përdoruesi. Default: shqip.',
    'Ton: i drejtpërdrejtë, miqësor, konkret. Pa lëvdata. Pa em-dash. Pa fjalët "asistent virtual", "AI", "robot".',
    fn ? `Drejtohu përdoruesit me emër (${fn}) herë pas here, jo në çdo fjali.` : '',
    '',
    'RREGULLA TË FORMATIMIT (e rëndësishme):',
    '- Mbaje përgjigjen të SHKURTËR: maksimumi 6–10 rreshta totale.',
    '- Përdor markdown: **bold** për tituj/emra grantesh, listë me `- ` për pikat.',
    '- Mos shpjego gjithçka. Sill 3–5 pika kryesore. Detajet i lë në link.',
    '- Çdo grant/panair/udhëzues përfundo me një link "[Detaje](URL)" duke përdorur URL-në që ka kthyer tool-i (detailUrl).',
    '- Nëse pergjigjja del e gjatë, sill kryesoret + një rresht "Më shumë te [faqja]([URL])".',
    '',
    'RREGULLA TË TË DHËNAVE:',
    '- Para se të rekomandosh diçka konkrete, THIRR një tool. Mos shpik fakte, mos shpik shifra.',
    '- Çdo grant: titull (bold), ofruesi, afati shqip ("18 Qershor 2026"), shuma, dhe lidhja Detaje.',
    '- Çdo panair: emër (bold), data, qyteti/shteti, tipi (FAIR/MATCHMAKING), lidhja.',
    '- Nëse user-i ka sektor në profil, prioritizo ato që i shkojnë. Nëse jo, kërko të zgjedhë.',
    '- Pyetje jashtë temës (politikë etj.): kthe bisedën miqësisht te biznesi.',
    '',
    'KUR TA PROPOZOSH EKSPERTIN HUMAN:',
    '- Plotësim aplikimi konkret për një grant ("më ndihmo ta plotësoj", "më shkruaj propozimin"): propozo [Bisedo me ekspertin](/dashboard/bookings/new?topic=GRANT_APPLICATION).',
    '- Regjistrim panairi konkret ("si regjistrohem", "më rezervo stendën"): [Bisedo me ekspertin](/dashboard/bookings/new?topic=FAIR_REGISTRATION).',
    '- Çështje doganore komplekse, klasifikim HS-kodi specifik: [Bisedo me ekspertin](/dashboard/bookings/new?topic=CUSTOMS).',
    '- Procese të mëdha certifikimi (ISO, HACCP, CE): [Bisedo me ekspertin](/dashboard/bookings/new?topic=CERTIFICATION).',
    '- Kur user-i thotë "kam afat", "më ndihmo urgjent", "nuk po e kuptoj si bëhet": shto propozimin e ekspertit në fund.',
    '- Mos e propozo për pyetje informative të thjeshta që mund t\'i përgjigjesh vetë me tools.',
    '',
    'KONTEKSTI I PËRDORUESIT:',
    fn ? `Emri: ${fn}.` : '',
    ctx.sectors.length
      ? `Sektorët: ${sectorsLabel(ctx.sectors)} (${ctx.sectors.join(', ')}).`
      : 'Sektori nuk është caktuar në profil.',
    ctx.companyName ? `Kompania: ${ctx.companyName}.` : '',
    ctx.interests.length ? `Interesat: ${ctx.interests.join(', ')}.` : '',
    `Data e sotme: ${new Date().toISOString().slice(0, 10)}.`,
  ].filter(Boolean).join('\n')
}

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

async function monthlyUsage(userId: string): Promise<number> {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return prisma.chatMessage.count({
    where: { role: 'USER', session: { userId }, createdAt: { gte: start } },
  })
}

function limitForTier(tier: string | null | undefined): number {
  switch (tier) {
    case 'PROFESSIONAL': return MONTHLY_LIMIT_PROFESSIONAL
    case 'ENTERPRISE': return 9999
    case 'STARTER': return MONTHLY_LIMIT_STARTER
    default: return MONTHLY_LIMIT_FREE
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'I paautorizuar.' }, { status: 401 })
  }
  const userId = session.user.id

  const body = await req.json().catch(() => ({})) as { sessionId?: string; message?: string }
  const userMsg = (body.message || '').trim().slice(0, MAX_USER_MSG_LEN)
  if (!userMsg) return NextResponse.json({ error: 'Mesazh bosh.' }, { status: 400 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Shërbimi i AI nuk është konfiguruar.' }, { status: 503 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  })
  if (!user) return NextResponse.json({ error: 'Përdoruesi nuk u gjet.' }, { status: 404 })

  const tier = user.subscription?.status === 'ACTIVE' ? user.subscription.tier : null
  const limit = limitForTier(tier)
  const used = await monthlyUsage(userId)
  if (used >= limit) {
    return NextResponse.json({
      error: 'limit',
      message: `Ke përdorur ${used}/${limit} mesazhe këtë muaj. Përmirëso planin për më shumë.`,
      used, limit, tier,
    }, { status: 429 })
  }

  let chatSession = body.sessionId
    ? await prisma.chatSession.findFirst({
        where: { id: body.sessionId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 30 } },
      })
    : null

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId, title: userMsg.slice(0, 60) },
      include: { messages: true },
    })
  }

  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: 'USER', content: userMsg },
  })

  const ctx: UserContext = {
    userId,
    // Personalization v1: canonical slug list. Empty when user hasn't picked.
    sectors: userSectorSlugs(user),
    interests: user.interests,
    companyName: user.companyName,
    language: user.language || 'sq',
  }

  const history = (chatSession.messages || [])
    .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
    .map((m) => ({
      role: m.role === 'USER' ? 'user' as const : 'model' as const,
      parts: [{ text: m.content }],
    }))

  const contents = [...history, { role: 'user' as const, parts: [{ text: userMsg }] }]

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const toolsUsed: Array<{ name: string; args: unknown; ok: boolean }> = []
  let assistantText = ''

  try {
    let currentContents: any = contents
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: currentContents,
        config: {
          systemInstruction: systemInstruction(ctx, user.name),
          tools: [{ functionDeclarations: TOOL_DECLARATIONS as unknown as never[] }],
          temperature: 0.4,
        },
      })

      const candidate = res.candidates?.[0]
      const parts = candidate?.content?.parts || []
      const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall!)

      if (calls.length === 0) {
        const texts = parts.map((p) => (p.text || '').trim()).filter(Boolean)
        const unique: string[] = []
        for (const t of texts) {
          if (unique[unique.length - 1] !== t) unique.push(t)
        }
        assistantText = unique.join('\n').trim()
        break
      }

      const callResults = await Promise.all(
        calls.map(async (c) => {
          try {
            const out = await runTool(c.name!, (c.args as Record<string, unknown>) || {}, ctx)
            toolsUsed.push({ name: c.name!, args: c.args, ok: true })
            return { name: c.name!, response: out }
          } catch (err: unknown) {
            toolsUsed.push({ name: c.name!, args: c.args, ok: false })
            return { name: c.name!, response: { error: err instanceof Error ? err.message : 'Gabim i panjohur.' } }
          }
        }),
      )

      currentContents = [
        ...currentContents,
        { role: 'model' as const, parts: parts.map((p) => p.functionCall ? { functionCall: p.functionCall } : { text: p.text || '' }).filter((p) => 'functionCall' in p || ((p as { text?: string }).text || '').length > 0) },
        { role: 'user' as const, parts: callResults.map((r) => ({ functionResponse: { name: r.name, response: r.response as Record<string, unknown> } })) },
      ]
    }

    if (!assistantText) {
      assistantText = 'Nuk arrita të kthej përgjigje. Provo ta riformulosh pyetjen.'
    }
  } catch (err: unknown) {
    console.error('Konsulenti error:', err)
    return NextResponse.json({ error: 'Shërbimi nuk po përgjigjet. Provo më vonë.' }, { status: 502 })
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: 'ASSISTANT',
      content: assistantText,
      toolData: toolsUsed.length ? (toolsUsed as unknown as object) : undefined,
    },
  })
  await prisma.chatSession.update({ where: { id: chatSession.id }, data: { updatedAt: new Date() } })

  return NextResponse.json({
    sessionId: chatSession.id,
    reply: assistantText,
    toolsUsed: toolsUsed.map((t) => t.name),
    usage: { used: used + 1, limit, tier },
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'I paautorizuar.' }, { status: 401 })
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  const userId = session.user.id

  if (sessionId) {
    const s = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!s) return NextResponse.json({ error: 'Sesion i panjohur.' }, { status: 404 })
    return NextResponse.json({
      sessionId: s.id,
      title: s.title,
      messages: s.messages.filter((m) => m.role !== 'TOOL').map((m) => ({ id: m.id, role: m.role.toLowerCase(), content: m.content, createdAt: m.createdAt })),
    })
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: { id: true, title: true, updatedAt: true },
  })
  const used = await monthlyUsage(userId)
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } })
  const tier = user?.subscription?.status === 'ACTIVE' ? user.subscription.tier : null
  return NextResponse.json({ sessions, usage: { used, limit: limitForTier(tier), tier } })
}
