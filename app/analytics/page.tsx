'use client';

import { Suspense } from 'react';
import { ModernAnalyticsDashboard } from '@/components/analytics/ModernAnalyticsDashboard';

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
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <ModernAnalyticsDashboard />
    </Suspense>
  );
}
