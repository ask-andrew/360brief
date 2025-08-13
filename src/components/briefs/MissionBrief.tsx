import React from 'react';
import { BriefItem } from '@/mock/missionBriefData';
import { Card, Typography, List, Tag, Divider, Space } from 'antd';
import { ClockCircleOutlined, MailOutlined, CalendarOutlined, AlertOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PriorityTag = ({ priority }: { priority: string }) => {
  const color = priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green';
  return <Tag color={color} style={{ textTransform: 'capitalize' }}>{priority}</Tag>;
};

const ItemIcon = ({ type }: { type: 'email' | 'calendar' }) => {
  return type === 'email' ? <MailOutlined /> : <CalendarOutlined />;
};

const formatTime = (time?: string) => {
  if (!time) return '';
  return time.replace(/([AP]M)/, ' $1');
};

export const MissionBrief = ({ data }: { data: any }) => {
  return (
    <Card 
      title={
        <Space direction="vertical" size={0}>
          <Text strong>MISSION BRIEF</Text>
          <Text type="secondary">{data.dateRange}</Text>
        </Space>
      }
      headStyle={{ 
        borderBottom: '2px solid #f0f0f0',
        backgroundColor: '#fafafa',
        padding: '16px 24px'
      }}
      bodyStyle={{ padding: 0 }}
      className="mission-brief"
      style={{ maxWidth: 800, margin: '0 auto', borderRadius: 8, overflow: 'hidden' }}
    >
      {/* Summary Section */}
      <div style={{ padding: '16px 24px', backgroundColor: '#fff8f0', borderBottom: '1px solid #ffe7ba' }}>
        <Space>
          <AlertOutlined style={{ color: '#fa8c16' }} />
          <Text strong>EXECUTIVE SUMMARY</Text>
        </Space>
        <Paragraph style={{ margin: '8px 0 0 0' }}>{data.summary}</Paragraph>
      </div>

      {/* Priority Items */}
      <div style={{ padding: '16px 24px' }}>
        <Title level={4} style={{ marginBottom: 16 }}>PRIORITY ITEMS</Title>
        <List
          itemLayout="vertical"
          dataSource={data.items.slice(0, 3)}
          renderItem={(item: BriefItem) => (
            <List.Item
              key={item.id}
              style={{ 
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
                margin: 0,
                alignItems: 'flex-start'
              }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: item.type === 'email' ? '#e6f7ff' : '#f6ffed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <ItemIcon type={item.type} style={{
                      color: item.type === 'email' ? '#1890ff' : '#52c41a',
                      fontSize: 16
                    }} />
                  </div>
                }
                title={
                  <Space>
                    <Text strong style={{ fontSize: '1.05em' }}>{item.title}</Text>
                    <PriorityTag priority={item.priority} />
                    {item.actionRequired && (
                      <Tag color="red" style={{ marginLeft: 8 }}>Action Required</Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4} style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: '0.9em' }}>
                      {item.type === 'email' 
                        ? `From: ${item.metadata.from}`
                        : `Location: ${item.metadata.location || 'Virtual'}`}
                    </Text>
                    <Space>
                      <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                      <Text type="secondary" style={{ fontSize: '0.85em' }}>
                        {item.metadata.date} • {formatTime(item.metadata.time)}
                        {item.metadata.duration && ` • ${item.metadata.duration} min`}
                      </Text>
                    </Space>
                  </Space>
                }
              />
              <Paragraph style={{ margin: '8px 0 0 0', fontSize: '0.95em' }}>{item.summary}</Paragraph>
            </List.Item>
          )}
        />
      </div>

      {/* Action Items */}
      <div style={{ 
        padding: '16px 24px',
        backgroundColor: '#f9f9f9',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Title level={4} style={{ marginBottom: 16 }}>REQUIRED ACTIONS</Title>
        <List
          dataSource={data.actionItems}
          renderItem={(item: string, index: number) => (
            <List.Item style={{ padding: '8px 0', border: 'none' }}>
              <List.Item.Meta
                avatar={<Text strong style={{ color: '#1890ff' }}>{index + 1}.</Text>}
                description={<Text style={{ fontSize: '0.95em' }}>{item}</Text>}
              />
            </List.Item>
          )}
        />
      </div>

      {/* Trends */}
      {data.trends && data.trends.length > 0 && (
        <div style={{ 
          padding: '16px 24px',
          backgroundColor: '#f0f9ff',
          borderTop: '1px solid #e6f7ff'
        }}>
          <Title level={4} style={{ marginBottom: 16 }}>TRENDS & PATTERNS</Title>
          <List
            dataSource={data.trends}
            renderItem={(item: string) => (
              <List.Item style={{ padding: '4px 0', border: 'none' }}>
                <List.Item.Meta
                  avatar={<Text>•</Text>}
                  description={<Text style={{ fontSize: '0.95em' }}>{item}</Text>}
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        padding: '12px 24px',
        backgroundColor: '#fafafa',
        borderTop: '1px solid #f0f0f0',
        textAlign: 'right'
      }}>
        <Text type="secondary" style={{ fontSize: '0.85em' }}>
          Generated by 360Brief • {new Date().toLocaleDateString()}
        </Text>
      </div>
    </Card>
  );
};

export default MissionBrief;
