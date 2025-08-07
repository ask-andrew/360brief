import React, { useEffect, useRef, useCallback } from 'react';
import { Card, Typography, Empty, Button } from 'antd';
import * as echarts from 'echarts/core';
import { GraphChart, GraphSeriesOption } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { LabelLayout } from 'echarts/features';

// Register the required components
echarts.use([
  GraphChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
  LabelLayout,
]);

const { Text } = Typography;

interface Node {
  id: string;
  name: string;
  email?: string;
  is_external?: boolean;
  degree?: number;
  projects?: string[];
  messageCount?: number;
}

interface Link {
  source: string;
  target: string;
  weight?: number;
  projects?: string[];
}

interface ProjectData {
  id: string;
  name: string;
  participants: string[];
  messageCount: number;
}

interface NetworkGraphProps {
  data: {
    nodes?: Node[];
    links?: Link[];
    projects?: ProjectData[];
  };
  viewMode?: 'people' | 'projects';
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string | null) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  data, 
  viewMode = 'people',
  selectedProjectId = null,
  onProjectSelect
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Format data for the graph
  const formatData = useCallback((): { 
    nodes: any[]; 
    links: any[]; 
    categories?: Array<{name: string}>
  } => {
    if (viewMode === 'projects' && data.projects) {
      // Format project nodes
      const projectNodes = data.projects.map(project => ({
        id: `project-${project.id}`,
        name: project.name,
        symbolSize: 15 + Math.min(40, Math.sqrt(project.messageCount) * 2),
        itemStyle: { color: '#722ed1' },
        category: 2, // Project category
        label: { show: true },
        tooltip: {
          formatter: (params: any) => `
            <div style="margin: 0">
              <div><strong>${project.name}</strong></div>
              <div>Participants: ${project.participants.length}</div>
              <div>Messages: ${project.messageCount}</div>
            </div>
          `,
        },
        projectId: project.id,
      }));

      // Format participant nodes
      const participantNodes = data.nodes?.filter(node => 
        data.projects?.some(p => p.participants.includes(node.id))
      ).map(node => ({
        ...node,
        symbolSize: 10 + Math.min(30, Math.sqrt(node.messageCount || 1) * 3),
        itemStyle: { color: node.is_external ? '#eb2f96' : '#1890ff' },
        category: node.is_external ? 1 : 0,
        label: { show: true },
      })) || [];

      // Create links between projects and participants
      const projectLinks: any[] = [];
      data.projects.forEach(project => {
        project.participants.forEach(participantId => {
          projectLinks.push({
            source: `project-${project.id}`,
            target: participantId,
            lineStyle: {
              width: 1,
              opacity: 0.6,
              curveness: 0.1,
              type: 'dashed'
            }
          });
        });
      });

      return { 
        nodes: [...projectNodes, ...participantNodes], 
        links: projectLinks,
        categories: [
          { name: 'Internal' },
          { name: 'External' },
          { name: 'Project' }
        ]
      };
    }

    // Original people view
    if (!data?.nodes || !data?.links) {
      return { nodes: [], links: [], categories: [] };
    }

    // Calculate degree for each node if not provided
    const nodes = data.nodes.map(node => {
      const degree = node.degree || data.links?.filter(
        link => link.source === node.id || link.target === node.id
      ).length || 0;
      
      return {
        id: node.id,
        name: node.name,
        email: node.email,
        symbolSize: 10 + Math.min(30, Math.sqrt(degree) * 5), // Scale node size based on degree
        itemStyle: {
          color: node.is_external ? '#eb2f96' : '#1890ff',
        },
        category: node.is_external ? 1 : 0,
        label: {
          show: degree > 1, // Only show label for nodes with multiple connections
        },
        tooltip: {
          formatter: (params: any) => {
            return `
              <div style="margin: 0">
                <div><strong>${params.data.name}</strong></div>
                ${params.data.email ? `<div>${params.data.email}</div>` : ''}
                <div>Connections: ${degree}</div>
              </div>
            `;
          },
        },
      };
    });

    // Format links
    const links = (data.links || []).map(link => ({
      source: link.source,
      target: link.target,
      value: link.weight || 1,
      lineStyle: {
        width: 1 + (link.weight ? Math.min(link.weight / 2, 5) : 1),
        opacity: 0.6,
        curveness: 0.2,
      },
    }));

    return { 
      nodes, 
      links,
      categories: [
        { name: 'Internal' },
        { name: 'External' }
      ]
    };
  }, [data]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const { nodes, links, categories } = formatData();

    // Set chart options
    const option: echarts.ComposeOption<GraphSeriesOption> = {
      tooltip: {},
      legend: [
        {
          data: categories?.map(cat => cat.name) || ['Internal', 'External'],
          selectedMode: 'multiple',
          icon: 'circle',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: {
            fontSize: 12,
          },
          right: 10,
          top: 10,
        },
      ],
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          name: 'Communication Network',
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links.map(link => ({
            ...link,
            lineStyle: {
              width: 1 + (link.weight ? Math.min(link.weight / 2, 5) : 1),
              opacity: 0.6,
              curveness: 0.2,
            },
          })),
          categories: categories || [
            { name: 'Internal' },
            { name: 'External' },
          ],
          roam: true,
          label: {
            show: true,
            position: 'right',
            fontSize: 12,
          },
          lineStyle: {
            color: 'source',
            curveness: 0.2,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 2,
            },
          },
          force: {
            repulsion: viewMode === 'projects' ? 200 : 100,
            edgeLength: viewMode === 'projects' ? [100, 200] : [50, 150],
            layoutAnimation: true,
            gravity: viewMode === 'projects' ? 0.05 : 0.1,
          },
          selectedMode: 'single',
          select: {
            itemStyle: {
              borderColor: '#000',
              borderWidth: 2
            }
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 2,
            },
          },
          scaleLimit: {
            min: 0.5,
            max: 2,
          },
        },
      ],
    };

    // Set chart options
    chartInstance.current.setOption(option);

    // Handle window resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [data, formatData]);

  // Show empty state if no data
  if (!data?.nodes?.length || !data?.links?.length) {
    return (
      <Card 
        title={viewMode === 'projects' ? 'Project Network' : 'Communication Network'}
        extra={
          onProjectSelect && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                type={viewMode === 'people' ? 'primary' : 'default'}
                onClick={() => onProjectSelect?.(null)}
                size="small"
              >
                People View
              </Button>
              <Button 
                type={viewMode === 'projects' ? 'primary' : 'default'}
                onClick={() => onProjectSelect?.('all')}
                size="small"
              >
                Projects View
              </Button>
            </div>
          )
        }
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Empty 
            description={
              <Text type="secondary">
                No network data available. Connect more channels to see your communication network.
              </Text>
            }
          />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={viewMode === 'projects' ? 'Project Network' : 'Communication Network'}
      extra={
        onProjectSelect && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              type={viewMode === 'people' ? 'primary' : 'default'}
              onClick={() => onProjectSelect?.(null)}
              size="small"
            >
              People View
            </Button>
            <Button 
              type={viewMode === 'projects' ? 'primary' : 'default'}
              onClick={() => onProjectSelect?.('all')}
              size="small"
            >
              Projects View
            </Button>
          </div>
        )
      }
    >
      <div ref={chartRef} style={{ width: '100%', height: '500px' }} />
    </Card>
  );
};

export default NetworkGraph;
