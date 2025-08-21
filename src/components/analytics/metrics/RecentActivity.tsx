import React from 'react';
import { List, Typography, Tag, Space } from 'antd';
import { 
  MailOutlined, 
  MessageOutlined, 
  CalendarOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface ActivityItem {
  id: string;
  type: 'email' | 'slack' | 'meeting' | 'other';
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}

const RecentActivity: React.FC = () => {
  // Mock data - in a real app, this would come from props or an API
  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'email',
      title: 'Weekly Team Sync',
      description: 'Agenda for the upcoming team meeting',
      time: '10:30 AM',
      unread: true
    },
    {
      id: '2',
      type: 'meeting',
      title: 'Project Kickoff',
      description: 'Initial discussion about the new project',
      time: 'Yesterday',
      unread: false
    },
    {
      id: '3',
      type: 'slack',
      title: '#general',
      description: 'Team announcement about the new office policy',
      time: 'Yesterday',
      unread: false
    },
    {
      id: '4',
      type: 'email',
      title: 'Action Required',
      description: 'Please review the attached document',
      time: '2 days ago',
      unread: false
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <MailOutlined style={{ color: '#1890ff' }} />;
      case 'slack':
        return <MessageOutlined style={{ color: '#4A154B' }} />;
      case 'meeting':
        return <CalendarOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  return (
    <div className="recent-activity">
      <List
        itemLayout="horizontal"
        dataSource={recentActivity}
        renderItem={(item) => (
          <List.Item 
            className={item.unread ? 'activity-item unread' : 'activity-item'}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: item.unread ? '#f6fbff' : 'transparent'
            }}
          >
            <List.Item.Meta
              avatar={getActivityIcon(item.type)}
              title={
                <Space>
                  <Text strong>{item.title}</Text>
                  {item.unread && <Tag color="blue">New</Tag>}
                </Space>
              }
              description={
                <>
                  <Text type="secondary" ellipsis={{ tooltip: item.description }}>
                    {item.description}
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.time}
                    </Text>
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default RecentActivity;
