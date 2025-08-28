import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // Use your custom middleware client
    const { supabase, response } = createClient(request)

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession()
    const currentPath = request.nextUrl.pathname

    console.log('🔍 Middleware check:', { path: currentPath, hasSession: !!session })

    // Define public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/auth/callback',
      '/api/auth/callback',
      '/debug-auth',
      '/_next/static',
      '/_next/image',
      '/favicon.ico',
    ]

    // Check if the current path is public
    const isPublicRoute = publicRoutes.some(route => 
      currentPath.startsWith(route) || currentPath === route
    )

    // If it's a public route, continue
    if (isPublicRoute) {
      // If user is authenticated but trying to access auth pages, redirect to dashboard
      if (session && ['/login', '/signup'].includes(currentPath)) {
        console.log('🔄 Authenticated user accessing auth page, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // If there's no session and the route is protected, redirect to login
    if (!session) {
      console.log('🔒 Protected route accessed without session, redirecting to login')
      
      // For API routes, return 401 instead of redirecting
      if (currentPath.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
            
      // For pages, redirect to login with the original URL
      const redirectUrl = new URL('/login', request.url)
      if (currentPath !== '/') {
        redirectUrl.searchParams.set('redirectedFrom', currentPath)
      }
      return NextResponse.redirect(redirectUrl)
    }

    console.log('✅ Authenticated access allowed')
    return response

  } catch (error) {
    console.error('❌ Error in middleware:', error)
        
    // On error, redirect to login with error message
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'auth_error')
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}