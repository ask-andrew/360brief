import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_API_BASE = process.env.ANALYTICS_API_BASE || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Check if analytics service is configured
    if (!process.env.ANALYTICS_API_BASE) {
      return NextResponse.json({
        error: 'Gmail integration not available',
        message: 'Analytics service not configured for this environment'
      }, {
        status: 503,
      });
    }

    // Get OAuth2 authorization URL from Python backend
    const response = await fetch(`${ANALYTICS_API_BASE}/auth/gmail/authorize`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail auth service responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Redirect user to Google OAuth2 consent screen
    return NextResponse.redirect(data.auth_url);
    
  } catch (error) {
    console.error('Gmail Authorization Error:', error);
    
    return NextResponse.json({
      error: 'Failed to initiate Gmail authorization',
      message: error instanceof Error ? error.message : 'Analytics service unavailable'
    }, {
      status: 503,
    });
  }
}