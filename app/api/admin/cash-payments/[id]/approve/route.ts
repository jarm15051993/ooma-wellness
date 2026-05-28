import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, endOfDay } from 'date-fns'
import { randomUUID } from 'crypto'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cashRequest = await prisma.cashPaymentRequest.findUnique({
      where: { id: params.id },
      include: { user: true, package: true },
    })

    if (!cashRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    if (cashRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }

    const now = new Date()

    await prisma.$transaction(async (tx) => {
      if (cashRequest.type === 'MEMBERSHIP') {
        await tx.user.update({
          where: { id: cashRequest.userId },
          data: { isClubMember: true, membershipPaymentMethod: 'CASH' },
        })
      } else if (cashRequest.type === 'SUBSCRIPTION') {
        const pkg = cashRequest.package!
        const periodEnd = addDays(now, pkg.durationDays)

        const subscription = await tx.subscription.create({
          data: {
            userId:               cashRequest.userId,
            packageId:            pkg.id,
            stripeSubscriptionId: `cash_${randomUUID()}`,
            status:               'ACTIVE',
            currentPeriodStart:   now,
            currentPeriodEnd:     periodEnd,
          },
        })

        await tx.userCredit.create({
          data: {
            userId:           cashRequest.userId,
            packageId:        pkg.id,
            subscriptionId:   subscription.id,
            packageType:      pkg.packageType,
            isUnlimited:      pkg.isUnlimited,
            creditsRemaining: pkg.isUnlimited ? 0 : pkg.classCount,
            creditsTotal:     pkg.isUnlimited ? 0 : pkg.classCount,
            expiresAt:        endOfDay(periodEnd),
            paymentMethod:    'CASH',
          },
        })
      } else if (cashRequest.type === 'ONE_TIME_CLASS') {
        const pkg = cashRequest.package!
        const expiresAt = endOfDay(addDays(now, pkg.durationDays))

        await tx.userCredit.create({
          data: {
            userId:           cashRequest.userId,
            packageId:        pkg.id,
            packageType:      pkg.packageType,
            isUnlimited:      pkg.isUnlimited,
            creditsRemaining: pkg.isUnlimited ? 0 : pkg.classCount,
            creditsTotal:     pkg.isUnlimited ? 0 : pkg.classCount,
            expiresAt,
            paymentMethod:    'CASH',
          },
        })
      }

      await tx.cashPaymentRequest.update({
        where: { id: cashRequest.id },
        data:  { status: 'APPROVED', processedAt: now },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/cash-payments/approve] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
