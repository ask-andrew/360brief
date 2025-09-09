import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Test NextJS analytics endpoints (no Python service dependency)
    console.log('🧪 Testing NextJS analytics endpoints...');
    
    const baseUrl = req.url.includes('localhost') ? 'http://localhost:3000' : 'https://360brief.com';
    
    // Test main analytics endpoint
    const analyticsResponse = await fetch(`${baseUrl}/api/analytics?use_real_data=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = {
      nextjs_analytics_ok: analyticsResponse.ok,
      analytics_status: analyticsResponse.status,
      analytics_status_text: analyticsResponse.statusText,
    };

    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      
      // Test priority messages endpoint
      const priorityResponse = await fetch(`${baseUrl}/api/analytics/priority-messages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Test network endpoint
      const networkResponse = await fetch(`${baseUrl}/api/analytics/network`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      return NextResponse.json({
        ...responseData,
        success: true,
        total_count: analyticsData.total_count || 0,
        has_priority_messages: !!analyticsData.priority_messages,
        awaiting_my_reply_count: analyticsData.priority_messages?.awaiting_my_reply?.length || 0,
        awaiting_their_reply_count: analyticsData.priority_messages?.awaiting_their_reply?.length || 0,
        sample_message: analyticsData.priority_messages?.awaiting_my_reply?.[0]?.subject || 'No messages',
        data_source: analyticsData.dataSource,
        endpoints_tested: {
          analytics: analyticsResponse.ok,
          priority_messages: priorityResponse.ok,
          network: networkResponse.ok
        },
        message: 'NextJS analytics endpoints are working! Python service bypassed successfully.'
      });
    }

    return NextResponse.json({
      ...responseData,
      success: false,
      message: 'NextJS analytics endpoint not responding correctly'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to connect to NextJS analytics endpoints'
    });
  }
}