import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer'
import { getAppUrl } from '@/lib/app-url'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const settings = await getSettings(['subscriptionPaymentRequired', 'subscriptionPrice'])

    if (settings.subscriptionPaymentRequired !== 'true') {
      return NextResponse.json({ error: 'Club membership fee is not currently enabled' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, email: true, isClubMember: true, role: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      return NextResponse.json({ error: 'Admins and owners do not require club membership' }, { status: 400 })
    }
    if (user.isClubMember) {
      return NextResponse.json({ error: 'Already a club member' }, { status: 409 })
    }

    const amount     = Math.round(parseFloat(settings.subscriptionPrice ?? '10.00') * 100)
    const customerId = await getOrCreateStripeCustomer(userId)
    const appUrl     = getAppUrl()

    const session = await stripe.checkout.sessions.create({
      mode:       'payment',
      customer:   customerId,
      line_items: [
        {
          price_data: {
            currency:     'eur',
            unit_amount:  amount,
            product_data: { name: 'OOMA Wellness Club Membership' },
          },
          quantity: 1,
        },
      ],
      metadata:    { userId, type: 'club_membership' },
      success_url: `${appUrl}/checkout/membership-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/packages`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[api/web/join-club] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
