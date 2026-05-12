import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { SignJWT, importPKCS8 } from 'jose'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)

    const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
    const privateKeyRaw        = process.env.GOOGLE_WALLET_PRIVATE_KEY
    const issuerId             = process.env.GOOGLE_WALLET_ISSUER_ID

    if (!serviceAccountEmail || !privateKeyRaw || !issuerId) {
      return NextResponse.json({ error: 'Google Wallet not configured' }, { status: 503 })
    }

    const user = await prisma.user.findUnique({
      where:  { id: payload.userId },
      select: { id: true, name: true, lastName: true, qrCode: true },
    })

    if (!user)        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!user.qrCode) return NextResponse.json({ error: 'QR code not yet generated' }, { status: 400 })

    const fullName = [user.name, user.lastName].filter(Boolean).join(' ') || 'Ooma Member'
    const classId  = `${issuerId}.membership`
    const objectId = `${issuerId}.user_${user.id.replace(/[^a-zA-Z0-9_.-]/g, '_')}`

    const genericObject = {
      id:      objectId,
      classId,
      state:   'ACTIVE',
      logo: {
        sourceUri: { uri: 'https://oomawellness.shop/logo.png' },
        contentDescription: { defaultValue: { language: 'es', value: 'OOMA Logo' } },
      },
      cardTitle: {
        defaultValue: { language: 'es', value: 'OOMA' },
      },
      header: {
        defaultValue: { language: 'es', value: 'Class Pass' },
      },
      subheader: {
        defaultValue: { language: 'es', value: 'MEMBERSHIP' },
      },
      textModulesData: [
        { header: 'MEMBER', body: fullName, id: 'member' },
      ],
      barcode: {
        type:          'QR_CODE',
        value:         user.qrCode,
        alternateText: user.qrCode,
      },
      hexBackgroundColor: '#0D0D0D',
    }

    // Normalize key: handle literal \n strings, extra spaces, or missing newlines
    const privateKeyPem = privateKeyRaw
      .replace(/\\n/g, '\n')
      .replace(/\n+/g, '\n')
      .trim()
    const privateKey = await importPKCS8(privateKeyPem, 'RS256')

    const walletJwt = await new SignJWT({
      origins: ['https://oomawellness.shop'],
      typ:     'savetowallet',
      payload: { genericObjects: [genericObject] },
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(serviceAccountEmail)
      .setAudience('google')
      .sign(privateKey)

    return NextResponse.json({ saveUrl: `https://pay.google.com/gp/v/save/${walletJwt}` })
  } catch (error: any) {
    console.error('[wallet/google] Error:', error)
    return NextResponse.json({ error: 'Failed to generate pass', detail: error?.message }, { status: 500 })
  }
}
