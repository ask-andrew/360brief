'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';

interface InsightData {
  ratio: number;
  strategic_seconds: number;
  reactive_seconds: number;
}

/**
 * UI card that displays the Strategic vs Reactive Time Ratio insight.
 * It fetches the latest insight for the given user from the `/api/insights/strategic_vs_reactive` endpoint.
 */
export function StrategicRatioCard({ userId }: { userId: string }) {
  const [data, setData] = useState<InsightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchInsight = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/insights/strategic_vs_reactive?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch insight');
        }
        
        const result = await response.json();
        setData(result.value);
        setError(null);
      } catch (err) {
        console.error('Error fetching strategic insight:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
  }, [userId]);

  if (!userId) {
    return null;
  }

  if (error) {
    return (
      <Card className="p-6 border-l-4 border-l-orange-500">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-semibold text-sm">Strategic vs Reactive Time</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Insight will be available after your first data sync
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Computing strategic insights…</span>
        </div>
      </Card>
    );
  }

  const { ratio, strategic_seconds, reactive_seconds } = data;
  const percent = Math.round(ratio * 100);
  const strategicMinutes = Math.round(strategic_seconds / 60);
  const reactiveMinutes = Math.round(reactive_seconds / 60);

  return (
    <Card className="p-6 border-l-4 border-l-indigo-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-sm">Strategic vs Reactive Time</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{percent}%</div>
                  <div className="text-xs text-muted-foreground">Strategic</div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Strategic Time</span>
                  <span className="font-medium">{strategicMinutes} min</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Reactive Time</span>
                  <span className="font-medium">{reactiveMinutes} min</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-400 rounded-full transition-all"
                    style={{ width: `${100 - percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {percent >= 50 
              ? '✨ Great balance! You\'re spending quality time on strategic work.'
              : '💡 Consider blocking more time for strategic planning and deep work.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
