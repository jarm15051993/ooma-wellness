import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const cashRequest = await prisma.cashPaymentRequest.findUnique({
      where: { id },
    })

    if (!cashRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    if (cashRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }

    await prisma.cashPaymentRequest.update({
      where: { id },
      data:  { status: 'REJECTED', processedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/cash-payments/reject] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
