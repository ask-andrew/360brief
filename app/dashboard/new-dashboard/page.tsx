
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
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

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
        const response = await fetch('/api/analytics/quick?use_real_data=true');
        
        if (response.ok) {
          const apiData = await response.json();
          
          if (apiData.status === 'processing' || apiData.processing) {
            const message = apiData.message || 'Processing your Gmail data... This may take 30-60 seconds as we analyze your messages.';
            setProcessingStatus(message);
            setData(null);
            
            setTimeout(() => {
              fetchData();
            }, 15000);
          } else if (apiData.status === 'error') {
            setError(`Data processing failed: ${apiData.error || 'Unknown error'}`);
            setData(null);
          } else {
            setData(apiData);
            
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

export default function NewDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: analyticsData, loading, error, processingStatus } = useDashboardData();

  const generatedAt = new Date().toISOString();

  if (loading) {
    return <div>Loading...</div>; // Or a more sophisticated skeleton loader
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'friend'}!
          </h1>
          <p className="text-gray-500">Here is your intelligence briefing for today.</p>
        </div>
        <Button onClick={() => toast({ title: 'Generating new brief...' })}>
          <Zap className="w-4 h-4 mr-2" />
          Generate New Brief
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Briefing Hub */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-white shadow-lg border-l-4 border-indigo-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Daily Intelligence Briefing</span>
                <span className="text-sm font-normal text-gray-500">
                  Generated: {new Date(generatedAt).toLocaleTimeString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Priorities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Priorities</h3>
                <ul className="space-y-2">
                  {analyticsData?.priority_messages?.awaiting_my_reply?.slice(0, 3).map((p: any, i: number) => (
                    <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>{p.subject}</span>
                      <Badge variant="outline">{p.from}</Badge>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Blockers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Blockers Identified</h3>
                <ul className="space-y-2">
                  {analyticsData?.risks?.slice(0, 2).map((b: any, i: number) => (
                    <li key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span>{b.summary}</span>
                      <Badge variant="destructive">{b.risk_level || 'High'} Risk</Badge>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Wins */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Team Wins</h3>
                <ul className="space-y-2">
                  {analyticsData?.achievements?.slice(0, 1).map((w: any, i: number) => (
                    <li key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span>{w.summary}</span>
                      <Badge className="bg-green-100 text-green-700">{w.kudos_to || 'Team'}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-right">
                <Button variant="link" onClick={() => router.push(`/briefs/1`)}>
                  View Full Brief <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Trends & Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Trends & Performance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 rounded-lg bg-gray-50">
                    <p className="text-4xl font-bold text-green-600">-10%</p>
                    <p className="text-gray-600">less time on email this week</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                    <p className="text-4xl font-bold text-green-600">-25%</p>
                    <p className="text-gray-600">fewer blocker mentions this month</p>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Risk & Opportunity Feed */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Risk & Opportunity Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData?.priority_messages?.needs_my_attention?.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="font-semibold">Urgent</p>
                    <p className="text-sm text-gray-600">{item.subject}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Connections & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Connections & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <span>Gmail</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span>Google Calendar</span>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700">Not Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        <span>Slack</span>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700">Not Connected</Badge>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/connections')}>
                    Manage Connections
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
