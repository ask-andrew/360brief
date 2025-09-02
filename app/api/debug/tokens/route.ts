import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'No authenticated user', userError }, { status: 401 });
    }

    // Check if user_tokens table exists and what tokens we have
    const { data: tokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id);

    if (tokenError) {
      return NextResponse.json({ 
        error: 'Database query failed', 
        tokenError,
        user: { id: user.id, email: user.email }
      }, { status: 500 });
    }

    // Also check all tokens (for debugging)
    const { data: allTokens, error: allTokensError } = await supabase
      .from('user_tokens')
      .select('user_id, provider, created_at')
      .limit(5);

    return NextResponse.json({
      success: true,
      currentUser: {
        id: user.id,
        email: user.email
      },
      userTokens: tokens || [],
      allTokensSample: allTokens || [],
      counts: {
        userTokens: tokens?.length || 0,
        totalTokens: allTokens?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}