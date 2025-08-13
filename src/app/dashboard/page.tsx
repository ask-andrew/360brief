'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isDevSession, clearDevSession, getDevSession } from '@/lib/dev-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Plus, Clock, Loader2, Pencil, Trash2, Mail, BarChart, BarChart2, MailOpen } from 'lucide-react';
import { SenderEngagementCard } from '@/components/analytics/SenderEngagementCard';
import { useSenderMetrics } from '@/hooks/use-sender-metrics';
import { format, isWeekend } from 'date-fns';
import { getDigestSchedules, deleteDigestSchedule } from '@/lib/services/digestService';
import { GoogleConnectButton, GoogleConnectionStatus } from '@/components/auth/GoogleConnectButton';
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Coming soon integrations (placeholders)
const comingSoonConnections = [
  { id: 'slack', name: 'Slack' },
  { id: 'notion', name: 'Notion' },
  { id: 'asana', name: 'Asana' },
  { id: 'jira', name: 'Jira' },
  { id: 'github', name: 'GitHub' },
  { id: 'linear', name: 'Linear' },
  { id: 'zoom', name: 'Zoom' },
  { id: 'hubspot', name: 'HubSpot' },
  { id: 'salesforce', name: 'Salesforce' },
];

// Type for scheduled digests
interface ScheduledDigest {
  id?: string;
  name: string;
  description: string;
  time: string;
  timezone: string;
  frequency: 'daily' | 'weekly' | 'weekdays';
  includeEmails: boolean;
  includeCalendar: boolean;
  summaryLength: 'brief' | 'detailed' | 'comprehensive';
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  nextDelivery?: Date;
}

// Helper function to calculate next delivery time
function calculateNextDelivery(time: string, frequency: 'daily' | 'weekly' | 'weekdays'): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  let next = new Date();
  
  // Set to today's time
  next.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, move to next occurrence
  if (next <= now) {
    if (frequency === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (frequency === 'weekdays') {
      do {
        next.setDate(next.getDate() + 1);
      } while (isWeekend(next));
    } else if (frequency === 'weekly') {
      next.setDate(next.getDate() + 7);
    }
  }
  
  return next;
}

export default function DashboardPage() {
  const router = useRouter();
  const devAuthEnabled = process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED === 'true';
  const [api, contextHolder] = notification.useNotification();
  
  // Helper function to show notifications
  const showNotification = (type: 'success' | 'error' | 'info', message: string, description?: string) => {
    api[type]({
      message,
      description,
      placement: 'topRight' as NotificationPlacement,
      duration: 3,
    });
  };

  const [isLoading, setIsLoading] = useState(true);
  const [scheduledDigests, setScheduledDigests] = useState<ScheduledDigest[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCheckingConn, setIsCheckingConn] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  
  // Use the useAuth hook to get the current user and session
  const { user, session, loading: authLoading } = useAuth();
  
  // Get user ID from session
  const getUserId = useCallback(async () => {
    if (devAuthEnabled && isDevSession()) {
      // In dev mode, use the dev user ID
      const session = getDevSession();
      return session?.userId || '123e4567-e89b-12d3-a456-426614174000';
    }
    
    // In production, use the user from the auth context
    if (!user) {
      throw new Error('Authentication required');
    }
    
    return user.id;
  }, [user, devAuthEnabled]);
  
  // Fetch scheduled briefs
  const fetchScheduledDigests = useCallback(async () => {
    try {
      const userId = await getUserId();
      const digests = await getDigestSchedules(userId);
      
      // Transform the data to include nextDelivery
      const transformedDigests = digests.map(digest => ({
        ...digest,
        nextDelivery: calculateNextDelivery(digest.time, digest.frequency),
        id: digest.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
        userId: digest.userId || userId
      })) as ScheduledDigest[];
      
      setScheduledDigests(transformedDigests);
      return transformedDigests;
    } catch (error) {
      console.error('Error fetching scheduled briefs:', error);
      showNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to load brief schedule');
      throw error;
    }
  }, [getUserId]);
  
  // Fetch connection status with proper auth
  const fetchConnectionStatus = useCallback(async () => {
    try {
      const userId = await getUserId();
      
      // Check if we have any connected Google accounts
      const { data: connectedAccounts, error } = await supabase
        .from('user_connected_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google');
      
      if (error) {
        throw error;
      }
      
      // Check if any of the accounts have a valid access token
      const now = Date.now();
      const hasValidGoogleAccount = connectedAccounts?.some(account => {
        if (!account) return false;
        const expiresAt = account.expires_at ? new Date(account.expires_at).getTime() : 0;
        return !!account.access_token && (expiresAt === 0 || expiresAt > now);
      }) || false;
      
      // Update the connection status
      setIsGoogleConnected(hasValidGoogleAccount);
      return hasValidGoogleAccount;
    } catch (e) {
      console.error('Failed to check Google connection status', e);
      setIsGoogleConnected(false);
      return false;
    }
  }, [session, getUserId]);

  const handleEditDigest = (digestId: string | undefined) => {
    if (!digestId) return;
    router.push(`/digest/${digestId}/edit`);
  };

  const handleDeleteDigest = async (digestId: string | undefined) => {
    if (!digestId) return;
    
    if (!confirm('Are you sure you want to delete this brief? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(digestId);
    try {
      await deleteDigestSchedule(digestId);
      setScheduledDigests(prev => prev.filter(digest => digest.id !== digestId));
      showNotification('success', 'Success', 'Brief schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting brief:', error);
      showNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to delete brief schedule');
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeDashboard = async () => {
      if (devAuthEnabled) {
        if (!isDevSession()) {
          router.replace('/dev/login');
          return;
        }
        setIsLoading(false);
        setIsCheckingConn(false);
        
        try {
          await Promise.all([
            fetchScheduledDigests(),
            fetchConnectionStatus()
          ]);
        } catch (error) {
          console.error('Dashboard: Error in dev mode data fetch:', error);
        }
        return;
      }

      if (!authLoading) {
        if (!user) {
          router.replace('/login');
          return;
        }
        
        try {
          await Promise.all([
            fetchScheduledDigests(),
            fetchConnectionStatus()
          ]);
        } catch (error) {
          console.error('Dashboard: Error initializing dashboard:', error);
          showNotification('error', 'Error', 'Failed to load dashboard data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeDashboard().catch(error => {
      console.error('Dashboard: Unhandled error in initializeDashboard:', error);
      setIsLoading(false);
    });
  }, [router, devAuthEnabled, user, authLoading, fetchScheduledDigests, fetchConnectionStatus]);

  const handleLogout = async () => {
    if (devAuthEnabled) {
      clearDevSession();
      window.location.href = '/dev/login';
    } else {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const handleCreateDigest = () => {
    router.push('/digest/new');
  };

  const { data: metrics = [], isLoading: metricsLoading } = useSenderMetrics();
  const safeMetrics = Array.isArray(metrics) ? metrics : [];

  if (authLoading || (isLoading && !devAuthEnabled) || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Scheduled Briefs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledDigests.length}</div>
            <p className="text-xs text-gray-500">Active briefs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Next Brief</CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledDigests.length > 0 ? (
              <div className="text-2xl font-bold">
                {scheduledDigests[0].nextDelivery ? 
                  format(scheduledDigests[0].nextDelivery, 'MMM d, h:mm a') : 
                  'Not scheduled'}
              </div>
            ) : (
              <div className="text-2xl font-bold">No briefs</div>
            )}
            <p className="text-xs text-gray-500">Upcoming delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="flex items-center">
                {isGoogleConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                )}
                <span className="font-medium">Google</span>
              </div>
              <span className="ml-auto text-sm">
                {isCheckingConn ? 'Checking...' : isGoogleConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Email Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {safeMetrics.length > 0 ? (
              <div className="space-y-4">
                {safeMetrics.slice(0, 3).map((metric, index) => (
                  <SenderEngagementCard key={index} metric={metric} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
                <p className="mt-1 text-sm text-gray-500">Connect your email to see analytics</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    {isGoogleConnected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                    )}
                    <span className="font-medium">Google</span>
                  </div>
                  <span className={`text-sm ${isGoogleConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isCheckingConn ? 'Checking...' : isGoogleConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                {!isGoogleConnected && !isCheckingConn && (
                  <div className="mt-4">
                    <GoogleConnectButton variant="outline" className="w-full" redirectPath="/dashboard" />
                    <p className="mt-2 text-sm text-gray-600 text-center">
                      Connect Google to enable Gmail and Calendar processing.
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">More integrations</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {comingSoonConnections.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <span className="text-gray-700">{c.name}</span>
                        <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">Coming Soon</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scheduled Briefs</CardTitle>
                <Button size="sm" onClick={handleCreateDigest}>
                  <Plus className="h-4 w-4 mr-1" /> New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scheduledDigests.length > 0 ? (
                <div className="space-y-4">
                  {scheduledDigests.map((digest) => (
                    <div key={digest.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{digest.name}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-4 w-4 mr-1.5" />
                            <span>
                              Next: {digest.nextDelivery ? 
                                format(digest.nextDelivery, 'EEEE, MMMM d') + ' at ' + format(digest.nextDelivery, 'h:mm a') : 
                                'Not scheduled'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {digest.frequency.charAt(0).toUpperCase() + digest.frequency.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditDigest(digest.id)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteDigest(digest.id)}
                            disabled={isDeleting === digest.id}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            {isDeleting === digest.id ? (
                              'Deleting...'
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled briefs</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first brief.</p>
                  <div className="mt-6">
                    <Button onClick={handleCreateDigest}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Brief
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {contextHolder}
    </div>
  );
}
