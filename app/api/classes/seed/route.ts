import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const now = new Date()

    // 10 classes all inside the validation window right now
    const names = [
      ['Quick Flow', 'Sarah Martinez'],
      ['Express Pilates', 'Maria Rodriguez'],
      ['Core Strength', 'Ana Lopez'],
      ['Morning Stretch', 'Sarah Martinez'],
      ['Reformer Basics', 'Maria Rodriguez'],
      ['Deep Stretch', 'Ana Lopez'],
      ['Power Pilates', 'Sarah Martinez'],
      ['Balance & Flow', 'Maria Rodriguez'],
      ['Breathwork', 'Ana Lopez'],
      ['Full Body Reset', 'Sarah Martinez'],
    ]
    const windowClasses = names.map(([title, instructor], i) => {
      // Stagger starts: from 50min ago to 10min from now (all within window)
      const offsetMs = (-50 + i * 6) * 60 * 1000
      const startTime = new Date(now.getTime() + offsetMs)
      const endTime   = new Date(startTime.getTime() + 60 * 60 * 1000)
      return { title, instructor, startTime, endTime, capacity: 6 }
    })
    await prisma.class.createMany({ data: windowClasses })

    // Check if the full 7-day schedule already exists
    const existingClasses = await prisma.class.count({
      where: { startTime: { gte: new Date(now.getTime() + 2 * 60 * 60 * 1000) } }
    })

    if (existingClasses > 0) {
      return NextResponse.json({
        message: '2 imminent classes created. 7-day schedule already exists.',
        imminentCreated: 2,
        existingUpcoming: existingClasses,
      })
    }

    // Create classes for the next 7 days
    const classesToCreate = []
    
    for (let day = 0; day < 7; day++) {
      const classDate = new Date(now)
      classDate.setDate(now.getDate() + day)
      
      // Morning class at 9:00 AM
      const morningStart = new Date(classDate)
      morningStart.setHours(9, 0, 0, 0)
      const morningEnd = new Date(morningStart)
      morningEnd.setHours(10, 0, 0, 0)
      
      classesToCreate.push({
        title: 'Morning Flow',
        description: 'Start your day with energizing pilates movements',
        startTime: morningStart,
        endTime: morningEnd,
        capacity: 6,
        instructor: 'Sarah Martinez'
      })
      
      // Midday class at 12:00 PM
      const middayStart = new Date(classDate)
      middayStart.setHours(12, 0, 0, 0)
      const middayEnd = new Date(middayStart)
      middayEnd.setHours(13, 0, 0, 0)
      
      classesToCreate.push({
        title: 'Lunch Break Pilates',
        description: 'Perfect midday reset for body and mind',
        startTime: middayStart,
        endTime: middayEnd,
        capacity: 6,
        instructor: 'Maria Rodriguez'
      })
      
      // Evening class at 6:00 PM
      const eveningStart = new Date(classDate)
      eveningStart.setHours(18, 0, 0, 0)
      const eveningEnd = new Date(eveningStart)
      eveningEnd.setHours(19, 0, 0, 0)
      
      classesToCreate.push({
        title: 'Evening Unwind',
        description: 'Relax and restore after a long day',
        startTime: eveningStart,
        endTime: eveningEnd,
        capacity: 6,
        instructor: 'Ana Lopez'
      })
    }

    // Create all classes
    const result = await prisma.class.createMany({
      data: classesToCreate
    })

    return NextResponse.json({
      message: 'Classes created successfully',
      imminentCreated: 2,
      weekCreated: result.count,
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}