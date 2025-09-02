'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Settings,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

type ServiceType = 'gmail' | 'calendar' | 'slack' | 'notion';

interface ServiceStatus {
  connected: boolean;
  processing?: boolean;
  lastSync?: string;
  error?: string;
  permissions?: string[];
  processingMessage?: string;
}

interface ServiceConnectionCardProps {
  service: ServiceType;
  status: ServiceStatus;
  onConnect?: () => void;
  onRefresh?: () => void;
}

const serviceConfig = {
  gmail: {
    name: 'Gmail',
    icon: Mail,
    description: 'Access your emails for brief generation',
    color: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
  },
  calendar: {
    name: 'Google Calendar',
    icon: Calendar,
    description: 'Sync your meetings and events',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
  },
  slack: {
    name: 'Slack',
    icon: Settings,
    description: 'Coming soon - Integrate team communications',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
  },
  notion: {
    name: 'Notion',
    icon: Settings,
    description: 'Coming soon - Sync your workspace',
    color: 'bg-gray-50 border-gray-200',
    iconColor: 'text-gray-600',
  },
};

export function ServiceConnectionCard({ 
  service, 
  status, 
  onConnect, 
  onRefresh 
}: ServiceConnectionCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const config = serviceConfig[service];
  const Icon = config.icon;

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: 'Connection refreshed',
        description: `${config.name} connection has been updated.`,
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: `Failed to refresh ${config.name} connection.`,
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = () => {
    if (status.processing) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Processing...
        </Badge>
      );
    }
    
    if (!status.connected) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Not Connected
        </Badge>
      );
    }
    
    if (status.error) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertCircle className="w-3 h-3" />
          Needs Attention
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3" />
        Connected
      </Badge>
    );
  };

  const isComingSoon = service === 'slack' || service === 'notion';

  return (
    <Card className={`${config.color} transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{config.name}</CardTitle>
              {isComingSoon && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>
          {!isComingSoon && getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{config.description}</p>
        
        {!isComingSoon && (
          <>
            {status.processing && status.processingMessage && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {status.processingMessage}
              </div>
            )}
            
            {status.connected && status.lastSync && !status.processing && (
              <div className="text-xs text-gray-500">
                Last synced: {new Date(status.lastSync).toLocaleString()}
              </div>
            )}
            
            {status.error && !status.processing && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {status.error}
              </div>
            )}
            
            <div className="flex gap-2">
              {!status.connected ? (
                <Button 
                  onClick={onConnect} 
                  className="flex-1"
                  variant="default"
                >
                  Connect {config.name}
                </Button>
              ) : (
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </>
        )}
        
        {isComingSoon && (
          <Button variant="outline" disabled className="w-full">
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}