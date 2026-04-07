import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        phone: true,
        birthday: true,
        goals: true,
        additionalInfo: true,
        profilePicture: true,
        userGoals: {
          select: { goalId: true, goal: { select: { label: true } } },
          orderBy: { goal: { sortOrder: 'asc' } },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { userGoals, goals, ...rest } = user
    const userGoalIds = userGoals.map(ug => ug.goalId)
    const goalsDisplay = userGoals.length > 0
      ? userGoals.map(ug => ug.goal.label).join(', ')
      : goals

    return NextResponse.json({ user: { ...rest, goals: goalsDisplay, userGoalIds } })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
