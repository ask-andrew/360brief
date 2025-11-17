'use client';

import { Suspense, useState } from 'react';
import { ModernAnalyticsDashboard } from '@/components/analytics/ModernAnalyticsDashboard';
import ExecutiveDashboard from '@/components/analytics/ExecutiveDashboard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('executive');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="executive">Executive View</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Suspense fallback={<AnalyticsLoading />}>
        {activeTab === 'executive' ? <ExecutiveDashboard /> : <ModernAnalyticsDashboard />}
      </Suspense>
    </div>
  );
}
