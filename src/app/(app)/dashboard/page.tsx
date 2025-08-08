'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isDevSession, clearDevSession, getDevSession } from '@/lib/dev-auth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Plus, Clock, Mail, Pencil, Trash2, Loader2 } from 'lucide-react';
import { format, addDays, isWeekend } from 'date-fns';
import { getDigestSchedules, deleteDigestSchedule } from '@/lib/services/digestService';
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';
import { supabase } from '@/lib/supabase/client';

// Mock data - will be replaced with real data
const mockConnections = [
  { id: 'gmail', name: 'Gmail', connected: true },
  { id: 'calendar', name: 'Google Calendar', connected: true },
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
  
  // Get user ID from session
  const getUserId = async () => {
    if (isDevSession()) {
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
  
  // Fetch scheduled digests
  const fetchScheduledDigests = async () => {
    try {
      const userId = await getUserId();
      console.log('Fetching digests for user:', userId);
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
      console.error('Error fetching scheduled digests:', error);
      showNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to delete digest schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDigest = (digestId: string | undefined) => {
    if (!digestId) {
      console.error('Cannot edit digest: No digest ID provided');
      return;
    }
    // In a real app, this would navigate to an edit page with the digest ID
    console.log('Edit digest:', digestId);
    // For now, we'll just show an alert
    alert(`Would navigate to edit page for digest ${digestId}`);
  };

  const handleDeleteDigest = async (digestId: string | undefined) => {
    if (!digestId) {
      console.error('Cannot delete digest: No digest ID provided');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this digest? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(digestId);
    try {
      await deleteDigestSchedule(digestId);
      
      // Update local state
      setScheduledDigests(prev => prev.filter(digest => digest.id !== digestId));
      
      showNotification('success', 'Success', 'Digest schedule deleted successfully');
    } catch (error) {
      console.error('Error deleting digest:', error);
      showNotification('error', 'Error', error instanceof Error ? error.message : 'Failed to delete digest schedule');
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !isDevSession()) {
      window.location.href = '/dev/login';
    } else {
      fetchScheduledDigests();
    }
  }, [router]);

  const handleLogout = () => {
    clearDevSession();
    window.location.href = '/dev/login';
  };

  const handleCreateDigest = () => {
    router.push('/digest/new');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
          <div className="text-gray-600">Loading your digests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dev Mode Banner */}
      <div className="w-full bg-yellow-200 text-yellow-900 py-2 px-4 text-center font-semibold flex items-center justify-center">
        <span>⚠️ Dev Mode: Authentication is bypassed. Not secure.</span>
        <button
          onClick={handleLogout}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm flex items-center"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Button onClick={handleCreateDigest}>
              <Plus className="mr-2 h-4 w-4" />
              New Digest
            </Button>
          </div>

          {/* Next Scheduled Digests */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scheduled Digests</h2>
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled digests</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first digest.</p>
                <div className="mt-6">
                  <Button onClick={handleCreateDigest}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Digest
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Connected Accounts</h2>
            <div className="space-y-4">
              {mockConnections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    {connection.connected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                    )}
                    <span className="font-medium">{connection.name}</span>
                  </div>
                  <span className={`text-sm ${connection.connected ? 'text-green-600' : 'text-yellow-600'}`}>
                    {connection.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Digests - Only show if we have digests */}
          {scheduledDigests.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recent Digests</h2>
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
                    <p>No digests created yet. Create your first digest to get started.</p>
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
