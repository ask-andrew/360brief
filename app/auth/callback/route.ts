import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Disable static rendering and caching for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  
  console.log('🔄 Auth callback received:', { code: !!code, error, errorDescription, next })
  
  // Handle OAuth errors
  if (error) {
    console.error('❌ OAuth error:', { error, description: errorDescription })
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl)
  }

  // Verify we have an authorization code
  if (!code) {
    console.error('❌ No authorization code provided')
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', 'no_code')
    return NextResponse.redirect(errorUrl)
  }

  try {
    const cookieStore = cookies()
    
    // Create a response object that we'll use to set cookies
    const response = NextResponse.redirect(new URL(next, request.url))
    
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
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
    
    // Exchange the auth code for a session
    console.log('[Auth Callback] Exchanging code for session...')
    const { error: authError, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (authError) {
      console.error('[Auth Callback] Error exchanging code for session:', authError)
      throw authError
    }
    
    console.log('[Auth Callback] Successfully authenticated user:', data.user?.email)
    
    // Clean up the URL by removing the code parameter
    const cleanUrl = new URL(next, request.url)
    cleanUrl.searchParams.delete('code')
    cleanUrl.searchParams.delete('next')
    
    // Update the response with the clean URL
    response.headers.set('location', cleanUrl.toString())
    
    return response
    
  } catch (error) {
    console.error('[Auth Callback] Error in auth callback:', error)
    
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'auth_error')
    redirectUrl.searchParams.set('error_description', 'Failed to authenticate with the provider')
    
    return NextResponse.redirect(redirectUrl)
  }
}
