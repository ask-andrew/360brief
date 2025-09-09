import { NextRequest, NextResponse } from 'next/server';

// Generate mock priority messages instead of relying on Python service
function generateMockPriorityMessages() {
  return {
    priority_messages: [
      {
        id: 1,
        subject: "Urgent: Product Launch Timeline Update",
        sender: "project.manager@company.com",
        priority: "high",
        importance_score: 0.95,
        snippet: "The product launch has been moved up by one week. Please review the updated timeline and confirm your deliverables.",
        received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        labels: ["urgent", "product-launch", "timeline"]
      },
      {
        id: 2,
        subject: "Client Meeting Reschedule - Tomorrow 2PM",
        sender: "client.relations@company.com",
        priority: "medium",
        importance_score: 0.78,
        snippet: "Client has requested to reschedule tomorrow's meeting to 2PM due to conflicting priorities.",
        received_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        labels: ["meeting", "client", "schedule-change"]
      },
      {
        id: 3,
        subject: "Security Alert: Review Required",
        sender: "security@company.com",
        priority: "high",
        importance_score: 0.88,
        snippet: "Unusual access patterns detected on the admin dashboard. Please review and confirm recent login activities.",
        received_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        labels: ["security", "alert", "admin"]
      }
    ],
    metadata: {
      total_count: 3,
      high_priority_count: 2,
      medium_priority_count: 1,
      generated_at: new Date().toISOString(),
      data_source: "nextjs_mock_priority_messages"
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement direct Gmail integration for priority message detection
    // For now, return mock data instead of relying on failing Python service
    console.log('📨 Using built-in NextJS mock priority messages');
    
    const data = generateMockPriorityMessages();
    
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