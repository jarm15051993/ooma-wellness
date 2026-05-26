'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import BottomNav from '@/app/components/BottomNav'

const toastStyle = (border: string) => ({
  background: '#F4F0E8',
  color:      '#1C1A14',
  border:     `1px solid ${border}`,
})

interface Package {
  id:              string
  name:            string
  description:     string | null
  classCount:      number
  price:           number
  durationDays:    number
  packageType:     string
  isUnlimited:     boolean
  isRecurring:     boolean
  isStudentPackage: boolean
  stripePriceId:   string | null
}

interface Subscription {
  id:                string
  status:            'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED'
  currentPeriodEnd:  string
  cancelledAt:       string | null
  package: {
    name:        string
    packageType: string
    isUnlimited: boolean
    classCount:  number
    price:       number
  }
  credits: Array<{
    creditsRemaining: number
    creditsTotal:     number
    isUnlimited:      boolean
    expiresAt:        string | null
  }>
}

interface Settings {
  subscriptionPaymentRequired: string
  subscriptionPrice:           number
  membershipRequiredSince:     string | null
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-burg flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function StatusBadge({ status }: { status: Subscription['status'] }) {
  const styles: Record<Subscription['status'], string> = {
    ACTIVE:    'bg-green-50 text-green-700 border border-green-300',
    CANCELLED: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
    PAST_DUE:  'bg-red-50 text-red-600 border border-red-300',
    EXPIRED:   'bg-bone text-lgray border border-rule',
  }
  const labels: Record<Subscription['status'], string> = {
    ACTIVE:    'Active',
    CANCELLED: 'Cancels at period end',
    PAST_DUE:  'Payment past due',
    EXPIRED:   'Expired',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

export default function PackagesPage() {
  const router = useRouter()
  const [user, setUser]                 = useState<any>(null)
  const [settings, setSettings]         = useState<Settings | null>(null)
  const [packages, setPackages]         = useState<Package[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading]           = useState(true)
  const [purchasing, setPurchasing]     = useState<string | null>(null)
  const [cancelling, setCancelling]     = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      toast.error('Please log in to view packages', { style: toastStyle('#ef4444') })
      setTimeout(() => router.push('/login'), 1500)
      return
    }
    const parsedUser = JSON.parse(stored)
    setUser(parsedUser)

    Promise.all([
      fetch('/api/web/settings').then(r => r.json()),
      fetch(`/api/web/packages?userId=${parsedUser.id}`).then(r => r.json()),
      fetch(`/api/web/subscriptions?userId=${parsedUser.id}`).then(r => r.json()),
    ])
      .then(([settingsData, packagesData, subsData]) => {
        setSettings(settingsData)
        setPackages(Array.isArray(packagesData) ? packagesData : [])
        setSubscriptions(subsData.subscriptions ?? [])
      })
      .catch(() => toast.error('Failed to load packages', { style: toastStyle('#ef4444') }))
      .finally(() => setLoading(false))
  }, [router])

  const showMembershipGate = (() => {
    if (!settings || !user) return false
    const required   = settings.subscriptionPaymentRequired === 'true'
    const since      = settings.membershipRequiredSince
    const grandfathered = since ? new Date(user.createdAt) < new Date(since) : false
    const isPrivileged = user.role === 'ADMIN' || user.role === 'OWNER'
    return required && !user.isClubMember && !grandfathered && !isPrivileged
  })()

  const handleJoinClub = async () => {
    setPurchasing('membership')
    try {
      const res  = await fetch('/api/web/join-club', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', { style: toastStyle('#ef4444') })
      setPurchasing(null)
    }
  }

  const handleSubscribe = async (pkg: Package) => {
    setPurchasing(pkg.id)
    try {
      const res  = await fetch('/api/web/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id, packageId: pkg.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', { style: toastStyle('#ef4444') })
      setPurchasing(null)
    }
  }

  const handleBuyPack = async (pkg: Package) => {
    setPurchasing(pkg.id)
    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ packageId: pkg.id, userId: user.id, userEmail: user.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', { style: toastStyle('#ef4444') })
      setPurchasing(null)
    }
  }

  const handleCancelSubscription = async (sub: Subscription) => {
    setCancelling(sub.id)
    try {
      const res  = await fetch(`/api/web/subscriptions/${sub.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel')
      setSubscriptions(prev =>
        prev.map(s => s.id === sub.id ? { ...s, status: 'CANCELLED', cancelledAt: new Date().toISOString() } : s)
      )
      toast.success('Subscription cancelled. Access continues until the period ends.', {
        duration: 4000,
        style:    toastStyle('#22c55e'),
      })
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong', { style: toastStyle('#ef4444') })
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const recurringPackages = packages.filter(p => p.isRecurring && p.stripePriceId)
  const oneTimePackages   = packages.filter(p => !p.isRecurring)

  const activeSubscriptionPackageIds = new Set(
    subscriptions
      .filter(s => s.status === 'ACTIVE' || s.status === 'CANCELLED')
      .map(s => {
        const pkg = packages.find(p => p.name === s.package.name)
        return pkg?.id
      })
      .filter(Boolean)
  )

  return (
    <div className="min-h-screen bg-cream p-8 pb-20">
      <Toaster position="top-center" />

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-light text-ink mb-2 tracking-wide">
            Packages &amp; <em className="text-burg">Subscriptions</em>
          </h1>
          <p className="text-mgray text-sm">Choose how you want to practice at OOMA Wellness Club</p>
        </div>

        {/* ── Membership Gate ────────────────────────────────────────── */}
        {showMembershipGate && (
          <div className="bg-warm-white rounded p-6 border border-burg/30 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-xs font-medium text-burg tracking-widest uppercase mb-2">Required to purchase</p>
                <h2 className="text-2xl font-serif font-light text-ink mb-2 tracking-wide">
                  Join the <em className="text-burg">OOMA Club</em>
                </h2>
                <p className="text-mgray text-sm max-w-sm">
                  A one-time membership fee is required before purchasing class packs or subscriptions.
                </p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="text-5xl font-serif font-light text-burg mb-1">
                  €{settings!.subscriptionPrice.toFixed(2)}
                </div>
                <p className="text-mgray text-xs mb-4">one-time fee</p>
                <button
                  onClick={handleJoinClub}
                  disabled={purchasing === 'membership'}
                  className="px-8 py-3 bg-burg hover:bg-burg-mid disabled:opacity-50 text-warm-white font-medium rounded-sm transition tracking-wider text-sm uppercase"
                >
                  {purchasing === 'membership' ? 'Processing…' : 'Join Club'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Content (hidden behind gate if needed) ─────────────────── */}
        {!showMembershipGate && (
          <>
            {/* Monthly Subscriptions */}
            {recurringPackages.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-serif font-light text-ink mb-1 tracking-wide">
                  Monthly <em className="text-burg">Subscriptions</em>
                </h2>
                <p className="text-mgray text-sm mb-6">Auto-renews each month.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recurringPackages.map(pkg => {
                    const alreadySubscribed = activeSubscriptionPackageIds.has(pkg.id)
                    const isLoading         = purchasing === pkg.id
                    const pricePerClass     = !pkg.isUnlimited && pkg.classCount > 0
                      ? (pkg.price / pkg.classCount).toFixed(2)
                      : null

                    return (
                      <div key={pkg.id} className="bg-warm-white rounded p-6 border border-rule hover:border-burg/40 transition-all flex flex-col">
                        <div className="mb-4">
                          <h3 className="text-xl font-serif font-light text-ink tracking-wide">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-mgray text-sm mt-1">{pkg.description}</p>
                          )}
                        </div>

                        <div className="mb-6">
                          <div className="text-4xl font-serif font-light text-burg">€{pkg.price}</div>
                          <div className="text-mgray text-xs mt-0.5">per month</div>
                        </div>

                        <div className="space-y-2 mb-6 flex-1">
                          <div className="flex items-center gap-2 text-ink text-sm">
                            <CheckIcon />
                            <span>
                              {pkg.isUnlimited ? 'Unlimited classes' : `${pkg.classCount} ${pkg.classCount === 1 ? 'class' : 'classes'} per month`}
                            </span>
                          </div>
                          {pricePerClass && (
                            <div className="flex items-center gap-2 text-green-700 text-sm">
                              <CheckIcon />
                              <span>€{pricePerClass} per class</span>
                            </div>
                          )}
                        </div>

                        {alreadySubscribed ? (
                          <div className="w-full py-3 rounded bg-bone text-mgray text-sm font-medium text-center tracking-wider uppercase">
                            Already subscribed
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSubscribe(pkg)}
                            disabled={!!purchasing}
                            className="w-full py-3 bg-ink hover:bg-burg disabled:opacity-50 text-warm-white font-medium rounded-sm transition tracking-wider text-sm uppercase"
                          >
                            {isLoading ? 'Processing…' : 'Subscribe'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Class Packs */}
            {oneTimePackages.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-serif font-light text-ink mb-1 tracking-wide">
                  Class <em className="text-burg">Packs</em>
                </h2>
                <p className="text-mgray text-sm mb-6">One-time purchase. Valid for {oneTimePackages[0]?.durationDays ?? 30} days from purchase.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {oneTimePackages.map(pkg => {
                    const isLoading     = purchasing === pkg.id
                    const pricePerClass = !pkg.isUnlimited && pkg.classCount > 1
                      ? (pkg.price / pkg.classCount).toFixed(2)
                      : null

                    return (
                      <div key={pkg.id} className="bg-warm-white rounded p-6 border border-rule hover:border-burg/40 transition-all flex flex-col">
                        <div className="mb-4">
                          <h3 className="text-xl font-serif font-light text-ink tracking-wide">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-mgray text-sm mt-1">{pkg.description}</p>
                          )}
                        </div>

                        <div className="mb-6">
                          <div className="text-4xl font-serif font-light text-burg">€{pkg.price}</div>
                          {pricePerClass && (
                            <div className="text-green-700 text-xs mt-0.5">€{pricePerClass} per class</div>
                          )}
                        </div>

                        <div className="space-y-2 mb-6 flex-1">
                          <div className="flex items-center gap-2 text-ink text-sm">
                            <CheckIcon />
                            <span>
                              {pkg.isUnlimited ? 'Unlimited classes' : `${pkg.classCount} ${pkg.classCount === 1 ? 'class' : 'classes'}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-ink text-sm">
                            <CheckIcon />
                            <span>Valid for {pkg.durationDays} days</span>
                          </div>
                          <div className="flex items-center gap-2 text-ink text-sm">
                            <CheckIcon />
                            <span>All equipment included</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBuyPack(pkg)}
                          disabled={!!purchasing}
                          className="w-full py-3 bg-ink hover:bg-burg disabled:opacity-50 text-warm-white font-medium rounded-sm transition tracking-wider text-sm uppercase"
                        >
                          {isLoading ? 'Processing…' : 'Buy Now'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {recurringPackages.length === 0 && oneTimePackages.length === 0 && (
              <div className="bg-warm-white rounded p-8 border border-rule text-center">
                <p className="text-mgray">No packages available at the moment. Check back soon!</p>
              </div>
            )}

            {/* Payment info */}
            <div className="bg-warm-white rounded p-5 border border-rule">
              <h3 className="text-lg font-serif font-light text-burg mb-3 tracking-wide">Payment Information</h3>
              <ul className="space-y-2 text-ink text-sm">
                <li className="flex items-start gap-2"><span className="text-burg mt-1">·</span><span>Secure payment processing via Stripe</span></li>
                <li className="flex items-start gap-2"><span className="text-burg mt-1">·</span><span>All prices are in Euros (€)</span></li>
                <li className="flex items-start gap-2"><span className="text-burg mt-1">·</span><span>Subscriptions auto-renew monthly and can be cancelled anytime from your dashboard</span></li>
                <li className="flex items-start gap-2"><span className="text-burg mt-1">·</span><span>Class pack credits are added to your account immediately after payment</span></li>
              </ul>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
