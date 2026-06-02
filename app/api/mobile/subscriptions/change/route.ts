import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer'
import { endOfDay } from 'date-fns'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

// Determines whether switching from currentPkg to newPkg is an upgrade.
// Upgrade rules:
//   1. Same type + more classes
//   2. Single type (REFORMER or YOGA) → BOTH + more classes (cross-upgrade)
// Everything else is a downgrade.
function isUpgrade(
  currentType: string, currentCount: number, currentUnlimited: boolean,
  newType: string,     newCount: number,     newUnlimited: boolean,
): boolean {
  const curEff = currentUnlimited ? Infinity : currentCount
  const newEff = newUnlimited     ? Infinity : newCount
  if (currentType === newType && newEff > curEff) return true
  if (currentType !== 'BOTH' && newType === 'BOTH' && newEff > curEff) return true
  return false
}

// ── GET: preview a plan change ──────────────────────────────────────────────
// Returns whether it's an upgrade or downgrade, the proration charge (upgrade),
// new credit calculation, and the effective date (downgrade).
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const tenantUserId = request.headers.get('x-tenant-user-id')
    const userId = tenantUserId ?? payload.userId

    const targetPackageId = request.nextUrl.searchParams.get('targetPackageId')
    if (!targetPackageId) return NextResponse.json({ error: 'targetPackageId required' }, { status: 400 })

    const [currentSub, newPkg] = await Promise.all([
      prisma.subscription.findFirst({
        where:   { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
        include: { package: true, credits: { where: { creditsRemaining: { gt: 0 } }, take: 1 } },
      }),
      prisma.package.findUnique({
        where:  { id: targetPackageId },
        select: { id: true, name: true, packageType: true, classCount: true, price: true, stripePriceId: true, isRecurring: true },
      }),
    ])

    if (!currentSub) return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    if (!newPkg || !newPkg.isRecurring || !newPkg.stripePriceId) {
      return NextResponse.json({ error: 'Target package not available for plan change' }, { status: 400 })
    }
    if (newPkg.id === currentSub.packageId) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 409 })
    }

    const upgrade = isUpgrade(
      currentSub.package.packageType, currentSub.package.classCount, currentSub.package.isUnlimited,
      newPkg.packageType, newPkg.classCount, newPkg.isUnlimited,
    )

    const alreadyUsed = currentSub.credits[0]
      ? currentSub.credits[0].creditsTotal - currentSub.credits[0].creditsRemaining
      : currentSub.package.classCount

    const newCreditsRemaining = Math.max(0, newPkg.classCount - alreadyUsed)

    if (upgrade) {
      // Fetch real proration amount from Stripe
      const stripeSub = await stripe.subscriptions.retrieve(currentSub.stripeSubscriptionId)
      const itemId = stripeSub.items.data[0]?.id
      if (!itemId) return NextResponse.json({ error: 'Could not retrieve subscription item' }, { status: 500 })

      const preview = await stripe.invoices.createPreview({
        subscription: currentSub.stripeSubscriptionId,
        subscription_details: {
          items: [{ id: itemId, price: newPkg.stripePriceId }],
          proration_behavior: 'always_invoice',
        } as any,
      })

      return NextResponse.json({
        isUpgrade:          true,
        chargeAmount:       Math.max(0, preview.amount_due) / 100,
        currency:           preview.currency,
        newCreditsRemaining,
        newPlanTotal:       newPkg.classCount,
        alreadyUsed,
        currentPeriodEnd:   currentSub.currentPeriodEnd,
        newPackageName:     newPkg.name,
        newPackageType:     newPkg.packageType,
      })
    } else {
      return NextResponse.json({
        isUpgrade:         false,
        chargeAmount:      0,
        currency:          'eur',
        newCreditsRemaining: null,
        currentPeriodEnd:  currentSub.currentPeriodEnd,
        newPackageName:    newPkg.name,
        newPackageType:    newPkg.packageType,
        newPlanTotal:      newPkg.classCount,
      })
    }
  } catch (error: any) {
    console.error('[subscriptions/change] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST: execute a plan change ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const tenantUserId = request.headers.get('x-tenant-user-id')
    const userId = tenantUserId ?? payload.userId

    const { targetPackageId } = await request.json()
    if (!targetPackageId) return NextResponse.json({ error: 'targetPackageId required' }, { status: 400 })

    const [currentSub, newPkg] = await Promise.all([
      prisma.subscription.findFirst({
        where:   { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
        include: { package: true, credits: { where: { creditsRemaining: { gt: 0 } }, take: 1 } },
      }),
      prisma.package.findUnique({
        where:  { id: targetPackageId },
        select: { id: true, name: true, packageType: true, classCount: true, price: true, stripePriceId: true, isRecurring: true, isUnlimited: true },
      }),
    ])

    if (!currentSub) return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    if (!newPkg || !newPkg.isRecurring || !newPkg.stripePriceId) {
      return NextResponse.json({ error: 'Target package not available for plan change' }, { status: 400 })
    }
    if (newPkg.id === currentSub.packageId) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 409 })
    }

    const upgrade = isUpgrade(
      currentSub.package.packageType, currentSub.package.classCount, currentSub.package.isUnlimited,
      newPkg.packageType, newPkg.classCount, newPkg.isUnlimited,
    )

    // Cancel any existing pending plan change for this user
    await prisma.subscription.deleteMany({
      where: { userId, status: 'PENDING' },
    })

    if (upgrade) {
      // ── Upgrade: swap Stripe subscription immediately ───────────────────
      const stripeSub = await stripe.subscriptions.retrieve(currentSub.stripeSubscriptionId)
      const itemId = stripeSub.items.data[0]?.id
      if (!itemId) return NextResponse.json({ error: 'Could not retrieve subscription item' }, { status: 500 })

      await stripe.subscriptions.update(currentSub.stripeSubscriptionId, {
        items:              [{ id: itemId, price: newPkg.stripePriceId }],
        proration_behavior: 'always_invoice',
      } as any)

      // Recalculate credits: new remaining = new total − already used
      const alreadyUsed = currentSub.credits[0]
        ? currentSub.credits[0].creditsTotal - currentSub.credits[0].creditsRemaining
        : currentSub.package.classCount
      const newCreditsRemaining = Math.max(0, newPkg.classCount - alreadyUsed)

      await prisma.$transaction(async (tx) => {
        // Void existing credits for this subscription
        await tx.userCredit.updateMany({
          where: { subscriptionId: currentSub.id },
          data:  { creditsRemaining: 0 },
        })
        // Update subscription to new package
        await tx.subscription.update({
          where: { id: currentSub.id },
          data:  { packageId: newPkg.id },
        })
        // Provision new credits
        await tx.userCredit.create({
          data: {
            userId,
            packageId:        newPkg.id,
            subscriptionId:   currentSub.id,
            packageType:      newPkg.packageType,
            isUnlimited:      newPkg.isUnlimited,
            creditsRemaining: newCreditsRemaining,
            creditsTotal:     newPkg.classCount,
            expiresAt:        endOfDay(new Date(currentSub.currentPeriodEnd)),
          },
        })
      })

      return NextResponse.json({ ok: true, type: 'upgrade', newCreditsRemaining })
    } else {
      // ── Downgrade: flag current sub to cancel at period end + store pending ──
      await stripe.subscriptions.update(currentSub.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })

      // Create a PENDING subscription record for the new plan
      await prisma.subscription.create({
        data: {
          userId,
          packageId:            newPkg.id,
          stripeSubscriptionId: `pending_change_${Date.now()}`,
          status:               'PENDING',
          currentPeriodStart:   currentSub.currentPeriodEnd,
          currentPeriodEnd:     currentSub.currentPeriodEnd, // placeholder
        },
      })

      return NextResponse.json({
        ok:              true,
        type:            'downgrade',
        effectiveDate:   currentSub.currentPeriodEnd,
        newPackageName:  newPkg.name,
      })
    }
  } catch (error: any) {
    console.error('[subscriptions/change] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
