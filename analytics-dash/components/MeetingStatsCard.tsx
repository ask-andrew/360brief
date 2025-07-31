
import React from 'react';
import type { MeetingStats, MetricValue } from '../types';
import { ClockIcon, TrendUpIcon, TrendDownIcon } from '../constants';

// Default metric values to ensure we always have valid data
// Default metric values to ensure we always have valid data
const defaultMetric: MetricValue = {
  value: 0,
  trend: '0%',
  trendDirection: 'up' as const
};

// Default meeting stats to ensure we always have valid data
const defaultMeetingStats: MeetingStats = {
  avgDuration: { ...defaultMetric },
  totalHours: { ...defaultMetric },
  meetingsPerWeek: { ...defaultMetric }
};

const StatLine: React.FC<{
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
}> = ({ label, value, trend, trendDirection }) => (
  <div>
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <div className="flex items-baseline space-x-2">
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <div className="flex items-center text-xs">
        {trendDirection === 'up' ? <TrendUpIcon /> : <TrendDownIcon />}
        <span className="ml-1">{trend}</span>
      </div>
    </div>
  </div>
);

export const MeetingStatsCard: React.FC<{ stats?: Partial<MeetingStats> }> = ({ stats = {} }) => {
  // Safely merge provided stats with defaults
  const safeStats: MeetingStats = {
    ...defaultMeetingStats,
    ...stats,
    avgDuration: {
      ...defaultMetric,
      ...(stats.avgDuration || {})
    },
    totalHours: {
      ...defaultMetric,
      ...(stats.totalHours || {})
    },
    meetingsPerWeek: {
      ...defaultMetric,
      ...(stats.meetingsPerWeek || {})
    }
  };

  // Safely calculate total hours
  const totalHours = Math.round((safeStats.totalHours?.value || 0) * 100) / 100;
  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md flex flex-col">
       <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Meeting Stats</h3>
       <div className="flex-grow flex flex-col justify-around space-y-4">
            <StatLine 
                label="Total Hours in Meetings"
                value={`${totalHours}h`}
                trend={safeStats.totalHours.trend}
                trendDirection={safeStats.totalHours.trendDirection}
            />
             <StatLine 
                label="Avg. Duration"
                value={`${safeStats.avgDuration.value}m`}
                trend={safeStats.avgDuration.trend}
                trendDirection={safeStats.avgDuration.trendDirection}
            />
             <StatLine 
                label="Meetings per Week"
                value={`${stats.meetingsPerWeek.value}`}
                trend={stats.meetingsPerWeek.trend}
                trendDirection={stats.meetingsPerWeek.trendDirection}
            />
       </div>
    </div>
  );
};
