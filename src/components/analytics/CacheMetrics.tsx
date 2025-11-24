'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface CacheMetricsProps {
  lastSyncAt?: string | null;
  totalMessages?: number;
  cacheHitRate?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function CacheMetrics({
  lastSyncAt,
  totalMessages = 0,
  cacheHitRate = 0,
  onRefresh,
  isRefreshing = false,
}: CacheMetricsProps) {
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getCacheRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (rate >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Last Update */}
            <div className="flex items-center space-x-2">
              <div className="text-xs font-medium text-gray-600">Last updated:</div>
              <Badge variant="outline" className="font-mono text-xs">
                {lastSyncAt ? getRelativeTime(lastSyncAt) : 'never'}
              </Badge>
            </div>

            {/* Total Messages */}
            <div className="flex items-center space-x-2">
              <div className="text-xs font-medium text-gray-600">Messages:</div>
              <Badge variant="secondary" className="font-mono">
                {totalMessages.toLocaleString()}
              </Badge>
            </div>

            {/* Cache Hit Rate */}
            {cacheHitRate > 0 && (
              <div className="flex items-center space-x-2">
                <div className="text-xs font-medium text-gray-600">Cache:</div>
                <Badge
                  variant="outline"
                  className={`font-mono ${getCacheRateColor(cacheHitRate)}`}
                >
                  {cacheHitRate.toFixed(0)}% hit rate
                </Badge>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2 hover:bg-blue-100 hover:border-blue-300 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </Button>
          )}
        </div>

        {/* Performance Indicator */}
        {lastSyncAt && cacheHitRate > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-600">
                {cacheHitRate >= 80 ? (
                  <span className="flex items-center gap-1">
                    <span className="text-green-600">⚡</span>
                    <span>Lightning fast! Most data loaded from cache.</span>
                  </span>
                ) : cacheHitRate >= 50 ? (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-600">🔄</span>
                    <span>Partial cache hit. Some new messages fetched.</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="text-gray-600">📥</span>
                    <span>Fresh data sync completed.</span>
                  </span>
                )}
              </div>
              <div className="text-gray-500">
                Next sync: Automatic on refresh
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
