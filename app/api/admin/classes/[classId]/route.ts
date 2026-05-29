import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> },
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload.canCreateClass && payload.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { classId } = await params
    const { title, description, startTime, endTime, capacity, instructor, classType } = await request.json()

    if (!title || !startTime || !endTime || !capacity) {
      return NextResponse.json(
        { error: 'Title, start time, end time, and capacity are required' },
        { status: 400 },
      )
    }

    if (classType && !['REFORMER', 'YOGA'].includes(classType)) {
      return NextResponse.json({ error: 'Invalid classType. Must be REFORMER or YOGA' }, { status: 400 })
    }

    const cap = parseInt(capacity)
    if (isNaN(cap) || cap < 1 || cap > 6) {
      return NextResponse.json({ error: 'Capacity must be between 1 and 6' }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }
    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const durationMins = (end.getTime() - start.getTime()) / 60000
    if (durationMins < 30 || durationMins > 180 || durationMins % 10 !== 0) {
      return NextResponse.json(
        { error: 'Duration must be between 30 and 180 minutes in 10-minute increments.' },
        { status: 400 },
      )
    }

    const existing = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: { select: { bookings: { where: { status: { in: ['confirmed', 'attended'] } } } } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const bookedCount = existing._count.bookings

    if (cap < bookedCount) {
      return NextResponse.json(
        { error: `Cannot reduce capacity to ${cap} — ${bookedCount} people are already enrolled.` },
        { status: 400 },
      )
    }

    if (classType && classType !== existing.classType && bookedCount > 0) {
      return NextResponse.json(
        { error: 'Cannot change class type while people are enrolled.' },
        { status: 400 },
      )
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startTime: start,
        endTime: end,
        capacity: cap,
        instructor: instructor?.trim() || null,
        classType: classType ?? existing.classType,
      },
    })

    return NextResponse.json({ class: updated })
  } catch (error: any) {
    console.error('[admin/classes/patch] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
