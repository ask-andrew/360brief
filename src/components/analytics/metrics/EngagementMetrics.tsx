import React from 'react';
import { Row, Col, Progress, Typography, Tooltip, Divider } from 'antd';
import { 
  MailOutlined, 
  MessageOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface EngagementMetricsProps {
  data: any;
  isMeeting?: boolean;
}

const EngagementMetrics: React.FC<EngagementMetricsProps> = ({ data, isMeeting = false }) => {
  if (!data) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const renderMetric = (icon: React.ReactNode, title: string, value: any, description?: string) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ marginRight: 8, color: '#1890ff' }}>{icon}</span>
        <Text strong>{title}</Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <Title level={3} style={{ margin: '0 8px 0 0' }}>
          {value}
        </Title>
        {description && (
          <Text type="secondary" style={{ fontSize: '0.9em' }}>
            {description}
          </Text>
        )}
      </div>
    </div>
  );

  const renderProgressMetric = (title: string, percent: number, color: string) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text>{title}</Text>
        <Text strong>{Math.round(percent)}%</Text>
      </div>
      <Progress 
        percent={percent} 
        showInfo={false} 
        strokeColor={color}
        trailColor="#f0f0f0"
      />
    </div>
  );

  if (isMeeting) {
    return (
      <div>
        {renderMetric(
          <TeamOutlined />,
          'Total Meetings',
          data.total_meetings || 0,
          data.total_meetings ? `${data.meetings_by_type?.['1:1'] || 0} 1:1s` : ''
        )}
        
        {renderMetric(
          <ClockCircleOutlined />,
          'Total Hours',
          data.total_hours || 0,
          data.avg_duration_minutes ? `(${data.avg_duration_minutes} min/meeting)` : ''
        )}
        
        {data.participant_stats && (
          <div style={{ marginTop: 16 }}>
            <Divider style={{ margin: '12px 0' }} />
            <Text strong>Participants</Text>
            {renderProgressMetric(
              'Avg. per meeting',
              Math.min(100, (data.participant_stats.avg_participants_per_meeting / 10) * 100),
              '#722ed1'
            )}
            {data.meetings_by_type && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Meeting Types</Text>
                {Object.entries(data.meetings_by_type).map(([type, count]) => (
                  <div key={type} style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>{type}</Text>
                      <Text strong>{count as number}</Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {renderMetric(
        isMeeting ? <TeamOutlined /> : <MailOutlined />,
        'Total',
        formatNumber(data.total_count || 0),
        data.inbound_count ? `${formatNumber(data.inbound_count)} received` : ''
      )}
      
      {!isMeeting && data.avg_response_time_minutes && (
        <Tooltip title="Average time to respond to messages">
          {renderMetric(
            <ClockCircleOutlined />,
            'Avg. Response Time',
            `${Math.round(data.avg_response_time_minutes)}m`,
            'to respond'
          )}
        </Tooltip>
      )}
      
      {data.engagement_by_contact && Object.keys(data.engagement_by_contact).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Divider style={{ margin: '12px 0' }} />
          <Text strong>Top Contacts</Text>
          {Object.entries(data.engagement_by_contact)
            .slice(0, 3)
            .map(([contact, count]) => (
              <div key={contact} style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text ellipsis style={{ maxWidth: '70%' }}>
                    {contact}
                  </Text>
                  <Text strong>{count as number}</Text>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {data.volume_by_date && Object.keys(data.volume_by_date).length > 1 && (
        <div style={{ marginTop: 16 }}>
          <Divider style={{ margin: '12px 0' }} />
          <Text strong>Activity Trend</Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              {Object.values(data.volume_by_date).reduce((a: number, b: number) => a + b, 0) / Object.keys(data.volume_by_date).length > 1.5 ? (
                <>
                  <ArrowUpOutlined style={{ color: '#52c41a' }} /> Higher than usual
                </>
              ) : (
                <>
                  <ArrowDownOutlined style={{ color: '#f5222d' }} /> Lower than usual
                </>
              )}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementMetrics;
