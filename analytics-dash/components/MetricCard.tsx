
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  trendIcon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, trendIcon }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            {icon}
        </div>
        <p className="text-4xl font-bold mt-4 text-slate-900 dark:text-white">{value}</p>
      </div>
      <div className="flex items-center mt-2">
        {trendIcon}
        <p className="text-sm text-slate-500 dark:text-slate-400 ml-2">{trend}</p>
      </div>
    </div>
  );
};
