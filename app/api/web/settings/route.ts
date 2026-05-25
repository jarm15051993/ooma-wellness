import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'

export async function GET() {
  try {
    const settings = await getSettings([
      'subscriptionPaymentRequired',
      'subscriptionPrice',
      'membershipRequiredSince',
    ])

    return NextResponse.json({
      subscriptionPaymentRequired: settings.subscriptionPaymentRequired ?? 'false',
      subscriptionPrice: parseFloat(settings.subscriptionPrice ?? '10.00'),
      membershipRequiredSince: settings.membershipRequiredSince ?? null,
    })
  } catch (error) {
    console.error('[api/web/settings] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
