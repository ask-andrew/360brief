import React from 'react';
import { Card, List, Tag, Space, Typography, Badge, Tabs, Progress } from 'antd';
import { 
  MailOutlined, 
  MessageOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  IssuesCloseOutlined,
  ArrowRightOutlined,
  CommentOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface ActionItem {
  id: string;
  type: 'email' | 'slack' | 'teams';
  title: string;
  excerpt: string;
  project: string;
  lastActivity: string;
  status: 'pending' | 'awaiting' | 'overdue';
  link: string;
  participants: string[];
  sentiment?: number; // -1 (negative) to 1 (positive)
  urgency: 'high' | 'medium' | 'low';
}

interface MessageTypeCounts {
  email: number;
  slack: number;
  meeting: number;
  teams: number;
  total: number;
}

// Define TopicGroup used throughout the component
interface TopicItem {
  id: string;
  type: 'email' | 'slack' | 'teams' | 'meeting';
  link: string;
  title: string;
  timestamp?: string;
  preview?: string;
  participants: string[];
}

interface TopicGroup {
  id: string;
  title: string;
  project: string;
  urgency: 'high' | 'medium' | 'low';
  lastActivity: string;
  participants: string[];
  messageTypes: MessageTypeCounts;
  sentiment: number;
  items: TopicItem[];
}

interface ActionCenterProps {
  data: {
    topics: {
      pending: TopicGroup[];
      awaiting: TopicGroup[];
    };
    messageCounts: {
      pending: MessageTypeCounts;
      awaiting: MessageTypeCounts;
      total: MessageTypeCounts;
    };
    sentimentByProject: Array<{
      project: string;
      sentiment: number;
      trend: 'up' | 'down' | 'neutral';
      messages: number;
      messageTypes: {
        email: number;
        slack: number;
        meeting: number;
      };
    }>;
    sentimentByContact: Array<{
      name: string;
      sentiment: number;
      trend: 'up' | 'down' | 'neutral';
      lastContact: string;
      channel: 'email' | 'slack' | 'teams' | 'meeting';
      messageCount: number;
    }>;
  };
}

const ActionCenter: React.FC<ActionCenterProps> = ({ data }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge status="processing" text="Needs Your Reply" />;
      case 'awaiting':
        return <Badge status="default" text="Awaiting Response" />;
      case 'overdue':
        return <Badge status="error" text="Overdue" />;
      default:
        return null;
    }
  };

  const renderActionItem = (item: any) => (
    <List.Item 
      key={item.id}
      actions={[
        <Space key="time" direction="vertical" align="end">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(item.lastActivity).fromNow()}
          </Text>
          {getUrgencyTag(item.urgency)}
        </Space>
      ]}
    >
      <List.Item.Meta
        avatar={
          item.type === 'email' ? <MailOutlined style={{ fontSize: 20 }} /> :
          item.type === 'slack' ? <MessageOutlined style={{ fontSize: 20 }} /> :
          <TeamOutlined style={{ fontSize: 20 }} />
        }
        title={
          <Space>
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontWeight: 500 }}
            >
              {item.title}
            </a>
            {getStatusBadge(item.status)}
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" ellipsis>
              {item.excerpt}
            </Text>
            <div>
              <Tag color="geekblue" icon={<TeamOutlined />}>
                {item.project || 'No Project'}
              </Tag>
              {item.participants.map((p: string, i: number) => (
                <Tag key={i} color="blue">{p}</Tag>
              ))}
            </div>
            {item.sentiment !== undefined && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ marginRight: 8 }}>Sentiment:</Text>
                {getSentimentBadge(item.sentiment)}
              </div>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  const getUrgencyTag = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Tag color="red">High Priority</Tag>;
      case 'medium':
        return <Tag color="orange">Medium Priority</Tag>;
      default:
        return <Tag color="blue">Low Priority</Tag>;
    }
  };

  const renderMessageTypeBadges = (counts: MessageTypeCounts, showTotal: boolean = true) => (
    <Space size={[8, 4]} wrap>
      {counts.email > 0 && (
        <Tag icon={<MailOutlined />} color="#1890ff">
          {counts.email}
        </Tag>
      )}
      {counts.slack > 0 && (
        <Tag icon={<MessageOutlined />} color="#52c41a">
          {counts.slack}
        </Tag>
      )}
      {counts.teams > 0 && (
        <Tag icon={<TeamOutlined />} color="#722ed1">
          {counts.teams}
        </Tag>
      )}
      {counts.meeting > 0 && (
        <Tag icon={<CalendarOutlined />} color="#fa8c16">
          {counts.meeting}
        </Tag>
      )}
      {showTotal && counts.total > 0 && (
        <Tag color="default">
          Total: {counts.total}
        </Tag>
      )}
    </Space>
  );

  const getSentimentBadge = (score: number) => {
    const percentage = Math.round(((score + 1) / 2) * 100);
    let status: 'success' | 'exception' | 'normal' = 'normal';
    let statusText = 'Neutral';
    
    if (score > 0.3) {
      status = 'success';
      statusText = 'Positive';
    } else if (score < -0.3) {
      status = 'exception';
      statusText = 'Negative';
    }
    
    return (
      <div style={{ width: 100 }}>
        <Progress 
          percent={percentage} 
          status={status} 
          showInfo={false} 
          strokeWidth={8}
          strokeColor={
            status === 'success' ? '#52c41a' : 
            status === 'exception' ? '#f5222d' : '#faad14'
          }
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {statusText}
        </Text>
      </div>
    );
  };

  const renderTopicGroup = (topic: TopicGroup) => (
    <div key={topic.id} className="topic-group" style={{ marginBottom: '16px', border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>{topic.title}</h4>
          <div>
            <Tag color="blue">{topic.project}</Tag>
            {getUrgencyTag(topic.urgency)}
          </div>
        </div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
          <span><UserOutlined /> {topic.participants.slice(0, 3).join(', ')}{topic.participants.length > 3 ? '...' : ''}</span>
          <span><ClockCircleOutlined /> {dayjs(topic.lastActivity).fromNow()}</span>
          {renderMessageTypeBadges(topic.messageTypes, true)}
          {getSentimentBadge(topic.sentiment)}
        </div>
      </div>
      
      <div className="topic-items" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {topic.items.map(item => (
          <div key={item.id} style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid #f5f5f5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{ flex: '0 0 24px' }}>
              {item.type === 'email' && <MailOutlined style={{ color: '#1890ff' }} />}
              {item.type === 'slack' && <MessageOutlined style={{ color: '#52c41a' }} />}
              {item.type === 'meeting' && <CalendarOutlined style={{ color: '#fa8c16' }} />}
              {item.type === 'teams' && <TeamOutlined style={{ color: '#722ed1' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500 }}>
                  {item.title}
                </a>
                <span style={{ color: '#999', fontSize: '12px' }}>
                  {dayjs(item.timestamp).format('MMM D, h:mma')}
                </span>
              </div>
              {item.preview && (
                <div style={{ 
                  marginTop: '4px', 
                  color: '#666',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.preview}
                </div>
              )}
              {item.participants.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <Tag color="default" style={{ fontSize: '11px' }}>
                    {item.participants[0]}{item.participants.length > 1 ? ` +${item.participants.length - 1}` : ''}
                  </Tag>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card 
      title={
        <Space>
          <IssuesCloseOutlined />
          <span>Action Center</span>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      <Tabs defaultActiveKey="1">
        <TabPane
          tab={
            <span>
              <CommentOutlined />
              Needs Your Reply ({data.topics.pending.length})
            </span>
          }
          key="1"
        >
          <List
            itemLayout="horizontal"
            dataSource={data.topics.pending}
            renderItem={renderActionItem}
            pagination={{
              pageSize: 5,
              hideOnSinglePage: true,
              showSizeChanger: false,
            }}
          />
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <ClockCircleOutlined />
              Awaiting Response ({data.topics.awaiting.length})
            </span>
          }
          key="2"
        >
          <List
            itemLayout="horizontal"
            dataSource={data.topics.awaiting}
            renderItem={renderActionItem}
            pagination={{
              pageSize: 5,
              hideOnSinglePage: true,
              showSizeChanger: false,
            }}
          />
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <CheckCircleOutlined />
              Sentiment by Project
            </span>
          }
          key="3"
        >
          <List
            dataSource={data.sentimentByProject}
            renderItem={item => (
              <List.Item
                actions={[
                  <Text key="trend" type={item.trend === 'up' ? 'success' : item.trend === 'down' ? 'danger' : 'secondary'}>
                    {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                  </Text>
                ]}
              >
                <List.Item.Meta
                  title={item.project}
                  description={`${item.messages} messages`}
                />
                {getSentimentBadge(item.sentiment)}
              </List.Item>
            )}
          />
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <TeamOutlined />
              Sentiment by Contact
            </span>
          }
          key="4"
        >
          <List
            dataSource={data.sentimentByContact}
            renderItem={item => (
              <List.Item
                actions={[
                  <Text key="time" type="secondary">
                    {dayjs(item.lastContact).fromNow()}
                  </Text>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    item.channel === 'email' ? <MailOutlined /> :
                    item.channel === 'slack' ? <MessageOutlined /> :
                    <TeamOutlined />
                  }
                  title={item.name}
                  description={`Last contact: ${dayjs(item.lastContact).format('MMM D, YYYY')}`}
                />
                {getSentimentBadge(item.sentiment)}
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

// Mock data for the component
export const mockActionCenterData = {
  pending: [
    {
      id: '1',
      type: 'email' as const,
      title: 'Project Alpha - Design Review',
      excerpt: 'Could you please review the latest design mockups? We need your feedback before we can proceed with development.',
      project: 'Project Alpha',
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      status: 'pending' as const,
      link: '#',
      participants: ['John D.', 'Sarah M.'],
      sentiment: 0.4,
      urgency: 'high' as const,
    },
    {
      id: '2',
      type: 'slack' as const,
      title: '#general - Team Standup',
      excerpt: '@you: Do you have any blockers for the current sprint?',
      project: 'Team Updates',
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      status: 'pending' as const,
      link: '#',
      participants: ['Team Channel'],
      sentiment: 0.1,
      urgency: 'medium' as const,
    },
  ],
  awaiting: [
    {
      id: '3',
      type: 'email' as const,
      title: 'RE: Budget Approval',
      excerpt: 'I\'ve sent the budget for your review. Please let me know if you need any changes.',
      project: 'Q2 Budget',
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      status: 'awaiting' as const,
      link: '#',
      participants: ['Finance Team'],
      sentiment: 0.2,
      urgency: 'medium' as const,
    },
  ],
  sentimentByProject: [
    { project: 'Project Alpha', sentiment: 0.4, trend: 'up' as const, messages: 42 },
    { project: 'Q2 Budget', sentiment: 0.1, trend: 'neutral' as const, messages: 18 },
    { project: 'Team Updates', sentiment: -0.2, trend: 'down' as const, messages: 76 },
  ],
  sentimentByContact: [
    { name: 'John D.', sentiment: 0.6, trend: 'up' as const, lastContact: new Date().toISOString(), channel: 'email' as const },
    { name: 'Sarah M.', sentiment: -0.3, trend: 'down' as const, lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), channel: 'slack' as const },
    { name: 'Alex W.', sentiment: 0.1, trend: 'neutral' as const, lastContact: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), channel: 'teams' as const },
  ],
};

export default ActionCenter;
