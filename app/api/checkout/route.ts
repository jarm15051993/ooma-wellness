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
    const { packageId, userId, userEmail } = await request.json()

    if (!packageId || !userId) {
      return NextResponse.json({ error: 'packageId and userId required' }, { status: 400 })
    }

    const pkg = await prisma.package.findUnique({
      where:  { id: packageId, active: true },
      select: { id: true, name: true, classCount: true, price: true, packageType: true },
    })

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const customerId = await getOrCreateStripeCustomer(userId)
    const appUrl     = getAppUrl()

    const session = await stripe.checkout.sessions.create({
      mode:     'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency:     'eur',
            product_data: {
              name:        pkg.name,
              description: `${pkg.classCount} ${pkg.classCount === 1 ? 'class' : 'classes'} at OOMA Wellness Club`,
            },
            unit_amount: Math.round(pkg.price * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: customerId ? undefined : userEmail,
      metadata: {
        userId,
        packageId: pkg.id,
        classes:   pkg.classCount.toString(),
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/packages`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('[api/checkout] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
