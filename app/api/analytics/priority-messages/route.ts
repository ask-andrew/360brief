import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_API_BASE = process.env.ANALYTICS_API_BASE || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${ANALYTICS_API_BASE}/priority-messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Priority Messages API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute (more frequent updates)
      },
    });
  } catch (error) {
    console.error('Priority Messages API Error:', error);
    
    return NextResponse.json({
      awaiting_my_reply: [],
      awaiting_their_reply: [],
      error: 'Priority messages service unavailable'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}