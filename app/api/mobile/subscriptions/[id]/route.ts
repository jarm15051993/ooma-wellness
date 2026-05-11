import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

// Called when the user cancels or payment fails — removes the pending DB record
// and cancels the Stripe subscription so the user can retry.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const { id } = await params
    const sub = await prisma.subscription.findUnique({
      where:   { id },
      include: { credits: { take: 1 } },
    })

    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    if (sub.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Only allow deletion if payment never completed (no credits created by webhook)
    if (sub.credits.length > 0) {
      return NextResponse.json({ error: 'Subscription has already been paid — use cancel instead' }, { status: 400 })
    }

    // Cancel the Stripe subscription immediately so it doesn't linger
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId)
    } catch (e: any) {
      // If already cancelled in Stripe, continue with DB cleanup
      if (!e?.message?.includes('No such subscription')) throw e
    }

    await prisma.subscription.delete({ where: { id: sub.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[mobile/subscriptions/:id] DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const { id } = await params
    const sub = await prisma.subscription.findUnique({
      where: { id },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }
    if (sub.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (sub.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 })
    }
    if (sub.cancelledAt) {
      return NextResponse.json({ error: 'Subscription is already pending cancellation' }, { status: 400 })
    }

    // Cancel at period end — student keeps access until currentPeriodEnd.
    // The customer.subscription.deleted webhook fires at period end → status EXPIRED.
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data:  { cancelledAt: new Date() },
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
    console.error('[mobile/subscriptions/:id] PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
