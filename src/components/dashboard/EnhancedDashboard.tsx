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

// Hook for fetching real analytics data with processing status
function useDashboardData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setProcessingStatus(null);
      
      try {
        // Use the working analytics API (same as analytics page)
        // This API automatically detects if user has real data and serves accordingly
        const response = await fetch('/api/analytics?use_real_data=true');
        
        if (response.ok) {
          const apiData = await response.json();
          
          // Check if data indicates processing status
          if (apiData.status === 'processing') {
            setProcessingStatus('Processing your Gmail data...');
            setData(null);
          } else if (apiData.status === 'error') {
            setError(`Data processing failed: ${apiData.error || 'Unknown error'}`);
            setData(null);
          } else {
            setData(apiData);
            
            // Clear any previous error if we successfully get data
            if (apiData.total_count > 0) {
              setError(null);
            } else {
              setError('No recent messages found. Connect Gmail or try again later.');
            }
          }
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

  return { data, loading, error, processingStatus };
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
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, processingStatus } = useDashboardData();

  // Handle connection success and processing status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const status = urlParams.get('status');
    
    if (connected === 'gmail') {
      if (status === 'processing') {
        toast({
          title: 'Gmail Connected!',
          description: 'Your Gmail account has been connected. Processing your data in the background...',
          duration: 5000,
        });
      } else if (status === 'processing_failed') {
        toast({
          title: 'Gmail Connected',
          description: 'Gmail connected, but background processing failed. You can manually refresh to try again.',
          variant: 'destructive',
          duration: 8000,
        });
      } else {
        toast({
          title: 'Gmail Connected!',
          description: 'Your Gmail account has been successfully connected. Refreshing data...',
        });
      }
      
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
      
      // Auto-refresh data every 10 seconds if processing
      if (status === 'processing') {
        const refreshInterval = setInterval(() => {
          window.location.reload();
        }, 10000);
        
        // Clear interval after 2 minutes
        setTimeout(() => clearInterval(refreshInterval), 120000);
      } else {
        // Refresh the page to load real data
        window.location.reload();
      }
    }
  }, [toast]);

  const dashboardStats: DashboardStats = {
    unreadEmails: analyticsData?.total_count || 0,
    upcomingMeetings: analyticsData?.priority_messages?.awaiting_my_reply?.length || 0,
    todaysMeetings: analyticsData?.channel_analytics?.by_time?.reduce((acc: number, timeData: any) => acc + timeData.count, 0) || 0,
    lastBriefGenerated: recentBriefs[0]?.createdAt
  };

  // Debug logging to see what's happening
  console.log('Dashboard Debug:', {
    analyticsLoading,
    analyticsError,
    hasAnalyticsData: !!analyticsData,
    totalCount: analyticsData?.total_count,
    dashboardStats
  });

  // Automatically check tokens when data loads (for debugging)
  useEffect(() => {
    if (!analyticsLoading && !analyticsError && analyticsData) {
      handleDebugTokens();
    }
  }, [analyticsLoading, analyticsError, analyticsData]);

  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      // Try real data first, but have fallback to demo data
      const hasRealData = !analyticsError && analyticsData && analyticsData.total_count > 0;
      
      const response = await fetch('/api/briefs/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: 'mission_brief',
          useRealData: hasRealData,
          scenario: hasRealData ? undefined : 'normal', // Use normal scenario as fallback
          timeRange: hasRealData ? {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          } : undefined
        })
      });

      const briefData = await response.json();

      if (!response.ok) {
        throw new Error(briefData.error || 'Failed to generate brief');
      }
      
      const newBrief = {
        id: Date.now().toString(),
        title: briefData.subject || `Brief - ${new Date().toLocaleDateString()}`,
        createdAt: briefData.generatedAt || new Date().toISOString(),
        status: 'completed' as const,
        style: briefData.style || 'mission_brief',
        dataSource: briefData.dataSource
      };
      
      setRecentBriefs(prev => [newBrief, ...prev.slice(0, 4)]); // Keep only 5 most recent
      
      // Store the brief data for the current brief page
      sessionStorage.setItem('currentBrief', JSON.stringify(briefData));
      
      toast({
        title: 'Brief Generated',
        description: briefData.dataSource === 'real' ? 
          'Your executive brief has been created using your real data.' :
          'Your executive brief has been created using demo data. Connect your services for personalized insights.',
      });
      
      router.push(`/briefs/current`);
    } catch (error) {
      console.error('Brief generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate brief. Please try again.',
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

  const handleDebugTokens = async () => {
    try {
      const response = await fetch('/api/debug/tokens');
      const data = await response.json();
      console.log('🔍 Token Debug Info:', data);
      toast({
        title: 'Debug Info',
        description: `Found ${data.counts?.userTokens || 0} user tokens. Check console for details.`,
      });
    } catch (error) {
      console.error('Debug tokens error:', error);
      toast({
        title: 'Debug Failed',
        description: 'Failed to fetch token debug info',
        variant: 'destructive',
      });
    }
  };

  // Determine service connection status based on analytics data
  const gmailStatus = {
    connected: !analyticsError && analyticsData && analyticsData.total_count > 0,
    processing: !!processingStatus,
    lastSync: (!analyticsError && analyticsData && analyticsData.total_count > 0) ? new Date().toISOString() : undefined,
    error: analyticsError || undefined,
    processingMessage: processingStatus
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
                  {analyticsLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    dashboardStats.unreadEmails
                  )}
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
                  {analyticsLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    dashboardStats.upcomingMeetings
                  )}
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
                  {analyticsLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    Math.round(dashboardStats.todaysMeetings / 8)
                  )}
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