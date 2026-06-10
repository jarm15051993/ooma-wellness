import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { sendEmail, type EmailLanguage } from '@/lib/email'
import { getAppUrl } from '@/lib/app-url'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const isOwner = payload.role === 'OWNER'
    if (!isOwner && !payload.canCancellClasses) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { classId } = await params

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        bookings: {
          where: { status: 'confirmed' },
          include: {
            user: { select: { id: true, name: true, email: true, language: true } },
            userCredit: { select: { isUnlimited: true } },
          },
        },
      },
    })

    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    if (cls.status === 'cancelled') {
      return NextResponse.json({ error: 'Class is already cancelled' }, { status: 400 })
    }

    const now = new Date()
    const confirmedBookings = cls.bookings

    await prisma.$transaction(async tx => {
      // Mark class cancelled
      await tx.class.update({
        where: { id: classId },
        data: { status: 'cancelled', cancelledAt: now, bookedCount: 0 },
      })

      for (const booking of confirmedBookings) {
        // Mark booking cancelled — no 2-hour credit loss rule for admin class cancellation
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'cancelled', stretcherNumber: null, creditLost: false, cancelledAt: now },
        })

        // Reinstate credit — skip unlimited subscriptions
        if (!booking.userCredit?.isUnlimited) {
          if (booking.userCreditId) {
            await tx.userCredit.update({
              where: { id: booking.userCreditId },
              data: { creditsRemaining: { increment: 1 } },
            })
          } else {
            // Fallback for bookings without a linked credit (older bookings)
            const fallback = await tx.userCredit.findFirst({
              where: {
                userId: booking.userId,
                OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
              },
              orderBy: { expiresAt: 'asc' },
            })
            if (fallback) {
              await tx.userCredit.update({
                where: { id: fallback.id },
                data: { creditsRemaining: { increment: 1 } },
              })
            }
          }
        }
      }

      await tx.adminAuditLog.create({
        data: {
          adminId: payload.userId,
          targetUserId: payload.userId,
          action: 'CANCEL_CLASS',
          metadata: { classId, classTitle: cls.title, bookingsCancelled: confirmedBookings.length },
        },
      })
    })

    // Fire-and-forget cancellation emails to all affected members
    const locale_map: Record<string, string> = { en: 'en-GB', ca: 'ca-ES', es: 'es-ES' }
    for (const booking of confirmedBookings) {
      const lang = ((booking.user.language ?? 'es') as EmailLanguage)
      const locale = locale_map[lang] ?? 'es-ES'
      const date = cls.startTime.toLocaleDateString(locale, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Europe/Madrid',
      })
      const time = cls.startTime.toLocaleTimeString(locale, {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
      })
      sendEmail({
        to: booking.user.email,
        type: 'class_cancelled',
        language: lang,
        userId: booking.user.id,
        vars: {
          name: booking.user.name ?? 'there',
          classTitle: cls.title,
          date,
          time,
          bookUrl: `${getAppUrl()}/book`,
        },
        metadata: { classId, bookingId: booking.id },
      }).catch(err => console.error(`[cancel-class] Email error for ${booking.user.email}:`, err))
    }

    return NextResponse.json({
      success: true,
      bookingsCancelled: confirmedBookings.length,
    })
  } catch (error: any) {
    console.error('[cancel-class] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
