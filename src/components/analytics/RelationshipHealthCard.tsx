'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Heart, Users } from 'lucide-react';

interface RelationshipData {
  health_score: number;
  top_relationships: Array<{
    email: string;
    balance: number;
    total_interactions: number;
  }>;
  total_contacts: number;
}

export function RelationshipHealthCard({ userId }: { userId: string }) {
  const [data, setData] = useState<RelationshipData | null>(null);
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
        const response = await fetch(`/api/insights/relationship_health?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch insight');
        }
        
        const result = await response.json();
        setData(result.value);
        setError(null);
      } catch (err) {
        console.error('Error fetching relationship health:', err);
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
          <Heart className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="font-semibold text-sm">Relationship Health</h3>
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
          <span className="text-sm text-muted-foreground">Computing relationship health…</span>
        </div>
      </Card>
    );
  }

  const { health_score, top_relationships, total_contacts } = data;
  const isHealthy = health_score >= 70;

  return (
    <Card className="p-6 border-l-4 border-l-pink-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-pink-600" />
            <h3 className="font-semibold text-sm">Relationship Health</h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${isHealthy ? 'from-pink-100 to-rose-100' : 'from-orange-100 to-yellow-100'} flex items-center justify-center`}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isHealthy ? 'text-pink-600' : 'text-orange-600'}`}>
                    {health_score}%
                  </div>
                  <div className="text-xs text-muted-foreground">Balanced</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Healthy Relationships</span>
                <span className="text-sm font-medium">{top_relationships.length}</span>
              </div>
              
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${isHealthy ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-gradient-to-r from-orange-500 to-yellow-500'}`}
                  style={{ width: `${health_score}%` }}
                />
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{total_contacts} total contacts</span>
              </div>
            </div>
          </div>
          
          {top_relationships.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Top Connections:</p>
              {top_relationships.slice(0, 3).map((rel, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[200px]">{rel.email}</span>
                  <span className="text-muted-foreground">
                    {Math.round(rel.balance * 100)}% balanced
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-3">
            {isHealthy 
              ? '💚 Great! Your relationships show healthy two-way communication.'
              : '💡 Consider reaching out to contacts you haven\'t heard from recently.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
