import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('[api/web/me] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
