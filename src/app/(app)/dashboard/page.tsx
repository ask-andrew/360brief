'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isDevSession, clearDevSession, getDevSession } from '@/lib/dev-auth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Plus, Clock, Loader2, Pencil, Trash2, Mail } from 'lucide-react';
import { format, isWeekend } from 'date-fns';
import { getDigestSchedules, deleteDigestSchedule } from '@/lib/services/digestService';
import { GoogleConnectButton, GoogleConnectionStatus } from '@/components/auth/GoogleConnectButton';
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import { supabase } from '@/lib/supabase/client';

// Connection status state will replace mocks
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
  id?: string;  // Make id optional since it might not be available for new digests
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

  const fetchConnectionStatus = async () => {
    try {
      const userId = await getUserId();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/api/user/${userId}/google/status`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to check connection');
      setIsGoogleConnected(Boolean(data?.isConnected));
    } catch (e) {
      console.error('Failed to load connection status', e);
      setIsGoogleConnected(false);
    } finally {
      setIsCheckingConn(false);
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledDigests, setScheduledDigests] = useState<ScheduledDigest[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCheckingConn, setIsCheckingConn] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  
  // Get user ID from session
  const getUserId = async () => {
    if (devAuthEnabled && isDevSession()) {
      // In dev mode, use the dev user ID
      const session = getDevSession();
      return session?.userId || '123e4567-e89b-12d3-a456-426614174000';
    }
    
    // In production, get the user from the session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Error getting user from session:', error);
      throw new Error('Authentication required');
    }
    
    return user.id;
  };
  
  // Fetch scheduled briefs
  const fetchScheduledDigests = async () => {
    try {
      const userId = await getUserId();
      console.log('Fetching briefs for user:', userId);
      const digests = await getDigestSchedules(userId);
      
      // Transform the data to include nextDelivery
      const transformedDigests = digests.map(digest => ({
        ...digest,
        nextDelivery: calculateNextDelivery(digest.time, digest.frequency),
        // Ensure required fields have values
        id: digest.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
        userId: digest.userId || userId
      })) as ScheduledDigest[];
      
      setScheduledDigests(transformedDigests);
    } catch (error) {
      console.error('Error fetching scheduled briefs:', error);
      showNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to load brief schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDigest = (digestId: string | undefined) => {
    if (!digestId) {
      console.error('Cannot edit brief: No brief ID provided');
      return;
    }
    // In a real app, this would navigate to an edit page with the brief ID
    console.log('Edit brief:', digestId);
    // For now, we'll just show an alert
    alert(`Would navigate to edit page for brief ${digestId}`);
  };

  const handleDeleteDigest = async (digestId: string | undefined) => {
    if (!digestId) {
      console.error('Cannot delete brief: No brief ID provided');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this brief? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(digestId);
    try {
      await deleteDigestSchedule(digestId);
      
      // Update local state
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

    // Only enforce dev login when explicitly enabled
    if (devAuthEnabled) {
      if (!isDevSession()) {
        window.location.href = '/dev/login';
        return;
      }
    }

    // If dev-auth is disabled, ensure we have a real Supabase session.
    // If not authenticated, redirect to /login instead of attempting data fetches.
    if (!devAuthEnabled) {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }
        fetchScheduledDigests();
        fetchConnectionStatus();
      })();
      return;
    }
    // In dev-auth mode, skip Supabase-backed fetches to avoid RLS errors
    setIsLoading(false);
    setIsCheckingConn(false);
  }, [router, devAuthEnabled]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
          <div className="text-gray-600">Loading your briefs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dev Mode Banner (only when enabled and session present) */}
      {devAuthEnabled && isDevSession() && (
        <div className="w-full bg-yellow-200 text-yellow-900 py-2 px-4 text-center font-semibold flex items-center justify-center">
          <span>⚠️ Dev Mode: Authentication is bypassed. Not secure.</span>
          <button
            onClick={handleLogout}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm flex items-center"
          >
            Logout
          </button>
        </div>
      )}
      {devAuthEnabled && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          Dev Auth enabled: Supabase-backed data (digests, connection status) is disabled. Set NEXT_PUBLIC_DEV_AUTH_ENABLED=false to test live data.
        </div>
      )}
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Button onClick={handleCreateDigest}>
              <Plus className="mr-2 h-4 w-4" />
              New Brief
            </Button>
          </div>

          {/* Connected Accounts */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Connected Accounts</h2>
            <div className="space-y-4">
              {/* Gmail */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  {isGoogleConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                  )}
                  <span className="font-medium">Gmail</span>
                </div>
                <span className={`text-sm ${isGoogleConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isCheckingConn ? 'Checking…' : isGoogleConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {/* Calendar (same Google connection) */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  {isGoogleConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                  )}
                  <span className="font-medium">Google Calendar</span>
                </div>
                <span className={`text-sm ${isGoogleConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isCheckingConn ? 'Checking…' : isGoogleConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>

            {!isGoogleConnected && !isCheckingConn && (
              <div className="mt-4">
                <GoogleConnectButton variant="outline" className="w-full" redirectPath="/dashboard" />
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Connect Google to enable Gmail and Calendar processing.
                </p>
              </div>
            )}

            {/* Coming Soon integrations */}
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

          {/* Scheduled Briefs */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scheduled Briefs</h2>
            {scheduledDigests.length > 0 ? (
              <div className="space-y-4">
                {scheduledDigests.map((digest) => (
                  <div key={digest.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{digest.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1.5" />
                          <span>Next: {digest.nextDelivery ? (
                            `${format(digest.nextDelivery, 'EEEE, MMMM d')} at ${format(digest.nextDelivery, 'h:mm a')}`
                          ) : 'Not scheduled'}</span>
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
          </div>

          {/* Recent Briefs - Only show if we have briefs */}
          {scheduledDigests.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Briefs</h2>
              </div>
              <div className="space-y-4">
                {scheduledDigests.slice(0, 3).map(digest => (
                  <div key={digest.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{digest.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1.5" />
                          <span>Last delivered: {format(new Date(), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {scheduledDigests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No briefs created yet. Create your first brief to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
