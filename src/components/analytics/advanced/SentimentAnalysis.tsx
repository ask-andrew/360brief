'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Heart,
  AlertTriangle,
  Smile,
  Frown,
  Meh
} from 'lucide-react';

interface SentimentData {
  overall: {
    score: number; // -1 to 1
    trend: 'positive' | 'negative' | 'neutral';
    change: number;
  };
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  insights: Array<{
    type: 'risk' | 'opportunity' | 'neutral';
    message: string;
    contact?: string;
    threadUrl?: string;
  }>;
  topSenders: Array<{
    name: string;
    email: string;
    sentiment: number;
    messageCount: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
}

// Mock data with realistic executive scenarios
const mockSentimentData: SentimentData = {
  overall: {
    score: 0.15,
    trend: 'positive',
    change: 8
  },
  breakdown: {
    positive: 45,
    neutral: 40,
    negative: 15
  },
  insights: [
    {
      type: 'risk',
      message: 'Client escalation detected in thread about Q4 deliverables',
      contact: 'Sarah Chen (Acme Corp)',
      threadUrl: '/gmail/thread/abc123'
    },
    {
      type: 'opportunity',
      message: 'Positive feedback from partner team on new API integration',
      contact: 'Tech Partners',
      threadUrl: '/gmail/thread/def456'
    },
    {
      type: 'risk',
      message: 'Budget concerns raised by finance team',
      contact: 'Finance Team',
      threadUrl: '/gmail/thread/ghi789'
    }
  ],
  topSenders: [
    {
      name: 'Sarah Chen',
      email: 'sarah@acmecorp.com',
      sentiment: -0.3,
      messageCount: 12,
      trend: 'declining'
    },
    {
      name: 'Mike Rodriguez',
      email: 'mike@company.com',
      sentiment: 0.6,
      messageCount: 8,
      trend: 'improving'
    },
    {
      name: 'Finance Team',
      email: 'finance@company.com',
      sentiment: -0.1,
      messageCount: 15,
      trend: 'declining'
    }
  ]
};

export function SentimentAnalysis() {
  const data = mockSentimentData;
  
  const getSentimentIcon = (score: number, size = 'w-5 h-5') => {
    if (score > 0.2) return <Smile className={`${size} text-green-600`} />;
    if (score < -0.2) return <Frown className={`${size} text-red-600`} />;
    return <Meh className={`${size} text-yellow-600`} />;
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-green-600';
    if (score < -0.2) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentBadge = (score: number) => {
    if (score > 0.2) return <Badge className="bg-green-100 text-green-800 border-green-300">Positive</Badge>;
    if (score < -0.2) return <Badge className="bg-red-100 text-red-800 border-red-300">Negative</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Neutral</Badge>;
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'improving' || change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === 'declining' || change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Overall Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            Communication Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Score */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getSentimentIcon(data.overall.score, 'w-8 h-8')}
                </div>
                <div className={`text-2xl font-bold ${getSentimentColor(data.overall.score)}`}>
                  {(data.overall.score * 100).toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground">Overall sentiment score</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {getTrendIcon(data.overall.trend, data.overall.change)}
                  <span className="text-sm font-medium">
                    {data.overall.change > 0 ? '+' : ''}{data.overall.change}%
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium">Message Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Positive</span>
                  </div>
                  <span className="text-sm font-medium">{data.breakdown.positive}%</span>
                </div>
                <Progress value={data.breakdown.positive} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Meh className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Neutral</span>
                  </div>
                  <span className="text-sm font-medium">{data.breakdown.neutral}%</span>
                </div>
                <Progress value={data.breakdown.neutral} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Frown className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Negative</span>
                  </div>
                  <span className="text-sm font-medium">{data.breakdown.negative}%</span>
                </div>
                <Progress value={data.breakdown.negative} className="h-2" />
              </div>
            </div>

            {/* Key Contacts */}
            <div className="space-y-3">
              <h4 className="font-medium">Key Contacts</h4>
              <div className="space-y-3">
                {data.topSenders.slice(0, 3).map((sender, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(sender.sentiment, 'w-4 h-4')}
                      <div>
                        <p className="text-sm font-medium">{sender.name}</p>
                        <p className="text-xs text-muted-foreground">{sender.messageCount} messages</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(sender.trend, 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actionable Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Sentiment Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'risk' 
                    ? 'bg-red-50 border-l-red-500' 
                    : insight.type === 'opportunity'
                    ? 'bg-green-50 border-l-green-500'
                    : 'bg-blue-50 border-l-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {insight.type === 'risk' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      {insight.type === 'opportunity' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      <Badge 
                        variant={insight.type === 'risk' ? 'destructive' : insight.type === 'opportunity' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.type === 'risk' ? 'Risk' : insight.type === 'opportunity' ? 'Opportunity' : 'Info'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{insight.message}</p>
                    {insight.contact && (
                      <p className="text-xs text-muted-foreground">{insight.contact}</p>
                    )}
                  </div>
                  {insight.threadUrl && (
                    <a 
                      href={insight.threadUrl}
                      className="ml-4 px-3 py-1 bg-white border rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      View Thread
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}