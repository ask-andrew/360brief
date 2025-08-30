import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_API_BASE = 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${ANALYTICS_API_BASE}/network`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Network API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Network API Error:', error);
    
    return NextResponse.json({
      nodes: [],
      connections: [],
      error: 'Network data service unavailable'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}