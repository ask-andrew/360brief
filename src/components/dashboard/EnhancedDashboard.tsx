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
import { useUnreadEmails, useEmailStats } from '@/hooks/use-gmail';
import { useUpcomingEvents, useCalendarStats } from '@/hooks/use-calendar';
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

export function EnhancedDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
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

  // Gmail data
  const { data: unreadEmails = [], isLoading: emailsLoading, error: emailsError } = useUnreadEmails({
    enabled: !!user,
    maxResults: 10
  });
  
  const { stats: emailStats, isLoading: emailStatsLoading } = useEmailStats();

  // Calendar data
  const { data: upcomingEvents = [], isLoading: eventsLoading, error: eventsError } = useUpcomingEvents({
    enabled: !!user,
    maxResults: 5
  });
  
  const { stats: calendarStats, isLoading: calendarStatsLoading } = useCalendarStats();

  const dashboardStats: DashboardStats = {
    unreadEmails: unreadEmails.length || 0,
    upcomingMeetings: upcomingEvents.length || 0,
    todaysMeetings: calendarStats?.today || 0,
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

  const handleConnectGmail = () => {
    // This would trigger the OAuth flow
    toast({
      title: 'Gmail Connection',
      description: 'Gmail OAuth flow would be triggered here.',
    });
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

  // Determine service connection status
  const gmailStatus = {
    connected: !emailsError && unreadEmails.length >= 0,
    lastSync: emailsError ? undefined : new Date().toISOString(),
    error: emailsError?.message
  };

  const calendarStatus = {
    connected: !eventsError && upcomingEvents.length >= 0,
    lastSync: eventsError ? undefined : new Date().toISOString(),
    error: eventsError?.message
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
                <p className="text-sm font-medium text-red-600">Unread Emails</p>
                <p className="text-3xl font-bold text-red-700">
                  {emailsLoading ? '...' : dashboardStats.unreadEmails}
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
                <p className="text-sm font-medium text-blue-600">Today's Meetings</p>
                <p className="text-3xl font-bold text-blue-700">
                  {calendarStatsLoading ? '...' : dashboardStats.todaysMeetings}
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
                <p className="text-sm font-medium text-green-600">Upcoming Events</p>
                <p className="text-3xl font-bold text-green-700">
                  {eventsLoading ? '...' : dashboardStats.upcomingMeetings}
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
      {(emailStats.total > 0 || calendarStats.totalUpcoming > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emailStats.total > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Top Email Domain</p>
                  <p className="font-semibold">
                    {Object.entries(emailStats.bySender)[0]?.[0] || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Object.entries(emailStats.bySender)[0]?.[1] || 0} emails
                  </p>
                </div>
              )}
              
              {calendarStats.totalUpcoming > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Busiest Hour</p>
                  <p className="font-semibold">
                    {Object.entries(calendarStats.busyHours)[0]?.[0] || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Object.entries(calendarStats.busyHours)[0]?.[1] || 0} meetings
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