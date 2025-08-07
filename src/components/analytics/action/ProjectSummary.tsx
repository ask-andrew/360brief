import React, { useState } from 'react';
import { Card, Button, Spin, Alert, Typography, List, Tag, Space, Tooltip } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface SummaryData {
  summary: string;
  key_points: string[];
  actions: string[];
  status?: string;
  error?: string;
}

interface ProjectSummaryProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: string;
    type: string;
  }>;
}

export const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  projectId,
  projectName,
  onClose,
  messages
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          messages: messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            timestamp: msg.timestamp,
            type: msg.type
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary(data);
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Project Summary: {projectName}</span>
        </Space>
      }
      extra={
        <Button type="link" onClick={onClose}>
          Close
        </Button>
      }
      style={{ width: '100%', marginBottom: 16 }}
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!summary ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Button
            type="primary"
            onClick={generateSummary}
            loading={isLoading}
            icon={<FileTextOutlined />}
            size="large"
          >
            Generate AI Summary
          </Button>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Get a concise summary of this project's communications
          </Text>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Summary</Title>
            <Paragraph>{summary.summary}</Paragraph>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Key Points</Title>
            <List
              size="small"
              dataSource={summary.key_points}
              renderItem={(point) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    title={point}
                  />
                </List.Item>
              )}
            />
          </div>

          <div>
            <Title level={5}>Actions & Next Steps</Title>
            <List
              size="small"
              dataSource={summary.actions}
              renderItem={(action) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                    title={action}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProjectSummary;
