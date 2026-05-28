import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const pending = await prisma.cashPaymentRequest.findFirst({
      where: { userId, status: 'PENDING' },
      include: { package: { select: { name: true } } },
    })

    return NextResponse.json({ cashRequest: pending ?? null })
  } catch (err) {
    console.error('[cash-payment/status] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
