'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  Clock, 
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar,
  Mail,
  MessageSquare
} from 'lucide-react';

interface ExecutiveInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'efficiency' | 'relationship';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metrics: {
    current: number;
    target?: number;
    trend: 'up' | 'down' | 'stable';
    unit: string;
  };
  impact: string;
  actionItems: Array<{
    action: string;
    estimatedTime: string;
    url?: string;
  }>;
  relatedContacts?: string[];
  dataSource: string;
}

// Mock executive insights based on communication patterns
const mockExecutiveInsights: ExecutiveInsight[] = [
  {
    id: '1',
    type: 'risk',
    priority: 'high',
    title: 'Client Sentiment Declining',
    description: 'Sentiment analysis shows a 40% decrease in positive language from key client communications over the past two weeks.',
    metrics: {
      current: 35,
      target: 75,
      trend: 'down',
      unit: '% positive sentiment'
    },
    impact: 'Risk of client churn or contract renegotiation. Estimated revenue at risk: $2.3M',
    actionItems: [
      {
        action: 'Schedule 1:1 with Sarah Chen (Acme Corp)',
        estimatedTime: '30 min',
        url: '/calendar/schedule/sarah-chen'
      },
      {
        action: 'Review recent client deliverables for quality issues',
        estimatedTime: '45 min'
      },
      {
        action: 'Prepare client success presentation',
        estimatedTime: '2 hours'
      }
    ],
    relatedContacts: ['sarah@acmecorp.com', 'client-success-team@company.com'],
    dataSource: 'Sentiment Analysis + Email Volume'
  },
  {
    id: '2',
    type: 'opportunity',
    priority: 'high',
    title: 'Partner Expansion Ready',
    description: 'Communication frequency with Tech Partner Inc has increased 300% with highly positive sentiment. Integration discussions are progressing well.',
    metrics: {
      current: 85,
      target: 90,
      trend: 'up',
      unit: '% positive sentiment'
    },
    impact: 'Potential to accelerate partnership timeline and expand market reach by 40%',
    actionItems: [
      {
        action: 'Propose accelerated integration timeline to Alex Johnson',
        estimatedTime: '20 min',
        url: '/compose/email/alex@techpartner.com'
      },
      {
        action: 'Schedule executive alignment meeting',
        estimatedTime: '15 min',
        url: '/calendar/schedule/tech-partner'
      },
      {
        action: 'Draft partnership expansion proposal',
        estimatedTime: '1.5 hours'
      }
    ],
    relatedContacts: ['alex@techpartner.com', 'partnerships@company.com'],
    dataSource: 'Network Analysis + Sentiment Tracking'
  },
  {
    id: '3',
    type: 'efficiency',
    priority: 'medium',
    title: 'Response Time Optimization',
    description: 'Average email response time has increased to 2.1 hours. Peak congestion occurs between 2-4 PM when 60% of daily emails arrive.',
    metrics: {
      current: 127,
      target: 60,
      trend: 'up',
      unit: 'minutes avg response'
    },
    impact: 'Delayed responses may impact stakeholder confidence and project velocity',
    actionItems: [
      {
        action: 'Block 2-4 PM for focused email processing',
        estimatedTime: '5 min',
        url: '/calendar/block-time'
      },
      {
        action: 'Set up email templates for common responses',
        estimatedTime: '30 min'
      },
      {
        action: 'Delegate routine inquiries to team leads',
        estimatedTime: '20 min'
      }
    ],
    dataSource: 'Communication Timeline Analysis'
  },
  {
    id: '4',
    type: 'relationship',
    priority: 'medium',
    title: 'Key Contacts Going Cold',
    description: 'Three high-value contacts have had no communication in 30+ days, including two board advisors and one strategic partner.',
    metrics: {
      current: 42,
      target: 14,
      trend: 'up',
      unit: 'days since last contact'
    },
    impact: 'Weakening strategic relationships could limit future opportunities and advisory support',
    actionItems: [
      {
        action: 'Send reconnection email to board advisors',
        estimatedTime: '15 min',
        url: '/templates/reconnect-advisors'
      },
      {
        action: 'Schedule quarterly check-in with strategic partner',
        estimatedTime: '10 min'
      },
      {
        action: 'Set up automated relationship maintenance reminders',
        estimatedTime: '25 min'
      }
    ],
    relatedContacts: ['advisor1@board.com', 'advisor2@board.com', 'partner@strategic.com'],
    dataSource: 'Network Map Analysis'
  },
  {
    id: '5',
    type: 'opportunity',
    priority: 'low',
    title: 'Cross-Team Collaboration Increasing',
    description: 'Inter-departmental communication has increased 45% this month, particularly between Engineering and Product teams.',
    metrics: {
      current: 145,
      target: 120,
      trend: 'up',
      unit: '% of baseline activity'
    },
    impact: 'Strong cross-team collaboration indicates healthy innovation pipeline',
    actionItems: [
      {
        action: 'Recognize teams for collaboration in all-hands',
        estimatedTime: '10 min'
      },
      {
        action: 'Document collaboration best practices',
        estimatedTime: '45 min'
      }
    ],
    dataSource: 'Internal Network Analysis'
  }
];

export function ExecutiveInsights() {
  const insights = mockExecutiveInsights;
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'efficiency': return <Target className="w-5 h-5 text-blue-600" />;
      case 'relationship': return <Users className="w-5 h-5 text-purple-600" />;
      default: return <Lightbulb className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getInsightColor = (type: string, priority: string) => {
    const baseColors = {
      opportunity: 'border-l-green-500 bg-green-50',
      risk: 'border-l-red-500 bg-red-50',
      efficiency: 'border-l-blue-500 bg-blue-50',
      relationship: 'border-l-purple-500 bg-purple-50'
    };
    
    return `${baseColors[type as keyof typeof baseColors]} ${
      priority === 'high' ? 'ring-2 ring-offset-1 ring-opacity-50 ' + baseColors[type as keyof typeof baseColors].split('-')[1] + '-200' : ''
    }`;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800 border-red-300">High Priority</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium</Badge>;
      case 'low': return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Low</Badge>;
      default: return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-600" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  // Summary stats
  const highPriorityCount = insights.filter(i => i.priority === 'high').length;
  const riskCount = insights.filter(i => i.type === 'risk').length;
  const opportunityCount = insights.filter(i => i.type === 'opportunity').length;
  const totalActions = insights.reduce((sum, i) => sum + i.actionItems.length, 0);

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            Executive Intelligence Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{riskCount}</div>
              <p className="text-sm text-muted-foreground">Risks Identified</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{opportunityCount}</div>
              <p className="text-sm text-muted-foreground">Opportunities</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalActions}</div>
              <p className="text-sm text-muted-foreground">Action Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id} className={`border-l-4 ${getInsightColor(insight.type, insight.priority)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getPriorityBadge(insight.priority)}
                      <Badge variant="outline" className="text-xs capitalize">
                        {insight.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Metrics */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <span className="text-2xl font-bold">
                      {insight.metrics.current}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {insight.metrics.unit}
                    </span>
                    {getTrendIcon(insight.metrics.trend)}
                  </div>
                  {insight.metrics.target && (
                    <div className="text-xs text-muted-foreground">
                      Target: {insight.metrics.target}{insight.metrics.unit}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Description */}
              <p className="text-sm text-gray-700">{insight.description}</p>
              
              {/* Impact */}
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm font-medium text-gray-900 mb-1">Business Impact:</p>
                <p className="text-sm text-gray-700">{insight.impact}</p>
              </div>

              {/* Action Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Recommended Actions ({insight.actionItems.length})
                </h4>
                <div className="space-y-2">
                  {insight.actionItems.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{action.estimatedTime}</span>
                        </div>
                      </div>
                      {action.url && (
                        <Button size="sm" variant="outline" className="ml-3">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Contacts */}
              {insight.relatedContacts && insight.relatedContacts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Related Contacts:</h4>
                  <div className="flex flex-wrap gap-2">
                    {insight.relatedContacts.map((contact, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        {contact}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Source */}
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Based on: {insight.dataSource}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights Footer */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
            <span>Insights updated automatically based on your communication patterns</span>
            <Badge variant="outline" className="ml-2 text-xs">
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}