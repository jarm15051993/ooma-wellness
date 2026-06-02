import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const tenantUserId = request.headers.get('x-tenant-user-id')
    const userId = tenantUserId ?? payload.userId

    const customerId = await getOrCreateStripeCustomer(userId)

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage:    'off_session',
    })

    return NextResponse.json({
      setupIntentId:         setupIntent.id,
      setupIntentClientSecret: setupIntent.client_secret,
    })
  } catch (error: any) {
    console.error('[mobile/payment-method/setup] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
