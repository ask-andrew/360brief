'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  Target,
  Zap,
  Eye,
  Heart,
  Frown,
  Meh,
  Smile,
  Network,
  Timer,
  ArrowRight,
  Info,
  ExternalLink
} from 'lucide-react';

// Fast demo data that loads instantly
const fastDemoData = {
  status: 'demo',
  dataSource: 'demo',
  total_count: 1247,
  inbound_count: 843,
  outbound_count: 404,
  avg_response_time_minutes: 127,
  missed_messages: 4,
  focus_ratio: 68,
  external_percentage: 35,
  internal_percentage: 65,
  top_projects: [
    { name: 'Project Alpha', messageCount: 75 },
    { name: 'Q2 Budget', messageCount: 45 },
    { name: 'Client Onboarding', messageCount: 32 }
  ],
  reconnect_contacts: [
    { name: 'Alex Johnson', role: 'Product Manager', days: 42, email: 'alex@example.com' },
    { name: 'Jordan Smith', role: 'Engineering Lead', days: 37, email: 'jordan@example.com' }
  ],
  recent_trends: {
    messages: { change: 12, direction: 'up' as const, value: 12 },
    response_time: { change: -8, direction: 'down' as const, value: 8 },
    meetings: { change: 23, direction: 'up' as const, value: 23 }
  },
  sentiment_analysis: {
    positive: 68,
    neutral: 24,
    negative: 8,
    overall_trend: 'positive' as const
  },
  priority_messages: {
    awaiting_my_reply: [
      {
        id: '1',
        sender: 'Sarah Chen',
        subject: 'Q4 Budget Approval Needed',
        channel: 'email',
        timestamp: '2 hours ago',
        priority: 'high' as const,
        link: '/messages/1'
      }
    ],
    awaiting_their_reply: []
  },
  channel_analytics: {
    by_channel: [
      { name: 'Email', count: 524, percentage: 42 },
      { name: 'Slack', count: 398, percentage: 32 },
      { name: 'Teams', count: 203, percentage: 16 }
    ],
    by_time: [
      { hour: '9AM', count: 89 },
      { hour: '10AM', count: 124 },
      { hour: '11AM', count: 156 },
      { hour: '12PM', count: 98 },
      { hour: '1PM', count: 67 },
      { hour: '2PM', count: 134 },
      { hour: '3PM', count: 178 },
      { hour: '4PM', count: 145 }
    ]
  },
  fetchedAt: new Date().toISOString(),
  processingTime: 'instant'
};

interface AnalyticsMetricCardProps {
  title: string;
  value: string | number;
  change?: { value: number; direction: 'up' | 'down' };
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  infoTooltip?: string;
  linkTo?: string;
}

function AnalyticsMetricCard({ title, value, change, icon: Icon, description, infoTooltip, linkTo }: AnalyticsMetricCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              {infoTooltip && (
                <div className="group relative">
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {infoTooltip}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-baseline space-x-2">
              {linkTo ? (
                <button
                  onClick={() => window.location.href = linkTo}
                  className="text-3xl font-bold hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                >
                  {typeof value === 'number' ? value.toLocaleString() : value}
                  <ExternalLink className="w-4 h-4" />
                </button>
              ) : (
                <p className="text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              )}
              {change && (
                <div className={`flex items-center space-x-1 text-sm ${change.direction === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {change.direction === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(change.value)}%</span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Fast data fetching hook with job system integration
function useFastAnalyticsData(isDemo: boolean) {
  const [data, setData] = useState(fastDemoData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      // Instant demo data
      setData(fastDemoData);
      setLoading(false);
      setError(null);
      return;
    }

    // Fast real data fetch with job system integration
    const fetchRealData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build auth headers from Supabase session (client-side auth)
        const supa = getSupabaseClient();
        const { data: sessionData } = await supa.auth.getSession();
        const token = sessionData.session?.access_token;
        const authHeaders: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        // First try to get analytics from cached job data (fastest)
        const response = await fetch('/api/analytics/from-job?daysBack=7', {
          signal: controller.signal,
          cache: 'no-store',
          headers: authHeaders,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const apiData = await response.json();
          
          if (apiData.status === 'demo' || apiData.dataSource === 'demo' || apiData.error?.includes('No cached messages')) {
            console.log('📊 No cached data found, creating job to fetch real data...');
            
            // Create a job to fetch real data
            const jobResponse = await fetch('/api/analytics/jobs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders },
              body: JSON.stringify({
                job_type: 'fetch_messages',
                metadata: { 
                  days_back: 7,
                  max_messages: 1000
                },
              }),
            });

            if (jobResponse.ok) {
              const jobResult = await jobResponse.json();
              console.log('✅ Job created:', jobResult.job.id);
              
              // Poll for job completion
              const pollForCompletion = async () => {
                let attempts = 0;
                const maxAttempts = 60; // 5 minutes max
                
                while (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                  
                  try {
                    const jobStatusResponse = await fetch(`/api/analytics/jobs/${jobResult.job.id}`, { headers: authHeaders });
                    if (jobStatusResponse.ok) {
                      const jobData = await jobStatusResponse.json();
                      console.log(`📋 Job status: ${jobData.status} (${jobData.progress || 0}%)`);
                      
                      if (jobData.status === 'completed') {
                        // Job completed, fetch analytics from cache
                        const analyticsResponse = await fetch('/api/analytics/from-job?daysBack=7', { headers: authHeaders });
                        if (analyticsResponse.ok) {
                          const analyticsData = await analyticsResponse.json();
                          if (analyticsData.total_count > 0) {
                            setData(analyticsData);
                            console.log('✅ Real analytics loaded from job completion');
                            return;
                          }
                        }
                      } else if (jobData.status === 'failed') {
                        throw new Error(jobData.error || 'Job failed');
                      }
                    }
                  } catch (pollError) {
                    console.warn('Job status poll error:', pollError);
                  }
                  
                  attempts++;
                }
                
                // If we get here, job took too long or failed, fallback to demo
                console.log('⏰ Job taking too long, using demo data');
                setData(fastDemoData);
              };
              
              // Start polling
              pollForCompletion();
              
            } else {
              throw new Error('Failed to create job');
            }
          } else {
            // Use cached analytics data
            setData(apiData);
            console.log('✅ Real analytics loaded from cache');
          }
        } else {
          throw new Error(`Failed to fetch analytics (${response.status})`);
        }
      } catch (err) {
        console.warn('Fast analytics fetch failed, using demo:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(fastDemoData); // Always fallback to demo
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [isDemo]);

  return { data, loading, error };
}

export function FastAnalyticsDashboard() {
  const [isDemo, setIsDemo] = useState(true); // Start with demo for instant loading
  
  const { data, loading, error } = useFastAnalyticsData(isDemo);

  const formatResponseTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = (minutes / 60).toFixed(1);
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Show loading state only when fetching
  if (loading && !isDemo) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-blue-100 mt-2">
                Loading your communication insights...
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="data-toggle" className="text-white text-sm">
                    Demo Data
                  </Label>
                  <Switch
                    id="data-toggle"
                    checked={!isDemo}
                    onCheckedChange={(checked) => setIsDemo(!checked)}
                    className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/30"
                  />
                  <Label htmlFor="data-toggle" className="text-white text-sm">
                    My Data
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Loading State with Job Progress */}
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your Analytics</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            We're fetching your Gmail data and generating insights. This may take a few moments...
          </p>
          
          {/* Job Progress Indicator */}
          <div className="max-w-sm mx-auto bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Background worker is processing your messages...
          </p>
          
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <p>📧 Fetching Gmail messages</p>
            <p>🔄 Processing communication patterns</p>
            <p>📊 Generating analytics insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-indigo-100 mt-2">
              Track and optimize your communication patterns
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Label htmlFor="data-toggle" className="text-white text-sm">
                  Demo Data
                </Label>
                <Switch
                  id="data-toggle"
                  checked={!isDemo}
                  onCheckedChange={(checked) => setIsDemo(!checked)}
                  className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/30"
                />
                <Label htmlFor="data-toggle" className="text-white text-sm">
                  My Data
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${data.dataSource === 'demo' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
              <span className="text-sm font-medium">
                {data.dataSource === 'demo' ? 'Showing Demo Data' : 'Showing Your Real Data'}
              </span>
            </div>
            {data.processingTime && (
              <span className="text-xs text-gray-500">
                Loaded in {data.processingTime}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsMetricCard
          title="Total Messages"
          value={data.total_count}
          change={data.recent_trends?.messages}
          icon={Mail}
          description="Last 7 days"
        />
        <AnalyticsMetricCard
          title="Response Time"
          value={formatResponseTime(data.avg_response_time_minutes)}
          change={data.recent_trends?.response_time}
          icon={Clock}
          description="Average response time"
        />
        <AnalyticsMetricCard
          title="Focus Ratio"
          value={`${data.focus_ratio}%`}
          icon={Target}
          description="Productive communication"
        />
        <AnalyticsMetricCard
          title="Sentiment"
          value={data.sentiment_analysis?.overall_trend || 'Neutral'}
          icon={data.sentiment_analysis?.overall_trend === 'positive' ? Smile : 
                data.sentiment_analysis?.overall_trend === 'negative' ? Frown : Meh}
          description={`${data.sentiment_analysis?.positive || 0}% positive`}
        />
      </div>

      {/* Communication Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Communication Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Inbound Messages</span>
                <span className="font-semibold">{data.inbound_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Outbound Messages</span>
                <span className="font-semibold">{data.outbound_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Missed Messages</span>
                <span className="font-semibold text-orange-600">{data.missed_messages}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_projects?.slice(0, 3).map((project, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{project.name}</span>
                  <Badge variant="outline">{project.messageCount} messages</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Messages */}
      {data.priority_messages?.awaiting_my_reply?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Priority Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.priority_messages.awaiting_my_reply.slice(0, 3).map((message) => (
                <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{message.subject}</p>
                    <p className="text-xs text-gray-500">{message.sender} • {message.timestamp}</p>
                  </div>
                  <Badge variant={message.priority === 'high' ? 'destructive' : 'secondary'}>
                    {message.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
