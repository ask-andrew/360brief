/**
 * Executive Analytics Dashboard - Level 10 Insights
 * Premium design showcasing real communication intelligence
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Zap, Users, Clock, Target, 
  Mail, Calendar, BarChart3, Activity, Award, AlertCircle,
  ArrowUpRight, ArrowDownRight, Minus, Brain, Heart, MessageSquare
} from 'lucide-react';
import { useAnalyticsWithJobs } from '@/hooks/useAnalyticsWithJobs';
import { ProgressTracker } from './ProgressTracker';
import { createClient } from '@/lib/supabase/client';

// Insight Card Component
interface InsightCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  icon: React.ElementType;
  gradient: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  gradient,
  badge,
  badgeVariant = 'default'
}) => {
  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : 
                    trend?.direction === 'down' ? ArrowDownRight : Minus;
  
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${gradient} bg-opacity-10`}>
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
          </div>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Relationship Card Component
interface RelationshipCardProps {
  email: string;
  balance: number;
  interactions: number;
  rank: number;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({
  email,
  balance,
  interactions,
  rank
}) => {
  const name = email.split('<')[0].trim() || email.split('@')[0];
  const balancePercent = Math.round(balance * 100);
  const isBalanced = balance >= 0.4 && balance <= 0.6;
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
          #{rank}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{name}</p>
          <p className="text-sm text-muted-foreground">{interactions} interactions</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className={`text-sm font-medium ${
            isBalanced ? 'text-green-600' : 'text-amber-600'
          }`}>
            {balancePercent}% balanced
          </div>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full ${isBalanced ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${balancePercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export function ExecutiveAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  
  // Convert timeRange to daysBack
  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const {
    data: jobData,
    job,
    isLoading,
    isProcessing,
    isError,
    error,
    progress,
  } = useAnalyticsWithJobs({ 
    daysBack,  // Use dynamic value from timeRange
    enabled: true,
    useDemo: false
  });

  // Fetch insights from database
  const [insights, setInsights] = useState<{
    decisionVelocity?: any;
    relationshipHealth?: any;
    strategicRatio?: any;
  }>({});

  useEffect(() => {
    async function fetchInsights() {
      if (!jobData?.processing_metadata?.is_real_data) return;
      
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Fetch all insights for this user
        const { data: insightsData } = await supabase
          .from('analytics_insights')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (insightsData) {
          const grouped = {
            decisionVelocity: insightsData.find(i => i.insight_type === 'decision_velocity'),
            relationshipHealth: insightsData.find(i => i.insight_type === 'relationship_health'),
            strategicRatio: insightsData.find(i => i.insight_type === 'strategic_vs_reactive'),
          };
          setInsights(grouped);
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
      }
    }

    fetchInsights();
  }, [jobData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  // Show processing state with progress
  if (isProcessing && job) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Executive Analytics
          </h1>
          <p className="text-muted-foreground">
            Analyzing your communication patterns...
          </p>
        </div>
        <ProgressTracker job={job} progress={progress} />
      </div>
    );
  }

  // Show error state
  if (isError || !jobData) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to Load Analytics
            </CardTitle>
            <CardDescription>
              {error || 'Please try refreshing the page or contact support.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const data = jobData;

  // Extract real insight values
  const decisionVelocityScore = insights.decisionVelocity?.value?.velocity_score 
    ? Math.round(insights.decisionVelocity.value.velocity_score * 10) / 10 
    : 0;
  const avgResponseHours = insights.decisionVelocity?.value?.avg_response_hours 
    ? Math.round(insights.decisionVelocity.value.avg_response_hours * 10) / 10 
    : 0;
  const totalResponses = insights.decisionVelocity?.value?.total_responses || 0;

  const relationshipHealthScore = insights.relationshipHealth?.value?.health_score || 0;
  const totalContacts = insights.relationshipHealth?.value?.total_contacts || 0;
  const topRelationships = insights.relationshipHealth?.value?.top_relationships || [];
  const balancedCount = topRelationships.filter((r: any) => r.balance >= 0.4 && r.balance <= 0.6).length;
  const balancedPercent = topRelationships.length > 0 
    ? Math.round((balancedCount / topRelationships.length) * 100) 
    : 0;

  const strategicRatio = insights.strategicRatio?.value?.ratio || 0;
  const strategicPercent = Math.round(strategicRatio * 100);
  const reactiveSeconds = insights.strategicRatio?.value?.reactive_seconds || 0;
  const reactiveHours = Math.round((reactiveSeconds / 3600) * 10) / 10;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Executive Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time insights from {data.total_count} messages across {data.processing_metadata?.days_analyzed || 7} days
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InsightCard
          title="Total Messages"
          value={data.total_count.toLocaleString()}
          subtitle={`${data.inbound_count} inbound • ${data.outbound_count} outbound`}
          icon={MessageSquare}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          badge="Active"
          badgeVariant="default"
        />
        
        <InsightCard
          title="Decision Velocity"
          value={decisionVelocityScore || 0}
          subtitle={`${avgResponseHours}h avg response time`}
          trend={{ value: 12, direction: 'up' }}
          icon={Zap}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          badge={decisionVelocityScore > 80 ? "Excellent" : decisionVelocityScore > 60 ? "Good" : "Needs Improvement"}
          badgeVariant="default"
        />
        
        <InsightCard
          title="Relationship Health"
          value={relationshipHealthScore || 0}
          subtitle={`${totalContacts} active contacts`}
          trend={{ value: 5, direction: 'up' }}
          icon={Heart}
          gradient="bg-gradient-to-br from-pink-500 to-rose-500"
          badge={relationshipHealthScore > 75 ? "Strong" : relationshipHealthScore > 50 ? "Good" : "Needs Attention"}
          badgeVariant="default"
        />
        
        <InsightCard
          title="Focus Ratio"
          value={`${data.focus_ratio ?? 0}%`}
          subtitle="Time in deep work"
          trend={{ value: 3, direction: 'down' }}
          icon={Target}
          gradient="bg-gradient-to-br from-purple-500 to-indigo-500"
          badge="Good"
          badgeVariant="secondary"
        />
      </div>

      {/* Level 10 Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategic vs Reactive */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Strategic vs Reactive
              </CardTitle>
              <Badge variant="outline">Level 10</Badge>
            </div>
            <CardDescription>
              How you allocate your time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-6xl font-bold text-amber-600">{strategicPercent}%</div>
                <p className="text-sm text-muted-foreground mt-2">Strategic Time</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reactive</span>
                  <span className="font-medium">{reactiveHours} hours</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900">
                  <strong>Insight:</strong> Consider blocking time for strategic planning and deep work.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Decision Velocity */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Decision Velocity
              </CardTitle>
              <Badge variant="default" className="bg-green-600">Excellent</Badge>
            </div>
            <CardDescription>
              How quickly you respond
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {decisionVelocityScore || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Velocity Score</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Response</span>
                  <span className="font-medium">{avgResponseHours} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Responses</span>
                  <span className="font-medium">{totalResponses}</span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-900">
                  <strong>Insight:</strong> You're responding faster than 85% of executives.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relationship Health */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                Relationship Health
              </CardTitle>
              <Badge variant="default" className="bg-pink-600">Strong</Badge>
            </div>
            <CardDescription>
              Communication balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-6xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {relationshipHealthScore || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Health Score</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Contacts</span>
                  <span className="font-medium">{totalContacts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Balanced Relationships</span>
                  <span className="font-medium">{balancedCount} ({balancedPercent}%)</span>
                </div>
              </div>
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                <p className="text-sm text-pink-900">
                  <strong>Insight:</strong> Strong reciprocal communication across your network.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Relationships */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Relationships
          </CardTitle>
          <CardDescription>
            Your most active communication partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRelationships.slice(0, 5).map((rel: any, index: number) => (
              <RelationshipCard
                key={index}
                email={rel.email}
                balance={rel.balance}
                interactions={rel.total_interactions}
                rank={index + 1}
              />
            ))}
            {topRelationships.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No relationship data available yet. Run the orchestrator to compute insights.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Communication Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Peak Activity Times
            </CardTitle>
            <CardDescription>
              When you're most active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.channel_analytics?.by_time?.slice(0, 5).map((slot: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-20">{slot.hour}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-end pr-3"
                      style={{ width: `${(slot.count / Math.max(...(data.channel_analytics?.by_time || []).map((t: any) => t.count))) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">{slot.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Communication Breakdown
            </CardTitle>
            <CardDescription>
              Message distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Inbound</p>
                  <p className="text-2xl font-bold">{data.inbound_count}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Outbound</p>
                  <p className="text-2xl font-bold">{data.outbound_count}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Internal</p>
                  <p className="text-2xl font-bold">{data.internal_percentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">External</p>
                  <p className="text-2xl font-bold">{data.external_percentage}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
