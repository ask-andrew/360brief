'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Mail, 
  Calendar, 
  TrendingUp,
  Users,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceConnectionCard } from './ServiceConnectionCard';
import { BriefGenerationCard } from './BriefGenerationCard';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface DashboardStats {
  unreadEmails: number;
  upcomingMeetings: number;
  todaysMeetings: number;
  lastBriefGenerated?: string;
}

// Hook for fetching real analytics data
function useDashboardData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch Gmail analytics data directly
        const gmailResponse = await fetch('/api/analytics/gmail');
        
        if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json();
          setData(gmailData);
          return;
        }
        
        // If Gmail is not connected (403) or other issues, fallback to demo data
        if (gmailResponse.status === 403 || gmailResponse.status === 401) {
          setError('Gmail not connected - using demo data');
        }
        
        // Fallback to general analytics (demo mode)
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const apiData = await response.json();
          setData(apiData);
        } else {
          throw new Error('Failed to fetch analytics data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

export function EnhancedDashboard() {
  const { user, connectGmail } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [recentBriefs, setRecentBriefs] = useState([
    // Mock data - replace with real data later
    {
      id: '1',
      title: 'Weekly Executive Brief',
      createdAt: new Date().toISOString(),
      status: 'completed' as const,
      style: 'mission_brief'
    }
  ]);

  // Fetch real analytics data
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useDashboardData();

  // Handle connection success message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    
    if (connected === 'gmail') {
      toast({
        title: 'Gmail Connected!',
        description: 'Your Gmail account has been successfully connected. Refreshing data...',
      });
      
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
      
      // Refresh the page to load real data
      window.location.reload();
    }
  }, [toast]);

  const dashboardStats: DashboardStats = {
    unreadEmails: analyticsData?.total_count || 0,
    upcomingMeetings: analyticsData?.priority_messages?.awaiting_my_reply?.length || 0,
    todaysMeetings: analyticsData?.channel_analytics?.by_time?.reduce((acc: number, timeData: any) => acc + timeData.count, 0) || 0,
    lastBriefGenerated: recentBriefs[0]?.createdAt
  };

  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      // Mock brief generation - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBrief = {
        id: Date.now().toString(),
        title: `Daily Brief - ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        status: 'completed' as const,
        style: 'mission_brief'
      };
      
      setRecentBriefs(prev => [newBrief, ...prev]);
      
      toast({
        title: 'Brief Generated',
        description: 'Your executive brief has been created successfully.',
      });
      
      router.push(`/briefs/current`);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate brief. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setIsConnecting(true);
      await connectGmail();
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect Gmail. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectCalendar = () => {
    // This would trigger the OAuth flow
    toast({
      title: 'Calendar Connection',
      description: 'Calendar OAuth flow would be triggered here.',
    });
  };

  const handleRefreshGmail = async () => {
    // Refresh Gmail connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleRefreshCalendar = async () => {
    // Refresh Calendar connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Determine service connection status based on analytics data
  const gmailStatus = {
    connected: !analyticsError && analyticsData && analyticsData.total_count > 0,
    lastSync: analyticsError ? undefined : new Date().toISOString(),
    error: analyticsError || undefined
  };

  const calendarStatus = {
    connected: false, // Calendar data not currently integrated in analytics
    lastSync: undefined,
    error: 'Calendar integration coming soon'
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-indigo-100 mt-1">
              Here's your briefing overview for today
            </p>
          </div>
          <div className="flex items-center gap-4">
            {dashboardStats.lastBriefGenerated && (
              <div className="text-right">
                <p className="text-sm text-indigo-100">Last Brief</p>
                <p className="font-medium">
                  {new Date(dashboardStats.lastBriefGenerated).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Messages</p>
                <p className="text-3xl font-bold text-red-700">
                  {analyticsLoading ? '...' : dashboardStats.unreadEmails}
                </p>
              </div>
              <Mail className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Priority Messages</p>
                <p className="text-3xl font-bold text-blue-700">
                  {analyticsLoading ? '...' : dashboardStats.upcomingMeetings}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Daily Activity</p>
                <p className="text-3xl font-bold text-green-700">
                  {analyticsLoading ? '...' : Math.round(dashboardStats.todaysMeetings / 8)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Brief Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {isGeneratingBrief ? (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                      Generating
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      Ready
                    </Badge>
                  )}
                </div>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brief Generation */}
        <div className="space-y-6">
          <BriefGenerationCard 
            recentBriefs={recentBriefs}
            isGenerating={isGeneratingBrief}
            onGenerateBrief={handleGenerateBrief}
            onViewBrief={(briefId) => router.push(`/briefs/${briefId}`)}
          />
        </div>

        {/* Service Connections */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Connected Services
          </h2>
          
          <div className="space-y-4">
            <ServiceConnectionCard 
              service="gmail"
              status={gmailStatus}
              onConnect={handleConnectGmail}
              onRefresh={handleRefreshGmail}
            />
            
            <ServiceConnectionCard 
              service="calendar"
              status={calendarStatus}
              onConnect={handleConnectCalendar}
              onRefresh={handleRefreshCalendar}
            />
            
            <ServiceConnectionCard 
              service="slack"
              status={{ connected: false }}
            />
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      {analyticsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsData.top_projects?.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Top Project</p>
                  <p className="font-semibold">
                    {analyticsData.top_projects[0]?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analyticsData.top_projects[0]?.messageCount || 0} messages
                  </p>
                </div>
              )}
              
              {analyticsData.channel_analytics?.by_time?.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Busiest Time</p>
                  <p className="font-semibold">
                    {analyticsData.channel_analytics.by_time[0]?.hour || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analyticsData.channel_analytics.by_time[0]?.count || 0} messages
                  </p>
                </div>
              )}
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Data Sources</p>
                <div className="flex justify-center gap-2">
                  {gmailStatus.connected && (
                    <Badge variant="outline" className="text-xs">Gmail</Badge>
                  )}
                  {calendarStatus.connected && (
                    <Badge variant="outline" className="text-xs">Calendar</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}