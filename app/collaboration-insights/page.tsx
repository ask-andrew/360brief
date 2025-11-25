
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  Network,
  Zap,
  Hash,
  Timer,
  AlertTriangle,
  Info,
  RefreshCw,
  Server
} from 'lucide-react';

interface CollaborationData {
  time_span: string;
  email_count: number;
  calendar_event_count: number;
  top_contacts: Array<{ name: string; count: number }>;
  average_response_times: Record<string, string>;
  key_organizations: Record<string, number>;
  emails_awaiting_response: Array<{
    subject: string;
    sender: string;
    date: string;
  }>;
  projects?: Array<{
    id: number;
    name: string;
    interaction_count: number;
    participant_count: number;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    top_keywords: string[];
    participants: string[];
  }>;
  network_metrics?: {
    total_unique_participants: number;
    average_project_participation: number;
    max_project_participation: number;
    project_distribution: Record<string, number>;
  };
  recommendation?: {
    recommendation: string;
    confidence: string;
    generated_at: string;
    model_used: string;
    context_summary: {
      projects: number;
      active_projects: number;
      participants: number;
      time_span: string;
    };
  };
  visualizations?: {
    chord_diagram?: any;
    force_directed?: any;
    timeline?: any;
    heatmap?: any;
  };
}

const CollaborationInsightsPage = () => {
  const [selectedTimeSpan, setSelectedTimeSpan] = useState('Last 90 Days');
  const [data, setData] = useState<CollaborationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const timeSpans = ['Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last 12 Months'];

  const fetchCollaborationInsights = async (timeSpan: string) => {
    if (!user?.email) {
      setError('User email not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the FastAPI service with mock mode for testing
      const response = await fetch('http://localhost:8001/api/collaboration-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_span: timeSpan,
          user_email: user.email,
          mock_mode: true  // Enable mock mode for testing
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

      toast({
        title: 'Data Updated',
        description: `Loaded collaboration insights for ${timeSpan}`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collaboration insights';
      setError(errorMessage);

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborationInsights(selectedTimeSpan);
  }, [selectedTimeSpan, user?.email]);

  // Calculate metrics from the API data for display
  const metrics = [
    {
      name: 'Email Volume',
      value: data?.email_count?.toString() || '0',
      icon: Users,
      description: 'Total emails processed'
    },
    {
      name: 'Calendar Events',
      value: data?.calendar_event_count?.toString() || '0',
      icon: Network,
      description: 'Meetings and events'
    },
    {
      name: 'Top Contacts',
      value: data?.top_contacts?.length?.toString() || '0',
      icon: Zap,
      description: 'Active collaborators'
    },
    {
      name: 'Organizations',
      value: Object.keys(data?.key_organizations || {}).length.toString(),
      icon: Hash,
      description: 'Companies involved'
    },
    {
      name: 'Avg Response Time',
      value: Object.keys(data?.average_response_times || {}).length > 0 ? 'Calculated' : 'N/A',
      icon: Timer,
      description: 'Average response times'
    },
    {
      name: 'Pending Responses',
      value: data?.emails_awaiting_response?.length?.toString() || '0',
      icon: AlertTriangle,
      description: 'Awaiting reply'
    },
  ];

  // Enhanced metrics with project clustering data
  const enhancedMetrics = [
    ...metrics,
    {
      name: 'Active Projects',
      value: data?.projects?.filter(p => p.is_active)?.length?.toString() || '0',
      icon: Network,
      description: 'Currently active projects'
    },
    {
      name: 'Network Reach',
      value: data?.network_metrics?.total_unique_participants?.toString() || '0',
      icon: Users,
      description: 'Unique collaborators'
    },
    {
      name: 'Project Diversity',
      value: data?.projects?.length?.toString() || '0',
      icon: Hash,
      description: 'Total identified projects'
    }
  ];

  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Collaboration Insights</h1>
          <p className="text-gray-600 mt-1">
            Analyze your network reach and collaboration patterns
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Time Span Toggles */}
          <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border border-gray-200">
            {timeSpans.map((span) => (
              <button
                key={span}
                onClick={() => setSelectedTimeSpan(span)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeSpan === span
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {span}
              </button>
            ))}
          </div>

          <Button
            onClick={() => fetchCollaborationInsights(selectedTimeSpan)}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">Error loading data</p>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card className="mt-6 bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Server className="w-4 h-4" />
            <p className="text-sm">
              Connected to FastAPI service at localhost:8001
              {data && ` • ${data.email_count} emails processed`}
              {data?.projects && ` • ${data.projects.length} projects identified`}
              {data?.recommendation && ` • AI recommendation generated`}
            </p>
          </div>
          {data?.recommendation && (
            <div className="text-xs text-gray-500 mt-1">
              Recommendation engine: {data.recommendation.model_used} ({data.recommendation.confidence} confidence)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <p className="font-medium">Loading collaboration insights...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actionable Insights Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Your Collaboration Insight
        </h2>
        <p className="text-gray-600 mb-4">
          {data ?
            `Based on ${data.email_count} emails and ${data.calendar_event_count} calendar events, here are your collaboration patterns for ${selectedTimeSpan}.` :
            'Loading personalized insights based on your collaboration metrics...'
          }
        </p>

        {data?.top_contacts?.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-700 mb-2">Top Collaborators:</h3>
            <div className="flex flex-wrap gap-2">
              {data.top_contacts.slice(0, 5).map((contact, index) => (
                <Badge key={index} variant="secondary">
                  {contact.name} ({contact.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {enhancedMetrics.map((metric) => (
          <Card key={metric.name} className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <metric.icon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-700">{metric.name}</h3>
                  </div>
                  <p className="text-4xl font-bold text-gray-800 mb-2">{metric.value}</p>
                  <p className="text-sm text-gray-500">{metric.description}</p>
                </div>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Contacts */}
          {data.top_contacts?.length > 0 && (
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Collaborators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.top_contacts.slice(0, 10).map((contact, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.count} interactions</p>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Times */}
          {Object.keys(data.average_response_times || {}).length > 0 && (
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Average Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.average_response_times).slice(0, 5).map(([contact, time], index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{contact}</p>
                        <p className="text-sm text-gray-500">Average response</p>
                      </div>
                      <Badge variant="secondary">{time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Responses */}
          {data.emails_awaiting_response?.length > 0 && (
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Awaiting Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.emails_awaiting_response.slice(0, 5).map((email, index) => (
                    <div key={index} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <p className="font-medium text-orange-800">{email.subject}</p>
                      <p className="text-sm text-orange-600">From: {email.sender}</p>
                      <p className="text-xs text-orange-500">{email.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organizations */}
          {Object.keys(data.key_organizations || {}).length > 0 && (
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Key Organizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.key_organizations)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([org, count], index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{org}</p>
                        <p className="text-sm text-gray-500">{count} mentions</p>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* LLM-Powered Recommendations */}
      {data?.recommendation && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Your Collaboration Insight</h2>
            <Badge variant="secondary" className="ml-auto">
              {data.recommendation.confidence} confidence
            </Badge>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed mb-3">
            {data.recommendation.recommendation}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Generated by {data.recommendation.model_used}</span>
            <span>•</span>
            <span>{data.recommendation.context_summary.projects} projects analyzed</span>
            <span>•</span>
            <span>{data.recommendation.context_summary.time_span}</span>
          </div>
        </div>
      )}

      {/* Project Clustering Analysis */}
      {data?.projects && data.projects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Dynamic Project Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects */}
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-green-600" />
                  Active Projects
                  <Badge variant="outline" className="ml-auto">
                    {data.projects.filter(p => p.is_active).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.projects.filter(p => p.is_active).slice(0, 5).map((project, index) => (
                    <div key={project.id} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-green-800">{project.name}</h4>
                        <Badge variant="secondary">{project.interaction_count} interactions</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.top_keywords.slice(0, 3).map((keyword, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-green-600">
                        {project.participant_count} participants
                        {project.end_date && ` • Ends ${new Date(project.end_date).toLocaleDateString()}`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Network Metrics */}
            {data?.network_metrics && (
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-blue-600" />
                    Network Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">Total Participants</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {data.network_metrics.total_unique_participants}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium text-purple-800">Avg Participation</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {data.network_metrics.average_project_participation.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium text-orange-800">Max Participation</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {data.network_metrics.max_project_participation}
                      </span>
                    </div>
                    {Object.keys(data.network_metrics.project_distribution).length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-800 mb-2">Project Distribution</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(data.network_metrics.project_distribution)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([count, projects]) => (
                              <span key={count} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                {projects} projects with {count} participants
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Network Visualizations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Network Visualizations</h2>

        {/* Chord Diagram */}
        {data?.visualizations?.chord_diagram && (
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-purple-600" />
                Collaboration Network - Chord Diagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <Network className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Interactive Chord Diagram</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Visualizes relationships between collaborators and projects
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Participants:</strong> {data.visualizations.chord_diagram.participants.length}
                    </div>
                    <div>
                      <strong>Projects:</strong> {data.visualizations.chord_diagram.projects.length}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Force-Directed Graph */}
        {data?.visualizations?.force_directed && (
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" />
                Force-Directed Network Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <Network className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Interactive Force-Directed Graph</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Shows the structure and strength of collaboration relationships
                  </p>
                  {data.visualizations.force_directed.network_stats && (
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Nodes:</strong> {data.visualizations.force_directed.network_stats.nodes}
                      </div>
                      <div>
                        <strong>Edges:</strong> {data.visualizations.force_directed.network_stats.edges}
                      </div>
                      <div>
                        <strong>Internal:</strong> {data.visualizations.force_directed.network_stats.internal_participants}
                      </div>
                      <div>
                        <strong>External:</strong> {data.visualizations.force_directed.network_stats.external_participants}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline Visualization */}
        {data?.visualizations?.timeline && (
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-green-600" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center">
                  <Timer className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Project Timeline Visualization</p>
                  <p className="text-sm text-gray-500">
                    Shows project activity over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CollaborationInsightsPage;
