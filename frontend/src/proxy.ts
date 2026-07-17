import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken, COOKIE_NAME } from '@/lib/jwt'

const publicPaths = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/demo',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/reset-password',
  '/forgot-password',
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.[a-z]+$/)
  ) {
    return NextResponse.next()
  }

  if (publicPaths.some((p) => pathname === p) || pathname.startsWith('/demo')) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifyAuthToken(token) : null

  if (!user && (pathname.startsWith('/app') || pathname.startsWith('/onboarding'))) {
    const login = new URL('/login', req.url)
    login.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(login)
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/app', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
