import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateDNI } from '@/utils/validateDNI'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dni = searchParams.get('dni')
  const excludeUserId = searchParams.get('excludeUserId')

  if (!dni) {
    return NextResponse.json({ available: false, message: 'DNI/NIE is required' }, { status: 400 })
  }

  const normalized = dni.trim().toUpperCase()

  if (!validateDNI(normalized)) {
    return NextResponse.json({ available: false, message: 'Invalid DNI/NIE format (e.g. 12345678Z or X1234567L)' })
  }

  const existing = await prisma.user.findFirst({
    where: {
      dni: normalized,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ available: false, message: 'This DNI/NIE is already registered' })
  }

  return NextResponse.json({ available: true })
}
