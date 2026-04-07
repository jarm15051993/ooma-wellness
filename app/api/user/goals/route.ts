import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        goals: true,
        userGoals: {
          select: { goalId: true },
          orderBy: { goal: { sortOrder: 'asc' } },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      userGoalIds: user.userGoals.map(ug => ug.goalId),
      goals: user.goals ?? null,
    })
  } catch (error) {
    console.error('[user/goals] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
