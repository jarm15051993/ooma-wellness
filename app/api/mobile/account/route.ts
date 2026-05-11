import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

// Returns a summary of what will be lost on account deletion — no side effects.
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const now = new Date()

    const [user, activeSubscriptions, upcomingBookings, credits] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true } }),
      prisma.subscription.findMany({
        where:   { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
        include: { package: { select: { name: true } } },
      }),
      prisma.booking.count({
        where: {
          userId,
          status: 'confirmed',
          class:  { startTime: { gt: now } },
        },
      }),
      prisma.userCredit.findMany({
        where: { userId, creditsRemaining: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        select: { creditsRemaining: true, isUnlimited: true },
      }),
    ])

    if (!user)            return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.deletedAt)   return NextResponse.json({ error: 'Account already deleted' }, { status: 410 })

    const totalCreditsRemaining = credits.reduce((sum, c) => sum + (c.isUnlimited ? 0 : c.creditsRemaining), 0)
    const hasUnlimited          = credits.some(c => c.isUnlimited)

    return NextResponse.json({
      activeSubscriptions:    activeSubscriptions.map(s => ({ id: s.id, name: s.package.name })),
      upcomingBookingsCount:  upcomingBookings,
      totalCreditsRemaining,
      hasUnlimited,
    })
  } catch (error: any) {
    console.error('[mobile/account] GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Soft-deletes the account: cancels subscriptions + future bookings, mangles unique fields.
export async function DELETE(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const now = new Date()

    const user = await prisma.user.findUnique({
      where:   { id: userId },
      include: {
        subscriptions: { where: { status: { in: ['ACTIVE', 'PAST_DUE'] } } },
        bookings: {
          where:   { status: 'confirmed', class: { startTime: { gt: now } } },
          include: { class: { select: { id: true } } },
        },
      },
    })

    if (!user)          return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.deletedAt) return NextResponse.json({ error: 'Account already deleted' }, { status: 410 })
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      return NextResponse.json({ error: 'Admin accounts cannot be self-deleted' }, { status: 403 })
    }

    // 1. Cancel active Stripe subscriptions immediately
    for (const sub of user.subscriptions) {
      try { await stripe.subscriptions.cancel(sub.stripeSubscriptionId) } catch {}
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  { status: 'CANCELLED', cancelledAt: now },
      })
    }

    // 2. Cancel future bookings and release capacity
    if (user.bookings.length > 0) {
      const bookingIds = user.bookings.map(b => b.id)
      await prisma.booking.updateMany({
        where: { id: { in: bookingIds } },
        data:  { status: 'cancelled', cancelledAt: now },
      })

      // Decrement bookedCount per class
      const classBookingCounts = user.bookings.reduce<Record<string, number>>((acc, b) => {
        acc[b.class.id] = (acc[b.class.id] ?? 0) + 1
        return acc
      }, {})
      await Promise.all(
        Object.entries(classBookingCounts).map(([classId, count]) =>
          prisma.class.update({
            where: { id: classId },
            data:  { bookedCount: { decrement: count } },
          }),
        ),
      )
    }

    // 3. Soft-delete: set deletedAt and mangle unique fields to free up the slots
    const suffix = `_DELETED_${userId}`
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt:        now,
        email:            `${user.email}${suffix}`,
        phone:            user.phone            ? `${user.phone}${suffix}`            : undefined,
        qrCode:           user.qrCode           ? `${user.qrCode}${suffix}`           : undefined,
        dni:              user.dni              ? `${user.dni}${suffix}`              : undefined,
        stripeCustomerId: user.stripeCustomerId ? `${user.stripeCustomerId}${suffix}` : undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[mobile/account] DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
