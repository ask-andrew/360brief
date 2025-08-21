import React, { useEffect, useRef } from 'react';
import { Card, Typography } from 'antd';
import * as echarts from 'echarts/core';
import { PieChart, PieSeriesOption } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// Register the required components
echarts.use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  LabelLayout,
  CanvasRenderer,
]);

const { Text } = Typography;

interface TimeAllocationProps {
  data: {
    meetings_by_type?: {
      [key: string]: number;
    };
  };
}

const TimeAllocation: React.FC<TimeAllocationProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Process data for the chart
    const chartData = data?.meetings_by_type
      ? Object.entries(data.meetings_by_type).map(([name, value]) => ({
          name,
          value,
        }))
      : [];

    // Set chart options
    const option: echarts.ComposeOption<PieSeriesOption> = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          color: '#666',
        },
      },
      series: [
        {
          name: 'Time Allocation',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
              formatter: '{b}\n{c} ({d}%)',
            },
          },
          labelLine: {
            show: false,
          },
          data: chartData,
        },
      ],
      color: [
        '#1890ff',
        '#52c41a',
        '#faad14',
        '#f5222d',
        '#722ed1',
        '#eb2f96',
        '#13c2c2',
        '#fa8c16',
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
  }, [data]);

  // Show message if no data is available
  if (!data?.meetings_by_type || Object.keys(data.meetings_by_type).length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Text type="secondary">No meeting data available</Text>
      </div>
    );
  }

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height: '300px',
        minHeight: '300px',
      }} 
    />
  );
};

export default TimeAllocation;
