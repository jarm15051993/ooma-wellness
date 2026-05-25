import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId } = await request.json()
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'userId and sessionId required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    } as any)

    if (session.metadata?.userId !== userId || session.metadata?.type !== 'web_subscription') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }
    if (session.status !== 'complete') {
      return NextResponse.json({ error: 'Checkout not completed' }, { status: 400 })
    }

    const stripeSub = session.subscription as any
    if (!stripeSub || typeof stripeSub === 'string') {
      return NextResponse.json({ error: 'Subscription not found in session' }, { status: 400 })
    }

    // Idempotency — return existing if already created
    const existing = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSub.id },
    })
    if (existing) return NextResponse.json({ subscription: existing })

    const packageId    = session.metadata!.packageId
    const periodStart  = new Date((stripeSub.current_period_start ?? 0) * 1000)
    const rawPeriodEnd = new Date((stripeSub.current_period_end   ?? 0) * 1000)
    const periodEnd    = rawPeriodEnd <= periodStart
      ? new Date(new Date(periodStart).setMonth(periodStart.getMonth() + 1))
      : rawPeriodEnd

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        packageId,
        stripeSubscriptionId: stripeSub.id,
        status:               'ACTIVE',
        currentPeriodStart:   periodStart,
        currentPeriodEnd:     periodEnd,
      },
    })

    return NextResponse.json({ subscription })
  } catch (error: any) {
    console.error('[api/web/subscribe/confirm] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
