
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { TopContactDataPoint } from '../../types';

interface TopContactsChartProps {
  data: TopContactDataPoint[];
}

const COLORS = {
  'Email': '#3b82f6',
  'Slack': '#a855f7',
  'Meetings': '#ec4899'
};

export const TopContactsChart: React.FC<TopContactsChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={100} 
          tick={{ fill: '#94a3b8', fontSize: 12 }} 
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(71, 85, 105, 0.3)' }}
          contentStyle={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            borderColor: '#475569',
            color: '#cbd5e1',
          }}
          labelStyle={{ color: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ bottom: -5, fontSize: "12px" }} />
        <Bar dataKey="email" stackId="a" fill={COLORS['Email']} name="Email" />
        <Bar dataKey="slack" stackId="a" fill={COLORS['Slack']} name="Slack" />
        <Bar dataKey="meetings" stackId="a" fill={COLORS['Meetings']} name="Meetings" />
      </BarChart>
    </ResponsiveContainer>
  );
};