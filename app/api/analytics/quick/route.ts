import { NextRequest, NextResponse } from 'next/server';

// Cached successful analytics data from Python service  
let cachedRealData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Sample data that looks like real data for demo
const realDataSample = {
  "total_count": 49,
  "inbound_count": 31,
  "outbound_count": 18,
  "avg_response_time_minutes": 147,
  "missed_messages": 2,
  "focus_ratio": 72,
  "external_percentage": 38,
  "internal_percentage": 62,
  "top_projects": [
    {"name": "Product Launch", "messageCount": 12, "type": "project"},
    {"name": "Q4 Planning", "messageCount": 8, "type": "project"}, 
    {"name": "Team Updates", "messageCount": 6, "type": "project"}
  ],
  "reconnect_contacts": [
    {"name": "Sarah Chen", "role": "Product Manager", "days": 18, "email": "sarah.chen@company.com"},
    {"name": "Mike Rodriguez", "role": "Engineering Lead", "days": 22, "email": "mike@company.com"},
    {"name": "Jessica Wang", "role": "Design Lead", "days": 15, "email": "jessica@company.com"}
  ],
  "recent_trends": {
    "messages": {"change": 8, "direction": "up"},
    "response_time": {"change": -12, "direction": "down"},
    "meetings": {"change": 15, "direction": "up"}
  },
  "sentiment_analysis": {
    "positive": 74,
    "neutral": 18, 
    "negative": 8,
    "overall_trend": "positive"
  },
  "priority_messages": {
    "awaiting_my_reply": [
      {
        "id": "real_1",
        "sender": "Andrew Chen",
        "subject": "Q4 Budget Review - Need Your Input",
        "channel": "email",
        "timestamp": "3 hours ago",
        "priority": "high",
        "link": "/messages/real_1"
      },
      {
        "id": "real_2", 
        "sender": "Product Team",
        "subject": "Launch timeline questions",
        "channel": "slack",
        "timestamp": "5 hours ago",
        "priority": "high",
        "link": "/messages/real_2"
      }
    ],
    "awaiting_their_reply": [
      {
        "id": "real_3",
        "sender": "Client Success Team",
        "subject": "Customer feedback discussion",
        "channel": "email", 
        "timestamp": "2 hours ago",
        "priority": "medium",
        "link": "/messages/real_3"
      }
    ]
  },
  "channel_analytics": {
    "by_channel": [
      {"name": "Email", "count": 31, "percentage": 63},
      {"name": "Slack", "count": 12, "percentage": 24},
      {"name": "Teams", "count": 4, "percentage": 8},
      {"name": "Calendar", "count": 2, "percentage": 5}
    ],
    "by_time": [
      {"hour": "9AM", "count": 4},
      {"hour": "10AM", "count": 7}, 
      {"hour": "11AM", "count": 9},
      {"hour": "12PM", "count": 5},
      {"hour": "1PM", "count": 3},
      {"hour": "2PM", "count": 8},
      {"hour": "3PM", "count": 7},
      {"hour": "4PM", "count": 6}
    ]
  },
  "network_data": {
    "nodes": [
      {"id": "product-launch", "name": "Product Launch", "type": "project", "messageCount": 12, "connections": 4},
      {"id": "q4-planning", "name": "Q4 Planning", "type": "project", "messageCount": 8, "connections": 3},
      {"id": "team-updates", "name": "Team Updates", "type": "topic", "messageCount": 6, "connections": 8}
    ],
    "connections": [
      {"source": "product-launch", "target": "team-updates"},
      {"source": "q4-planning", "target": "team-updates"}
    ]
  },
  "dataSource": "real",
  "lastUpdated": new Date().toISOString(),
  "gmailConnected": true
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const useRealData = searchParams.get('use_real_data') === 'true';
    
    if (!useRealData) {
      // Return sample data for demo mode
      return NextResponse.json({
        ...realDataSample,
        dataSource: 'demo'
      });
    }

    // Check if we have cached real data that's still valid
    const now = Date.now();
    if (cachedRealData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedRealData,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }
    
    // First try to get user from session for authenticated requests
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (user) {
      console.log('🔍 Quick analytics: User authenticated, trying real data');
    } else {
      console.log('🔍 Quick analytics: No authenticated user, will use fallback');
    }

    // Redirect real data requests to the main analytics endpoint which handles Gmail directly
    console.log('🔄 Redirecting real data request to main analytics endpoint');
    console.log('🔍 Quick endpoint debug:', {
      hasCookies: !!request.headers.get('cookie'),
      cookiePreview: request.headers.get('cookie')?.substring(0, 50) + '...',
      origin: request.nextUrl.origin
    });
    
    try {
      const origin = request.nextUrl.origin;
      
      // Forward all relevant headers to preserve authentication context
      const forwardHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      };
      
      // Forward authentication-related headers
      if (request.headers.get('cookie')) {
        forwardHeaders['Cookie'] = request.headers.get('cookie')!;
      }
      if (request.headers.get('authorization')) {
        forwardHeaders['Authorization'] = request.headers.get('authorization')!;
      }
      if (request.headers.get('user-agent')) {
        forwardHeaders['User-Agent'] = request.headers.get('user-agent')!;
      }
      
      console.log('🔄 Forwarding headers:', Object.keys(forwardHeaders));
      
      const response = await fetch(`${origin}/api/analytics?use_real_data=true`, {
        method: 'GET',
        headers: forwardHeaders,
      });

      if (response.ok) {
        const realData = await response.json();
        
        // Cache successful real data
        cachedRealData = realData;
        cacheTimestamp = now;
        
        return NextResponse.json({
          ...realData,
          dataSource: 'gmail_real',
          cached: false,
          message: `Real Gmail data: ${realData.processing_metadata?.message_count || 'N/A'} messages analyzed`
        });
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('❌ Main analytics endpoint failed:', errorData);
        throw new Error(errorData.error || 'Main analytics endpoint failed');
      }
    } catch (fetchError) {
      console.error('❌ Failed to fetch from main analytics endpoint:', fetchError);
      throw new Error(`Real Gmail data unavailable: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

  } catch (error) {
    console.error('Quick analytics API error:', error);
    
    return NextResponse.json({
      ...realDataSample,
      dataSource: 'fallback',
      message: 'Fallback data for demo'
    });
  }
}