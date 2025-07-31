
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartDataPoint } from '../../types';

interface UnifiedCommunicationChartProps {
  data: ChartDataPoint[];
}

const COLORS = {
  'Email': '#3b82f6',
  'Slack': '#a855f7',
  'Meetings': '#ec4899'
};

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-col space-y-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
          <span className="w-4 h-4 mr-2" style={{ backgroundColor: entry.color }}></span>
          <span>{entry.value}</span>
          <span className="ml-auto font-semibold">{entry.payload.value}</span>
        </li>
      ))}
    </ul>
  );
};

// Custom Tooltip component for consistent and visible styling
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      return (
        <div className="p-2 bg-slate-800/95 border border-slate-700 rounded-md shadow-lg text-sm">
          <p className="font-bold text-slate-200">{`${dataPoint.name}: ${dataPoint.value}`}</p>
        </div>
      );
    }
  
    return null;
  };

export const UnifiedCommunicationChart: React.FC<UnifiedCommunicationChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
          content={<CustomTooltip />}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};
