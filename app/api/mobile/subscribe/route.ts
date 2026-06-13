import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const { packageId } = await request.json()
    if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })

    const pkg = await prisma.package.findUnique({
      where:  { id: packageId },
      select: {
        id:               true,
        name:             true,
        classCount:       true,
        price:            true,
        active:           true,
        durationDays:     true,
        isStudentPackage: true,
        stripePriceId:    true,
        packageType:      true,
        isUnlimited:      true,
        isRecurring:      true,
      },
    })

    if (!pkg || !pkg.active) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }
    if (!pkg.isRecurring && pkg.price === 0) {
      return NextResponse.json({ error: 'This package is not available for purchase' }, { status: 400 })
    }
    if (pkg.isRecurring && !pkg.stripePriceId) {
      return NextResponse.json({ error: 'Package is not available for subscription' }, { status: 400 })
    }

    // Enforce student-only packages server-side
    if (pkg.isStudentPackage) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { isStudent: true, email: true } })
      if (!user?.isStudent) {
        return NextResponse.json({ error: 'This package is only available to students.' }, { status: 403 })
      }
    }

    // ── One-time payment (e.g. single class drop-in) ──────────────────────────
    if (!pkg.isRecurring) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
      const customerId = await getOrCreateStripeCustomer(userId)
      const periodEnd  = new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000)

      // Create a placeholder subscription record so polling works unchanged
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          packageId,
          stripeSubscriptionId: `pending_${Date.now()}`,
          status:               'ACTIVE',
          currentPeriodStart:   new Date(),
          currentPeriodEnd:     periodEnd,
        },
      })

      const paymentIntent = await stripe.paymentIntents.create({
        amount:                    Math.round(pkg.price * 100),
        currency:                  'eur',
        customer:                  customerId,
        receipt_email:             user?.email,
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId,
          packageId,
          subscriptionId: subscription.id,
          type:           'one_time_package',
        },
      })

      // Update placeholder with real PaymentIntent ID
      await prisma.subscription.update({
        where: { id: subscription.id },
        data:  { stripeSubscriptionId: paymentIntent.id },
      })

      return NextResponse.json({ subscription, clientSecret: paymentIntent.client_secret })
    }

    // ── Recurring subscription ────────────────────────────────────────────────

    // Block new subscription purchase if user already has any active subscription.
    // Users must use the Change Plan flow to switch plans.
    const anyActive = await prisma.subscription.findFirst({
      where:   { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      include: { credits: { take: 1 } },
    })
    if (anyActive) {
      if (anyActive.credits.length === 0) {
        // Previous payment never completed (any package) — clean it up so user can retry.
        try { await stripe.subscriptions.cancel(anyActive.stripeSubscriptionId) } catch {}
        await prisma.subscription.delete({ where: { id: anyActive.id } })
      } else {
        return NextResponse.json({ error: 'You already have an active subscription. Use the Change Plan flow to switch plans.' }, { status: 409 })
      }
    }

    const customerId = await getOrCreateStripeCustomer(userId)

    // Create Stripe subscription — stays incomplete until first payment is confirmed.
    const stripeSub = await stripe.subscriptions.create({
      customer:         customerId,
      items:            [{ price: pkg.stripePriceId! }],
      payment_behavior: 'default_incomplete',
      expand:           ['latest_invoice'],
      metadata:         { userId, packageId },
    })

    const invoiceRaw = stripeSub.latest_invoice as any
    const invoiceId  = typeof invoiceRaw === 'string' ? invoiceRaw : invoiceRaw?.id

    if (!invoiceId) {
      return NextResponse.json({ error: 'Failed to retrieve invoice' }, { status: 500 })
    }

    // In Stripe SDK v20, payment_intent moved to invoice.payments[0].payment.payment_intent.
    // List the invoice's payments and expand the nested payment_intent to get the client_secret.
    const invoicePayments = await stripe.invoicePayments.list({
      invoice: invoiceId,
      expand: ['data.payment.payment_intent'],
    } as any)

    const firstPayment  = invoicePayments.data[0]
    const paymentIntent = firstPayment?.payment?.payment_intent as Stripe.PaymentIntent | undefined
    const clientSecret  = paymentIntent?.client_secret ?? null

    if (!clientSecret) {
      console.error('[mobile/subscribe] No client_secret found. Payments:', JSON.stringify(invoicePayments.data))
      return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
    }

    const invoice     = invoiceRaw as Stripe.Invoice
    const periodStart = new Date(invoice.period_start * 1000)
    // For default_incomplete subscriptions, period_end === period_start because
    // the billing period hasn't started yet. Compute a provisional end date of
    // +1 month; the webhook (invoice.payment_succeeded) will overwrite this with
    // the correct value from the paid invoice.
    const rawPeriodEnd = new Date(invoice.period_end * 1000)
    const periodEnd = rawPeriodEnd <= periodStart
      ? new Date(new Date(periodStart).setMonth(periodStart.getMonth() + 1))
      : rawPeriodEnd

    // Create the DB record immediately. The webhook (invoice.payment_succeeded)
    // will create the UserCredit once payment is confirmed. Status starts as
    // ACTIVE optimistically — the webhook reconfirms it on success.
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

    return NextResponse.json({
      subscription,
      clientSecret,
    })
  } catch (error: any) {
    console.error('[mobile/subscribe] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
