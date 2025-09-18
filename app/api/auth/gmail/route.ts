import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('❌ Unauthorized access attempt to Gmail OAuth');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to connect Gmail' },
        { status: 401 }
      );
    }

    console.log('🔄 Initiating Gmail OAuth for user:', session.user.id);

    // Get redirect parameter from URL with fallback to dashboard
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get('redirect') || '/dashboard';

    // Validate redirect URL to prevent open redirects
    const safeRedirect = redirect.startsWith('/') ? redirect : '/dashboard';

    // Create OAuth2 client with environment variables
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`
    );

    // Define scopes for Gmail and Calendar access
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    // Create state parameter with additional security
    const state = Buffer.from(JSON.stringify({
      redirect: safeRedirect,
      account_type: 'personal',
      user_id: session.user.id,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 15)
    }), 'utf-8').toString('base64');

    // Generate authorization URL with additional security parameters
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
      state: encodeURIComponent(state),
      include_granted_scopes: true,
    });

    console.log('✅ Generated OAuth URL, redirecting user...');

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('❌ Gmail OAuth initiation error:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate Gmail connection',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'OAUTH_INITIATION_ERROR'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      } 
    });
  }
}
