import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Spin, Typography, DatePicker, Tabs } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth0 } from '@auth0/auth0-react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Import components
import CommunicationPulse from './metrics/CommunicationPulse';
import RecentActivity from './metrics/RecentActivity';
import TimeAllocation from './charts/TimeAllocation';
import EngagementMetrics from './metrics/EngagementMetrics';
import NetworkGraph from './charts/NetworkGraph';
import CommunicationVolume from './charts/CommunicationVolume';

// Extend dayjs with custom format plugin
dayjs.extend(customParseFormat);

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface AnalyticsData {
  email_stats: any;
  slack_stats: any;
  meeting_stats: any;
  combined_stats: any;
  top_contacts: any[];
  time_series_data: any;
  network_graph: any;
}

const Dashboard: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [data, setData] = useState<AnalyticsData | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAccessTokenSilently();
      const [startDate, endDate] = dateRange;
      
      const response = await fetch(
        `/api/analytics?start_date=${startDate.format('YYYY-MM-DD')}&end_date=${endDate.format('YYYY-MM-DD')}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Handle date range change
  const handleDateChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setDateRange([dayjs(dates[0]), dayjs(dates[1])]);
    }
  };

  // Loading state
  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <Title level={4} type="danger">
          {error}
        </Title>
        <p>Please refresh the page or try again later.</p>
      </Card>
    );
  }

  // Main dashboard content
  return (
    <div className="analytics-dashboard">
      {/* Header with title and date range picker */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Executive Dashboard</Title>
            <p>Analyze your communication patterns and optimize your time</p>
          </Col>
          <Col>
            <RangePicker
              value={dateRange as any}
              onChange={handleDateChange}
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Col>
        </Row>
      </div>

      {/* Main content */}
      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          {/* Communication Pulse */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="Communication Pulse">
                <CommunicationPulse data={data?.combined_stats} />
              </Card>
            </Col>
          </Row>

          {/* Metrics Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12} lg={8}>
              <Card title="Email Metrics">
                <EngagementMetrics data={data?.email_stats} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card title="Slack Metrics">
                <EngagementMetrics data={data?.slack_stats} />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card title="Meeting Metrics">
                <EngagementMetrics data={data?.meeting_stats} isMeeting />
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              <Card title="Communication Volume">
                <CommunicationVolume data={data?.time_series_data} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Time Allocation">
                <TimeAllocation data={data?.meeting_stats} />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Network" key="network">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Your Communication Network">
                <NetworkGraph data={data?.network_graph} />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Recent Activity" key="activity">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Recent Communications">
                <RecentActivity />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Dashboard;
