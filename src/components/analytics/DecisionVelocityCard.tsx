'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface DecisionVelocityData {
  avg_response_hours: number;
  velocity_score: number;
  total_responses: number;
}

export function DecisionVelocityCard({ userId }: { userId: string }) {
  const [data, setData] = useState<DecisionVelocityData | null>(null);
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
        const response = await fetch(`/api/insights/decision_velocity?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch insight');
        }
        
        const result = await response.json();
        setData(result.value);
        setError(null);
      } catch (err) {
        console.error('Error fetching decision velocity:', err);
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
          <Zap className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-semibold text-sm">Decision Velocity</h3>
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
          <span className="text-sm text-muted-foreground">Computing decision velocity…</span>
        </div>
      </Card>
    );
  }

  const { avg_response_hours, velocity_score, total_responses } = data;
  const isGood = velocity_score >= 70;
  const Icon = isGood ? TrendingUp : TrendingDown;

  return (
    <Card className="p-6 border-l-4 border-l-emerald-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Decision Velocity</h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${isGood ? 'from-emerald-100 to-green-100' : 'from-orange-100 to-yellow-100'} flex items-center justify-center`}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isGood ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {Math.round(velocity_score)}
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Response Time</span>
                <span className="text-sm font-medium">
                  {avg_response_hours < 1 
                    ? `${Math.round(avg_response_hours * 60)}m`
                    : `${avg_response_hours.toFixed(1)}h`}
                </span>
              </div>
              
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${isGood ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-orange-500 to-yellow-500'}`}
                  style={{ width: `${velocity_score}%` }}
                />
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className={`w-3 h-3 ${isGood ? 'text-emerald-600' : 'text-orange-600'}`} />
                <span>{total_responses} responses analyzed</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            {isGood 
              ? '⚡ Excellent! You respond quickly and keep conversations moving.'
              : '💡 Consider setting aside dedicated time blocks for email responses.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
