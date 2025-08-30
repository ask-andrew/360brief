import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_API_BASE = 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Gmail OAuth error:', error);
      return NextResponse.redirect(
        new URL('/analytics?auth=error&message=' + encodeURIComponent(error), request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/analytics?auth=error&message=' + encodeURIComponent('No authorization code received'), request.url)
      );
    }

    // Exchange code for tokens via Python backend
    const response = await fetch(`${ANALYTICS_API_BASE}/auth/gmail/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        redirect_uri: `${request.nextUrl.origin}/api/auth/gmail/callback`
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      // Redirect to analytics with success message
      return NextResponse.redirect(
        new URL('/analytics?auth=success&message=' + encodeURIComponent('Gmail connected successfully!'), request.url)
      );
    } else {
      throw new Error(result.error || 'Token exchange failed');
    }
    
  } catch (error) {
    console.error('Gmail Callback Error:', error);
    
    return NextResponse.redirect(
      new URL('/analytics?auth=error&message=' + encodeURIComponent(
        error instanceof Error ? error.message : 'Gmail connection failed'
      ), request.url)
    );
  }
}