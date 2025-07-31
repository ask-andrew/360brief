
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DashboardCard } from './components/DashboardCard';
import { UnifiedCommunicationChart } from './components/charts/UnifiedCommunicationChart';
import { TopContactsChart } from './components/charts/TopContactsChart';
import { VolumeTrendChart } from './components/charts/VolumeTrendChart';
import { ActivityByHourChart } from './components/charts/ActivityByHourChart';
import { MeetingTimeAllocationChart } from './components/charts/MeetingTimeAllocationChart';
import { DataTable } from './components/tables/DataTable';
import { generateMockData } from './services/mockData';
import { processData } from './services/dataProcessor';
import type { ProcessedData, DataTableColumn, TopPartnerDataPoint } from './types';
import { MeetingStatsCard } from './components/MeetingStatsCard';
import { SentimentByTopicChart } from './components/charts/SentimentByTopicChart';
import { SentimentHeatmap } from './components/charts/SentimentHeatmap';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
            active
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
    >
        {children}
    </button>
);


const App: React.FC = () => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTopicTab, setActiveTopicTab] = useState<'sent' | 'received'>('received');
  const [activeHeatmapTab, setActiveHeatmapTab] = useState<'sent' | 'received'>('sent');


  useEffect(() => {
    // Simulate data fetching and processing
    const mockData = generateMockData();
    const data = processData(mockData);
    setProcessedData(data);
    setLoading(false);
  }, []);

  const waitingForReplyColumns: DataTableColumn<ProcessedData['email']['waitingForReply'][0]>[] = useMemo(() => [
    { header: 'Subject', accessor: 'subject', sortable: true },
    { header: 'To', accessor: 'to', sortable: true },
    { header: 'Last Sent', accessor: 'sent', sortable: true }
  ], []);

  const unrepliedThreadsColumns: DataTableColumn<ProcessedData['email']['unrepliedThreads'][0]>[] = useMemo(() => [
    { header: 'Subject', accessor: 'subject', sortable: true },
    { header: 'From', accessor: 'from', sortable: true },
    { header: 'Last Received', accessor: 'received', sortable: true }
  ], []);
  
  const topPartnersColumns: DataTableColumn<TopPartnerDataPoint>[] = useMemo(() => [
      { header: 'Contact', accessor: 'contact', sortable: true },
      { header: 'Total', accessor: 'total', sortable: true },
      { header: 'Emails', accessor: 'email', sortable: true },
      { header: 'Slack', accessor: 'slack', sortable: true },
      { header: 'Meetings', accessor: 'meetings', sortable: true }
  ], []);
  
  const reciprocityColumns: DataTableColumn<ProcessedData['relationships']['reciprocity'][0]>[] = useMemo(() => [
      { header: 'Contact', accessor: 'contact', sortable: true },
      { header: 'Sent : Received', accessor: 'ratio', sortable: true }
  ], []);

  if (loading || !processedData) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-2xl">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="mt-6">
        {/* Section I: Action Center */}
        <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Action Center</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard title="Waiting For Reply" contentClassName="h-56">
                    <DataTable columns={waitingForReplyColumns} data={processedData.email.waitingForReply} initialSortConfig={{key: 'sent', direction: 'descending'}}/>
                </DashboardCard>
                <DashboardCard title="Needs Your Reply" contentClassName="h-56">
                    <DataTable columns={unrepliedThreadsColumns} data={processedData.email.unrepliedThreads} initialSortConfig={{key: 'received', direction: 'descending'}}/>
                </DashboardCard>
            </div>
        </section>


        {/* Section II: Executive Pulse */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Executive Pulse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard title="Communication Pulse (Last 30 Days)">
               <UnifiedCommunicationChart data={processedData.summary.communicationPulse} />
            </DashboardCard>
            <DashboardCard title="Top 5 Engaged Contacts" className="lg:col-span-2">
              <TopContactsChart data={processedData.summary.topContacts} />
            </DashboardCard>
            <MeetingStatsCard stats={processedData.summary.meetingStats} />
          </div>
        </section>

         {/* Section III: Relationship & Meeting Insights */}
        <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Relationship & Meeting Insights</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <DashboardCard title="Top 10 Partners by Channel" contentClassName="h-80">
                        <DataTable columns={topPartnersColumns} data={processedData.relationships.topPartners} initialSortConfig={{key: 'total', direction: 'descending'}} />
                    </DashboardCard>
                     <DashboardCard title="Communication Reciprocity" contentClassName="h-80">
                         <DataTable columns={reciprocityColumns} data={processedData.relationships.reciprocity} initialSortConfig={{key: 'contact', direction: 'ascending'}} />
                    </DashboardCard>
                </div>
                <DashboardCard title="Time in Meetings by Type">
                    <MeetingTimeAllocationChart data={processedData.meetings.timeAllocation} />
                </DashboardCard>
            </div>
        </section>

        {/* Section IV: Productivity & Volume Trends */}
        <section className="mb-8">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Productivity & Volume Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardCard title="Your Outbound Activity by Hour">
                    <ActivityByHourChart data={processedData.summary.activityByHour} />
                </DashboardCard>
                <DashboardCard title="Email Volume (Sent vs. Received)">
                    <VolumeTrendChart data={processedData.email.volume} sentKey="sent" receivedKey="received" />
                </DashboardCard>
                <DashboardCard title="Slack Activity (DMs vs. Channels)">
                        <VolumeTrendChart data={processedData.slack.volume} sentKey="dm" receivedKey="channel" areaChart={true} />
                </DashboardCard>
            </div>
        </section>

        {/* Section V: Sentiment Analysis */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Sentiment Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="Top Topics by Sentiment" contentClassName="h-96">
                <div className="flex flex-col h-full">
                    <div className="flex justify-center space-x-2 mb-4">
                        <TabButton active={activeTopicTab === 'sent'} onClick={() => setActiveTopicTab('sent')}>Sent</TabButton>
                        <TabButton active={activeTopicTab === 'received'} onClick={() => setActiveTopicTab('received')}>Received</TabButton>
                    </div>
                    <div className="flex-grow overflow-hidden">
                        {activeTopicTab === 'sent' && (
                           <SentimentByTopicChart data={processedData.sentimentAnalysis.sentTopics} />
                        )}
                        {activeTopicTab === 'received' && (
                            <SentimentByTopicChart data={processedData.sentimentAnalysis.receivedTopics} />
                        )}
                    </div>
                </div>
            </DashboardCard>
            <DashboardCard title="Communication Temperature" contentClassName="h-96">
                <div className="flex flex-col h-full">
                    <div className="flex justify-center space-x-2 mb-4">
                        <TabButton active={activeHeatmapTab === 'sent'} onClick={() => setActiveHeatmapTab('sent')}>Sent</TabButton>
                        <TabButton active={activeHeatmapTab === 'received'} onClick={() => setActiveHeatmapTab('received')}>Received</TabButton>
                    </div>
                    <div className="flex-grow overflow-hidden">
                        {activeHeatmapTab === 'sent' && (
                            <SentimentHeatmap data={processedData.sentimentAnalysis.sentHeatmap} />
                        )}
                        {activeHeatmapTab === 'received' && (
                            <SentimentHeatmap data={processedData.sentimentAnalysis.receivedHeatmap} />
                        )}
                    </div>
                </div>
            </DashboardCard>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
