import React, { useState, useEffect, useRef } from 'react';
import { Card, Col, Row, Spin, Typography, Tabs, Alert, Image, Tooltip, Switch, Space, Drawer, Tag, List, Select, Button } from 'antd';
import { LoadingOutlined, ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, MailOutlined, MailFilled } from '@ant-design/icons';
import NextImage from 'next/image';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

// Import components
import CommunicationPulse from './metrics/CommunicationPulse';
import EngagementMetrics from './metrics/EngagementMetrics';
import TimeAllocation from './charts/TimeAllocation';
import NetworkGraph from './charts/NetworkGraph';
import CommunicationVolume from './charts/CommunicationVolume';
import { EnhancedActionCenter } from './action/EnhancedActionCenter';
import { mockEnhancedData } from './action/mockEnhancedData';
import ProjectNetworkView from './ProjectNetworkView';
import DashboardDownload from '@/components/common/DashboardDownload';

const { Title } = Typography;



const AnalyticalDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'actions';
    return localStorage.getItem('analytics:activeTab') || 'actions';
  }); // Persisted active tab
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [useDemoData, setUseDemoData] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return (localStorage.getItem('analytics:dataSource') || 'demo') === 'demo';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics:dataSource', useDemoData ? 'demo' : 'real');
    }
  }, [useDemoData]);

  // Persist active tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics:activeTab', activeTab);
    }
  }, [activeTab]);

  // Fetch real data (unified API). The structure should align with charts; when unavailable, we fall back to demo data.
  const { data: realData, loading: realLoading, error: realError } = useAnalyticsData<any>({});

  // Selected data source
  const selectedData = useDemoData ? null : (realData ?? null);

  

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

  // Derived metrics (with safe fallbacks) - placed after supporting data to avoid use-before-define
  const inboundCount: number = selectedData?.inbound_count ?? 0;
  const outboundCount: number = selectedData?.outbound_count ?? 0;
  const avgResponseMin: number = selectedData?.avg_response_time_minutes ?? 0;
  const meetingsByType: Record<string, number> = selectedData?.meetings_by_type ?? {};
  const totalMeetings: number = Object.values(meetingsByType).reduce((a: number, b: number) => a + b, 0);
  // Use a proxy for focus time ratio when only meeting counts exist
  const focusRatio: number = (() => {
    const workBlocks = 40; // proxy weekly blocks
    const used = Math.min(totalMeetings, workBlocks);
    return Math.max(0, Math.min(100, Math.round(((workBlocks - used) / workBlocks) * 100)));
  })();
  type NodeInfo = { is_external: boolean; messageCount?: number };
  const nodes: NodeInfo[] = (selectedData?.nodes as NodeInfo[]) ?? [];
  const extIntPct = (() => {
    if (!nodes.length) return { externalPct: 0, internalPct: 100 };
    const total = nodes.reduce((s: number, n: NodeInfo) => s + (n.messageCount ?? 0), 0) || 1;
    const ext = nodes.filter((n: NodeInfo) => n.is_external).reduce((s: number, n: NodeInfo) => s + (n.messageCount ?? 0), 0);
    const externalPct = Math.round((ext / total) * 100);
    return { externalPct, internalPct: 100 - externalPct };
  })();
  type ProjectInfo = { id: string; name: string; messageCount?: number };
  const topProjects: ProjectInfo[] = ((selectedData?.projects as ProjectInfo[]) ?? [])
    .slice()
    .sort((a: ProjectInfo, b: ProjectInfo) => (b.messageCount ?? 0) - (a.messageCount ?? 0))
    .slice(0, 3);
  const reconnectCount: number = peopleToReconnect.length;
  const missedCount: number = missedMessagesData.length;

  // Compute prior-period deltas from time-series if available (fallback to null)
  const computeDeltaPct = (current: number, previous: number): number | null => {
    if (previous <= 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getSeriesTotals = (series: number[], days: number) => {
    const n = series.length;
    if (n < days * 2) return { curr: null, prev: null };
    const curr = series.slice(n - days).reduce((a, b) => a + b, 0);
    const prev = series.slice(n - days * 2, n - days).reduce((a, b) => a + b, 0);
    return { curr, prev };
  };

  const daysWindow = 14;
  const totals = (() => {
    const d = selectedData;
    const len: number = (d?.email?.inbound ?? []).length;
    if (!len) return { deltaTotalPct: null };
    const inboundAll: number[] = Array.from({ length: len }, (_: unknown, i: number) =>
      (d?.email?.inbound?.[i] ?? 0) + (d?.slack?.inbound?.[i] ?? 0) + (d?.meeting?.inbound?.[i] ?? 0)
    );
    const outboundAll: number[] = Array.from({ length: len }, (_: unknown, i: number) =>
      (d?.email?.outbound?.[i] ?? 0) + (d?.slack?.outbound?.[i] ?? 0) + (d?.meeting?.outbound?.[i] ?? 0)
    );
    const totalAll: number[] = inboundAll.map((v: number, i: number) => v + (outboundAll[i] ?? 0));
    const { curr: currTotal, prev: prevTotal } = getSeriesTotals(totalAll, daysWindow);
    const deltaTotalPct = currTotal != null && prevTotal != null ? computeDeltaPct(currTotal, prevTotal) : null;
    return { deltaTotalPct };
  })();

  const totalDeltaPct = totals.deltaTotalPct;

  // Missed messages drawer state
  const [missedOpen, setMissedOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>(
    () => (typeof window === 'undefined' ? 'all' : (localStorage.getItem('analytics:missed:priority') as any) || 'all')
  );
  const [filterChannel, setFilterChannel] = useState<'all' | 'email' | 'slack' | 'meeting' | 'teams'>(
    () => (typeof window === 'undefined' ? 'all' : (localStorage.getItem('analytics:missed:channel') as any) || 'all')
  );
  const [filterDirectQ, setFilterDirectQ] = useState<'all' | 'question' | 'no_question'>(
    () => (typeof window === 'undefined' ? 'all' : (localStorage.getItem('analytics:missed:directQ') as any) || 'all')
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('analytics:missed:priority', filterPriority);
  }, [filterPriority]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('analytics:missed:channel', filterChannel);
  }, [filterChannel]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('analytics:missed:directQ', filterDirectQ);
  }, [filterDirectQ]);

  // External/Internal drawer state
  const [extOpen, setExtOpen] = useState(false);
  const [extScope, setExtScope] = useState<'all' | 'external' | 'internal'>(() => {
    if (typeof window === 'undefined') return 'all';
    return (localStorage.getItem('analytics:ext:scope') as any) || 'all';
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('analytics:ext:scope', extScope);
  }, [extScope]);

  const allNodes: { id: string; name: string; is_external: boolean; messageCount?: number; email?: string }[] =
    (selectedData?.nodes ?? []) as any[];
  const extFiltered = allNodes
    .filter(n => (extScope === 'all' ? true : extScope === 'external' ? n.is_external : !n.is_external))
    .sort((a, b) => (b.messageCount ?? 0) - (a.messageCount ?? 0));

  const filteredMissed = missedMessagesData.filter(m => {
    if (filterPriority !== 'all' && m.priority !== filterPriority) return false;
    if (filterChannel !== 'all' && m.channel !== filterChannel) return false;
    if (filterDirectQ !== 'all') {
      const want = filterDirectQ === 'question';
      if (m.hasDirectQuestion !== want) return false;
    }
    return true;
  });



  // Render loading state
  if (realLoading) {
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
  if (realError) {
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
        <div style={{ padding: '16px 0' }}>
          {/* BLUF Summary */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card
                style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Summary (BLUF)</span>
                    <Tooltip title="Bottom Line Up Front: quick read-out of what's most important.">
                      <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </Tooltip>
                  </div>
                }
                bodyStyle={{ padding: '16px 24px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {typeof totalDeltaPct === 'number' && totalDeltaPct < 0 ? (
                      <ArrowDownOutlined style={{ color: '#cf1322' }} />
                    ) : (
                      <ArrowUpOutlined style={{ color: '#52c41a' }} />
                    )}
                    <span>
                      <strong>{(selectedData?.total_count ?? 0).toLocaleString()}</strong>
                      {` total messages — `}
                      {typeof totalDeltaPct === 'number' ? (
                        <span style={{ color: totalDeltaPct >= 0 ? '#52c41a' : '#cf1322' }}>
                          {totalDeltaPct >= 0 ? '+' : ''}{totalDeltaPct}% vs prior
                        </span>
                      ) : (
                        <span style={{ color: '#8c8c8c' }}>vs prior n/a</span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {missedCount > 0 ? (
                      <ArrowDownOutlined style={{ color: '#faad14' }} />
                    ) : (
                      <ArrowUpOutlined style={{ color: '#52c41a' }} />
                    )}
                    <span><strong>{missedCount}</strong> potential missed/overdue — <a href="#missed-messages">review and clear now</a></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ArrowUpOutlined style={{ color: '#722ed1' }} />
                    <span><strong>{extIntPct.externalPct}%</strong> external mix — lean into partner/customer threads</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Missed Messages Drawer */}
          <Drawer
            title="Potential Missed / Overdue"
            open={missedOpen}
            onClose={() => setMissedOpen(false)}
            width={640}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <Tag color={filterPriority === 'high' ? 'red' : 'default'} onClick={() => setFilterPriority(filterPriority === 'high' ? 'all' : 'high')} style={{ cursor: 'pointer' }}>High</Tag>
              <Tag color={filterPriority === 'medium' ? 'orange' : 'default'} onClick={() => setFilterPriority(filterPriority === 'medium' ? 'all' : 'medium')} style={{ cursor: 'pointer' }}>Medium</Tag>
              <Tag color={filterPriority === 'low' ? 'blue' : 'default'} onClick={() => setFilterPriority(filterPriority === 'low' ? 'all' : 'low')} style={{ cursor: 'pointer' }}>Low</Tag>
              <Tag color={filterDirectQ === 'question' ? 'processing' : 'default'} onClick={() => setFilterDirectQ(filterDirectQ === 'question' ? 'all' : 'question')} style={{ cursor: 'pointer' }}>Direct question</Tag>
            </div>
            <List
              dataSource={filteredMissed}
              renderItem={(msg: any) => (
                <List.Item
                  key={msg.id}
                  actions={[
                    <a key="open" href={msg.url} target="_blank" rel="noreferrer">Open</a>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Tag color={msg.priority === 'high' ? 'red' : msg.priority === 'medium' ? 'orange' : 'blue'} style={{ marginRight: 0 }}>{msg.priority}</Tag>
                        <span style={{ fontWeight: 500 }}>{msg.subject}</span>
                      </div>
                    }
                    description={
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', color: '#666' }}>
                        <span>{msg.from}</span>
                        <span>•</span>
                        <span>{msg.channel}</span>
                        <span>•</span>
                        <span>{msg.daysOld} day{msg.daysOld !== 1 ? 's' : ''} ago</span>
                        {msg.hasDirectQuestion && (<Tag color="processing">Response needed</Tag>)}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Drawer>

          {/* External vs Internal Drawer */}
          <Drawer
            title="External vs Internal"
            open={extOpen}
            onClose={() => setExtOpen(false)}
            width={640}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>Scope:</span>
              <Select
                size="small"
                value={extScope}
                onChange={setExtScope}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'external', label: 'External' },
                  { value: 'internal', label: 'Internal' },
                ]}
              />
            </div>
            <List
              dataSource={extFiltered}
              renderItem={(n: any) => (
                <List.Item key={n.id}>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {n.is_external ? <Tag color="purple">External</Tag> : <Tag>Internal</Tag>}
                        <span style={{ fontWeight: 500 }}>{n.name}</span>
                      </div>
                    }
                    description={
                      <div style={{ display: 'flex', gap: 8, color: '#666', flexWrap: 'wrap' }}>
                        <span>{n.email || '—'}</span>
                        <span>•</span>
                        <span>{n.messageCount ?? 0} messages</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Drawer>

          {/* First Row - Primary Tiles */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered
                style={{ borderRadius: 12, height: '100%' }}
                bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ fontSize: 12, letterSpacing: 0.4, color: '#8c8c8c' }}>TOTAL MESSAGES</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {(selectedData?.total_count ?? 0).toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#389e0d', fontSize: 13 }}>
                  <ArrowUpOutlined />
                  <span>12% vs prior</span>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered
                style={{ borderRadius: 12, height: '100%' }}
                bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 12, letterSpacing: 0.4, color: '#8c8c8c' }}>AVG RESPONSE TIME</div>
                  <Tooltip title="Average time to first response." placement="top">
                    <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                  </Tooltip>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{formatResponseTime(avgResponseMin)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cf1322', fontSize: 13 }}>
                  <ArrowDownOutlined />
                  <span>2% slower vs prior</span>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, letterSpacing: 0.4, color: '#8c8c8c' }}>INBOX RISK</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{missedCount}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Potential missed/overdue responses</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, letterSpacing: 0.4, color: '#8c8c8c' }}>INBOUND VS OUTBOUND</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{inboundCount.toLocaleString()}</div>
                  <span style={{ color: '#8c8c8c' }}>/</span>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{outboundCount.toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Inbound / Outbound</div>
              </Card>
            </Col>
          </Row>

          {/* Second Row - Secondary Tiles */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, letterSpacing: 0.4, color: '#8c8c8c' }}>FOCUS VS MEETINGS</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{focusRatio}%</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>focus time</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, letterSpacing: 0.4, color: '#8c8c8c' }}>EXTERNAL VS INTERNAL</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{extIntPct.externalPct}%</div>
                  <span style={{ color: '#8c8c8c' }}>/</span>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{extIntPct.internalPct}%</div>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>External / Internal</div>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <Button type="link" onClick={() => setExtOpen(true)} style={{ padding: 0 }}>View details</Button>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: 20 }}>
                <div style={{ fontSize: 12, letterSpacing: 0.4, color: '#8c8c8c', marginBottom: 8 }}>TOP PROJECTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topProjects.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>No project activity</div>
                  ) : (
                    topProjects.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{p.name}</span>
                        <span style={{ color: '#8c8c8c' }}>{p.messageCount}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, letterSpacing: 0.4, color: '#8c8c8c' }}>NETWORK HEALTH</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{reconnectCount}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>Contacts &gt;30 days since last touch</div>
              </Card>
            </Col>
          </Row>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span id="missed-messages">Potential Missed Messages</span>
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
                            width: '64px',
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
                              alignItems: 'center',
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
                                    border: '1px solid #91d5ff',
                                    lineHeight: '18px'
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
                          gap: '2px',
                          flex: '0 0 auto',
                          minWidth: '96px'
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: '#8c8c8c', fontSize: 12 }}>Filters:</span>
                      <Select size="small" value={filterPriority} onChange={setFilterPriority} style={{ width: 110 }}
                        options={[{value:'all',label:'All priority'},{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]}
                      />
                      <Select size="small" value={filterChannel} onChange={setFilterChannel} style={{ width: 110 }}
                        options={[{value:'all',label:'All channels'},{value:'email',label:'Email'},{value:'slack',label:'Slack'},{value:'meeting',label:'Meeting'},{value:'teams',label:'Teams'}]}
                      />
                      <Select size="small" value={filterDirectQ} onChange={setFilterDirectQ} style={{ width: 140 }}
                        options={[{value:'all',label:'All'},{value:'question',label:'Direct question'},{value:'no_question',label:'No question'}]}
                      />
                    </div>
                    <Button type="link" onClick={() => setMissedOpen(true)} style={{ color: '#1890ff', fontSize: '14px' }}>
                      View all messages
                    </Button>
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
                        transition: 'all 0.3s'
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
                  <CommunicationVolume data={selectedData} />
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
                  <TimeAllocation data={selectedData} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tooltip title={useDemoData ? 'Showing sample analytics. Toggle to load your real data.' : 'Showing your real analytics.'}>
              <Space align="center">
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>Demo data</span>
                <Switch checked={useDemoData} onChange={setUseDemoData} />
              </Space>
            </Tooltip>
            <DashboardDownload dashboardRef={dashboardRef} />
          </div>
        </div>
      </div>

      {!useDemoData && realError && (
        <div style={{ margin: '12px 0' }}>
          <Alert type="error" message="Failed to load analytics" description={realError} showIcon />
        </div>
      )}

      {!useDemoData && realLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <Spin indicator={<LoadingOutlined spin />} />
        </div>
      )}

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
};

export default AnalyticalDashboard;
