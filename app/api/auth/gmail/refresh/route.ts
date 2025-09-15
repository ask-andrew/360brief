import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTokenManager } from '@/lib/gmail/token-manager';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client and get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'User not authenticated'
      }, {
        status: 401,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
    }

    console.log(`🔄 Refreshing Gmail tokens for user ${user.id}`);

    // Get the token manager and refresh tokens
    const tokenManager = getTokenManager();

    // First check if we have tokens to refresh
    const { data: existingTokens, error: fetchError } = await supabase
      .from('user_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (fetchError || !existingTokens?.refresh_token) {
      return NextResponse.json({
        error: 'No refresh token found',
        requiresAuth: true
      }, {
        status: 400,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Attempt to refresh the token
    const refreshedTokens = await tokenManager.refreshToken(
      user.id,
      existingTokens.refresh_token
    );

    // Check the refreshed token status
    const status = await tokenManager.checkTokenStatus(user.id);

    return NextResponse.json({
      success: true,
      user_id: user.id,
      email: user.email,
      expires_at: refreshedTokens.expires_at,
      status: status
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('❌ Gmail Token Refresh Error:', error);

    // Handle specific refresh errors
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant') || error.message.includes('Token has been expired or revoked')) {
        return NextResponse.json({
          error: 'Refresh token invalid or expired',
          requiresAuth: true
        }, {
          status: 401,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    return NextResponse.json({
      error: 'Failed to refresh token',
      message: error instanceof Error ? error.message : 'Internal server error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}