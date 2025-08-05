import React, { useEffect, useRef, useMemo } from 'react';
import { Card, Typography, Empty } from 'antd';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, LineSeriesOption, BarSeriesOption } from 'echarts/charts';
import { 
  TitleComponent, 
  TooltipComponent, 
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register the required components
echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

const { Text } = Typography;

type EChartsOption = echarts.ComposeOption<LineSeriesOption | BarSeriesOption>;

interface CommunicationVolumeProps {
  data: {
    dates?: string[];
    email?: {
      inbound?: number[];
      outbound?: number[];
    };
    slack?: {
      inbound?: number[];
      outbound?: number[];
    };
    meeting?: {
      inbound?: number[];
      outbound?: number[];
    };
  };
}

const CommunicationVolume: React.FC<CommunicationVolumeProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data?.dates?.length) return null;

    const series: any[] = [];
    const colors = {
      email: { inbound: '#1890ff', outbound: '#69c0ff' },
      slack: { inbound: '#52c41a', outbound: '#95de64' },
      meeting: { inbound: '#722ed1', outbound: '#b37feb' },
    };

    // Add series for each communication type
    (['email', 'slack', 'meeting'] as const).forEach(type => {
      if (data[type]?.inbound?.length) {
        series.push({
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Inbound`,
          type: 'line',
          stack: 'total',
          smooth: true,
          lineStyle: {
            width: 2,
            type: 'solid',
          },
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${colors[type].inbound}40` },
              { offset: 1, color: `${colors[type].inbound}10` },
            ]),
          },
          emphasis: {
            focus: 'series',
          },
          data: data[type]?.inbound,
          itemStyle: {
            color: colors[type].inbound,
          },
        });
      }

      if (data[type]?.outbound?.length) {
        series.push({
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Outbound`,
          type: 'line',
          stack: 'total',
          smooth: true,
          lineStyle: {
            width: 2,
            type: 'dashed',
          },
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${colors[type].outbound}40` },
              { offset: 1, color: `${colors[type].outbound}10` },
            ]),
          },
          emphasis: {
            focus: 'series',
          },
          data: data[type]?.outbound,
          itemStyle: {
            color: colors[type].outbound,
          },
        });
      }
    });

    return {
      dates: data.dates,
      series,
    };
  }, [data]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current || !chartData) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Set chart options
    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
      },
      legend: {
        data: chartData.series.map(s => s.name),
        type: 'scroll',
        orient: 'horizontal',
        bottom: 0,
        textStyle: {
          fontSize: 11,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: chartData.dates,
          axisLabel: {
            formatter: (value: string) => {
              // Format date to be more readable (e.g., "Jan 1")
              const date = new Date(value);
              return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
            },
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Volume',
          axisLabel: {
            formatter: '{value}',
          },
        },
      ],
      series: chartData.series,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          start: 0,
          end: 100,
          bottom: '5%',
          handleIcon:
            'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6z M13.3,22H6.7v-1.2h6.6z M13.3,19.6H6.7v-1.2h6.6z',
          handleSize: '80%',
          handleStyle: {
            color: '#fff',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowOffsetX: 2,
            shadowOffsetY: 2,
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
  }, [chartData]);

  // Show empty state if no data
  if (!chartData?.series.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Empty 
          description={
            <Text type="secondary">
              No communication volume data available
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
        height: '300px',
        minHeight: '300px',
      }} 
    />
  );
};

export default CommunicationVolume;
