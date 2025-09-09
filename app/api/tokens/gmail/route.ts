import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({
        error: 'Missing user_id parameter'
      }, { status: 400 });
    }

    // Create Supabase client with service role key for server-to-server access
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; },
          set() {},
          remove() {},
        },
      }
    );

    // Get the latest Gmail tokens for the user
    const { data: tokens, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error fetching tokens:', error);
      return NextResponse.json({
        error: 'No tokens found',
        authenticated: false
      }, { status: 404 });
    }

    if (!tokens) {
      return NextResponse.json({
        error: 'No Gmail tokens found for user',
        authenticated: false
      }, { status: 404 });
    }

    // Check if token is expired
    const now = Date.now() / 1000;
    const isExpired = tokens.expires_at && tokens.expires_at < now;

    return NextResponse.json({
      authenticated: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      expired: isExpired,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata', 
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
      ]
    });

  } catch (error) {
    console.error('❌ Token API Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      authenticated: false
    }, { status: 500 });
  }
}