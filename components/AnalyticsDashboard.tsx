import React from 'react';
import { UnifiedBriefData } from '../services/unifiedDataService';

// Import components from the analytics-dash folder
import { DashboardCard } from '../analytics-dash/components/DashboardCard';
import { MeetingStatsCard } from '../analytics-dash/components/MeetingStatsCard';
import { TopContactsChart } from '../analytics-dash/components/charts/TopContactsChart';
import { MeetingTimeAllocationChart } from '../analytics-dash/components/charts/MeetingTimeAllocationChart';

// Simple stat card component for summary metrics
const StatCard = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-gray-700 p-4 rounded-lg">
    <p className="text-sm text-gray-300">{title}</p>
    <p className="text-xl font-bold text-white">{value}</p>
  </div>
);

// Define types for our analytics data
interface AnalyticsData {
  email: {
    waitingForReply: Array<{
      id: string;
      subject: string;
      from: string;
      date: string;
      snippet: string;
      threadId: string;
    }>;
  };
  meetingStats?: {
    total: number;
    duration: number;
    withActionItems: number;
  };
  timeAllocation?: Record<string, number>;
  volume?: Array<{ date: string; received: number; sent: number }>;
  topContacts?: Array<{
    name: string;
    email: number; // Changed to number for chart compatibility
    count: number;
    lastContact: string;
    slack: number;
    meetings: number;
  }>;
  overview?: {
    emailStats: {
      received: number;
      sent: number;
      unread: number;
      pendingReply: number;
      avgResponseTime: number;
    };
    meetingStats: {
      avgDuration: {
        value: number;
        trend: string;
        trendDirection: 'up' | 'down';
      };
      totalHours: {
        value: number;
        trend: string;
        trendDirection: 'up' | 'down';
      };
      meetingsPerWeek: {
        value: number;
        trend: string;
        trendDirection: 'up' | 'down';
      };
    };
  };
};

// Simple table component to avoid type conflicts
const SimpleTable = ({ columns, data }: { columns: { header: string; key: string }[]; data: Record<string, any>[] }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-700">
      <thead className="bg-gray-800">
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-gray-900 divide-y divide-gray-700">
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column) => (
              <td key={`${rowIndex}-${column.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface AnalyticsDashboardProps {
  data: UnifiedBriefData;
}

// Helper function to transform our data to match the analytics dashboard's expected format
const transformDataForAnalytics = (data: UnifiedBriefData): AnalyticsData => {
  // Handle case where data might be undefined
  if (!data) {
    return {
      email: { waitingForReply: [] },
      meetingStats: undefined,
      timeAllocation: undefined,
      volume: undefined,
      topContacts: undefined,
      overview: undefined
    };
  }

  // Transform waiting for reply emails
  const waitingForReply = data.emailAnalytics?.pendingResponses?.map(email => ({
    id: email.id || '',
    subject: email.subject || '(No subject)',
    from: email.from || 'Unknown',
    date: email.received || new Date().toISOString(),
    snippet: email.snippet || '',
    threadId: email.threadId || ''
  })) || [];

  // Transform top contacts
  const topContacts = data.emailAnalytics?.topSenders?.map(sender => ({
    name: sender.name || sender.email?.split('@')[0] || 'Unknown',
    email: sender.email || '',
    count: sender.count || 0,
    lastContact: new Date().toISOString()
  })) || [];

  // Transform time allocation data
  const timeAllocation = data.meetingAnalytics?.recentMeetings?.reduce<Record<string, number>>((acc, meeting) => {
    const category = meeting?.title?.split(' ')[0] || 'Other';
    const duration = meeting?.duration || 30; // Default to 30 minutes if not available
    acc[category] = (acc[category] || 0) + duration;
    return acc;
  }, {}) || {};

  // Transform email volume data
  const volume = data.emailAnalytics?.volumeOverTime?.map(item => ({
    date: item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    received: item?.received || 0,
    sent: item?.sent || 0
  })) || [];

  const result: AnalyticsData = {
    email: {
      waitingForReply
    },
    meetingStats: data.overview?.meetingStats ? {
      total: data.overview.meetingStats.total || 0,
      duration: data.overview.meetingStats.duration || 0,
      withActionItems: data.overview.meetingStats.withActionItems || 0
    } : undefined,
    timeAllocation: Object.keys(timeAllocation).length > 0 ? timeAllocation : undefined,
    volume: volume.length > 0 ? volume : undefined,
    topContacts: topContacts.length > 0 ? topContacts.map(contact => ({
      name: contact.name || 'Unknown',
      email: 0, // Using count as email for the chart
      count: contact.count || 0,
      lastContact: contact.lastContact || '',
      slack: 0,
      meetings: 0
    })) : undefined,
    overview: data.overview ? {
      emailStats: {
        received: data.overview.emailStats?.received || 0,
        sent: data.overview.emailStats?.sent || 0,
        unread: data.overview.emailStats?.unread || 0,
        pendingReply: data.overview.emailStats?.pendingReply || 0,
        avgResponseTime: data.overview.emailStats?.avgResponseTime || 0
      },
      meetingStats: {
        // Transform meeting stats to match the MeetingStats interface
        avgDuration: {
          value: data.overview.meetingStats?.duration || 0, // Using duration as avgDuration value
          trend: '0%', // Default trend value
          trendDirection: 'up' as const
        },
        totalHours: {
          value: data.overview.meetingStats?.duration || 0, // Using duration as totalHours value
          trend: '0%', // Default trend value
          trendDirection: 'up' as const
        },
        meetingsPerWeek: {
          value: data.overview.meetingStats?.total || 0, // Using total as meetingsPerWeek value
          trend: '0%', // Default trend value
          trendDirection: 'up' as const
        }
      }
    } : undefined
  };
  
  return result;
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  if (!data) {
    return <div className="p-4 text-gray-400">Loading analytics data...</div>;
  }
  
  const analyticsData = transformDataForAnalytics(data);
  
  // Table columns
  const waitingForReplyColumns = [
    { header: 'Subject', key: 'subject' },
    { header: 'From', key: 'from' },
    { header: 'Date', key: 'date' }
  ];

  // Transform data for the table
  const waitingForReplyData = analyticsData.email.waitingForReply.map((item) => ({
    subject: item.subject || '(No subject)',
    from: item.from || 'Unknown',
    date: item.date ? new Date(item.date).toLocaleDateString() : 'Unknown date'
  }));

  // Transform top contacts data for the chart
  const topContactsData = analyticsData.topContacts?.map(contact => {
    // Safely handle email extraction with type assertion
    const contactEmail = contact.email as unknown;
    let name = 'Unknown';
    
    if (contact.name) {
      name = contact.name;
    } else if (typeof contactEmail === 'string') {
      if (contactEmail.includes('@')) {
        name = contactEmail.split('@')[0];
      } else {
        name = contactEmail;
      }
    }
    
    return {
      name,
      email: 0, // Using count as email for the chart
      count: contact.count || 0,
      lastContact: contact.lastContact || '',
      slack: 0, // Not currently tracked
      meetings: 0 // Not currently tracked
    };
  }) || [];

  // Transform time allocation data for the chart
  const timeAllocationData = analyticsData.timeAllocation 
    ? Object.entries(analyticsData.timeAllocation).map(([name, value]) => ({
        name,
        value: Number(value) || 0
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Action Center */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Action Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard title="Waiting For Reply" contentClassName="h-56 overflow-y-auto">
            <SimpleTable 
              columns={waitingForReplyColumns}
              data={waitingForReplyData}
            />
          </DashboardCard>
          <DashboardCard title="Meeting Overview" contentClassName="h-56">
            <MeetingStatsCard stats={analyticsData.overview?.meetingStats} />
          </DashboardCard>
        </div>
      </section>

      {/* Email Summary */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Email Summary</h2>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Email Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {analyticsData.overview?.emailStats ? (
              <>
                <StatCard title="Received" value={analyticsData.overview.emailStats.received.toString()} />
                <StatCard title="Sent" value={analyticsData.overview.emailStats.sent.toString()} />
                <StatCard title="Unread" value={analyticsData.overview.emailStats.unread.toString()} />
                <StatCard title="Pending Reply" value={analyticsData.overview.emailStats.pendingReply.toString()} />
                <StatCard title="Avg. Response Time" value={`${analyticsData.overview.emailStats.avgResponseTime}h`} />
              </>
            ) : (
              <p className="text-gray-400 col-span-3">No summary data available</p>
            )}
          </div>
        </div>
      </section>

      {/* Email Analytics */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Email Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard title="Waiting for Reply" contentClassName="h-80">
            <SimpleTable 
              columns={waitingForReplyColumns} 
              data={waitingForReplyData} 
            />
          </DashboardCard>
          <DashboardCard title="Top Contacts" contentClassName="h-80">
            {topContactsData.length > 0 ? (
              <TopContactsChart data={topContactsData} />
            ) : (
              <p className="text-gray-400">No contact data available</p>
            )}
          </DashboardCard>
        </div>
      </section>

      {/* Meeting Analytics */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Meeting Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard title="Time Allocation" contentClassName="h-80">
            {timeAllocationData.length > 0 ? (
              <MeetingTimeAllocationChart data={timeAllocationData} />
            ) : (
              <p className="text-gray-400">No time allocation data available</p>
            )}
          </DashboardCard>
          <DashboardCard title="Meeting Stats" contentClassName="h-80">
            {analyticsData.meetingStats ? (
              <div className="space-y-4">
                <p>Total Meetings: {analyticsData.meetingStats.total}</p>
                <p>Total Duration: {analyticsData.meetingStats.duration} minutes</p>
                <p>Meetings with Action Items: {analyticsData.meetingStats.withActionItems}</p>
              </div>
            ) : (
              <p className="text-gray-400">No meeting data available</p>
            )}
          </DashboardCard>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
