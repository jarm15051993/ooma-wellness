import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

type BulkClassInput = {
  title: string
  instructor: string
  date: string       // YYYY-MM-DD
  startTime: string  // HH:MM
  durationMins: number
  capacity: number
  classType?: string // REFORMER | YOGA
}

type FailedRow = {
  row: number
  reason: string
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const isOwner = payload.role === 'OWNER'
    if (!isOwner && !payload.canCreateClass) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { classes } = await request.json()
    if (!Array.isArray(classes) || classes.length === 0) {
      return NextResponse.json({ error: 'No classes provided' }, { status: 400 })
    }

    const toCreate = []
    const failed: FailedRow[] = []

    for (let i = 0; i < classes.length; i++) {
      const c: BulkClassInput = classes[i]
      const rowNum = i + 2 // 1-indexed, offset by 1 for header row

      if (!c.title?.trim()) {
        failed.push({ row: rowNum, reason: 'Missing class name' }); continue
      }
      if (!c.date || !/^\d{4}-\d{2}-\d{2}$/.test(c.date)) {
        failed.push({ row: rowNum, reason: 'Invalid or missing date (expected YYYY-MM-DD)' }); continue
      }
      if (!c.startTime || !/^\d{2}:\d{2}$/.test(c.startTime)) {
        failed.push({ row: rowNum, reason: 'Invalid or missing start time (expected HH:MM)' }); continue
      }
      const duration = Number(c.durationMins)
      if (!duration || duration < 30 || duration > 180 || duration % 10 !== 0) {
        failed.push({ row: rowNum, reason: 'Duration must be between 30 and 180 minutes in 10-minute increments' }); continue
      }
      const cap = Number(c.capacity)
      if (!cap || cap < 1 || cap > 20) {
        failed.push({ row: rowNum, reason: 'Capacity must be between 1 and 20' }); continue
      }

      const [hours, mins] = c.startTime.split(':').map(Number)
      const start = new Date(`${c.date}T00:00:00`)
      start.setHours(hours, mins, 0, 0)
      const end = new Date(start.getTime() + duration * 60_000)

      if (isNaN(start.getTime())) {
        failed.push({ row: rowNum, reason: 'Invalid date' }); continue
      }

      const classType = c.classType && ['REFORMER', 'YOGA'].includes(c.classType.toUpperCase())
        ? c.classType.toUpperCase() as 'REFORMER' | 'YOGA'
        : 'REFORMER'

      toCreate.push({
        title: c.title.trim(),
        instructor: c.instructor?.trim() || null,
        startTime: start,
        endTime: end,
        capacity: cap,
        bookedCount: 0,
        classType,
      })
    }

    const result = await prisma.class.createMany({ data: toCreate })

    return NextResponse.json({
      created: result.count,
      failed,
    })
  } catch (err) {
    console.error('[bulk classes] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
