import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/server/google/client';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ Gmail OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard?auth=error&message=' + encodeURIComponent(error), request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard?auth=error&message=' + encodeURIComponent('No authorization code received'), request.url)
      );
    }

    console.log('🔄 Gmail callback received code, exchanging for tokens...');

    // Exchange code for tokens using direct Next.js implementation
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Invalid tokens received from Google');
    }

    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('🔄 Storing Gmail tokens in Supabase...');

    // Store tokens in Supabase (upsert to handle duplicates)  
    // Fix: Database expects bigint (Unix timestamp in seconds), not TIMESTAMPTZ
    const expiresAt = tokens.expiry_date 
      ? Math.floor(tokens.expiry_date / 1000)  // Convert milliseconds to seconds
      : null;
    
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      }, {
        onConflict: 'user_id,provider'
      });

    if (tokenError) {
      console.error('❌ Failed to store Gmail tokens:', tokenError);
      throw new Error('Failed to store Gmail tokens');
    }

    console.log('✅ Gmail tokens stored successfully');
    
    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL('/dashboard?auth=success&message=' + encodeURIComponent('Gmail connected successfully!'), request.url)
    );
    
  } catch (error) {
    console.error('❌ Gmail Callback Error:', error);
    
    return NextResponse.redirect(
      new URL('/dashboard?auth=error&message=' + encodeURIComponent(
        error instanceof Error ? error.message : 'Gmail connection failed'
      ), request.url)
    );
  }
}