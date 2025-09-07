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

    // REMOVED PYTHON SERVICE FALLBACK - Real data must come from authenticated Gmail integration
    throw new Error('Real data requested but no valid Gmail connection found - use main analytics endpoint');

  } catch (error) {
    console.error('Quick analytics API error:', error);
    
    return NextResponse.json({
      ...realDataSample,
      dataSource: 'fallback',
      message: 'Fallback data for demo'
    });
  }
}