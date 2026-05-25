import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer'
import { getAppUrl } from '@/lib/app-url'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const { userId, packageId } = await request.json()
    if (!userId || !packageId) {
      return NextResponse.json({ error: 'userId and packageId required' }, { status: 400 })
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    }) as any

    if (!pkg || !pkg.active) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }
    if (!pkg.isRecurring) {
      return NextResponse.json({ error: 'This package is not a recurring subscription' }, { status: 400 })
    }
    if (!pkg.stripePriceId) {
      return NextResponse.json({ error: 'Package is not available for subscription' }, { status: 400 })
    }

    if (pkg.isStudentPackage) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { isStudent: true } })
      if (!user?.isStudent) {
        return NextResponse.json({ error: 'This package is only available to students' }, { status: 403 })
      }
    }

    // Block duplicate active subscription for same package
    const existing = await prisma.subscription.findFirst({
      where:   { userId, packageId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      include: { credits: { take: 1 } },
    })
    if (existing) {
      if (existing.credits.length > 0) {
        return NextResponse.json({ error: 'You already have an active subscription for this package' }, { status: 409 })
      }
      // Orphaned record with no credits — clean up so user can retry
      try { await stripe.subscriptions.cancel(existing.stripeSubscriptionId) } catch {}
      await prisma.subscription.delete({ where: { id: existing.id } })
    }

    const customerId = await getOrCreateStripeCustomer(userId)
    const appUrl     = getAppUrl()

    const session = await stripe.checkout.sessions.create({
      mode:       'subscription',
      customer:   customerId,
      line_items: [{ price: pkg.stripePriceId, quantity: 1 }],
      metadata:   { userId, packageId, type: 'web_subscription' },
      subscription_data: {
        metadata: { userId, packageId, type: 'web_subscription' },
      },
      success_url: `${appUrl}/checkout/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/packages`,
    } as any)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[api/web/subscribe] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
