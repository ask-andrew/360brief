import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function getGoogleConnectionStatus(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .limit(1);

  if (error || !data || data.length === 0) {
    return {
      connected: false,
      error: error?.message || 'No Google tokens found'
    };
  }

  return {
    connected: true,
    hasRefreshToken: !!data[0].refresh_token,
    expiresAt: data[0].expires_at
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    console.log(`🔍 Checking unified Gmail connection status for user: ${user.id}`);

    const status = await getGoogleConnectionStatus(user.id);

    return NextResponse.json({
      authenticated: status.connected,
      user_id: user.id,
      connection_details: status,
      message: status.connected
        ? 'Google account connected via unified OAuth'
        : 'No Google account connected'
    });

  } catch (error) {
    console.error('❌ Gmail status check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Failed to check Gmail connection'
    }, { status: 500 });
  }
}