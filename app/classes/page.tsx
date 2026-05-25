'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/app/components/BottomNav'

interface Booking {
  id: string
  classId: string
  stretcherNumber: number
  class: {
    title: string
    startTime: string
    endTime: string
    instructor: string | null
  }
}

export default function ClassesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const fetchUpcomingBookings = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/user/bookings?userId=${userId}`)
      const data = await response.json()
      if (response.ok) setUpcomingBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem('user')
      if (!userData) { router.push('/login'); return }
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      await fetchUpcomingBookings(parsedUser.id)
      setLoading(false)
    }
    init()
    const handlePageShow = (e: PageTransitionEvent) => { if (e.persisted) init() }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router, fetchUpcomingBookings])

  const handleCancelBooking = async (booking: Booking) => {
    setCancellingId(booking.id)
    try {
      const response = await fetch('/api/classes/book', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, classId: booking.classId }),
      })
      if (response.ok) {
        setUpcomingBookings(prev => prev.filter(b => b.id !== booking.id))
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
    setCancellingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-8 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-light text-ink mb-6 tracking-wide">My <em className="text-burg">Classes</em></h1>

        {upcomingBookings.length === 0 ? (
          <div className="bg-warm-white rounded p-8 border border-rule text-center">
            <p className="text-mgray text-sm mb-4">No upcoming classes booked yet.</p>
            <button onClick={() => router.push('/book')}
              className="px-5 py-2 bg-ink hover:bg-burg text-warm-white text-sm font-medium rounded-sm transition tracking-wider uppercase">
              Book a Class →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="bg-warm-white rounded p-4 border border-rule">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-serif font-light text-ink tracking-wide">{booking.class.title}</h3>
                  <span className="px-3 py-1 bg-burg text-warm-white text-xs font-medium rounded-full">
                    Reformer #{booking.stretcherNumber}
                  </span>
                </div>
                <div className="space-y-1 text-sm mb-3">
                  <p className="text-mgray">
                    {new Date(booking.class.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-mgray">
                    {new Date(booking.class.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(booking.class.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {booking.class.instructor && <p className="text-mgray">{booking.class.instructor}</p>}
                </div>
                <button onClick={() => handleCancelBooking(booking)} disabled={cancellingId === booking.id}
                  className="px-4 py-1.5 border border-rule hover:border-burg disabled:opacity-50 text-mgray hover:text-burg text-sm font-medium rounded-sm transition">
                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
