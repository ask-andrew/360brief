import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test auth endpoint called');
    
    // Check if we have cookies
    console.log('🔍 Cookies:', {
      hasCookieHeader: !!request.headers.get('cookie'),
      cookiePreview: request.headers.get('cookie')?.substring(0, 100)
    });
    
    // Try to create Supabase client
    const supabase = await createClient();
    console.log('🔍 Supabase client created');
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 User query result:', { 
      hasUser: !!user, 
      userId: user?.id,
      userError: userError?.message 
    });
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authenticated user',
        userError: userError?.message 
      });
    }
    
    // Try to get tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, expires_at, provider')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .limit(1);
    
    console.log('🔍 Token query result:', { 
      hasTokens: !!tokens, 
      tokenCount: tokens?.length || 0,
      tokenError: tokenError?.message,
      provider: tokens?.[0]?.provider 
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      tokens: {
        found: !!tokens?.[0],
        provider: tokens?.[0]?.provider,
        hasAccessToken: !!tokens?.[0]?.access_token,
        expiresAt: tokens?.[0]?.expires_at
      }
    });
    
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}