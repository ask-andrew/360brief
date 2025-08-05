import React, { useEffect, useRef, useCallback } from 'react';
import { Card, Typography, Empty } from 'antd';
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

interface NetworkGraphProps {
  data: {
    nodes?: Array<{
      id: string;
      name: string;
      email?: string;
      is_external?: boolean;
      degree?: number;
    }>;
    links?: Array<{
      source: string;
      target: string;
      weight?: number;
    }>;
  };
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Format data for the graph
  const formatData = useCallback(() => {
    if (!data?.nodes || !data?.links) {
      return { nodes: [], links: [] };
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

    return { nodes, links };
  }, [data]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const { nodes, links } = formatData();

    // Set chart options
    const option: echarts.ComposeOption<GraphSeriesOption> = {
      tooltip: {},
      legend: [
        {
          data: ['Internal', 'External'],
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
          links: links,
          categories: [
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
            repulsion: 100,
            edgeLength: [50, 150],
            layoutAnimation: true,
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
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Empty 
          description={
            <Text type="secondary">
              No network data available. Connect more channels to see your communication network.
            </Text>
          }
        />
      </div>
    );
  }

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height: '500px',
        minHeight: '500px',
      }} 
    />
  );
};

export default NetworkGraph;
