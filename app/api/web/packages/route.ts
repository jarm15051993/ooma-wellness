import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    let isStudent = false
    if (userId) {
      const user = await prisma.user.findUnique({
        where:  { id: userId },
        select: { isStudent: true },
      })
      isStudent = user?.isStudent ?? false
    }

    const packages = await prisma.package.findMany({
      where:   { active: true },
      orderBy: { price: 'asc' },
    }) as any[]

    const filtered = packages.filter(pkg => !pkg.isStudentPackage || isStudent)

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('[api/web/packages] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
