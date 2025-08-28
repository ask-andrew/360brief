import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

type NotionConnection = {
  id: string;
  bot_id: string;
  workspace_name?: string;
  workspace_icon?: string;
  created_at: string;
  last_synced_at?: string;
};

export function useNotion() {
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<NotionConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notion/connections');
      if (!response.ok) {
        throw new Error('Failed to fetch Notion connections');
      }
      const data = await response.json();
      setConnections(data);
    } catch (err) {
      console.error('Error fetching Notion connections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch connections');
      toast({
        title: 'Error',
        description: 'Failed to fetch Notion connections',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const connectNotion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This will redirect to Notion's OAuth page
      window.location.href = '/api/notion/authorize';
    } catch (err) {
      console.error('Error initiating Notion connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Notion');
      toast({
        title: 'Error',
        description: 'Failed to initiate Notion connection',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  }, [toast]);

  const disconnectNotion = useCallback(async (connectionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notion/connections?id=${connectionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect Notion');
      }
      
      // Refresh the connections list
      await fetchConnections();
      
      toast({
        title: 'Success',
        description: 'Successfully disconnected from Notion',
      });
    } catch (err) {
      console.error('Error disconnecting Notion:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect Notion');
      toast({
        title: 'Error',
        description: 'Failed to disconnect from Notion',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchConnections, toast]);

  return {
    connections,
    isLoading,
    error,
    fetchConnections,
    connectNotion,
    disconnectNotion,
  };
}
