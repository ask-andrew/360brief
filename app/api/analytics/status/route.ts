import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_API_BASE = process.env.ANALYTICS_API_BASE || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Quick health check and status
    const healthResponse = await fetch(`${ANALYTICS_API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      
      return NextResponse.json({
        python_service: 'healthy',
        timestamp: healthData.timestamp,
        gmail_integration: 'available',
        recommended_flow: 'Use /api/analytics with ?use_real_data=true',
        quick_endpoint: '/api/analytics/quick for faster responses',
        status: 'ready',
        volume_limit: '100 messages (optimized for performance)'
      });
    }

    throw new Error('Python service not responding');

  } catch (error) {
    return NextResponse.json({
      python_service: 'unavailable',
      gmail_integration: 'fallback_mode',
      recommended_flow: 'Use demo data or quick endpoint',
      quick_endpoint: '/api/analytics/quick provides immediate fallback data',
      status: 'fallback_ready',
      message: 'Python service not available, using fallback data for demo'
    });
  }
}