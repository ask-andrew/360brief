'use client';

import { useNotion } from '@/hooks/useNotion';
import { IntegrationCard } from '@/components/settings/IntegrationCard';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function NotionIntegration() {
  const { connections, isLoading, connectNotion, disconnectNotion, fetchConnections } = useNotion();
  const { toast } = useToast();

  // Initial fetch of connections
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleDisconnect = async (connectionId: string) => {
    await disconnectNotion(connectionId);
    toast({
      title: 'Success',
      description: 'Successfully disconnected from Notion',
    });
  };

  const isConnected = connections.length > 0;
  const mainConnection = isConnected ? connections[0] : null;

  return (
    <IntegrationCard
      name="Notion"
      description={
        isConnected 
          ? `Connected to ${mainConnection?.workspace_name || 'Notion workspace'}`
          : "Connect your Notion workspace to import pages and databases"
      }
      icon={
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.781.54 2.88-.348L15.75 3.24a2.25 2.25 0 0 1 2.8 2.8l-1.153 5.962c-.046.24-.072.486-.076.732a2.35 2.35 0 0 1-2.35 2.35 2.35 2.35 0 0 1-2.352-2.35c0-.246.027-.492.076-.732l.348-1.797H6.58l-.348 1.797a2.35 2.35 0 1 1-4.7 0c0-.246.027-.492.076-.732L3.24 7.8a2.25 2.25 0 0 1 1.22-2.592zM15.75 12a.75.75 0 0 0-.75.75v6.75a.75.75 0 0 0 1.5 0v-6.75a.75.75 0 0 0-.75-.75z" />
        </svg>
      }
      connected={isConnected}
      connectHref="#"
      onConnect={connectNotion}
      onDisconnect={mainConnection ? () => handleDisconnect(mainConnection.id) : undefined}
      isLoading={isLoading}
    />
  );
}
