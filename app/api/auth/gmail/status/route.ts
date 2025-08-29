import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_API_BASE = 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${ANALYTICS_API_BASE}/auth/gmail/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Gmail status API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache', // Don't cache auth status
      },
    });
  } catch (error) {
    console.error('Gmail Status Error:', error);
    
    return NextResponse.json({
      authenticated: false,
      error: 'Gmail service unavailable'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}