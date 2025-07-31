
import React from 'react';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className = '', contentClassName }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md flex flex-col ${className}`}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      <div className={`flex-grow ${contentClassName || 'h-64'}`}>{children}</div>
    </div>
  );
};
