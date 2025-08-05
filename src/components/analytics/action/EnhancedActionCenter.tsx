import React from 'react';
import { Card, Tag, Tabs, Badge, List, Space, Progress } from 'antd';
import { 
  MailOutlined, MessageOutlined, TeamOutlined, 
  ClockCircleOutlined, UserOutlined, CalendarOutlined,
  IssuesCloseOutlined, CommentOutlined, ArrowUpOutlined,
  ArrowDownOutlined, MinusOutlined
} from '@ant-design/icons';

type MessageType = 'email' | 'slack' | 'meeting' | 'teams';

interface MessageItem {
  id: string;
  type: MessageType;
  title: string;
  link: string;
  timestamp: string;
  participants: string[];
  preview?: string;
}

interface TopicGroup {
  id: string;
  title: string;
  participants: string[];
  lastActivity: string;
  project: string;
  messageTypes: Record<MessageType, number>;
  sentiment: number;
  urgency: 'high' | 'medium' | 'low';
  items: MessageItem[];
}

export interface EnhancedActionCenterProps {
  data: {
    topics: {
      pending: TopicGroup[];
      awaiting: TopicGroup[];
    };
    messageCounts: {
      pending: number;
      awaiting: number;
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

const MessageTypeBadges = ({ types }: { types: Record<MessageType, number> }) => (
  <Space size={4}>
    {Object.entries(types).map(([type, count]) => (
      count > 0 && (
        <Tag key={type} icon={
          type === 'email' ? <MailOutlined /> :
          type === 'slack' ? <MessageOutlined /> :
          type === 'teams' ? <TeamOutlined /> : <ClockCircleOutlined />
        }>
          {count}
        </Tag>
      )
    ))}
  </Space>
);

const getUrgencyTag = (urgency: string) => (
  <Tag color={
    urgency === 'high' ? 'red' : 
    urgency === 'medium' ? 'orange' : 'blue'
  }>
    {urgency} priority
  </Tag>
);

const getSentimentBadge = (score: number, trend?: 'up' | 'down' | 'neutral') => {
  const percentage = Math.round(((score + 1) / 2) * 100);
  let status: 'success' | 'exception' | 'normal' = 'normal';
  let strokeColor = '#52c41a';
  
  if (score > 0.3) {
    status = 'success';
  } else if (score < -0.3) {
    status = 'exception';
    strokeColor = '#ff4d4f';
  } else {
    strokeColor = '#faad14';
  }

  const trendIcon = trend === 'up' ? 
    <ArrowUpOutlined style={{ color: '#52c41a' }} /> : 
    trend === 'down' ? 
    <ArrowDownOutlined style={{ color: '#ff4d4f' }} /> : 
    <MinusOutlined style={{ color: '#faad14' }} />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Progress
        percent={percentage}
        showInfo={false}
        strokeColor={strokeColor}
        status={status}
        style={{ width: '60px' }}
        strokeWidth={8}
      />
      <span style={{ fontSize: '12px', color: '#666' }}>
        {trend && <span style={{ marginRight: 2 }}>{trendIcon}</span>}
        {score > 0 ? '+' : ''}{score.toFixed(1)}
      </span>
    </div>
  );
};

const SentimentByProject = ({ projects }: { projects: EnhancedActionCenterProps['data']['sentimentByProject'] }) => (
  <List
    itemLayout="horizontal"
    dataSource={projects}
    renderItem={(project) => (
      <List.Item>
        <List.Item.Meta
          title={project.project}
          description={
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {getSentimentBadge(project.sentiment, project.trend)}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Tag>📧 {project.messageTypes.email}</Tag>
                <Tag>💬 {project.messageTypes.slack}</Tag>
                <Tag>📅 {project.messageTypes.meeting}</Tag>
              </div>
            </div>
          }
        />
      </List.Item>
    )}
  />
);

const SentimentByContact = ({ contacts }: { contacts: EnhancedActionCenterProps['data']['sentimentByContact'] }) => (
  <List
    itemLayout="horizontal"
    dataSource={contacts}
    renderItem={(contact) => (
      <List.Item>
        <List.Item.Meta
          title={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {contact.channel === 'email' && <MailOutlined style={{ color: '#1890ff' }} />}
              {contact.channel === 'slack' && <MessageOutlined style={{ color: '#52c41a' }} />}
              {contact.channel === 'teams' && <TeamOutlined style={{ color: '#722ed1' }} />}
              {contact.channel === 'meeting' && <CalendarOutlined style={{ color: '#fa8c16' }} />}
              {contact.name}
            </div>
          }
          description={
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {getSentimentBadge(contact.sentiment, contact.trend)}
              <span style={{ fontSize: '12px', color: '#666' }}>
                Last: {new Date(contact.lastContact).toLocaleDateString()}
              </span>
              <Tag>Messages: {contact.messageCount}</Tag>
            </div>
          }
        />
      </List.Item>
    )}
  />
);

export const EnhancedActionCenter = ({ data }: EnhancedActionCenterProps) => (
  <Card title="Action Center" style={{ marginBottom: '24px' }}>
    <Tabs defaultActiveKey="pending" type="card">
      <Tabs.TabPane
        key="pending"
        tab={
          <span>
            <IssuesCloseOutlined />
            Needs Your Reply
            <Badge count={data.messageCounts.pending} style={{ marginLeft: 8 }} />
          </span>
        }
      >
        <div style={{ marginTop: 16 }}>
          {data.topics.pending.map(topic => (
            <div key={topic.id} style={{ marginBottom: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
              <div style={{ padding: 12, background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <h4 style={{ margin: 0 }}>{topic.title}</h4>
                  <Tag color="blue">{topic.project}</Tag>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#666' }}>
                  <span>👥 {topic.participants.slice(0, 3).join(', ')}{topic.participants.length > 3 ? '...' : ''}</span>
                  <span>🕒 {new Date(topic.lastActivity).toLocaleDateString()}</span>
                  <MessageTypeBadges types={topic.messageTypes} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane
        tab={
          <span>
            <CommentOutlined />
            Sentiment by Project
          </span>
        }
        key="sentiment-project"
      >
        <SentimentByProject projects={data.sentimentByProject} />
      </Tabs.TabPane>
      <Tabs.TabPane
        tab={
          <span>
            <UserOutlined />
            Sentiment by Contact
          </span>
        }
        key="sentiment-contact"
      >
        <SentimentByContact contacts={data.sentimentByContact} />
      </Tabs.TabPane>
    </Tabs>
  </Card>
);
