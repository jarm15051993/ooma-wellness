import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const statusParam = new URL(request.url).searchParams.get('status')
    const where = statusParam
      ? { status: statusParam as 'PENDING' | 'APPROVED' | 'REJECTED' }
      : {}

    const requests = await prisma.cashPaymentRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        user: { select: { name: true, lastName: true, email: true } },
        package: { select: { name: true } },
      },
    })

    return NextResponse.json({ requests })
  } catch (err) {
    console.error('[admin/cash-payments] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
