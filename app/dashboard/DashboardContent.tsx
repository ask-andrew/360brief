'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDigestSchedules, createDigestSchedule, updateDigestSchedule, deleteDigestSchedule } from '@/lib/actions/digest';
import { calculateNextDelivery } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-provider';
import { ScheduledDigest } from '@/types/digest';

export default function DashboardContent() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch scheduled digests
  const { data: scheduledDigests = [], isLoading } = useQuery<ScheduledDigest[]>({
    queryKey: ['scheduledDigests'],
    queryFn: getDigestSchedules,
    select: (data) => 
      data.map((digest: ScheduledDigest) => ({
        ...digest,
        nextDelivery: calculateNextDelivery(digest.time, digest.frequency),
      })),
    enabled: isClient,
  });

  // Handle create/update/delete operations
  const handleCreateDigest = useCallback(async (digest: Omit<ScheduledDigest, 'id'>) => {
    try {
      await createDigestSchedule(digest);
      await queryClient.invalidateQueries({ queryKey: ['scheduledDigests'] });
      toast({
        title: 'Success',
        description: 'Digest schedule created successfully',
      });
    } catch (error) {
      console.error('Error creating digest:', error);
      toast({
        title: 'Error',
        description: 'Failed to create digest schedule',
        variant: 'destructive',
      });
    }
  }, [queryClient, toast]);

  // Rest of your dashboard component JSX...
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => router.push('/digest/new')}>
          Schedule New Digest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Digests</CardTitle>
          <CardDescription>Manage your scheduled briefings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : scheduledDigests.length > 0 ? (
            <div className="space-y-4">
              {scheduledDigests.map((digest) => (
                <div key={digest.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{digest.name || 'Untitled Digest'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {digest.frequency} at {digest.time}
                      </p>
                      {digest.nextDelivery && (
                        <p className="text-sm text-muted-foreground">
                          Next delivery: {new Date(digest.nextDelivery).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No scheduled digests found</p>
              <Button className="mt-4" onClick={() => router.push('/digest/new')}>
                Schedule Your First Digest
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
