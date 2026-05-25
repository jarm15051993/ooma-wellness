import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const [subscriptions, standaloneCredits] = await Promise.all([
      prisma.subscription.findMany({
        where:   { userId },
        include: {
          package: {
            select: {
              name:        true,
              packageType: true,
              isUnlimited: true,
              classCount:  true,
              price:       true,
            },
          },
          credits: {
            orderBy: { createdAt: 'desc' },
            take:    1,
          },
        },
        orderBy: [
          { status: 'asc' },
          { currentPeriodEnd: 'asc' },
        ],
      }),
      prisma.userCredit.findMany({
        where: {
          userId,
          subscriptionId:   null,
          creditsRemaining: { gt: 0 },
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
        include: { package: { select: { name: true, packageType: true } } },
      }),
    ])

    return NextResponse.json({ subscriptions, standaloneCredits })
  } catch (error) {
    console.error('[api/web/subscriptions] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
