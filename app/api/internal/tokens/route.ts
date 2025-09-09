import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is an INTERNAL API endpoint only accessible from localhost
// Used by the Python analytics service to get tokens
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Security: Only allow access from localhost
  const host = request.headers.get('host');
  const forwarded = request.headers.get('x-forwarded-for');
  
  if (!host?.includes('localhost') && !host?.includes('127.0.0.1')) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [INTERNAL] Fetching tokens for user: ${userId}`);

    // Fetch Gmail tokens using service role key to bypass RLS
    const { data: tokens, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ [INTERNAL] Error fetching tokens:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log(`⚠️  [INTERNAL] No tokens found for user ${userId}`);
      return NextResponse.json(
        { error: 'No tokens found' },
        { status: 404 }
      );
    }

    const token = tokens[0];
    const now = Math.floor(Date.now() / 1000);
    const isExpired = token.expires_at && token.expires_at < now;

    console.log(`✅ [INTERNAL] Found tokens for user ${userId}, expired: ${isExpired}`);

    return NextResponse.json({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at,
      is_expired: isExpired,
      provider: token.provider
    });

  } catch (error) {
    console.error('❌ [INTERNAL] Token API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}