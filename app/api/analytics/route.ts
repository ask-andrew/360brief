import { NextResponse } from 'next/server';

// Different mock data for the API to show the toggle is working
const realAnalyticsData = {
  total_count: 2500,
  inbound_count: 1500,
  outbound_count: 1000,
  avg_response_time_minutes: 90,
  missed_messages: 2,
  focus_ratio: 75,
  external_percentage: 40,
  internal_percentage: 60,
  top_projects: [
    { name: 'Project Phoenix', messageCount: 120 },
    { name: 'Q3 Roadmap', messageCount: 80 },
    { name: 'New Client Proposal', messageCount: 50 }
  ],
  reconnect_contacts: [
    { name: 'Samantha Green', role: 'Lead Developer', days: 25, email: 'samantha@example.com' },
    { name: 'Ben Carter', role: 'UX Designer', days: 30, email: 'ben@example.com' },
    { name: 'Olivia White', role: 'Project Manager', days: 28, email: 'olivia@example.com' }
  ],
  recent_trends: {
    messages: { change: 15, direction: 'up' as const },
    response_time: { change: -10, direction: 'down' as const },
    meetings: { change: 5, direction: 'up' as const }
  },
  sentiment_analysis: {
    positive: 75,
    neutral: 20,
    negative: 5,
    overall_trend: 'positive' as const
  },
  priority_messages: {
    awaiting_my_reply: [
      {
        id: '1',
        sender: 'John Doe',
        subject: 'Urgent: Action Required',
        channel: 'email',
        timestamp: '1 hour ago',
        priority: 'high' as const,
        link: '/messages/4'
      }
    ],
    awaiting_their_reply: []
  },
  channel_analytics: {
    by_channel: [
      { name: 'Email', count: 1000, percentage: 40 },
      { name: 'Slack', count: 800, percentage: 32 },
      { name: 'Teams', count: 500, percentage: 20 },
      { name: 'WhatsApp', count: 200, percentage: 8 }
    ],
    by_time: [
      { hour: '9AM', count: 120 },
      { hour: '10AM', count: 200 },
      { hour: '11AM', count: 250 },
      { hour: '12PM', count: 150 },
      { hour: '1PM', count: 100 },
      { hour: '2PM', count: 220 },
      { hour: '3PM', count: 300 },
      { hour: '4PM', count: 250 }
    ]
  },
  network_data: {
    nodes: [
      { id: 'project-phoenix', name: 'Project Phoenix', type: 'project', messageCount: 300, connections: 10 },
      { id: 'q3-roadmap', name: 'Q3 Roadmap', type: 'project', messageCount: 250, connections: 8 },
      { id: 'new-client-proposal', name: 'New Client Proposal', type: 'project', messageCount: 200, connections: 15 },
      { id: 'internal-sync', name: 'Internal Sync', type: 'topic', messageCount: 150, connections: 20 }
    ],
    connections: [
      { source: 'project-phoenix', target: 'internal-sync' },
      { source: 'q3-roadmap', target: 'internal-sync' },
      { source: 'new-client-proposal', target: 'internal-sync' }
    ]
  }
};

export async function GET() {
  console.log('/api/analytics endpoint hit');
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('Returning analytics data');
  return NextResponse.json(realAnalyticsData);
}
