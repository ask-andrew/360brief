'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { analyzeSentiment, generateInsights } from '@/services/analytics/sentimentAnalysis';

interface Message {
  id: string;
  subject: string;
  body: string;
  timestamp: string;
  from: string;
  to?: string;
  isRead?: boolean;
  isSent: boolean;
}

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  overall_trend?: 'positive' | 'neutral' | 'negative' | string;
  sentiment_scores?: number[];
  negative_messages?: Array<{
    id: string;
    subject: string;
    body: string;
    timestamp: string;
    reason?: string;
  }>;
  total?: number;
}

interface SentimentInsightsProps {
  messages: Message[];
}

export function SentimentInsights({ messages }: SentimentInsightsProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [sentMessagesSentiment, setSentMessagesSentiment] = useState<SentimentData | null>(null);
  const [receivedMessagesSentiment, setReceivedMessagesSentiment] = useState<SentimentData | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'mistral'>('gemini');
  const [showSentVsReceived, setShowSentVsReceived] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received' | 'insights'>('all');
  const { theme } = useTheme();

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'sent' | 'received' | 'insights');
  };

  const activeData = useMemo(() => {
    if (activeTab === 'sent' && sentMessagesSentiment) return sentMessagesSentiment;
    if (activeTab === 'received' && receivedMessagesSentiment) return receivedMessagesSentiment;
    return sentimentData;
  }, [activeTab, sentimentData, sentMessagesSentiment, receivedMessagesSentiment]);

  const renderNegativeMessages = useCallback(() => {
    const data = activeData?.negative_messages || [];
    if (!data.length) return null;
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Recent Negative Messages</h3>
        <div className="space-y-2">
          {data.slice(0, 3).map((msg) => (
            <div key={msg.id} className="p-3 border rounded-lg bg-muted/20">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{msg.subject || 'No Subject'}</h4>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {msg.body?.substring(0, 200) || ''}{msg.body?.length > 200 ? '...' : ''}
              </p>
              {msg.reason && (
                <p className="text-xs mt-1 text-muted-foreground">
                  <span className="font-medium">Reason:</span> {msg.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }, [activeData]);

  const analyzeMessages = useCallback(async () => {
    if (!messages.length) return;

    setIsLoading(true);
    setError(null);

    try {
      // Process messages with better sent/received detection
      const processedMessages = messages.map(msg => {
        // Coerce isSent to boolean if present (handles string/boolean)
        const coercedIsSent =
          typeof msg.isSent === 'string' ? msg.isSent.toLowerCase() === 'true' : !!msg.isSent;

        // If isSent is already provided (truthy/falsey), use it; otherwise detect
        if (msg.isSent !== undefined && msg.isSent !== null) {
          return { ...msg, isSent: coercedIsSent, from: msg.from || 'unknown@example.com' };
        }

        // Improved detection for sent messages when undefined
        const detectedIsSent = (
          (msg.to && !msg.from?.includes('@')) ||
          (!msg.from && !!msg.to) ||
          (msg.subject?.toLowerCase().includes('sent:') ||
            msg.body?.toLowerCase().includes('sent from my') ||
            msg.body?.toLowerCase().includes('sent via'))
        );

        return {
          ...msg,
          isSent: detectedIsSent,
          from: msg.from || 'unknown@example.com'
        };
      });

      // Log counts for debugging
      console.group('Message Analysis');
      console.log('Total messages:', messages.length);
      console.log('Sent messages:', processedMessages.filter(m => m.isSent).length);
      console.log('Received messages:', processedMessages.filter(m => !m.isSent).length);
      console.groupEnd();

      // Analyze all messages
      const allResult = await analyzeSentiment(processedMessages);
      setSentimentData(allResult);

      // Analyze sent messages
      const sentMessages = processedMessages.filter(msg => msg.isSent);
      if (sentMessages.length > 0) {
        console.log('Analyzing sent messages:', sentMessages.length);
        const sentResult = await analyzeSentiment(sentMessages);
        setSentMessagesSentiment(sentResult);
      } else {
        console.warn('No sent messages to analyze');
        setSentMessagesSentiment(null);
      }

      // Analyze received messages
      const receivedMessages = processedMessages.filter(msg => !msg.isSent);
      if (receivedMessages.length > 0) {
        console.log('Analyzing received messages:', receivedMessages.length);
        const receivedResult = await analyzeSentiment(receivedMessages);
        setReceivedMessagesSentiment(receivedResult);
      } else {
        console.warn('No received messages to analyze');
        setReceivedMessagesSentiment(null);
      }
    } catch (err) {
      console.error('Error analyzing sentiment:', err);
      setError('Failed to analyze sentiment. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  useEffect(() => {
    analyzeMessages();
  }, [analyzeMessages]);


  const comparisonData = useMemo(() => {
    if (!sentMessagesSentiment || !receivedMessagesSentiment) return [];
    
    return [
      { 
        name: 'Positive', 
        Sent: sentMessagesSentiment.positive, 
        Received: receivedMessagesSentiment.positive 
      },
      { 
        name: 'Neutral', 
        Sent: sentMessagesSentiment.neutral, 
        Received: receivedMessagesSentiment.neutral 
      },
      { 
        name: 'Negative', 
        Sent: sentMessagesSentiment.negative, 
        Received: receivedMessagesSentiment.negative 
      }
    ];
  }, [sentMessagesSentiment, receivedMessagesSentiment]);

  const chartData = useMemo(() => {
    if (!activeData) return [];
    
    return [
      { name: 'Positive', value: activeData.positive },
      { name: 'Neutral', value: activeData.neutral },
      { name: 'Negative', value: activeData.negative }
    ];
  }, [activeData]);

  const handleRegenerate = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sentimentData) return;
    setIsLoading(true);
    setError(null);
    try {
      const insightsText = await generateInsights(
        {
          positive: sentimentData.positive,
          neutral: sentimentData.neutral,
          negative: sentimentData.negative,
          overall_trend: (sentimentData.overall_trend as any) || 'neutral',
          negative_messages: (sentimentData.negative_messages || []).map(m => ({
            subject: m.subject,
            body: m.body,
            reason: m.reason
          }))
        },
        { provider: selectedProvider }
      );
      setInsights(insightsText);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Unable to generate insights. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [sentimentData, selectedProvider]);

  if (!messages.length) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No messages available for analysis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sentiment Analysis</CardTitle>
          <div className="flex items-center space-x-2">
            <Select 
              value={selectedProvider}
              onValueChange={(value) => setSelectedProvider(value as 'gemini' | 'mistral')}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="AI Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="mistral">Mistral</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRegenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            Analyze sentiment across your messages
          </p>
          <div className="flex items-center space-x-2">
            <Switch 
              id="compare-toggle"
              checked={showSentVsReceived}
              onCheckedChange={setShowSentVsReceived}
              disabled={!sentMessagesSentiment || !receivedMessagesSentiment}
            />
            <Label htmlFor="compare-toggle">Compare Sent vs Received</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <div className="h-[180px] mt-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center text-destructive">
                  {error}
                </div>
              ) : showSentVsReceived && sentMessagesSentiment && receivedMessagesSentiment ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      labelFormatter={(label: string) => `${label} Sentiment`}
                    />
                    <Legend />
                    <Bar dataKey="Sent" fill="#3b82f6" radius={[4, 0, 0, 0]} />
                    <Bar dataKey="Received" fill="#8b5cf6" radius={[0, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : activeData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      labelFormatter={(label: string) => `${label} Sentiment`}
                    />
                    <Bar
                      dataKey="value"
                      fill="currentColor"
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
            {sentMessagesSentiment?.negative_messages?.length ? (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Recent Negative Sent Messages</h3>
                <div className="space-y-2">
                  {sentMessagesSentiment.negative_messages.slice(0, 3).map((msg) => (
                    <div key={msg.id} className="p-3 border rounded-lg bg-muted/20">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{msg.subject || 'No Subject'}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {msg.body?.substring(0, 200) || ''}{msg.body?.length > 200 ? '...' : ''}
                      </p>
                      {msg.reason && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          <span className="font-medium">Reason:</span> {msg.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <div className="h-[180px] mt-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : receivedMessagesSentiment ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Positive', value: receivedMessagesSentiment.positive },
                    { name: 'Neutral', value: receivedMessagesSentiment.neutral },
                    { name: 'Negative', value: receivedMessagesSentiment.negative }
                  ]}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '']}
                      labelFormatter={(label: string) => `${label} Sentiment`}
                    />
                    <Bar
                      dataKey="value"
                      fill="currentColor"
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No received messages available for analysis
                </div>
              )}
            </div>
            {receivedMessagesSentiment?.negative_messages?.length ? (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Recent Negative Received Messages</h3>
                <div className="space-y-2">
                  {receivedMessagesSentiment.negative_messages.slice(0, 3).map((msg) => (
                    <div key={msg.id} className="p-3 border rounded-lg bg-muted/20">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{msg.subject || 'No Subject'}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {msg.body?.substring(0, 200) || ''}{msg.body?.length > 200 ? '...' : ''}
                      </p>
                      {msg.reason && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          <span className="font-medium">Reason:</span> {msg.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI-Powered Insights</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRegenerate}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-destructive">{error}</div>
                ) : insights ? (
                  <div className="prose prose-sm max-w-none">
                    {insights.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    No insights available. Click "Regenerate" to generate insights.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
