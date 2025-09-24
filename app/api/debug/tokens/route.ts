import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user tokens from database
    const { data: tokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('provider, expires_at, updated_at')
      .eq('user_id', user.id);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    // Get user metadata (which may contain refresh tokens)
    const metadata = user.user_metadata || {};

    // Create debug info without exposing actual tokens
    const debugInfo = {
      user_id: user.id,
      email: user.email,
      tokens_in_db: tokens?.length || 0,
      token_providers: tokens?.map(t => t.provider) || [],
      token_statuses: tokens?.map(t => ({
        provider: t.provider,
        expires_at: t.expires_at,
        updated_at: t.updated_at,
        is_expired: t.expires_at ? new Date(t.expires_at) < new Date() : false
      })) || [],
      has_google_refresh_token: !!metadata.google_refresh_token,
      metadata_keys: Object.keys(metadata),
      last_sign_in: user.last_sign_in_at
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug tokens error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}