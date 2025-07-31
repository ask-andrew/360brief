
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartDataPoint } from '../../types';

interface MeetingTimeAllocationChartProps {
  data: ChartDataPoint[];
}

const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#f59e0b'];

export const MeetingTimeAllocationChart: React.FC<MeetingTimeAllocationChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
           contentStyle={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            borderColor: '#475569',
            color: '#cbd5e1',
          }}
          labelStyle={{ color: '#f1f5f9' }}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend wrapperStyle={{fontSize: "12px"}}/>
      </PieChart>
    </ResponsiveContainer>
  );
};
