'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  Mail,
  MessageCircle,
  Video,
  User
} from 'lucide-react';

interface MissedMessage {
  id: string;
  subject: string;
  from: {
    name: string;
    email: string;
    company?: string;
    isVip: boolean;
  };
  preview: string;
  timestamp: string;
  daysOld: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  hasDirectQuestion: boolean;
  tags: string[];
  channel: 'email' | 'slack' | 'teams' | 'zoom';
  threadUrl: string;
  gmailThreadId?: string;
  slackChannelId?: string;
  sentiment: number; // -1 to 1
  isClientMessage: boolean;
  estimatedResponseTime: number; // minutes
  relatedProject?: string;
}

// Mock data with executive-relevant scenarios
const mockMissedMessages: MissedMessage[] = [
  {
    id: '1',
    subject: 'URGENT: Q4 Revenue Projection Concerns',
    from: {
      name: 'Sarah Chen',
      email: 'sarah@acmecorp.com',
      company: 'Acme Corp',
      isVip: true
    },
    preview: 'Hi, I need to discuss some concerns about our Q4 projections. The numbers we discussed last week...',
    timestamp: '2024-01-26T14:30:00Z',
    daysOld: 3,
    priority: 'critical',
    hasDirectQuestion: true,
    tags: ['revenue', 'q4', 'client-escalation'],
    channel: 'email',
    threadUrl: '/gmail/thread/abc123',
    gmailThreadId: 'thread_abc123',
    sentiment: -0.6,
    isClientMessage: true,
    estimatedResponseTime: 15,
    relatedProject: 'client-expansion'
  },
  {
    id: '2',
    subject: 'Budget Approval Needed - Project Platform',
    from: {
      name: 'Finance Team',
      email: 'finance@company.com',
      isVip: false
    },
    preview: 'Following up on the budget request submitted last week. We need your approval to proceed with...',
    timestamp: '2024-01-27T09:15:00Z',
    daysOld: 2,
    priority: 'high',
    hasDirectQuestion: true,
    tags: ['budget', 'approval', 'platform'],
    channel: 'email',
    threadUrl: '/gmail/thread/def456',
    gmailThreadId: 'thread_def456',
    sentiment: 0.1,
    isClientMessage: false,
    estimatedResponseTime: 10,
    relatedProject: 'platform-upgrade'
  },
  {
    id: '3',
    subject: 'Re: Partnership Discussion Follow-up',
    from: {
      name: 'Alex Johnson',
      email: 'alex@techpartner.com',
      company: 'Tech Partner Inc',
      isVip: true
    },
    preview: 'Thanks for the great meeting yesterday. Just wanted to clarify a few points about the technical integration...',
    timestamp: '2024-01-28T16:45:00Z',
    daysOld: 1,
    priority: 'medium',
    hasDirectQuestion: false,
    tags: ['partnership', 'integration', 'follow-up'],
    channel: 'email',
    threadUrl: '/gmail/thread/ghi789',
    gmailThreadId: 'thread_ghi789',
    sentiment: 0.4,
    isClientMessage: true,
    estimatedResponseTime: 5,
    relatedProject: 'partnership'
  },
  {
    id: '4',
    subject: 'Team Standup - Action Items Pending',
    from: {
      name: 'Mike Rodriguez',
      email: 'mike@company.com',
      isVip: false
    },
    preview: '@channel Can you provide an update on the client deliverables? Team is blocked waiting for your input...',
    timestamp: '2024-01-28T10:20:00Z',
    daysOld: 1,
    priority: 'high',
    hasDirectQuestion: true,
    tags: ['standup', 'deliverables', 'blocked'],
    channel: 'slack',
    threadUrl: '/slack/thread/jkl012',
    slackChannelId: 'C1234567890',
    sentiment: -0.2,
    isClientMessage: false,
    estimatedResponseTime: 3,
    relatedProject: 'client-deliverables'
  },
  {
    id: '5',
    subject: 'Board Meeting Prep - Missing Slides',
    from: {
      name: 'Executive Assistant',
      email: 'ea@company.com',
      isVip: false
    },
    preview: 'The board meeting is tomorrow and we\'re still missing the Q4 performance slides you mentioned...',
    timestamp: '2024-01-28T17:30:00Z',
    daysOld: 1,
    priority: 'critical',
    hasDirectQuestion: true,
    tags: ['board-meeting', 'slides', 'q4-performance'],
    channel: 'email',
    threadUrl: '/gmail/thread/mno345',
    gmailThreadId: 'thread_mno345',
    sentiment: -0.3,
    isClientMessage: false,
    estimatedResponseTime: 20,
    relatedProject: 'board-reporting'
  }
];

export function ActionableMissedMessages() {
  const [messages, setMessages] = useState(mockMissedMessages);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterChannel, setFilterChannel] = useState<'all' | 'email' | 'slack' | 'teams' | 'zoom'>('all');
  const [showOnlyVip, setShowOnlyVip] = useState(false);

  const filteredMessages = messages.filter(msg => {
    if (searchTerm && !msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !msg.from.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterPriority !== 'all' && msg.priority !== filterPriority) {
      return false;
    }
    if (filterChannel !== 'all' && msg.channel !== filterChannel) {
      return false;
    }
    if (showOnlyVip && !msg.from.isVip) {
      return false;
    }
    return true;
  });

  const handleMarkAsHandled = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleOpenThread = (message: MissedMessage) => {
    // In a real app, this would navigate to the actual thread
    if (message.channel === 'email' && message.gmailThreadId) {
      window.open(`https://mail.google.com/mail/u/0/#inbox/${message.gmailThreadId}`, '_blank');
    } else if (message.channel === 'slack' && message.slackChannelId) {
      window.open(`https://app.slack.com/client/workspace/${message.slackChannelId}`, '_blank');
    } else {
      window.open(message.threadUrl, '_blank');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'slack': return <MessageCircle className="w-4 h-4" />;
      case 'teams': return <MessageSquare className="w-4 h-4" />;
      case 'zoom': return <Video className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment < -0.3) return 'text-red-600';
    if (sentiment < -0.1) return 'text-orange-600';
    if (sentiment > 0.3) return 'text-green-600';
    return 'text-gray-600';
  };

  const criticalCount = filteredMessages.filter(m => m.priority === 'critical').length;
  const vipCount = filteredMessages.filter(m => m.from.isVip).length;
  const avgResponseTime = Math.round(
    filteredMessages.reduce((sum, m) => sum + m.estimatedResponseTime, 0) / filteredMessages.length
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-sm text-muted-foreground">Critical Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{vipCount}</div>
            <p className="text-sm text-muted-foreground">VIP Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{avgResponseTime}m</div>
            <p className="text-sm text-muted-foreground">Avg Est. Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{filteredMessages.length}</div>
            <p className="text-sm text-muted-foreground">Total Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Missed Messages Requiring Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages or senders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Priority:</span>
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(priority => (
                  <Button
                    key={priority}
                    variant={filterPriority === priority ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterPriority(priority)}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Channel:</span>
                {(['all', 'email', 'slack', 'teams', 'zoom'] as const).map(channel => (
                  <Button
                    key={channel}
                    variant={filterChannel === channel ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterChannel(channel)}
                  >
                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </Button>
                ))}
              </div>
              
              <Button
                variant={showOnlyVip ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyVip(!showOnlyVip)}
                className="flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                VIP Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardContent className="p-0">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No missed messages match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredMessages.map((message, index) => (
                <div
                  key={message.id}
                  className={`p-6 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                    message.priority === 'critical' ? 'bg-red-50 hover:bg-red-100' : ''
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getPriorityColor(message.priority)}>
                            {message.priority.toUpperCase()}
                          </Badge>
                          {message.from.isVip && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                              VIP
                            </Badge>
                          )}
                          {message.isClientMessage && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              Client
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {getChannelIcon(message.channel)}
                            <span className="text-sm capitalize">{message.channel}</span>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                          {message.subject}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{message.from.name}</span>
                            {message.from.company && (
                              <span className="text-xs">({message.from.company})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{message.daysOld} day{message.daysOld !== 1 ? 's' : ''} ago</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={getSentimentColor(message.sentiment)}>
                              {message.sentiment > 0.2 ? '😊' : message.sentiment < -0.2 ? '😟' : '😐'}
                            </span>
                            <span>Sentiment</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                          {message.preview}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {message.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {message.hasDirectQuestion && (
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                              Direct Question
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <Button
                          onClick={() => handleOpenThread(message)}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Thread
                        </Button>
                        
                        <Button
                          onClick={() => handleMarkAsHandled(message.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Done
                        </Button>
                        
                        <div className="text-xs text-muted-foreground text-center mt-1">
                          Est. {message.estimatedResponseTime}m to respond
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}