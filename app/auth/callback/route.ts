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

    // Store OAuth tokens if this is a Google OAuth with provider_token
    if (data.session.provider_token && data.session.user) {
      console.log('🔄 Storing Gmail OAuth tokens...')
      
      try {
        await supabase.from('user_tokens').upsert({
          user_id: data.session.user.id,
          provider: 'google',
          access_token: data.session.provider_token,
          refresh_token: data.session.provider_refresh_token,
          expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
          updated_at: new Date().toISOString(),
        });
        
        console.log('✅ Gmail OAuth tokens stored successfully!');
      } catch (tokenError) {
        console.error('⚠️ Failed to store tokens:', tokenError);
        // Continue anyway - user can still use the app
      }
    }

    console.log('✅ Session exchange successful!')
    
    // Check if this was a Gmail connection flow
    const connectParam = requestUrl.searchParams.get('connect');
    if (connectParam === 'gmail') {
      return NextResponse.redirect(`${requestUrl.origin}/dashboard?connected=gmail`);
    }
    
    return NextResponse.redirect(`${requestUrl.origin}${next}`)

  } catch (err) {
    console.error('❌ Callback error:', err)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=server_error`)
  }
}