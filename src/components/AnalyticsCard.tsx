'use client';

import { ArrowUp, ArrowDown, Clock, Mail, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

type AnalyticsCardProps = {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  loading?: boolean;
};

const AnalyticsCard = ({ title, value, change, icon, loading = false }: AnalyticsCardProps) => {
  const isPositive = change !== undefined ? change >= 0 : null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mt-2"></div>
          ) : (
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </div>
      
      {change !== undefined && !loading && (
        <div className={`mt-4 flex items-center text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? (
            <ArrowUp className="w-4 h-4 mr-1" />
          ) : (
            <ArrowDown className="w-4 h-4 mr-1" />
          )}
          <span>{Math.abs(change)}% {isPositive ? 'increase' : 'decrease'} from last week</span>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCard;
