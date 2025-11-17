'use client';

import { useState, useEffect, useMemo } from 'react';
import * as React from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Users, 
  BarChart2, 
  PieChart, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Target, 
  Zap, 
  ArrowRight, 
  Info, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import SentimentInsights with no SSR
const SentimentInsights = dynamic(
  () => import('./SentimentInsights').then(mod => mod.SentimentInsights),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center">Loading sentiment analysis...</div> }
);
import ReactECharts from 'echarts-for-react';
import { supabase } from '@/utils/supabaseClient';

// Types
type RoadmapItem = {
  id: string;
  title: string;
  completed: boolean;
  children?: RoadmapItem[];
};

type ProjectProgress = {
  name: string;
  progress: number;
  target: number;
};

type AnalyticsData = {
  total_count: number;
  period_days: number;
  inbound_count: number;
  outbound_count: number;
  avg_response_time_minutes: number;
  channel_analytics: {
    by_channel: Array<{ name: string; count: number; percentage: number }>;
    by_time: Array<{ hour: string; count: number }>;
  };
  top_senders: Array<{ name: string; count: number }>;
  message_distribution: {
    by_day: Array<{ date: string; count: number }>;
    by_sender: Array<{ name: string; count: number }>;
  };
  sentiment_analysis: {
    positive: number;
    neutral: number;
    negative: number;
    overall_trend: string;
  };
  processing_metadata: {
    is_real_data: boolean;
    processed_at: string;
    message_count: number;
    days_analyzed: number;
  };
};

// Custom hook to fetch analytics data
const useAnalyticsData = (isDemo: boolean) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics data: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDemo]);

  return { data, loading, error };
};

// Component for rendering roadmap items with expand/collapse
const RoadmapItemComponent = ({ item }: { item: RoadmapItem }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="mb-4">
      <div 
        className={`flex items-center ${hasChildren ? 'cursor-pointer' : ''}`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren && (
          <ChevronRight 
            className={`h-4 w-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            aria-hidden="true"
          />
        )}
        <div 
          className={`h-4 w-4 rounded-full mr-2 flex-shrink-0 ${item.completed ? 'bg-green-500' : 'bg-gray-300'}`}
          aria-hidden="true"
        />
        <span className={`font-medium ${item.completed ? 'text-green-600' : ''}`}>
          {item.title}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-2 space-y-2">
          {item.children?.map(child => (
            <div key={child.id} className="flex items-center">
              <div 
                className={`h-3 w-3 rounded-full mr-2 ${child.completed ? 'bg-green-400' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
              <span className="text-sm">{child.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main dashboard component
const ExecutiveDashboard = () => {
  const { theme } = useTheme();
  const { data: analyticsData, loading: isLoading, error } = useAnalyticsData(false);
  const [userEmail, setUserEmail] = useState<string>('andrew.ledet@gmail.com');
  const [roadmapData, setRoadmapData] = useState<RoadmapItem[]>([]);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  
  // Load user email from Supabase session (client-side), fallback to configured default
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted && user?.email) {
          setUserEmail(user.email);
        }
      } catch {}
    })();
    return () => { mounted = false };
  }, []);

  // Fetch real messages from API for SentimentInsights
  const [messagesForAnalysis, setMessagesForAnalysis] = useState<Array<{
    id: string;
    subject: string;
    body: string;
    timestamp: string;
    from: string;
    to?: string;
    isRead?: boolean;
    isSent: boolean;
  }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/analytics/messages?daysBack=7&max=150', { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && Array.isArray(data.messages)) {
          setMessagesForAnalysis(data.messages);
          console.group('Messages API');
          console.log('total:', data.total, 'sent:', data.sentCount, 'received:', data.receivedCount);
          console.groupEnd();
        }
      } catch (e) {
        // Silent fail; UI will still render
      }
    })();
    return () => { mounted = false };
  }, []);
  
  // Process analytics data when it's loaded
  useEffect(() => {
    if (isLoading || !analyticsData) return;

    const totalMessages = analyticsData.total_count || 0;
    const topSenders = analyticsData.top_senders || [];
    const channelData = analyticsData.channel_analytics?.by_channel || [];

    // Update roadmap based on analytics
    const newRoadmap: RoadmapItem[] = [
      {
        id: '1',
        title: 'Initial Setup',
        completed: totalMessages > 0,
        children: [
          { 
            id: '1-1', 
            title: 'Connect communication channels', 
            completed: channelData.length > 0 
          },
          { 
            id: '1-2', 
            title: 'Analyze initial message volume', 
            completed: totalMessages > 0 
          },
        ],
      },
      {
        id: '2',
        title: 'Data Analysis',
        completed: topSenders.length > 0,
        children: [
          { 
            id: '2-1', 
            title: 'Identify top senders', 
            completed: topSenders.length > 0 
          },
          { 
            id: '2-2', 
            title: 'Analyze channel distribution', 
            completed: channelData.length > 0 
          },
        ],
      },
    ];

    // Update project progress based on analytics
    const newProjectProgress: ProjectProgress[] = [
      {
        name: 'Message Analysis',
        progress: Math.min(100, Math.floor(totalMessages / 1000 * 100)),
        target: 1000,
      },
      {
        name: 'Top Senders Identified',
        progress: Math.min(100, topSenders.length * 20),
        target: 5,
      },
    ];

    setRoadmapData(newRoadmap);
    setProjectProgress(newProjectProgress);
  }, [analyticsData, isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading analytics data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
        <p className="text-gray-500 mb-4">We couldn't load your analytics data. Please try again.</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your communication analytics and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.total_count.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {analyticsData?.period_days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inbound/Outbound</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.inbound_count || '0'} / {analyticsData?.outbound_count || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.inbound_count && analyticsData?.outbound_count 
                ? `${Math.round((analyticsData.outbound_count / analyticsData.inbound_count) * 100)}% response ratio`
                : 'Inbound / Outbound'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.avg_response_time_minutes 
                ? `${Math.round(analyticsData.avg_response_time_minutes)}m` 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to respond
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
            {analyticsData?.sentiment_analysis.overall_trend === 'positive' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : analyticsData?.sentiment_analysis.overall_trend === 'negative' ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {analyticsData?.sentiment_analysis.overall_trend || 'Neutral'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.sentiment_analysis.positive}% positive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Sentiment Analysis - Full Width */}
        <Card className="col-span-7">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <CardTitle>Sentiment Analysis</CardTitle>
              </div>
              {analyticsData?.sentiment_analysis?.overall_trend && (
                <div className="text-sm text-muted-foreground">
                  <span className="capitalize">
                    {analyticsData.sentiment_analysis.overall_trend} overall sentiment
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <SentimentInsights messages={messagesForAnalysis} />
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>
              Track the progress of key analytics initiatives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectProgress.map((project) => (
              <div key={project.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{project.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Analytics Roadmap</CardTitle>
            <CardDescription>
              Your personalized analytics implementation plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roadmapData.map((item) => (
                <RoadmapItemComponent key={item.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Visualization Row */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Distribution</CardTitle>
            <CardDescription>
              Breakdown of messages by communication channel
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{b}: {c} ({d}%)',
                },
                legend: {
                  orient: 'vertical',
                  right: 10,
                  top: 'center',
                  data: analyticsData?.channel_analytics.by_channel.map((c) => c.name) || [],
                },
                series: [
                  {
                    name: 'Channels',
                    type: 'pie',
                    radius: ['50%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                      borderRadius: 10,
                      borderColor: theme === 'dark' ? '#1e1e2d' : '#fff',
                      borderWidth: 2,
                    },
                    label: {
                      show: false,
                      position: 'center',
                    },
                    emphasis: {
                      label: {
                        show: true,
                        fontSize: '16',
                        fontWeight: 'bold',
                      },
                    },
                    labelLine: {
                      show: false,
                    },
                    data: analyticsData?.channel_analytics.by_channel.map((c) => ({
                      value: c.count,
                      name: c.name,
                    })) || [],
                  },
                ],
              }}
              style={{ height: '100%', width: '100%' }}
              className="w-full h-full"
            />
          </CardContent>
        </Card>

        {/* Activity by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Activity by Hour</CardTitle>
            <CardDescription>
              When you're most active throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                  axisPointer: {
                    type: 'shadow',
                  },
                },
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '3%',
                  containLabel: true,
                },
                xAxis: {
                  type: 'category',
                  data: analyticsData?.channel_analytics.by_time
                    .map((t) => t.hour)
                    .filter((_, i) => i % 3 === 0) || [],
                  axisLabel: {
                    interval: 2,
                  },
                },
                yAxis: {
                  type: 'value',
                  name: 'Messages',
                },
                series: [
                  {
                    name: 'Messages',
                    type: 'bar',
                    data: analyticsData?.channel_analytics.by_time
                      .map((t) => t.count) || [],
                    itemStyle: {
                      color: theme === 'dark' ? '#4f46e5' : '#6366f1',
                    },
                  },
                ],
              }}
              style={{ height: '100%', width: '100%' }}
              className="w-full h-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Senders */}
      <Card>
        <CardHeader>
          <CardTitle>Top Senders</CardTitle>
          <CardDescription>
            People you interact with most frequently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.top_senders.map((sender, index) => (
              <div key={sender.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium text-primary">
                      {sender.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {sender.name.split('@')[0].split('.').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sender.count} messages
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sentiment Analysis</CardTitle>
              <CardDescription>
                Overall tone of your communications
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs">Positive</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-gray-400 mr-1"></div>
                <span className="text-xs">Neutral</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
                <span className="text-xs">Negative</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'item',
                  formatter: '{b}: {c}%',
                },
                series: [
                  {
                    name: 'Sentiment',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                      borderRadius: 10,
                      borderColor: theme === 'dark' ? '#1e1e2d' : '#fff',
                      borderWidth: 2,
                    },
                    label: {
                      show: false,
                    },
                    emphasis: {
                      label: {
                        show: true,
                        fontSize: '16',
                        fontWeight: 'bold',
                      },
                    },
                    labelLine: {
                      show: false,
                    },
                    data: [
                      {
                        value: analyticsData?.sentiment_analysis.positive || 0,
                        name: 'Positive',
                        itemStyle: { color: '#10b981' },
                      },
                      {
                        value: analyticsData?.sentiment_analysis.neutral || 0,
                        name: 'Neutral',
                        itemStyle: { color: '#9ca3af' },
                      },
                      {
                        value: analyticsData?.sentiment_analysis.negative || 0,
                        name: 'Negative',
                        itemStyle: { color: '#ef4444' },
                      },
                    ],
                  },
                ],
              }}
              style={{ height: '100%', width: '100%' }}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveDashboard;
