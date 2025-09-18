import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isDatabaseTimestampExpired } from '@/lib/utils/timestamp';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client and get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: 'User not authenticated'
      }, {
        status: 401,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Check if user has Gmail tokens in the database
    const { data: tokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !tokens) {
      return NextResponse.json({
        authenticated: false,
        error: 'No Gmail tokens found',
        requiresAuth: true
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Check if token is expired using database timestamp utility
    const isExpired = isDatabaseTimestampExpired(tokens.expires_at);

    if (isExpired) {
      return NextResponse.json({
        authenticated: false,
        error: 'Gmail tokens expired',
        requiresAuth: true,
        expired: true
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
    }

    return NextResponse.json({
      authenticated: true,
      user_id: user.id,
      email: user.email,
      expires_at: tokens.expires_at,
      scopes: tokens.scope ? tokens.scope.split(' ') : [],
      has_refresh_token: !!tokens.refresh_token
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('Gmail Status Error:', error);
    
    return NextResponse.json({
      authenticated: false,
      error: 'Internal server error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}