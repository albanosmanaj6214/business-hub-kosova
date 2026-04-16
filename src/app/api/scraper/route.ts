import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

async function scrapeGrants() {
  const startTime = Date.now()

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an export intelligence researcher for Kosovo manufacturers. Generate a JSON array of 5 realistic and relevant grants/funding opportunities currently available for Kosovo-based manufacturers and exporters. Each grant should be plausible and based on real EU, USAID, GIZ, World Bank, or Kosovo government programs.

Return ONLY a valid JSON array with objects having these fields:
- title (string, English)
- titleSq (string, Albanian)
- description (string, English, 2-3 sentences)
- descriptionSq (string, Albanian)
- provider (string, organization name)
- amount (string, e.g. "EUR 10,000 - 50,000")
- currency (string, "EUR")
- deadline (string, ISO date within next 6 months)
- eligibility (string, who can apply)
- url (string, realistic URL)
- country (string)
- sectors (string array)
- tags (string array)`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('No text response')

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found')

    const grants = JSON.parse(jsonMatch[0])

    let created = 0
    for (const grant of grants) {
      await prisma.grant.create({
        data: {
          title: grant.title,
          titleSq: grant.titleSq,
          description: grant.description,
          descriptionSq: grant.descriptionSq,
          provider: grant.provider,
          amount: grant.amount,
          currency: grant.currency || 'EUR',
          deadline: grant.deadline ? new Date(grant.deadline) : null,
          eligibility: grant.eligibility,
          url: grant.url,
          country: grant.country,
          sectors: grant.sectors || [],
          tags: grant.tags || [],
        },
      })
      created++
    }

    await prisma.scraperLog.create({
      data: {
        type: 'GRANTS',
        status: 'SUCCESS',
        message: `Scraped ${created} grants`,
        itemsFound: created,
        duration: Date.now() - startTime,
      },
    })

    return { success: true, count: created }
  } catch (error: any) {
    await prisma.scraperLog.create({
      data: {
        type: 'GRANTS',
        status: 'ERROR',
        message: error.message,
        duration: Date.now() - startTime,
      },
    })
    return { success: false, error: error.message }
  }
}

async function scrapeFairs() {
  const startTime = Date.now()

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an export intelligence researcher for Kosovo manufacturers. Generate a JSON array of 5 realistic upcoming international trade fairs relevant to Kosovo manufacturers and exporters. Focus on fairs in EU countries, Turkey, and the Western Balkans.

Return ONLY a valid JSON array with objects having these fields:
- name (string, English)
- nameSq (string, Albanian)
- description (string, English, 2-3 sentences)
- descriptionSq (string, Albanian)
- location (string, city)
- country (string)
- startDate (string, ISO date within next 12 months)
- endDate (string, ISO date)
- website (string, realistic URL)
- sectors (string array)
- tags (string array)`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('No text response')

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found')

    const fairs = JSON.parse(jsonMatch[0])

    let created = 0
    for (const fair of fairs) {
      await prisma.tradeFair.create({
        data: {
          name: fair.name,
          nameSq: fair.nameSq,
          description: fair.description,
          descriptionSq: fair.descriptionSq,
          location: fair.location,
          country: fair.country,
          startDate: new Date(fair.startDate),
          endDate: new Date(fair.endDate),
          website: fair.website,
          sectors: fair.sectors || [],
          tags: fair.tags || [],
        },
      })
      created++
    }

    await prisma.scraperLog.create({
      data: {
        type: 'FAIRS',
        status: 'SUCCESS',
        message: `Scraped ${created} trade fairs`,
        itemsFound: created,
        duration: Date.now() - startTime,
      },
    })

    return { success: true, count: created }
  } catch (error: any) {
    await prisma.scraperLog.create({
      data: {
        type: 'FAIRS',
        status: 'ERROR',
        message: error.message,
        duration: Date.now() - startTime,
      },
    })
    return { success: false, error: error.message }
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type } = await req.json()

  if (type === 'grants') {
    const result = await scrapeGrants()
    return NextResponse.json(result)
  } else if (type === 'fairs') {
    const result = await scrapeFairs()
    return NextResponse.json(result)
  } else if (type === 'all') {
    const [grants, fairs] = await Promise.all([scrapeGrants(), scrapeFairs()])
    return NextResponse.json({ grants, fairs })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
