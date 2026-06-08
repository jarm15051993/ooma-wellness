import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const tenantUserId = request.headers.get('x-tenant-user-id')
    const userId = tenantUserId ?? payload.userId

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
            where:   { expiresAt: { gte: new Date() } },
            orderBy: { createdAt: 'desc' },
            take:    1,
          },
        },
        orderBy: [
          { status: 'asc' },
          { currentPeriodEnd: 'asc' },
        ],
      }),
      // Single-class credits (all states: active, booked, attended, expired)
      prisma.userCredit.findMany({
        where: {
          userId,
          subscriptionId: null,
        },
        include: {
          package: { select: { name: true, packageType: true } },
          bookings: {
            where: { cancelledAt: null },
            include: {
              class: { select: { title: true, startTime: true, classType: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({ subscriptions, standaloneCredits })
  } catch (error: any) {
    console.error('[mobile/subscriptions] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
