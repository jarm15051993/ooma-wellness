import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limit store — resets per Edge invocation but sufficient for burst protection
// Key: IP address, Value: { count, windowStart }
const loginAttempts = new Map<string, { count: number; windowStart: number }>()

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10            // max attempts per window per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now })
    return false
  }

  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit login endpoints
  const isLoginRoute =
    pathname === '/api/auth/login' ||
    pathname === '/api/mobile/auth/signin'

  if (isLoginRoute && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute and try again.' },
        { status: 429 }
      )
    }
  }

  // Allow the login page and auth API through without a session check
  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return NextResponse.next()
  }

  // Mobile admin API routes: authenticated via JWT Bearer token — let through, route handles auth
  if (pathname.startsWith('/api/admin') && request.headers.get('authorization')?.startsWith('Bearer ')) {
    return NextResponse.next()
  }

  // Protect all other /admin and /api/admin routes (web admin panel — cookie-based)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const session = request.cookies.get('admin_session')?.value
    const secret = process.env.ADMIN_SESSION_SECRET

    if (!secret || !session || session !== secret) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/auth/login',
    '/api/mobile/auth/signin',
  ],
}
