'use client'

import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ClassesIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function PackagesIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

const tabs = [
  { label: 'Calendar',      href: '/book',     icon: CalendarIcon  },
  { label: 'My Classes',    href: '/classes',  icon: ClassesIcon   },
  { label: 'Subscriptions', href: '/packages', icon: PackagesIcon  },
  { label: 'Profile',       href: '/profile',  icon: ProfileIcon   },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-warm-white border-t border-rule pb-safe">
      <div className="flex items-stretch">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/profile' && pathname.startsWith(href))
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-burg' : 'text-mgray hover:text-ink'
              }`}
            >
              <Icon />
              <span className="text-[10px] tracking-wide uppercase font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
