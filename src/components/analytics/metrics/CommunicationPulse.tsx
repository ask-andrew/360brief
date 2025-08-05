import React from 'react';
import { Row, Col, Statistic, Card, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface CommunicationPulseProps {
  data: {
    total_count?: number;
    inbound_count?: number;
    outbound_count?: number;
    avg_response_time_minutes?: number;
  };
}

const CommunicationPulse: React.FC<CommunicationPulseProps> = ({ data }) => {
  if (!data) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 100, direction: 'up' };
    const percent = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(percent)),
      direction: percent >= 0 ? 'up' : 'down',
    };
  };

  // Mock previous period data (in a real app, this would come from your API)
  const previousData = {
    total_count: data.total_count ? Math.round(data.total_count * 0.8) : 0,
    inbound_count: data.inbound_count ? Math.round(data.inbound_count * 0.85) : 0,
    outbound_count: data.outbound_count ? Math.round(data.outbound_count * 0.75) : 0,
    avg_response_time_minutes: data.avg_response_time_minutes 
      ? data.avg_response_time_minutes * 1.2 
      : 0,
  };

  const totalTrend = getTrend(data.total_count || 0, previousData.total_count);
  const inboundTrend = getTrend(data.inbound_count || 0, previousData.inbound_count);
  const outboundTrend = getTrend(data.outbound_count || 0, previousData.outbound_count);
  const responseTrend = getTrend(
    data.avg_response_time_minutes || 0,
    previousData.avg_response_time_minutes
  );

  const renderTrend = (trend: { value: number; direction: string }) => (
    <span style={{ color: trend.direction === 'up' ? '#52c41a' : '#f5222d', marginLeft: 8 }}>
      {trend.direction === 'up' ? (
        <ArrowUpOutlined />
      ) : (
        <ArrowDownOutlined />
      )}
      {trend.value}%
    </span>
  );

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Communications"
            value={formatNumber(data.total_count || 0)}
            suffix={
              <Text type="secondary" style={{ fontSize: '0.8em' }}>
                vs. {formatNumber(previousData.total_count)} last period
                {renderTrend(totalTrend)}
              </Text>
            }
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Inbound"
            value={formatNumber(data.inbound_count || 0)}
            suffix={
              <Text type="secondary" style={{ fontSize: '0.8em' }}>
                {((data.inbound_count || 0) / (data.total_count || 1) * 100).toFixed(1)}% of total
                {renderTrend(inboundTrend)}
              </Text>
            }
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Outbound"
            value={formatNumber(data.outbound_count || 0)}
            suffix={
              <Text type="secondary" style={{ fontSize: '0.8em' }}>
                {((data.outbound_count || 0) / (data.total_count || 1) * 100).toFixed(1)}% of total
                {renderTrend(outboundTrend)}
              </Text>
            }
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Avg. Response Time"
            value={data.avg_response_time_minutes ? Math.round(data.avg_response_time_minutes) : 'N/A'}
            suffix={
              <Text type="secondary" style={{ fontSize: '0.8em' }}>
                {data.avg_response_time_minutes ? 'minutes' : ''}
                {data.avg_response_time_minutes && renderTrend(responseTrend)}
              </Text>
            }
          />
        </Card>
      </Col>
    </Row>
  );
};

export default CommunicationPulse;
