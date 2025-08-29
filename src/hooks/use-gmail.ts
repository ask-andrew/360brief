import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Client-side email message type
export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: {
    name: string;
    email: string;
  };
  to: Array<{
    name: string;
    email: string;
  }>;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
  isUnread?: boolean;
}

type UseEmailsOptions = {
  enabled?: boolean;
  maxResults?: number;
  refetchInterval?: number | false;
};

/**
 * Hook to fetch and manage unread emails (mock implementation)
 */
export function useUnreadEmails({
  enabled = true,
  maxResults = 10,
  refetchInterval = 5 * 60 * 1000, // 5 minutes
}: UseEmailsOptions = {}) {
  const { user } = useAuth();

  return useQuery<EmailMessage[], Error>({
    queryKey: ['emails', 'unread'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Mock data for now - replace with API call to /api/gmail/emails
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      return [
        {
          id: '1',
          threadId: 'thread-1',
          subject: 'Q4 Performance Review',
          from: { name: 'Sarah Johnson', email: 'sarah@company.com' },
          to: [{ name: 'You', email: user.email || '' }],
          date: new Date().toISOString(),
          snippet: 'Please review the attached Q4 performance metrics...',
          labels: ['UNREAD', 'IMPORTANT']
        },
        {
          id: '2', 
          threadId: 'thread-2',
          subject: 'Meeting Follow-up: Product Strategy',
          from: { name: 'Mike Chen', email: 'mike@company.com' },
          to: [{ name: 'You', email: user.email || '' }],
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          snippet: 'Thanks for the productive discussion. Here are the action items...',
          labels: ['UNREAD']
        }
      ];
    },
    enabled: enabled && !!user,
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('User not authenticated');
      // Mock API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
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
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emails', 'threads'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [];
    },
    enabled: enabled && !!user,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to mark multiple emails as read
 */
export function useMarkMultipleAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[]>({
    mutationFn: async (messageIds: string[]) => {
      if (!user) throw new Error('User not authenticated');
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
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
