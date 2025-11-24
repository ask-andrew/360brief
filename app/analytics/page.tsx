'use client';

import { Suspense } from 'react';
import { ExecutiveAnalyticsDashboard } from '@/components/analytics/ExecutiveAnalyticsDashboard';
import { AnalyticsLoading } from '@/components/analytics/AnalyticsLoading';

/**
 * Analytics Page
 * Displays executive-level communication analytics and insights
 */
export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Suspense fallback={<AnalyticsLoading />}>
        <ExecutiveAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
