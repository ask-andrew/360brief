import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_API_BASE = 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the Python analytics API
    const response = await fetch(`${ANALYTICS_API_BASE}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Analytics API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    
    // Return fallback mock data if the API is unavailable
    const fallbackData = {
      total_count: 0,
      inbound_count: 0,
      outbound_count: 0,
      avg_response_time_minutes: 0,
      missed_messages: 0,
      focus_ratio: 0,
      external_percentage: 0,
      internal_percentage: 0,
      top_projects: [],
      reconnect_contacts: [],
      recent_trends: {
        messages: { change: 0, direction: "up" as const },
        response_time: { change: 0, direction: "down" as const },
        meetings: { change: 0, direction: "up" as const }
      },
      sentiment_analysis: {
        positive: 0,
        neutral: 0,
        negative: 0,
        overall_trend: "neutral" as const
      },
      priority_messages: {
        awaiting_my_reply: [],
        awaiting_their_reply: []
      },
      channel_analytics: {
        by_channel: [],
        by_time: []
      },
      network_data: {
        nodes: [],
        connections: []
      },
      error: 'Analytics service unavailable'
    };

    return NextResponse.json(fallbackData, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}