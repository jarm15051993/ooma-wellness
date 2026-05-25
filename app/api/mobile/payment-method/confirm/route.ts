import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

// Called by the app after presentPaymentSheet succeeds for a SetupIntent.
// Sets the newly attached payment method as the default for the customer
// and all their active subscriptions.
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const { setupIntentId } = await request.json()
    if (!setupIntentId) return NextResponse.json({ error: 'setupIntentId required' }, { status: 400 })

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

    // Security: ensure this SetupIntent belongs to this user's Stripe customer
    const user = await prisma.user.findUniqueOrThrow({
      where:  { id: payload.userId },
      select: { stripeCustomerId: true },
    })
    if (setupIntent.customer !== user.stripeCustomerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const paymentMethodId = setupIntent.payment_method as string
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'No payment method on SetupIntent' }, { status: 400 })
    }

    // Set as default on the customer
    await stripe.customers.update(user.stripeCustomerId!, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Set as default on all active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where:  { userId: payload.userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      select: { stripeSubscriptionId: true },
    })

    await Promise.all(
      activeSubscriptions.map(sub =>
        stripe.subscriptions.update(sub.stripeSubscriptionId, {
          default_payment_method: paymentMethodId,
        })
      )
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[mobile/payment-method/confirm] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
