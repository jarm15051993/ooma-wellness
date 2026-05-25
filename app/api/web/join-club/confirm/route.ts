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

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.userId !== userId || session.metadata?.type !== 'club_membership') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data:  { isClubMember: true },
      select: {
        id:                  true,
        email:               true,
        name:                true,
        lastName:            true,
        phone:               true,
        birthday:            true,
        goals:               true,
        profilePicture:      true,
        onboardingCompleted: true,
        qrCode:              true,
        isClubMember:        true,
        role:                true,
        language:            true,
        createdAt:           true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error: any) {
    console.error('[api/web/join-club/confirm] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
