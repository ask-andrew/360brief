import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Card, Typography, Empty, Switch, Space, Radio, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
  const [showInbound, setShowInbound] = useState(true);
  const [showOutbound, setShowOutbound] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Toggle message direction
  const toggleInbound = (checked: boolean) => {
    setShowInbound(checked);
  };

  const toggleOutbound = (checked: boolean) => {
    setShowOutbound(checked);
  };

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data?.dates?.length) return null;

    const series: any[] = [];
    const colors = {
      email: { inbound: '#1890ff', outbound: '#69c0ff' },
      slack: { inbound: '#52c41a', outbound: '#95de64' },
      meeting: { inbound: '#722ed1', outbound: '#b37feb' },
    };

    // Filter data based on time range
    const filterDataByRange = (data: number[] | undefined, range: number) => {
      if (!data) return [];
      return data.slice(-range);
    };

    const rangeMap = {
      week: 7,
      month: 30,
      quarter: 90
    };

    const range = rangeMap[timeRange];
    const filteredDates = filterDataByRange(data.dates as any, range);

    // Add series for each communication type
    (['email', 'slack', 'meeting'] as const).forEach(type => {
      if (showInbound && data[type]?.inbound?.length) {
        const inboundData = filterDataByRange(data[type]?.inbound, range);
        series.push({
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Inbound`,
          type: 'line',
          stack: 'total',
          smooth: true,
          lineStyle: {
            width: 3,
            type: 'solid',
          },
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${colors[type].inbound}60` },
              { offset: 1, color: `${colors[type].inbound}15` },
            ]),
          },
          emphasis: {
            focus: 'series',
            lineStyle: {
              width: 4,
            }
          },
          data: inboundData,
          itemStyle: {
            color: colors[type].inbound,
          },
        });
      }

      if (showOutbound && data[type]?.outbound?.length) {
        const outboundData = filterDataByRange(data[type]?.outbound, range);
        series.push({
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Outbound`,
          type: 'line',
          stack: 'total',
          smooth: true,
          lineStyle: {
            width: 3,
            type: 'solid',
            opacity: 0.9,
          },
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${colors[type].outbound}50` },
              { offset: 1, color: `${colors[type].outbound}10` },
            ]),
          },
          emphasis: {
            focus: 'series',
            lineStyle: {
              width: 4,
              opacity: 1,
            }
          },
          data: outboundData,
          itemStyle: {
            color: colors[type].outbound,
          },
        });
      }
    });

    return {
      series,
      dates: filteredDates,
    };
  }, [data, showInbound, showOutbound]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartData?.series.length || !chartRef.current) return;

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

  // Show empty state if no data or no series selected
  if (!chartData?.series.length || (!showInbound && !showOutbound)) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Communication Volume</h3>
            <Text type="secondary">Toggle message directions to view data</Text>
          </div>
          <Space size="middle">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Inbound</span>
              <Switch 
                checked={showInbound}
                onChange={toggleInbound}
                checkedChildren={<ArrowDownOutlined />}
                unCheckedChildren={<ArrowDownOutlined />}
                style={{ backgroundColor: showInbound ? '#1890ff' : '#d9d9d9' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Outbound</span>
              <Switch 
                checked={showOutbound}
                onChange={toggleOutbound}
                checkedChildren={<ArrowUpOutlined />}
                unCheckedChildren={<ArrowUpOutlined />}
                style={{ backgroundColor: showOutbound ? '#52c41a' : '#d9d9d9' }}
              />
            </div>
            <Radio.Group 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="week">Week</Radio.Button>
              <Radio.Button value="month">Month</Radio.Button>
              <Radio.Button value="quarter">Quarter</Radio.Button>
            </Radio.Group>
          </Space>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '300px',
          border: '1px dashed #d9d9d9',
          borderRadius: '8px',
          backgroundColor: '#fafafa'
        }}>
          <Empty 
            description={
              <span>
                {!showInbound && !showOutbound 
                  ? "Please select at least one message direction"
                  : "No communication data available for the selected filters"
                }
              </span>
            } 
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Communication Volume</h3>
          <Text type="secondary">
            Showing {timeRange}ly data 
            <Tooltip title="Adjust time range to analyze communication patterns">
              <InfoCircleOutlined style={{ marginLeft: '8px', color: '#8c8c8c' }} />
            </Tooltip>
          </Text>
        </div>
        <Space size="middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Inbound</span>
            <Switch 
              checked={showInbound}
              onChange={toggleInbound}
              checkedChildren={<ArrowDownOutlined />}
              unCheckedChildren={<ArrowDownOutlined />}
              style={{ backgroundColor: showInbound ? '#1890ff' : '#d9d9d9' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Outbound</span>
            <Switch 
              checked={showOutbound}
              onChange={toggleOutbound}
              checkedChildren={<ArrowUpOutlined />}
              unCheckedChildren={<ArrowUpOutlined />}
              style={{ backgroundColor: showOutbound ? '#52c41a' : '#d9d9d9' }}
            />
          </div>
          <Radio.Group 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="week">Week</Radio.Button>
            <Radio.Button value="month">Month</Radio.Button>
            <Radio.Button value="quarter">Quarter</Radio.Button>
          </Radio.Group>
        </Space>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default CommunicationVolume;
