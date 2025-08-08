import React, { useState, useEffect, useRef } from 'react';
import { Card, Col, Row, Spin, Typography, Tabs, Alert, Image, Tooltip, Switch, Space } from 'antd';
import { LoadingOutlined, ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, MailOutlined, MailFilled } from '@ant-design/icons';
import NextImage from 'next/image';

// Import components
import CommunicationPulse from './metrics/CommunicationPulse';
import EngagementMetrics from './metrics/EngagementMetrics';
import TimeAllocation from './charts/TimeAllocation';
import NetworkGraph from './charts/NetworkGraph';
import CommunicationVolume from './charts/CommunicationVolume';
import { EnhancedActionCenter } from './action/EnhancedActionCenter';
import { mockEnhancedData } from './action/mockEnhancedData';
import ProjectNetworkView from './ProjectNetworkView';
import DashboardDownload from '../common/DashboardDownload';

const { Title } = Typography;

// Mock data for the dashboard
const mockAnalyticsData = {
  // For CommunicationPulse
  total_count: 1247,
  inbound_count: 843,
  outbound_count: 404,
  avg_response_time_minutes: 127,
  
  // For CommunicationVolume
  dates: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  }),
  email: {
    inbound: Array(30).fill(0).map(() => Math.floor(Math.random() * 20) + 5),
    outbound: Array(30).fill(0).map(() => Math.floor(Math.random() * 15) + 3)
  },
  slack: {
    inbound: Array(30).fill(0).map(() => Math.floor(Math.random() * 15) + 3),
    outbound: Array(30).fill(0).map(() => Math.floor(Math.random() * 10) + 2)
  },
  meeting: {
    inbound: Array(30).fill(0).map(() => Math.floor(Math.random() * 5) + 1),
    outbound: Array(30).fill(0).map(() => Math.floor(Math.random() * 5) + 1)
  },
  
  // For TimeAllocation
  meetings_by_type: {
    'Project Planning': 12,
    'Team Sync': 8,
    'Client Call': 5,
    'Code Review': 7,
    'Retrospective': 3
  },
  
  // For NetworkGraph
  nodes: [
    { id: '1', name: 'You', email: 'me@example.com', is_external: false, messageCount: 150 },
    { id: '2', name: 'John Doe', email: 'john@example.com', is_external: false, messageCount: 87 },
    { id: '3', name: 'Jane Smith', email: 'jane@example.com', is_external: false, messageCount: 65 },
    { id: '4', name: 'Acme Inc', email: 'contact@acme.com', is_external: true, messageCount: 42 }
  ],
  links: [
    { source: '1', target: '2', weight: 30, projects: ['project1', 'project2'] },
    { source: '1', target: '3', weight: 25, projects: ['project1'] },
    { source: '1', target: '4', weight: 15, projects: ['project3'] },
    { source: '2', target: '3', weight: 20, projects: ['project1'] }
  ],
  projects: [
    { id: 'project1', name: 'Project Alpha', participants: ['1', '2', '3'], messageCount: 75 },
    { id: 'project2', name: 'Q2 Budget', participants: ['1', '2'], messageCount: 30 },
    { id: 'project3', name: 'Client Onboarding', participants: ['1', '4'], messageCount: 15 }
  ]
};

const AnalyticalDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('actions'); // Set 'actions' as default tab
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Format response time to show hours if > 60 minutes
  const formatResponseTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = (minutes / 60).toFixed(1);
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Calculate missed messages (example calculation)
  const missedMessages = Math.floor(Math.random() * 15) + 5;
  
  // Get people to reconnect with (example data)
  const peopleToReconnect = [
    { 
      name: 'Alex Johnson', 
      email: 'alex.johnson@example.com',
      days: 42, 
      role: 'Product Manager',
      lastContact: '2023-07-20',
      lastProject: 'Q3 Product Roadmap'
    },
    { 
      name: 'Jordan Smith', 
      email: 'jordan.smith@example.com',
      days: 37, 
      role: 'Engineering Lead',
      lastContact: '2023-07-25',
      lastProject: 'API Integration'
    },
    { 
      name: 'Taylor Wilson', 
      email: 'taylor.wilson@example.com',
      days: 45, 
      role: 'Design Director',
      lastContact: '2023-07-12',
      lastProject: 'UI Refresh'
    },
  ];

  // Function to calculate how old a message is in days
  const getDaysOld = (dateString: string): number => {
    const messageDate = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Define message type for better type safety
  type Message = {
    id: string;
    from: string;
    subject: string;
    body: string;
    date: string;
    priority: 'high' | 'medium' | 'low';
    hasDirectQuestion: boolean;
    isArchived: boolean;
    url: string;
    channel: string;
  };

  // Function to determine if a message should be flagged as missed
  const getMissedMessages = () => {
    const now = new Date();
    const messages: Message[] = [
      {
        id: 'msg-001',
        from: 'jane.doe@example.com',
        subject: 'Urgent: Project deadline moved up - need your approval',
        body: 'Hi, we need your approval on the updated project deadline. Can you please review and confirm by EOD?',
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
        priority: 'high',
        hasDirectQuestion: true,
        isArchived: false,
        url: '/inbox/msg-001',
        channel: 'email'
      },
      {
        id: 'msg-002',
        from: 'mike.smith@example.com',
        subject: 'Budget approval needed for Q4',
        body: 'Following up on the budget approval. Your input is required to proceed.',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
        priority: 'high',
        hasDirectQuestion: true,
        isArchived: false,
        url: '/inbox/msg-002',
        channel: 'email'
      },
      {
        id: 'msg-003',
        from: 'team@slack.com',
        subject: 'New message in #leadership',
        body: '@andrew Can you provide an update on the client meeting?',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
        priority: 'medium',
        hasDirectQuestion: true,
        isArchived: false,
        url: '/slack/thread/12345',
        channel: 'slack'
      },
      {
        id: 'msg-004',
        from: 'sarah.williams@example.com',
        subject: 'Project kickoff next week',
        body: 'Just confirming the details for next week\'s kickoff.',
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
        priority: 'low',
        hasDirectQuestion: false,
        isArchived: true, // This one is archived, so it shouldn't show up in the list
        url: '/inbox/msg-004',
        channel: 'email'
      },
      {
        id: 'msg-005',
        from: 'meeting@zoom.us',
        subject: 'Action items from leadership meeting',
        body: 'Here are the action items assigned to you from today\'s meeting.',
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days ago
        priority: 'medium',
        hasDirectQuestion: false,
        isArchived: false,
        url: '/meetings/recording/abc123',
        channel: 'zoom'
      }
    ];

    // Filter logic:
    // 1. Messages older than 1 day
    // 2. AND (priority is high OR contains direct question)
    // 3. AND not marked as done/archived
    return messages.filter(message => {
      const daysOld = getDaysOld(message.date);
      return daysOld > 1 && 
             (message.priority === 'high' || message.hasDirectQuestion) &&
             !message.isArchived;
    })
    // Sort by priority (high first) then by age (oldest first)
    .sort((a, b) => {
      if (a.priority === b.priority) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.priority === 'high' ? -1 : 1;
    });
  };

  // Get missed messages and add additional metadata
  const missedMessagesData = getMissedMessages().map(msg => ({
    ...msg,
    daysOld: getDaysOld(msg.date),
    isUrgent: msg.priority === 'high' || getDaysOld(msg.date) > 3
  }));
  
  const hasMissedMessages = missedMessagesData.length > 0;

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh' 
      }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading your analytics...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error loading analytics"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Define tab items in order: Actions, Metrics, Projects
  const tabItems = [
    {
      key: 'actions',
      label: 'Actions',
      children: <EnhancedActionCenter data={mockEnhancedData} />,
    },
    {
      key: 'metrics',
      label: 'Metrics',
      children: (
        <div style={{ padding: '16px 8px' }}>
          {/* Top Row - Primary Metric Tiles */}
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col xs={24} md={6}>
              <div 
                style={{
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: 'white',
                  height: '100%',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.2)'
                }}
              >
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>TOTAL MESSAGES</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {mockAnalyticsData.total_count.toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', opacity: 0.9 }}>
                  <span style={{ marginRight: '8px' }}>↑ 12% from last week</span>
                  <ArrowUpOutlined />
                </div>
              </div>
            </Col>
            <Col xs={24} md={6}>
              <div 
                style={{
                  background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: 'white',
                  height: '100%',
                  boxShadow: '0 4px 12px rgba(114, 46, 209, 0.2)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>ENGAGEMENT SCORE</span>
                  <Tooltip 
                    title="Measures your responsiveness and interaction patterns. Higher scores indicate better engagement with your network." 
                    placement="top"
                  >
                    <InfoCircleOutlined style={{ marginLeft: '8px', cursor: 'pointer', opacity: 0.8 }} />
                  </Tooltip>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                  87/100
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', opacity: 0.9 }}>
                  <span style={{ marginRight: '8px' }}>↑ 5% from last week</span>
                  <ArrowUpOutlined />
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Second Row - Actionable Tiles */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Potential Missed Messages</span>
                    <Tooltip title="Messages that may need your attention based on priority and response time">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </Tooltip>
                  </div>
                }
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}
                headStyle={{ 
                  borderBottom: '1px solid #f0f0f0', 
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #fff9f0 0%, #fff2e8 100%)',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px'
                }}
                bodyStyle={{ padding: '16px 24px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {!hasMissedMessages ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '24px', 
                      color: '#8c8c8c',
                      fontStyle: 'italic'
                    }}>
                      No critical messages requiring your attention right now.
                    </div>
                  ) : (
                    missedMessagesData.map((msg) => (
                    <a 
                      key={msg.id}
                      href={msg.url}
                      style={{
                        display: 'block',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                          <div style={{
                            backgroundColor: msg.isUrgent ? '#ff4d4f' : '#faad14',
                            color: 'white',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            alignSelf: 'flex-start',
                            marginTop: '2px',
                            minWidth: msg.priority === 'high' ? '50px' : '60px',
                            textAlign: 'center',
                            boxShadow: msg.isUrgent ? '0 0 0 1px #ffccc7' : 'none'
                          }}>
                            {msg.isUrgent ? 'Urgent' : 'Attention'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ 
                              fontWeight: 500, 
                              marginBottom: '6px',
                              lineHeight: '1.4',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px'
                            }}>
                              <span style={{
                                flex: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {msg.subject}
                              </span>
                              {msg.hasDirectQuestion && (
                                <Tooltip title="Contains a direct question">
                                  <span style={{ 
                                    flexShrink: 0,
                                    color: '#1890ff',
                                    fontWeight: 'normal',
                                    fontSize: '11px',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: '#e6f7ff',
                                    padding: '0 6px',
                                    borderRadius: '2px',
                                    border: '1px solid #91d5ff'
                                  }}>
                                    Response needed
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666',
                              display: 'flex',
                              gap: '8px',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              lineHeight: '1.4'
                            }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%'
                              }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                                </svg>
                                <span style={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '200px',
                                  display: 'inline-block'
                                }}>
                                  {msg.from}
                                </span>
                              </span>
                              <span style={{ color: '#d9d9d9' }}>•</span>
                              <span style={{
                                backgroundColor: '#f5f5f5',
                                padding: '1px 6px',
                                borderRadius: '2px',
                                fontSize: '11px',
                                textTransform: 'capitalize'
                              }}>
                                {msg.channel}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: msg.isUrgent ? '#ff4d4f' : '#8c8c8c',
                          whiteSpace: 'nowrap',
                          marginLeft: '8px',
                          fontWeight: msg.isUrgent ? 'bold' : 'normal',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '2px'
                        }}>
                          <span>{`${msg.daysOld} day${msg.daysOld !== 1 ? 's' : ''} ago`}</span>
                          {msg.isUrgent && (
                            <span style={{
                              fontSize: '10px',
                              color: '#ff4d4f',
                              backgroundColor: '#fff1f0',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              border: '1px solid #ffa39e'
                            }}>
                              Needs response
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  ))
                  )}
                  <div style={{ textAlign: 'right', marginTop: '8px' }}>
                    <a href="/inbox?filter=unread" style={{ color: '#1890ff', fontSize: '14px' }}>
                      View all messages
                    </a>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Reconnect With</span>
                    <Tooltip title="People you haven't contacted in over 30 days">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </Tooltip>
                  </div>
                }
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}
                headStyle={{ 
                  borderBottom: '1px solid #f0f0f0', 
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px'
                }}
                bodyStyle={{ padding: '16px 24px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {peopleToReconnect.map((person, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        transition: 'all 0.3s',
                        ':hover': {
                          backgroundColor: '#fafafa',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{person.name}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {person.role} • Last contact: {person.lastContact}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                          Last project: {person.lastProject}
                        </div>
                      </div>
                      <a 
                        href={`mailto:${person.email}?subject=Reconnecting&body=Hi ${person.name.split(' ')[0]},`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1890ff',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '13px',
                          textDecoration: 'none',
                          transition: 'all 0.3s',
                          cursor: 'pointer'
                        }}
                      >
                        Email
                      </a>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', marginTop: '8px' }}>
                    <a href="/contacts?filter=inactive" style={{ color: '#1890ff', fontSize: '14px' }}>
                      View all contacts
                    </a>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Main Content */}
          <Row gutter={[24, 24]}>
            <Col xs={24} xl={12}>
              <Card 
                title="Communication Volume" 
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
                bodyStyle={{ padding: '16px 24px' }}
              >
                <div style={{ minHeight: '300px' }}>
                  <CommunicationVolume data={mockAnalyticsData} />
                </div>
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card 
                title="Time Allocation" 
                style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
                bodyStyle={{ padding: '16px 24px' }}
              >
                <div style={{ minHeight: '300px' }}>
                  <TimeAllocation data={mockAnalyticsData} />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'projects',
      label: 'Projects',
      children: <ProjectNetworkView />,
    },
  ];

  return (
    <div ref={dashboardRef} className="dashboard-container" style={{ padding: '24px' }}>
      <div style={{ 
        background: 'linear-gradient(90deg, #1a237e, #283593)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', position: 'relative' }}>
              <Image
                src="/images/360logo.svg"
                alt="360Brief Logo"
                width={40}
                height={40}
                preview={false}
              />
            </div>
            <div>
              <h1 style={{ 
                color: 'white', 
                margin: 0, 
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: 1.2
              }}>
                Analytics Dashboard
              </h1>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                margin: '4px 0 0',
                fontSize: '0.9rem'
              }}>
                Track and optimize your communication patterns
              </p>
            </div>
          </div>
          <DashboardDownload dashboardRef={dashboardRef} />
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
};

export default AnalyticalDashboard;
