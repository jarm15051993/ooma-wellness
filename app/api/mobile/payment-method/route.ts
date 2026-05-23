import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const user = await prisma.user.findUniqueOrThrow({
      where:  { id: payload.userId },
      select: { stripeCustomerId: true },
    })

    if (!user.stripeCustomerId) {
      return NextResponse.json({ card: null, nextInvoices: {} })
    }

    // Fetch customer with default payment method expanded
    const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    }) as Stripe.Customer

    const pm = customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod | null
    const card = pm?.card
      ? {
          brand:    pm.card.brand,
          last4:    pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear:  pm.card.exp_year,
        }
      : null

    // Fetch next invoice amount for each active subscription
    const activeSubscriptions = await prisma.subscription.findMany({
      where:  { userId: payload.userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      select: { id: true, stripeSubscriptionId: true, status: true },
    })

    const nextInvoices: Record<string, { amount: number; currency: string } | null> = {}

    await Promise.all(
      activeSubscriptions.map(async (sub) => {
        try {
          const upcoming = await stripe.invoices.createPreview({
            subscription: sub.stripeSubscriptionId,
          })
          nextInvoices[sub.id] = {
            amount:   upcoming.amount_due,
            currency: upcoming.currency,
          }
        } catch {
          // No upcoming invoice (e.g. subscription cancelled mid-period)
          nextInvoices[sub.id] = null
        }
      })
    )

    return NextResponse.json({ card, nextInvoices })
  } catch (error: any) {
    console.error('[mobile/payment-method] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
