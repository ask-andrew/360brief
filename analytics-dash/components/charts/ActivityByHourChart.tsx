
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ActivityHour } from '../../types';

interface ActivityByHourChartProps {
  data: ActivityHour[];
}

export const ActivityByHourChart: React.FC<ActivityByHourChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="hour" tick={{ fill: '#94a3b8' }} />
        <YAxis tick={{ fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            borderColor: '#475569',
            color: '#cbd5e1',
          }}
          labelStyle={{ color: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ bottom: 0, fontSize: "12px" }} />
        <Bar dataKey="emails" stackId="a" fill="#3b82f6" name="Emails" />
        <Bar dataKey="slack" stackId="a" fill="#a855f7" name="Slack" />
      </BarChart>
    </ResponsiveContainer>
  );
};
