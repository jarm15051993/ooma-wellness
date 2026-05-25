'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SubscriptionSuccessContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const sessionId    = searchParams.get('session_id')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return }

    const stored = localStorage.getItem('user')
    if (!stored) { router.replace('/login'); return }
    const user = JSON.parse(stored)

    fetch('/api/web/subscribe/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: user.id, sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.subscription) {
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [sessionId, router])

  useEffect(() => {
    if (status !== 'success') return
    if (countdown <= 0) { router.replace('/packages'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [status, countdown, router])

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-warm-white rounded p-8 border border-rule shadow-sm text-center max-w-md w-full mx-4">
          <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-mgray text-sm tracking-wide">Activating your subscription…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-warm-white rounded p-8 border border-rule shadow-sm text-center max-w-md w-full mx-4">
          <p className="text-burg font-medium mb-2">Something went wrong</p>
          <p className="text-mgray text-sm mb-6">Your payment may have been processed — please check your dashboard or contact support.</p>
          <button
            onClick={() => router.replace('/dashboard')}
            className="px-6 py-2 bg-ink hover:bg-burg text-warm-white text-sm font-medium rounded-sm transition tracking-wider uppercase"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-warm-white rounded p-8 border border-rule shadow-sm text-center max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-bone rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-burg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-serif font-light text-burg mb-2 tracking-wide">Subscription Activated!</h1>
        <p className="text-mgray text-sm mb-2">Your subscription is now active.</p>
        <p className="text-mgray text-xs mb-6 bg-bone rounded px-4 py-2">
          Your class credits are being added — they'll appear on your dashboard in a few seconds once our system confirms the payment.
        </p>
        <p className="text-mgray text-xs">Redirecting in {countdown}s…</p>
        <button
          onClick={() => router.replace('/packages')}
          className="mt-4 px-6 py-2 bg-ink hover:bg-burg text-warm-white text-sm font-medium rounded-sm transition tracking-wider uppercase"
        >
          View Packages
        </button>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
