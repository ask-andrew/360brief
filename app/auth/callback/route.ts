import { createClient } from '../../../src/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  console.log('🔄 Auth callback received:', { 
    hasCode: !!code, 
    error, 
    origin: requestUrl.origin,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  if (error) {
    console.error('❌ OAuth error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    console.error('❌ No code in callback')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
  }

  try {
    const supabase = await createClient()
    
    console.log('🔄 Exchanging code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Exchange error:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=exchange_failed`)
    }

    if (!data?.session) {
      console.error('❌ No session after exchange')
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`)
    }

    console.log('✅ Session exchange successful!')
    return NextResponse.redirect(`${requestUrl.origin}${next}`)

  } catch (err) {
    console.error('❌ Callback error:', err)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=server_error`)
  }
}