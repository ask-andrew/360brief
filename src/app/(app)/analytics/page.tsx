'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

// Dynamically import the AnalyticalDashboard component with no SSR
const AnalyticalDashboard = dynamic(
  () => import('@/components/analytics/AnalyticalDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
);

export default function AnalyticsPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Key metrics and insights from your communications</p>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Preparing your analytics...</p>
          </div>
        </div>
      }>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <AnalyticalDashboard />
        </div>
      </Suspense>
    </div>
  );
}
