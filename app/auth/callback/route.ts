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
      
      const tokenData = {
        user_id: data.session.user.id,
        provider: 'google',
        access_token: data.session.provider_token,
        refresh_token: data.session.provider_refresh_token,
        expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      
      console.log('📊 Token data to store:', {
        user_id: tokenData.user_id,
        provider: tokenData.provider,
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expires_at: tokenData.expires_at
      });
      
      try {
        const { data: insertResult, error: insertError } = await supabase
          .from('user_tokens')
          .upsert(tokenData);
        
        if (insertError) {
          console.error('❌ Token insert error:', insertError);
          throw insertError;
        }
        
        console.log('✅ Gmail OAuth tokens stored successfully!', insertResult);
      } catch (tokenError) {
        console.error('⚠️ Failed to store tokens:', tokenError);
        // Continue anyway - user can still use the app
      }
    }

    console.log('✅ Session exchange successful!')
    
    // For development, redirect to localhost instead of production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment ? 'http://localhost:3000' : requestUrl.origin;
    
    // Check if this was a Gmail connection flow
    const connectParam = requestUrl.searchParams.get('connect');
    if (connectParam === 'gmail') {
      console.log(`🔄 Gmail connection complete, initiating data processing...`);
      
      // Trigger background data processing
      try {
        await initiateDataProcessing(data.session.user.id);
        console.log(`✅ Data processing initiated for user ${data.session.user.id}`);
        return NextResponse.redirect(`${baseUrl}/dashboard?status=processing&connected=gmail`);
      } catch (processError) {
        console.error('⚠️ Failed to initiate data processing:', processError);
        return NextResponse.redirect(`${baseUrl}/dashboard?status=processing_failed&connected=gmail`);
      }
    }
    
    return NextResponse.redirect(`${baseUrl}${next}`)

  } catch (err) {
    console.error('❌ Callback error:', err)
    return NextResponse.redirect(`${requestUrl.origin}/login?error=server_error`)
  }
}

// Function to initiate background data processing
async function initiateDataProcessing(userId: string) {
  console.log(`🚀 Starting data processing for user: ${userId}`);
  
  // Store processing status
  const supabase = await createClient();
  try {
    await supabase
      .from('user_analytics_cache')
      .upsert({
        user_id: userId,
        provider: 'gmail',
        data: { 
          status: 'processing',
          started_at: new Date().toISOString(),
          message: 'Processing your Gmail data...'
        },
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes processing window
      });
      
    console.log('✅ Processing status stored');
  } catch (statusError) {
    console.error('⚠️ Failed to store processing status:', statusError);
  }
  
  // Trigger immediate processing attempt (non-blocking)
  setImmediate(async () => {
    try {
      console.log(`📊 Processing Gmail data for user ${userId}...`);
      
      // Use the same analytics API that the dashboard uses
      const response = await fetch(`http://localhost:3000/api/analytics/gmail?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const analyticsData = await response.json();
        console.log(`✅ Data processing completed for user ${userId} - ${analyticsData.total_count} messages processed`);
        
        // Update status to completed
        await supabase
          .from('user_analytics_cache')
          .upsert({
            user_id: userId,
            provider: 'gmail',
            data: {
              ...analyticsData,
              status: 'completed',
              processed_at: new Date().toISOString()
            },
            cached_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour cache
          });
          
      } else {
        throw new Error(`Analytics API failed: ${response.status}`);
      }
    } catch (processingError) {
      console.error(`❌ Data processing failed for user ${userId}:`, processingError);
      
      // Update status to error
      await supabase
        .from('user_analytics_cache')
        .upsert({
          user_id: userId,
          provider: 'gmail',
          data: { 
            status: 'error',
            error: processingError instanceof Error ? processingError.message : 'Unknown error',
            failed_at: new Date().toISOString()
          },
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minute error cache
        });
    }
  });
}