import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload.canViewStudents && payload.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

    const users = await prisma.user.findMany({
      where: {
        onboardingCompleted: false,
        ...(q.length >= 2
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { name: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        phone: true,
        createdAt: true,
        activationToken: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('[admin/inactive-users] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch inactive users.' }, { status: 500 })
  }
}
