import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    // Get stored Gmail tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, expires_at, scope, created_at, updated_at')
      .eq('user_id', session.user.id)
      .eq('provider', 'google')
      .single();

    return NextResponse.json({
      authenticated: true,
      user_id: session.user.id,
      user_email: session.user.email,
      gmail_tokens_stored: !!tokenData,
      token_expires: tokenData?.expires_at,
      token_length: tokenData?.access_token?.length,
      token_scope: tokenData?.scope,
      token_created: tokenData?.created_at,
      token_updated: tokenData?.updated_at,
      token_error: tokenError?.message,
      has_refresh_token: !!tokenData?.refresh_token
    });
  } catch (error) {
    console.error('[Gmail Status] Error:', error);
    return NextResponse.json({
      error: 'Failed to check Gmail status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}