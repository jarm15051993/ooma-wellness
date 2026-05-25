import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const { id } = await params
    const sub = await prisma.subscription.findUnique({
      where:   { id },
      include: { credits: { take: 1 } },
    })

    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    if (sub.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (sub.credits.length > 0) {
      return NextResponse.json({ error: 'Subscription already paid — use cancel instead' }, { status: 400 })
    }

    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId)
    } catch (e: any) {
      if (!e?.message?.includes('No such subscription')) throw e
    }

    await prisma.subscription.delete({ where: { id: sub.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[api/web/subscriptions/:id] DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const { id } = await params
    const sub = await prisma.subscription.findUnique({ where: { id } })

    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    if (sub.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (sub.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 })
    }
    if (sub.cancelledAt) {
      return NextResponse.json({ error: 'Already pending cancellation' }, { status: 400 })
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    const updated = await prisma.subscription.update({
      where:   { id: sub.id },
      data:    { cancelledAt: new Date() },
      include: {
        package: {
          select: { name: true, packageType: true, isUnlimited: true, classCount: true, price: true },
        },
        credits: {
          where:   { expiresAt: { gte: new Date() } },
          orderBy: { createdAt: 'desc' },
          take:    1,
        },
      },
    })

    return NextResponse.json({ subscription: updated })
  } catch (error: any) {
    console.error('[api/web/subscriptions/:id] PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
