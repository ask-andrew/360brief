import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test OAuth URL generation to see what scopes are included
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    // Check current environment variables
    const environment = {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_client_id: !!process.env.GOOGLE_CLIENT_ID,
      has_client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
      client_id_preview: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      site_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      node_env: process.env.NODE_ENV
    };

    // Parse OAuth URL to check scopes
    let oauthScopes = null;
    let redirectUri = null;
    if (data?.url) {
      try {
        const url = new URL(data.url);
        oauthScopes = url.searchParams.get('scope');
        redirectUri = url.searchParams.get('redirect_uri');
      } catch (e) {
        console.warn('Failed to parse OAuth URL:', e);
      }
    }

    return NextResponse.json({
      oauth_url: data?.url,
      oauth_error: error,
      oauth_scopes: oauthScopes,
      redirect_uri: redirectUri,
      environment,
      debug_info: {
        timestamp: new Date().toISOString(),
        gmail_scope_included: oauthScopes?.includes('gmail.readonly') || false,
        offline_access: oauthScopes?.includes('offline') || false
      }
    });
  } catch (error) {
    console.error('OAuth config debug error:', error);
    return NextResponse.json({
      error: 'Failed to generate OAuth config debug info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}