import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUnreadEmails, markAsRead, EmailMessage, fetchEmailThreads } from '@/lib/gmail/client';
import { useAuthStore } from '@/store/auth-store';

type UseEmailsOptions = {
  enabled?: boolean;
  maxResults?: number;
  refetchInterval?: number | false;
};

/**
 * Hook to fetch and manage unread emails
 */
export function useUnreadEmails({
  enabled = true,
  maxResults = 10,
  refetchInterval = 5 * 60 * 1000, // 5 minutes
}: UseEmailsOptions = {}) {
  const user = useAuthStore(state => state.user);
  const userId = user?.id;

  return useQuery<EmailMessage[], Error>({
    queryKey: ['emails', 'unread'],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchUnreadEmails(userId, maxResults);
    },
    enabled: enabled && !!userId,
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to mark an email as read
 */
export function useMarkAsRead() {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation<void, Error, string>({
    mutationFn: async (messageId: string) => {
      if (!userId) throw new Error('User not authenticated');
      await markAsRead(userId, messageId);
    },
    onSuccess: (_, messageId) => {
      // Optimistically update the cache
      queryClient.setQueryData<EmailMessage[]>(['emails', 'unread'], (old) =>
        old ? old.filter((email) => email.id !== messageId) : []
      );
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['emails', 'unread'] });
    },
  });
}

/**
 * Hook to fetch email threads
 */
export function useEmailThreads({
  enabled = true,
  maxResults = 10,
}: {
  enabled?: boolean;
  maxResults?: number;
} = {}) {
  const user = useAuthStore(state => state.user);
  const userId = user?.id;

  return useQuery({
    queryKey: ['emails', 'threads'],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchEmailThreads(userId, maxResults);
    },
    enabled: enabled && !!userId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to mark multiple emails as read
 */
export function useMarkMultipleAsRead() {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const userId = user?.id;
  const { mutate: markSingleAsRead } = useMarkAsRead();

  return useMutation<void, Error, string[]>({
    mutationFn: async (messageIds: string[]) => {
      if (!userId) throw new Error('User not authenticated');
      
      // Process each message in parallel
      await Promise.all(
        messageIds.map((id) => markAsRead(userId, id).catch(console.error))
      );
    },
    onSuccess: (_, messageIds) => {
      // Optimistically update the cache
      queryClient.setQueryData<EmailMessage[]>(['emails', 'unread'], (old) =>
        old ? old.filter((email) => !messageIds.includes(email.id)) : []
      );
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['emails', 'unread'] });
    },
  });
}

/**
 * Hook to get email statistics
 */
export function useEmailStats() {
  const { data: emails, isLoading } = useUnreadEmails({ maxResults: 100 });
  
  // Process emails to get statistics
  const stats = {
    total: emails?.length || 0,
    bySender: emails?.reduce((acc, email) => {
      const domain = email.from.email.split('@')[1] || 'unknown';
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    byDay: emails?.reduce((acc, email) => {
      const date = new Date(email.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  return {
    stats,
    isLoading,
  };
}
