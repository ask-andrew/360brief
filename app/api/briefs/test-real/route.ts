import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Test direct Python service connection
    console.log('🧪 Testing Python service connection...');
    
    const analyticsResponse = await fetch('http://localhost:8000/analytics?use_real_data=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = {
      python_service_ok: analyticsResponse.ok,
      python_status: analyticsResponse.status,
      python_status_text: analyticsResponse.statusText,
    };

    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      
      return NextResponse.json({
        ...responseData,
        success: true,
        total_count: analyticsData.total_count,
        has_priority_messages: !!analyticsData.priority_messages,
        awaiting_my_reply_count: analyticsData.priority_messages?.awaiting_my_reply?.length || 0,
        awaiting_their_reply_count: analyticsData.priority_messages?.awaiting_their_reply?.length || 0,
        sample_message: analyticsData.priority_messages?.awaiting_my_reply?.[0]?.subject || 'No messages',
        data_source_from_python: analyticsData.dataSource,
        message: 'Real data from Python service is working!'
      });
    }

    return NextResponse.json({
      ...responseData,
      success: false,
      message: 'Python service not responding correctly'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to connect to Python service'
    });
  }
}