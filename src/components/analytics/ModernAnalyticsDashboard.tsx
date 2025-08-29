'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Hash,
  Timer,
  ArrowRight,
  Info,
  ExternalLink
} from 'lucide-react';

// Mock data - same structure as your existing analytics but simplified
const mockAnalyticsData = {
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
    { name: 'Jordan Smith', role: 'Engineering Lead', days: 37, email: 'jordan@example.com' },
    { name: 'Taylor Wilson', role: 'Design Director', days: 45, email: 'taylor@example.com' }
  ],
  recent_trends: {
    messages: { change: 12, direction: 'up' as const },
    response_time: { change: -8, direction: 'down' as const },
    meetings: { change: 23, direction: 'up' as const }
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
      },
      {
        id: '3',
        sender: 'Team Alpha',
        subject: 'Sprint planning questions',
        channel: 'teams',
        timestamp: '6 hours ago', 
        priority: 'high' as const,
        link: '/messages/3'
      }
    ],
    awaiting_their_reply: [
      {
        id: '2', 
        sender: 'Mike Rodriguez',
        subject: 'Client feedback on proposal',
        channel: 'slack',
        timestamp: '4 hours ago',
        priority: 'medium' as const,
        link: '/messages/2'
      }
    ]
  },
  channel_analytics: {
    by_channel: [
      { name: 'Email', count: 524, percentage: 42 },
      { name: 'Slack', count: 398, percentage: 32 },
      { name: 'Teams', count: 203, percentage: 16 },
      { name: 'WhatsApp', count: 122, percentage: 10 }
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
  network_data: {
    nodes: [
      { id: 'project-alpha', name: 'Project Alpha', type: 'project', messageCount: 245, connections: 8 },
      { id: 'q2-budget', name: 'Q2 Budget', type: 'project', messageCount: 189, connections: 6 },
      { id: 'client-onboarding', name: 'Client Onboarding', type: 'project', messageCount: 156, connections: 12 },
      { id: 'product-launch', name: 'Product Launch', type: 'project', messageCount: 134, connections: 10 },
      { id: 'team-sync', name: 'Team Sync', type: 'topic', messageCount: 98, connections: 15 },
      { id: 'design-review', name: 'Design Review', type: 'topic', messageCount: 87, connections: 7 }
    ],
    connections: [
      { source: 'project-alpha', target: 'team-sync' },
      { source: 'project-alpha', target: 'design-review' },
      { source: 'q2-budget', target: 'team-sync' },
      { source: 'client-onboarding', target: 'product-launch' },
      { source: 'product-launch', target: 'design-review' }
    ]
  }
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
                <div className={`flex items-center space-x-1 text-sm ${
                  change.direction === 'up' ? 'text-green-600' : 'text-red-600'
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

// API Data fetching hook
function useAnalyticsData(isDemo: boolean) {
  const [data, setData] = useState(mockAnalyticsData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      setData(mockAnalyticsData);
      setLoading(false);
      setError(null);
      return;
    }

    // Fetch real data from API
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const apiData = await response.json();
          setData(apiData);
        } else {
          throw new Error('Failed to fetch analytics data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Keep showing demo data on error
        setData(mockAnalyticsData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDemo]);

  return { data, loading, error };
}

export function ModernAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDemo, setIsDemo] = useState(true);
  const { data, loading, error } = useAnalyticsData(isDemo);

  const formatResponseTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = (minutes / 60).toFixed(1);
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Show loading state
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
                    My Data
                  </Label>
                  <Switch
                    id="data-toggle"
                    checked={isDemo}
                    onCheckedChange={setIsDemo}
                    className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/30"
                  />
                  <Label htmlFor="data-toggle" className="text-white text-sm">
                    Demo Data
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading your analytics...</h2>
            <p className="text-gray-600 mb-6">
              Fetching your communication data and generating insights.
            </p>
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when My Data is selected but no data available
  if (!isDemo && !loading && (error || data.total_count === 0)) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-blue-100 mt-2">
                Your personal communication insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="data-toggle" className="text-white text-sm">
                    My Data
                  </Label>
                  <Switch
                    id="data-toggle"
                    checked={isDemo}
                    onCheckedChange={setIsDemo}
                    className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/30"
                  />
                  <Label htmlFor="data-toggle" className="text-white text-sm">
                    Demo Data
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Syncing State */}
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up your analytics</h2>
            <p className="text-gray-600 mb-6">
              {error ? `Error: ${error}` : 'We\'re currently syncing your communication data to generate personalized insights. This usually takes a few minutes.'}
            </p>
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            </div>
            <Button 
              onClick={() => setIsDemo(true)}
              variant="outline"
            >
              View Demo Data Instead
            </Button>
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
                  My Data
                </Label>
                <Switch
                  id="data-toggle"
                  checked={isDemo}
                  onCheckedChange={setIsDemo}
                  className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/30"
                />
                <Label htmlFor="data-toggle" className="text-white text-sm">
                  Demo Data
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsMetricCard
          title="Total Messages"
          value={data.total_count}
          change={{ value: data.recent_trends.messages.change, direction: data.recent_trends.messages.direction }}
          icon={MessageSquare}
        />
        
        <AnalyticsMetricCard
          title="Avg Response Time"
          value={formatResponseTime(data.avg_response_time_minutes)}
          change={{ value: data.recent_trends.response_time.change, direction: data.recent_trends.response_time.direction }}
          icon={Clock}
        />
        
        <AnalyticsMetricCard
          title="Focus Time"
          value={`${data.focus_ratio}%`}
          icon={Target}
          description="of work time protected"
          infoTooltip="Percentage of time spent in deep work vs. communication"
        />
        
        <AnalyticsMetricCard
          title="Missed Messages"
          value={data.missed_messages}
          icon={AlertTriangle}
          description="requiring attention"
          infoTooltip="Messages older than 24 hours without a response"
          linkTo="/messages?filter=missed"
        />
      </div>

      {/* Executive Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsMetricCard
          title="Sentiment Score"
          value={`${data.sentiment_analysis.positive}%`}
          icon={data.sentiment_analysis.overall_trend === 'positive' ? Smile : data.sentiment_analysis.overall_trend === 'negative' ? Frown : Meh}
          description="positive communications"
        />
        
        <AnalyticsMetricCard
          title="Priority Messages"
          value={data.priority_messages.awaiting_my_reply.length + data.priority_messages.awaiting_their_reply.length}
          icon={AlertTriangle}
          description="awaiting reply"
          infoTooltip="High-priority messages and direct questions requiring response"
          linkTo="/messages?filter=priority"
        />
        
        <AnalyticsMetricCard
          title="Top Channel"
          value={data.channel_analytics.by_channel[0].name}
          icon={Hash}
          description={`${data.channel_analytics.by_channel[0].percentage}% of messages`}
        />
        
        <AnalyticsMetricCard
          title="Peak Activity"
          value={data.channel_analytics.by_time.reduce((prev, current) => (prev.count > current.count) ? prev : current).hour}
          icon={Timer}
          description="most active time"
        />
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Communication Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Message Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Inbound Messages</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(data.inbound_count / data.total_count) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{data.inbound_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Outbound Messages</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(data.outbound_count / data.total_count) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{data.outbound_count}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contact Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">External Contacts</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${data.external_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{data.external_percentage}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Internal Contacts</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${data.internal_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{data.internal_percentage}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Most Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.top_projects.map((project, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.messageCount} messages</p>
                    </div>
                    <Badge variant="outline">{`#${index + 1}`}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          {/* Priority Messages Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Priority Messages Awaiting Reply
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Summary Section */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">Awaiting My Reply</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900">{data.priority_messages.awaiting_my_reply.length}</div>
                  <p className="text-sm text-red-700">Direct questions asked of me</p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Awaiting Their Reply</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{data.priority_messages.awaiting_their_reply.length}</div>
                  <p className="text-sm text-blue-700">Questions I asked others</p>
                </div>
              </div>
              
              {/* Awaiting My Reply Messages */}
              {data.priority_messages.awaiting_my_reply.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-red-800 mb-3 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Urgent: Awaiting My Response
                  </h4>
                  <div className="space-y-2">
                    {data.priority_messages.awaiting_my_reply.map((message) => (
                      <div key={message.id} className="flex justify-between items-center p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={message.priority === 'high' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {message.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{message.channel}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <p className="font-medium">{message.subject}</p>
                          <p className="text-sm text-muted-foreground">From: {message.sender}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => window.location.href = message.link}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Reply Now
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Awaiting Their Reply Messages */}
              {data.priority_messages.awaiting_their_reply.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-blue-800 mb-3 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Waiting for Response
                  </h4>
                  <div className="space-y-2">
                    {data.priority_messages.awaiting_their_reply.map((message) => (
                      <div key={message.id} className="flex justify-between items-center p-3 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline"
                              className="text-xs"
                            >
                              {message.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{message.channel}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <p className="font-medium">{message.subject}</p>
                          <p className="text-sm text-muted-foreground">To: {message.sender}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = message.link}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Channel and Time Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Messages by Channel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.channel_analytics.by_channel.map((channel, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{channel.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-blue-600' :
                              index === 1 ? 'bg-green-600' :
                              index === 2 ? 'bg-purple-600' : 'bg-orange-600'
                            }`}
                            style={{ width: `${channel.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold w-12 text-right">{channel.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Activity by Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.channel_analytics.by_time.map((timeSlot, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{timeSlot.hour}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ 
                              width: `${(timeSlot.count / Math.max(...data.channel_analytics.by_time.map(t => t.count))) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold w-8 text-right">{timeSlot.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.missed_messages > 0 ? (
                    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-800">
                          {data.missed_messages} messages need response
                        </span>
                      </div>
                      <p className="text-sm text-orange-700">
                        High priority or direct questions older than 24 hours
                      </p>
                      <Button size="sm" className="mt-3">
                        <Eye className="w-4 h-4 mr-2" />
                        Review Messages
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">All caught up!</span>
                      </div>
                      <p className="text-sm text-green-700">
                        No urgent messages requiring attention
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Response Time Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Response Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {formatResponseTime(data.avg_response_time_minutes)}
                    </div>
                    <p className="text-sm text-muted-foreground">Average response time</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>&lt; 1 hour</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>1-4 hours</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>4-24 hours</span>
                      <span className="font-medium">20%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>&gt; 24 hours</span>
                      <span className="font-medium text-red-600">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Network Map Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Project & Topic Activity Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 rounded-lg p-6 min-h-[400px] overflow-hidden">
                {/* Network Visualization */}
                <div className="grid grid-cols-3 gap-8 h-full">
                  {/* Column 1 - Projects */}
                  <div className="space-y-6">
                    <h4 className="font-medium text-sm text-gray-600 text-center">Projects</h4>
                    {data.network_data.nodes.filter(n => n.type === 'project').map((node, index) => {
                      const size = Math.max(40, Math.min(80, (node.messageCount / 250) * 80));
                      return (
                        <div key={node.id} className="flex flex-col items-center">
                          <div 
                            className={`rounded-full border-2 border-blue-500 bg-blue-100 flex items-center justify-center relative ${
                              index % 2 === 0 ? 'ml-4' : 'mr-4'
                            }`}
                            style={{ width: size, height: size }}
                            title={`${node.messageCount} messages, ${node.connections} connections`}
                          >
                            <div className="text-center">
                              <div className="text-xs font-bold text-blue-800">{node.messageCount}</div>
                              <div className="text-[10px] text-blue-600">msgs</div>
                            </div>
                            {/* Connection lines */}
                            <div className={`absolute top-1/2 ${index % 2 === 0 ? 'left-full' : 'right-full'} w-8 h-0.5 bg-gray-300`}></div>
                          </div>
                          <p className="text-xs text-center mt-2 max-w-20">{node.name}</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Column 2 - Connection Hub */}
                  <div className="flex flex-col justify-center items-center relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Network className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-xs text-center mt-2 font-medium">Communication Hub</p>
                    
                    {/* Animated connection lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div 
                          key={i}
                          className="absolute w-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                          style={{
                            height: '60px',
                            left: '50%',
                            top: '50%',
                            transformOrigin: 'top',
                            transform: `rotate(${i * 45}deg) translateX(-50%)`,
                            animation: `pulse 2s ease-in-out ${i * 0.2}s infinite`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Column 3 - Topics */}
                  <div className="space-y-6">
                    <h4 className="font-medium text-sm text-gray-600 text-center">Topics</h4>
                    {data.network_data.nodes.filter(n => n.type === 'topic').map((node, index) => {
                      const size = Math.max(40, Math.min(80, (node.messageCount / 250) * 80));
                      return (
                        <div key={node.id} className="flex flex-col items-center">
                          <div 
                            className={`rounded-full border-2 border-green-500 bg-green-100 flex items-center justify-center relative ${
                              index % 2 === 0 ? 'mr-4' : 'ml-4'
                            }`}
                            style={{ width: size, height: size }}
                            title={`${node.messageCount} messages, ${node.connections} connections`}
                          >
                            <div className="text-center">
                              <div className="text-xs font-bold text-green-800">{node.messageCount}</div>
                              <div className="text-[10px] text-green-600">msgs</div>
                            </div>
                            {/* Connection lines */}
                            <div className={`absolute top-1/2 ${index % 2 === 0 ? 'right-full' : 'left-full'} w-8 h-0.5 bg-gray-300`}></div>
                          </div>
                          <p className="text-xs text-center mt-2 max-w-20">{node.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-sm border">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Topics</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Node size = message volume
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reconnect Suggestions - Compact */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-4 h-4" />
                People to Reconnect With
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.reconnect_contacts.map((contact, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{contact.name}</p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">{contact.days}d ago</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{contact.role}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => window.location.href = `mailto:${contact.email}?subject=Reconnecting`}
                    >
                      <Mail className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Communication Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center mb-2">
                      <Smile className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-800">{data.sentiment_analysis.positive}%</div>
                    <p className="text-sm text-green-700">Positive</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-center mb-2">
                      <Meh className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{data.sentiment_analysis.neutral}%</div>
                    <p className="text-sm text-gray-700">Neutral</p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-center mb-2">
                      <Frown className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-800">{data.sentiment_analysis.negative}%</div>
                    <p className="text-sm text-red-700">Negative</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  data.sentiment_analysis.overall_trend === 'positive' 
                    ? 'bg-green-50 border-green-200' 
                    : data.sentiment_analysis.overall_trend === 'negative'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    data.sentiment_analysis.overall_trend === 'positive' 
                      ? 'text-green-900' 
                      : data.sentiment_analysis.overall_trend === 'negative'
                      ? 'text-red-900'
                      : 'text-gray-900'
                  }`}>
                    Overall Sentiment: {data.sentiment_analysis.overall_trend.charAt(0).toUpperCase() + data.sentiment_analysis.overall_trend.slice(1)}
                  </h4>
                  <p className={`text-sm ${
                    data.sentiment_analysis.overall_trend === 'positive' 
                      ? 'text-green-800' 
                      : data.sentiment_analysis.overall_trend === 'negative'
                      ? 'text-red-800'
                      : 'text-gray-800'
                  }`}>
                    {data.sentiment_analysis.overall_trend === 'positive' 
                      ? 'Your communications have a predominantly positive tone, indicating healthy professional relationships.' 
                      : data.sentiment_analysis.overall_trend === 'negative'
                      ? 'Communications show some negative sentiment. Consider reviewing tone in challenging conversations.'
                      : 'Communications maintain a professional, neutral tone.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productivity Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Productivity Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Focus Time Optimization</h4>
                  <p className="text-sm text-blue-800">
                    You maintain {data.focus_ratio}% focus time. Consider blocking calendar time for deep work.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Communication Balance</h4>
                  <p className="text-sm text-green-800">
                    Good balance with {data.external_percentage}% external communication. 
                    Keep nurturing customer/partner relationships.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}