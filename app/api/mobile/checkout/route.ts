import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, isStudent: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { packageId } = await request.json()
    if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      select: { id: true, name: true, classCount: true, price: true, active: true, isStudentPackage: true, durationDays: true },
    })
    if (!pkg || !pkg.active) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

    // Server-side student enforcement — runs before any Stripe interaction
    if (pkg.isStudentPackage && !user.isStudent) {
      return NextResponse.json({ error: 'This package is only available to students.' }, { status: 403 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pkg.price * 100),
      currency: 'eur',
      receipt_email: user.email,
      metadata: {
        userId,
        packageId: pkg.id,
        classes: pkg.classCount.toString(),
        packageName: pkg.name,
        durationDays: pkg.durationDays.toString(),
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    console.error('[mobile/checkout] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
