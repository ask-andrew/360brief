// src/components/briefs/NarrativeFeedbackDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FeedbackStats {
  total_feedback: number;
  helpful_count: number;
  not_helpful_count: number;
  helpful_rate: number;
  engine_performance: Record<string, any>;
  project_performance: Record<string, any>;
  recent_feedback: any[];
}

export function NarrativeFeedbackDashboard() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbackStats();
  }, []);

  const fetchFeedbackStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Authentication required');
        return;
      }

      // Fetch user's feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from('narrative_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (feedbackError) {
        throw feedbackError;
      }

      // Calculate stats
      const total_feedback = feedback.length;
      const helpful_count = feedback.filter(f => f.feedback_type === 'helpful').length;
      const not_helpful_count = total_feedback - helpful_count;
      const helpful_rate = total_feedback > 0 ? (helpful_count / total_feedback) * 100 : 0;

      // Engine performance
      const engine_performance: Record<string, any> = {};
      feedback.forEach(f => {
        const engine = f.engine_used;
        if (!engine_performance[engine]) {
          engine_performance[engine] = { total: 0, helpful: 0 };
        }
        engine_performance[engine].total += 1;
        if (f.feedback_type === 'helpful') {
          engine_performance[engine].helpful += 1;
        }
      });

      // Add rates
      Object.keys(engine_performance).forEach(engine => {
        const stats = engine_performance[engine];
        stats.rate = stats.total > 0 ? (stats.helpful / stats.total) * 100 : 0;
      });

      // Project performance
      const project_performance: Record<string, any> = {};
      feedback.forEach(f => {
        const types = f.project_types || [];
        types.forEach((type: string) => {
          if (!project_performance[type]) {
            project_performance[type] = { total: 0, helpful: 0 };
          }
          project_performance[type].total += 1;
          if (f.feedback_type === 'helpful') {
            project_performance[type].helpful += 1;
          }
        });
      });

      // Add rates
      Object.keys(project_performance).forEach(type => {
        const stats = project_performance[type];
        stats.rate = stats.total > 0 ? (stats.helpful / stats.total) * 100 : 0;
      });

      setStats({
        total_feedback,
        helpful_count,
        not_helpful_count,
        helpful_rate,
        engine_performance,
        project_performance,
        recent_feedback: feedback.slice(0, 10)
      });

    } catch (err) {
      console.error('Error fetching feedback stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading feedback analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_feedback === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-medium mb-2">No Feedback Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your feedback on narrative briefs will appear here and help improve the system.
          </p>
          <p className="text-xs text-muted-foreground">
            Look for 👍/👎 buttons when viewing narrative briefs to provide feedback.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Narrative Feedback Analytics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your feedback drives improvements to the synthesis system
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total_feedback}</div>
              <div className="text-sm text-muted-foreground">Total Feedback</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.helpful_count}</div>
              <div className="text-sm text-muted-foreground">Helpful</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.not_helpful_count}</div>
              <div className="text-sm text-muted-foreground">Needs Improvement</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.helpful_rate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>

          <Tabs defaultValue="engines" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="engines">Engine Performance</TabsTrigger>
              <TabsTrigger value="projects">Project Types</TabsTrigger>
              <TabsTrigger value="recent">Recent Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="engines" className="space-y-4">
              <div className="grid gap-3">
                {Object.entries(stats.engine_performance).map(([engine, engineStats]: [string, any]) => (
                  <div key={engine} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {engine.includes('llm') ? (
                        <Target className="w-4 h-4 text-purple-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{engine}</div>
                        <div className="text-xs text-muted-foreground">
                          {engineStats.helpful}/{engineStats.total} helpful
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{engineStats.rate.toFixed(1)}%</div>
                      <Badge variant={engineStats.rate >= 70 ? 'default' : 'destructive'} className="text-xs">
                        {engineStats.rate >= 70 ? 'Good' : 'Needs Work'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <div className="grid gap-3">
                {Object.entries(stats.project_performance).map(([projectType, projectStats]: [string, any]) => (
                  <div key={projectType} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                      <div>
                        <div className="font-medium text-sm capitalize">{projectType}</div>
                        <div className="text-xs text-muted-foreground">
                          {projectStats.helpful}/{projectStats.total} helpful
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{projectStats.rate.toFixed(1)}%</div>
                      <Badge variant={projectStats.rate >= 70 ? 'default' : 'destructive'} className="text-xs">
                        {projectStats.rate >= 70 ? 'Good' : 'Needs Work'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <div className="space-y-3">
                {stats.recent_feedback.map((feedback, index) => (
                  <div key={feedback.id || index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {feedback.feedback_type === 'helpful' ? (
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-red-500" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {feedback.engine_used}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feedback.project_types?.join(', ') || 'General'}
                      </Badge>
                    </div>

                    {feedback.feedback_comments && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        "{feedback.feedback_comments}"
                      </div>
                    )}

                    <div className="mt-2 text-xs text-muted-foreground">
                      {feedback.markdown_length} chars • {feedback.clusters_covered} clusters
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Improvement Status */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">How Your Feedback Helps</span>
            </div>
            <p className="text-sm text-blue-700">
              Your feedback is analyzed weekly to improve synthesis prompts and rules.
              Low-performing project types get specialized prompts, and common issues trigger rule updates.
              Current system learns from {stats.total_feedback} feedback points to deliver better cognitive relief.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
