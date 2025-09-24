// Frontend Integration for Enhanced Clustering
// Filename: src/components/clustering/ClusteringDisplay.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Clock, 
  TrendingUp, 
  Sparkles,
  BarChart3 
} from 'lucide-react';

// Types matching your EmailItem interface
interface ClusteringMetrics {
  total_messages: number;
  clusters_found: number;
  messages_clustered: number;
  clustering_rate: number;
  time_saved_minutes: number;
  avg_confidence: number;
  largest_cluster_size: number;
}

interface ClusterItem {
  cluster_id: string;
  topic_name: string;
  topic_category: string;
  description: string;
  email_ids: string[];
  email_count: number;
  confidence_score: number;
  key_entities: Record<string, string[]>;
  priority_score: number;
  upgrade_hint?: string;
}

interface ClusteringResult {
  clusters: ClusterItem[];
  unclustered_emails: string[];
  metrics: ClusteringMetrics;
  upgrade_suggestions: string[];
  processing_time_ms: number;
}

interface ClusteringDisplayProps {
  digestId: string;
  userId: string;
  userTier: 'free' | 'paid';
  clusteringResult: ClusteringResult;
  onUpgradeClick?: () => void;
  onClusterExpand?: (clusterId: string) => void;
}

export function ClusteringDisplay({ 
  digestId,
  userId,
  userTier, 
  clusteringResult, 
  onUpgradeClick,
  onClusterExpand 
}: ClusteringDisplayProps) {
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [showMetrics, setShowMetrics] = useState(false);

  const { clusters, metrics, upgrade_suggestions } = clusteringResult;

  const toggleCluster = (clusterId: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(clusterId)) {
      newExpanded.delete(clusterId);
    } else {
      newExpanded.add(clusterId);
      onClusterExpand?.(clusterId);
    }
    setExpandedClusters(newExpanded);
  };

  const handleUpgradeClick = async () => {
    // Track upgrade click
    try {
      await fetch('/api/clustering/upgrade-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, digest_id: digestId })
      });
    } catch (error) {
      console.error('Failed to track upgrade click:', error);
    }
    
    onUpgradeClick?.();
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'vendor_management': '🏢',
      'project_management': '📋',
      'meetings': '🤝',
      'finance': '💰',
      'client_communication': '👥',
      'general': '📧'
    };
    return icons[category as keyof typeof icons] || '📧';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'vendor_management': 'bg-blue-100 text-blue-800',
      'project_management': 'bg-green-100 text-green-800', 
      'meetings': 'bg-purple-100 text-purple-800',
      'finance': 'bg-yellow-100 text-yellow-800',
      'client_communication': 'bg-pink-100 text-pink-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Clustering Metrics Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Email Intelligence Summary
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
            >
              {showMetrics ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.clusters_found}</div>
              <div className="text-sm text-gray-600">Topics Identified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.messages_clustered}</div>
              <div className="text-sm text-gray-600">Messages Grouped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.time_saved_minutes}min</div>
              <div className="text-sm text-gray-600">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(metrics.clustering_rate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Organized</div>
            </div>
          </div>

          {showMetrics && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Clustering Confidence</span>
                  <span>{Math.round(metrics.avg_confidence * 100)}%</span>
                </div>
                <Progress value={metrics.avg_confidence * 100} className="h-2" />
              </div>
              <div className="text-xs text-gray-500">
                Processing time: {clusteringResult.processing_time_ms}ms
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topic Clusters */}
      <div className="space-y-3">
        {clusters.map((cluster) => (
          <Card key={cluster.cluster_id} className="hover:shadow-md transition-shadow">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleCluster(cluster.cluster_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedClusters.has(cluster.cluster_id) ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(cluster.topic_category)}</span>
                      <CardTitle className="text-base">{cluster.topic_name}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{cluster.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(cluster.topic_category)}>
                    {cluster.topic_category.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {cluster.email_count}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {expandedClusters.has(cluster.cluster_id) && (
              <CardContent>
                <div className="space-y-3">
                  {/* Cluster Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Information</h4>
                      {Object.entries(cluster.key_entities).map(([type, entities]) => (
                        entities.length > 0 && (
                          <div key={type} className="mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {type}:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entities.slice(0, 3).map((entity, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {entity}
                                </Badge>
                              ))}
                              {entities.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{entities.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Cluster Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Confidence:</span>
                          <span className="font-medium">
                            {Math.round(cluster.confidence_score * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Priority Score:</span>
                          <span className="font-medium">
                            {cluster.priority_score.toFixed(1)}/5.0
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Hint for Free Users */}
                  {userTier === 'free' && cluster.upgrade_hint && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-800">{cluster.upgrade_hint}</p>
                          <Button 
                            size="sm" 
                            className="mt-2 bg-gradient-to-r from-blue-500 to-purple-500"
                            onClick={handleUpgradeClick}
                          >
                            Upgrade for AI Insights
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Global Upgrade Suggestions for Free Users */}
      {userTier === 'free' && upgrade_suggestions.length > 0 && (
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-purple-900 mb-2">
                  Unlock More Insights with AI
                </h3>
                <ul className="space-y-1 text-sm text-purple-800">
                  {upgrade_suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500"
                  onClick={handleUpgradeClick}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unclustered Messages Notice */}
      {clusteringResult.unclustered_emails.length > 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {clusteringResult.unclustered_emails.length} individual messages didn't fit into topics
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for clustering API integration
export function useClusteringAPI() {
  const processEmails = async (
    userId: string,
    digestId: string,
    emails: any[],
    userTier: 'free' | 'paid' = 'free'
  ): Promise<ClusteringResult> => {
    const response = await fetch('/api/clustering/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        digest_id: digestId,
        emails: emails,
        user_tier: userTier
      })
    });

    if (!response.ok) {
      throw new Error('Clustering failed');
    }

    return response.json();
  };

  const getAnalytics = async (userId: string, days: number = 30) => {
    const response = await fetch(`/api/clustering/analytics/${userId}?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  };

  const updatePreferences = async (userId: string, preferences: any) => {
    const response = await fetch(`/api/clustering/preferences/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  };

  return {
    processEmails,
    getAnalytics,
    updatePreferences
  };
}