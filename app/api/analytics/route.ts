import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_API_BASE = process.env.ANALYTICS_API_BASE || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Forward the request to the Python analytics API with query params
    const apiUrl = queryString 
      ? `${ANALYTICS_API_BASE}/analytics?${queryString}`
      : `${ANALYTICS_API_BASE}/analytics`;
      
    console.log(`Fetching analytics from: ${apiUrl}`);
    
    // Check if Python service is available with quick timeout
    console.log(`🔄 Checking Python analytics service...`);
    
    const controller = new AbortController();
    const quickTimeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout for real data processing
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(quickTimeout);
    } catch (timeoutError) {
      clearTimeout(quickTimeout);
      // If timeout, return processing status immediately
      throw new Error('Service processing - returning status');
    }

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
    
    // Return processing status with more friendly message
    const processingStatus = {
      total_count: 0,
      inbound_count: 0,
      outbound_count: 0,
      processing: true,
      status: 'processing',
      message: 'Working on gathering your Gmail insights... This takes about 30-60 seconds.',
      progress: 'Analyzing your recent messages and creating personalized brief',
      estimated_time: '30-60 seconds',
      error: null,
      // Add some basic structure for dashboard display
      priority_messages: { awaiting_my_reply: [], awaiting_their_reply: [] },
      channel_analytics: { by_time: [], by_channel: [] },
      recent_trends: { messages: { change: 0, direction: 'up' } }
    };

    return NextResponse.json(processingStatus, {
      status: 202, // Accepted - processing
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}