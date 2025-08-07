"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

// Import UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Network, AlertCircle } from 'lucide-react';

// Dynamically import client components with no SSR
const CommunicationPulse = dynamic(
  () => import('@/components/analytics/metrics/CommunicationPulse').then(mod => mod.default),
  { ssr: false }
);

const EngagementMetrics = dynamic(
  () => import('@/components/analytics/metrics/EngagementMetrics').then(mod => mod.default),
  { ssr: false }
);

const TimeAllocation = dynamic(
  () => import('@/components/analytics/charts/TimeAllocation').then(mod => mod.default),
  { ssr: false }
);

const NetworkGraph = dynamic(
  () => import('@/components/analytics/charts/NetworkGraph').then(mod => mod.default),
  { ssr: false }
);

const CommunicationVolume = dynamic(
  () => import('@/components/analytics/charts/CommunicationVolume').then(mod => mod.default),
  { ssr: false }
);

const EnhancedActionCenter = dynamic(
  () => import('@/components/analytics/action/EnhancedActionCenter').then(mod => mod.EnhancedActionCenter),
  { ssr: false }
);

const ProjectNetworkView = dynamic(
  () => import('@/components/analytics/ProjectNetworkView').then(mod => mod.default),
  { ssr: false }
);

// Import mock data with proper types
import { mockEnhancedData } from '@/components/analytics/action/mockEnhancedData';

// Import component prop types
import { EnhancedActionCenterProps } from '@/components/analytics/action/EnhancedActionCenter';

// Define proper types for the analytics data
interface PulseData {
  total_count: number;
  inbound_count: number;
  outbound_count: number;
  avg_response_time_minutes: number;
}

interface TimeAllocationData {
  data: {
    meetings_by_type?: Record<string, number>;
  };
}

interface CommunicationVolumeData {
  data: {
    dates: string[];
    email: {
      inbound: number[];
      outbound: number[];
    };
    slack: {
      inbound: number[];
      outbound: number[];
    };
    meeting: {
      inbound: number[];
      outbound: number[];
    };
  };
}

interface NetworkData {
  data: {
    nodes: Array<{
      id: string;
      name: string;
      email?: string;
      is_external?: boolean;
      messageCount?: number;
      symbolSize?: number;
      category?: number;
      value?: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      weight: number;
      lineStyle?: {
        width?: number;
        opacity?: number;
        curveness?: number;
      };
    }>;
    projects?: Array<{
      id: string;
      name: string;
      participants: string[];
      messageCount: number;
    }>;
  };
  viewMode?: 'people' | 'projects';
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string | null) => void;
}

type TopicGroup = {
  id: string;
  title: string;
  participants: string[];
  lastActivity: string;
  project: string;
  messageTypes: Record<string, number>;
  sentiment: number;
  urgency: 'high' | 'medium' | 'low';
  items: Array<{
    id: string;
    type: string;
    title: string;
    link: string;
    directLink?: string;
    sourceId?: string;
    timestamp: string;
    participants: string[];
    preview?: string;
  }>;
};

interface ActionItemsData {
  data: {
    topics: {
      pending: TopicGroup[];
      awaiting: TopicGroup[];
    };
    messageCounts: {
      pending: number;
      awaiting: number;
    };
    sentimentByProject: Array<{
      project: string;
      sentiment: number;
      trend: 'up' | 'down' | 'neutral';
      messages: number;
      messageTypes: {
        email: number;
        slack: number;
        meeting: number;
      };
    }>;
    sentimentByContact: Array<{
      name: string;
      sentiment: number;
      trend: 'up' | 'down' | 'neutral';
      lastContact: string;
      channel: 'email' | 'slack' | 'teams' | 'meeting';
      messageCount: number;
    }>;
  };
}

// Mock data structure with proper types
const mockAnalyticsData = {
  // Communication pulse data
  pulse: {
    total_count: 45,
    inbound_count: 25,
    outbound_count: 20,
    avg_response_time_minutes: 32,
  } as PulseData,

  // Engagement metrics
  engagement: {
    response_rate: 87,
    avg_response_time: 32,
    completion_rate: 94,
    satisfaction_score: 4.5,
  },

  // Time allocation data
  timeAllocation: {
    data: {
      meetings_by_type: {
        '1:1': 10,
        'Team Sync': 8,
        'Project Review': 5,
        'Client Call': 2
      }
    }
  } as TimeAllocationData,

  // Communication volume data
  communicationVolume: {
    data: {
      dates: ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05'],
      email: {
        inbound: [8, 10, 5, 7, 12],
        outbound: [4, 5, 3, 5, 6],
      },
      slack: {
        inbound: [12, 15, 8, 10, 14],
        outbound: [6, 8, 4, 5, 7],
      },
      meeting: {
        inbound: [3, 4, 2, 3, 5],
        outbound: [120, 180, 90, 150, 210],
      },
    }
  } as CommunicationVolumeData,

  // Network graph data
  network: {
    data: {
      nodes: [
        { 
          id: 'user1', 
          name: 'Alex Johnson', 
          email: 'alex@example.com', 
          is_external: false, 
          messageCount: 25,
          symbolSize: 20,
          category: 0
        },
        { 
          id: 'user2', 
          name: 'Jamie Smith', 
          email: 'jamie@example.com', 
          is_external: false, 
          messageCount: 18,
          symbolSize: 18,
          category: 0
        },
        { 
          id: 'user3', 
          name: 'Taylor Wong', 
          email: 'taylor@external.com', 
          is_external: true, 
          messageCount: 12,
          symbolSize: 16,
          category: 1
        }
      ],
      links: [
        { 
          source: '1', 
          target: '2',
          weight: 1,
          lineStyle: { width: 1, opacity: 0.8 }
        },
        { 
          source: '1', 
          target: '3',
          weight: 1,
          lineStyle: { width: 1, opacity: 0.8 }
        },
        { 
          source: '2', 
          target: '4',
          weight: 1,
          lineStyle: { width: 1, opacity: 0.8 }
        }
      ],
      categories: [
        { name: 'Internal' },
        { name: 'External' }
      ]
    },
    onProjectSelect: (projectId: string | null) => {
      console.log('Selected project:', projectId);
    },
  } as NetworkData,

  // Action items data - Using the mock data from the EnhancedActionCenter component
  actionItems: {
    topics: mockEnhancedData.topics,
    messageCounts: mockEnhancedData.messageCounts,
    sentimentByProject: mockEnhancedData.sentimentByProject,
    sentimentByContact: mockEnhancedData.sentimentByContact
  }
};

export default function DashboardContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (mounted) {
          setSession(session);
          
          // If no session, redirect to login with a returnTo parameter
          if (!session) {
            router.push('/login?returnTo=/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          router.push('/login?error=auth_error');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Add auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session);
        setIsLoading(false);
        
        if (!session && window.location.pathname !== '/login') {
          router.push('/login?returnTo=' + encodeURIComponent(window.location.pathname));
        }
      }
    });

    // Initial session check
    getSession();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your communications.
          </p>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6">
        {/* Top Row: Pulse Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication Pulse</CardTitle>
              <CardDescription>Your communication overview</CardDescription>
            </CardHeader>
            <CardContent>
              <CommunicationPulse data={mockAnalyticsData.pulse} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Engagement</CardTitle>
              <CardDescription>Your engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <EngagementMetrics data={mockAnalyticsData.engagement} />
            </CardContent>
          </Card>
        </div>

        {/* Middle Row: Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Time Allocation</CardTitle>
              <CardDescription>How you're spending your time this week</CardDescription>
            </CardHeader>
            <CardContent>
              <TimeAllocation data={mockAnalyticsData.timeAllocation.data} />
            </CardContent>
          </Card>
          <Card className="h-full">
            <div className="flex items-center justify-between p-6 pb-2">
              <h3 className="text-lg font-semibold">Communication Volume</h3>
              <Button variant="ghost" size="icon">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
            <CardContent>
              <CommunicationVolume data={mockAnalyticsData.communicationVolume.data} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row: Network and Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="h-full">
            <div className="flex items-center justify-between p-6 pb-2">
              <h3 className="text-lg font-semibold">Project Network</h3>
              <Button variant="ghost" size="icon">
                <Network className="h-4 w-4" />
              </Button>
            </div>
            <CardContent>
              <ProjectNetworkView />
            </CardContent>
          </Card>
          <Card className="h-full">
            <div className="flex items-center justify-between p-6 pb-2">
              <h3 className="text-lg font-semibold">Action Center</h3>
              <Button variant="ghost" size="icon">
                <AlertCircle className="h-4 w-4" />
              </Button>
            </div>
            <CardContent>
              <EnhancedActionCenter 
                data={mockAnalyticsData.actionItems}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
