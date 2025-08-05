import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Tabs, Typography, Spin, Alert } from 'antd';
import {
  BarChartOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  MailOutlined,
  CalendarOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  CheckCircleOutlined,
  IssuesCloseOutlined,
} from '@ant-design/icons';

// Import components
import CommunicationPulse from '../components/analytics/metrics/CommunicationPulse';
import EngagementMetrics from '../components/analytics/metrics/EngagementMetrics';
import TimeAllocation from '../components/analytics/charts/TimeAllocation';
import NetworkGraph from '../components/analytics/charts/NetworkGraph';
import CommunicationVolume from '../components/analytics/charts/CommunicationVolume';
import { EnhancedActionCenter } from '../components/analytics/action/EnhancedActionCenter';
import { mockEnhancedData } from '../components/analytics/action/mockEnhancedData';
import DashboardDownload from '../components/common/DashboardDownload';

const { Title } = Typography;
const { TabPane } = Tabs;

// Mock data - in a real app, this would come from an API
const mockAnalyticsData = {
  // Pulse metrics
  total_count: 1247,
  inbound_count: 843,
  outbound_count: 404,
  avg_response_time_minutes: 127,
  
  // Engagement data
  email: {
    total_count: 843,
    inbound_count: 527,
    outbound_count: 316,
    avg_response_time_minutes: 145,
    engagement_by_contact: {
      'john.doe@example.com': 87,
      'jane.smith@example.com': 65,
      'team@company.com': 52,
      'alex.wong@example.com': 48,
      'sarah.johnson@example.com': 42,
    },
  },
  
  slack: {
    total_count: 287,
    inbound_count: 194,
    outbound_count: 93,
    avg_response_time_minutes: 23,
    engagement_by_contact: {
      'john.doe@example.com': 42,
      'jane.smith@example.com': 38,
      'alex.wong@example.com': 35,
      'team-engineering@company.com': 28,
      'sarah.johnson@example.com': 25,
    },
  },
  
  meeting: {
    total_meetings: 117,
    total_hours: 78.5,
    avg_duration_minutes: 40,
    meetings_by_type: {
      '1:1': 45,
      'Team Sync': 32,
      'Project Review': 22,
      'Client Call': 12,
      'Other': 6,
    },
    participant_stats: {
      avg_participants_per_meeting: 4.2,
      total_participants: 492,
    },
  },
  
  // Time series data
  volume_by_date: {
    '2023-01-01': 12,
    '2023-01-02': 18,
    '2023-01-03': 24,
    '2023-01-04': 15,
    '2023-01-05': 22,
    '2023-01-06': 30,
    '2023-01-07': 10,
  },
  
  // Network data
  network: {
    nodes: [
      { id: 'you', name: 'You', email: 'me@example.com', is_external: false },
      { id: 'john', name: 'John Doe', email: 'john.doe@example.com', is_external: false },
      { id: 'jane', name: 'Jane Smith', email: 'jane.smith@example.com', is_external: false },
      { id: 'alex', name: 'Alex Wong', email: 'alex.wong@example.com', is_external: false },
      { id: 'sarah', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', is_external: false },
      { id: 'client1', name: 'Client A', email: 'client@example.com', is_external: true },
      { id: 'client2', name: 'Client B', email: 'client2@example.com', is_external: true },
    ],
    links: [
      { source: 'you', target: 'john', weight: 87 },
      { source: 'you', target: 'jane', weight: 65 },
      { source: 'you', target: 'alex', weight: 83 },
      { source: 'you', target: 'sarah', weight: 67 },
      { source: 'you', target: 'client1', weight: 42 },
      { source: 'you', target: 'client2', weight: 35 },
      { source: 'john', target: 'jane', weight: 28 },
      { source: 'john', target: 'alex', weight: 15 },
      { source: 'jane', target: 'sarah', weight: 22 },
    ],
  },
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Simulate API fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you would fetch this from your API
        // const response = await fetch('/api/analytics');
        // const data = await response.json();
        
        // Using mock data for now
        setAnalyticsData(mockAnalyticsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading your analytics..." />
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="dashboard-container" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <Title level={2} style={{ margin: 0 }}>Communication Analytics</Title>
        <DashboardDownload dashboardRef={dashboardRef} />
      </div>
      
      {/* Action Center */}
      <EnhancedActionCenter data={mockEnhancedData} />
      
      {/* Communication Pulse */}
      <Card style={{ marginBottom: '24px' }}>
        <CommunicationPulse data={analyticsData} />
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ marginBottom: '24px' }}
      >
        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              Overview
            </span>
          }
          key="overview"
        >
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            {/* Email Metrics */}
            <Col xs={24} md={8}>
              <Card 
                title={
                  <span>
                    <MailOutlined /> Email
                  </span>
                }
                style={{ height: '100%' }}
              >
                <EngagementMetrics data={analyticsData.email} />
              </Card>
            </Col>

            {/* Slack Metrics */}
            <Col xs={24} md={8}>
              <Card 
                title={
                  <span>
                    <MessageOutlined /> Slack
                  </span>
                }
                style={{ height: '100%' }}
              >
                <EngagementMetrics data={analyticsData.slack} />
              </Card>
            </Col>

            {/* Meeting Metrics */}
            <Col xs={24} md={8}>
              <Card 
                title={
                  <span>
                    <CalendarOutlined /> Meetings
                  </span>
                }
                style={{ height: '100%' }}
              >
                <EngagementMetrics data={analyticsData.meeting} isMeeting />
              </Card>
            </Col>
          </Row>

          {/* Time Allocation Chart */}
          <Card 
            title={
              <span>
                <PieChartOutlined /> Time Allocation by Meeting Type
              </span>
            }
            style={{ marginTop: '24px' }}
          >
            <TimeAllocation data={analyticsData.meeting} />
          </Card>

          {/* Communication Volume */}
          <Card 
            title={
              <span>
                <AreaChartOutlined /> Communication Volume Over Time
              </span>
            }
            style={{ marginTop: '24px' }}
          >
            <CommunicationVolume data={{
              dates: Object.keys(analyticsData.volume_by_date),
              email: {
                inbound: [8, 12, 15, 9, 14, 20, 6],
                outbound: [4, 6, 9, 6, 8, 10, 4],
              },
              slack: {
                inbound: [5, 8, 10, 6, 9, 12, 5],
                outbound: [2, 3, 5, 3, 4, 5, 2],
              },
              meeting: {
                inbound: [3, 4, 5, 3, 4, 5, 2],
              },
            }} />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              Network
            </span>
          }
          key="network"
        >
          <Card style={{ marginTop: '16px' }}>
            <NetworkGraph data={analyticsData.network} />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ClockCircleOutlined />
              Activity
            </span>
          }
          key="activity"
        >
          <div style={{ marginTop: '16px', textAlign: 'center', padding: '40px 0' }}>
            <Alert 
              message="Activity Feed Coming Soon" 
              description="We're working on bringing you a detailed activity feed with all your communications in one place." 
              type="info" 
              showIcon
            />
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Dashboard;
