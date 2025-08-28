import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Update the response cookies
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            path: '/',
          })
        },
        remove(name: string, options: any) {
          // Remove the cookie by setting maxAge to 0
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            path: '/',
          })
        },
      },
    }
  )

  try {
    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()
    const currentPath = request.nextUrl.pathname

    // Define public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/auth/callback',
      '/api/auth/callback',
      '/api/auth/session',
      '/_next/static/(.*)',
      '/_next/image(.*)',
      '/favicon.ico',
      '/(.*)\.(jpg|jpeg|png|svg|gif|ico|webp|woff|woff2|ttf|eot)$',
    ]

    // Check if the current path is public
    const isPublicRoute = publicRoutes.some(route => {
      const regex = new RegExp(`^${route.replace(/\*/g, '.*')}$`)
      return regex.test(currentPath)
    })

    // If it's a public route, continue
    if (isPublicRoute) {
      // If user is authenticated but trying to access auth pages, redirect to dashboard
      const authRoutes = ['/login', '/signup']
      if (session && authRoutes.includes(currentPath)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return response
    }

    // If there's no session and the route is protected, redirect to login
    if (!session) {
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

    return response
  } catch (error) {
    console.error('Error in middleware:', error)
    
    // On error, redirect to login with error message
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'auth_error')
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
