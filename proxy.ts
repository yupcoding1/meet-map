import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/profile',
  '/dashboard',
  '/chat/',
]

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/sign-up',
  '/auth/callback',
  '/',
]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
  
  if (isProtected) {
    // Get the session via updateSession which checks auth
    const response = await updateSession(request)
    
    // Check if user has a valid session from the response
    const cookieHeader = response.headers.get('set-cookie')
    const hasSession = request.cookies.get('sb-auth-token')?.value
    
    // If no session, redirect to login
    if (!hasSession && !cookieHeader) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    return response
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
