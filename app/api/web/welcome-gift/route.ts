import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const WELCOME_GIFT_PACKAGE_NAME = 'Early Member Free Class'

// GET /api/web/welcome-gift?userId=... → { eligible: boolean }
export async function GET(request: NextRequest) {
  try {
    if (process.env.EARLY_MEMBER_GIFT_ENABLED !== 'true') {
      return NextResponse.json({ eligible: false })
    }

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ eligible: false })

    const giftPackage = await prisma.package.findFirst({
      where: { name: WELCOME_GIFT_PACKAGE_NAME },
    })
    if (!giftPackage) return NextResponse.json({ eligible: false })

    const existing = await prisma.userCredit.findFirst({
      where: { userId, packageId: giftPackage.id },
    })

    return NextResponse.json({ eligible: !existing })
  } catch (error) {
    console.error('[web/welcome-gift] GET error:', error)
    return NextResponse.json({ eligible: false })
  }
}

// POST /api/web/welcome-gift → claims the gift for the user
export async function POST(request: NextRequest) {
  try {
    if (process.env.EARLY_MEMBER_GIFT_ENABLED !== 'true') {
      return NextResponse.json({ error: 'This promotion is not currently active.' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const giftPackage = await prisma.package.findFirst({
      where: { name: WELCOME_GIFT_PACKAGE_NAME },
    })
    if (!giftPackage) {
      return NextResponse.json({ error: 'Gift package not found.' }, { status: 500 })
    }

    const existing = await prisma.userCredit.findFirst({
      where: { userId, packageId: giftPackage.id },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already claimed.' }, { status: 409 })
    }

    await prisma.userCredit.create({
      data: {
        userId,
        packageId: giftPackage.id,
        creditsTotal: 1,
        creditsRemaining: 1,
        expiresAt: null,
        stripePaymentId: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[web/welcome-gift] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
