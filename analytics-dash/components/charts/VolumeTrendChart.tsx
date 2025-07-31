import React from 'react';
import { LineChart, AreaChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { VolumeDataPoint } from '../../types';

interface VolumeTrendChartProps {
  data: VolumeDataPoint[];
  sentKey: string;
  receivedKey: string;
  areaChart?: boolean;
}

export const VolumeTrendChart: React.FC<VolumeTrendChartProps> = ({ data, sentKey, receivedKey, areaChart = false }) => {
  const ChartComponent = areaChart ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartComponent data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis tick={{ fill: '#94a3b8' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            borderColor: '#475569',
            color: '#cbd5e1',
          }}
          labelStyle={{ color: '#f1f5f9' }}
        />
        <Legend />
        {areaChart ? (
          <>
            <Area
              type="monotone"
              dataKey={sentKey}
              stroke="#818cf8"
              fill="#818cf8"
              fillOpacity={0.3}
              name={sentKey.charAt(0).toUpperCase() + sentKey.slice(1)}
            />
            <Area
              type="monotone"
              dataKey={receivedKey}
              stroke="#f472b6"
              fill="#f472b6"
              fillOpacity={0.3}
              name={receivedKey.charAt(0).toUpperCase() + receivedKey.slice(1)}
            />
          </>
        ) : (
          <>
            <Line
              type="monotone"
              dataKey={sentKey}
              stroke="#818cf8"
              name={sentKey.charAt(0).toUpperCase() + sentKey.slice(1)}
            />
            <Line
              type="monotone"
              dataKey={receivedKey}
              stroke="#f472b6"
              name={receivedKey.charAt(0).toUpperCase() + receivedKey.slice(1)}
            />
          </>
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
};
