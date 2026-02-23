import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getAppUrl } from '@/lib/app-url'

// POST — send a test activation email to the given address
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const appUrl = getAppUrl()
    await sendEmail({
      to: email,
      type: 'activation',
      vars: {
        name: email,
        link: `${appUrl}/activate?token=TEST_TOKEN`,
      },
    })

    return NextResponse.json({ message: `Test email sent to ${email}` })
  } catch (error: any) {
    console.error('[email-test]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
