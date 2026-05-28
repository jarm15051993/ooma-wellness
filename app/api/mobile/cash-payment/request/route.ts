import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const { type, packageId } = await request.json()

    if (!type || !['MEMBERSHIP', 'SUBSCRIPTION', 'ONE_TIME_CLASS'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    if (type !== 'MEMBERSHIP' && !packageId) {
      return NextResponse.json({ error: 'packageId required for this type' }, { status: 400 })
    }

    // One active cash request at a time
    const existing = await prisma.cashPaymentRequest.findFirst({
      where: { userId, status: 'PENDING' },
    })
    if (existing) {
      return NextResponse.json({ error: 'A cash payment request is already pending' }, { status: 400 })
    }

    // Derive amount server-side — never trust client
    let amount: number
    if (type === 'MEMBERSHIP') {
      const setting = await prisma.setting.findUnique({ where: { key: 'subscriptionPrice' } })
      amount = setting ? parseFloat(setting.value) : 0
    } else {
      const pkg = await prisma.package.findUnique({ where: { id: packageId }, select: { price: true, active: true } })
      if (!pkg || !pkg.active) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 })
      }
      amount = pkg.price
    }

    const cashRequest = await prisma.cashPaymentRequest.create({
      data: { userId, type, packageId: packageId ?? null, amount, status: 'PENDING' },
      include: { package: { select: { name: true } } },
    })

    return NextResponse.json({ cashRequest })
  } catch (err) {
    console.error('[cash-payment/request] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
