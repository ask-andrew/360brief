'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface RadarItem {
  id: string;
  summary: string;
  impactArea: string;
  urgencyScore: 'Low' | 'Medium' | 'High';
  severityScore: 'Minor' | 'Major' | 'Critical';
  suggestedAction: string;
  relatedEmails: string[];
}

interface RadarChartProps {
  data: RadarItem[];
}

const scoreToValue = {
  Low: 1,
  Medium: 2,
  High: 3,
  Minor: 1,
  Major: 2,
  Critical: 3,
};

export default function RadarChart({ data }: RadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const myChart = echarts.init(chartRef.current);

      const impactAreas = [...new Set(data.map(item => item.impactArea))];
      const indicators = impactAreas.map(area => ({ name: area, max: 3 }));

      const urgencyData = {
        name: 'Urgency',
        value: impactAreas.map(area => {
          const items = data.filter(item => item.impactArea === area);
          if (items.length === 0) return 0;
          const avgScore = items.reduce((acc, item) => acc + scoreToValue[item.urgencyScore], 0) / items.length;
          return avgScore;
        })
      };

      const severityData = {
        name: 'Severity',
        value: impactAreas.map(area => {
          const items = data.filter(item => item.impactArea === area);
          if (items.length === 0) return 0;
          const avgScore = items.reduce((acc, item) => acc + scoreToValue[item.severityScore], 0) / items.length;
          return avgScore;
        })
      };

      const option = {
        title: {
          text: 'Proactive Risk & Opportunity Radar'
        },
        tooltip: {},
        legend: {
          data: ['Urgency', 'Severity']
        },
        radar: {
          indicator: indicators
        },
        series: [{
          name: 'Risk Radar',
          type: 'radar',
          data: [urgencyData, severityData]
        }]
      };

      myChart.setOption(option);

      return () => {
        myChart.dispose();
      };
    }
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: '500px' }}></div>;
}
