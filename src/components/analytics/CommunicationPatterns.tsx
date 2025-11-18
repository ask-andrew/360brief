import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface TimeOfDayCardProps {
  time: string;
  data: {
    sentiment: number;
    wordCount: number;
    messageCount: number;
  };
}

const TimeOfDayCard: React.FC<TimeOfDayCardProps> = ({ time, data }) => {
  const sentimentColor = data.sentiment > 0 ? 'text-green-500' : data.sentiment < 0 ? 'text-red-500' : 'text-gray-500';
  
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{time}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sentiment:</span>
            <span className={`font-medium ${sentimentColor}`}>
              {data.sentiment > 0 ? '+' : ''}{data.sentiment.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg. Words:</span>
            <span className="font-medium">{data.wordCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Messages:</span>
            <span className="font-medium">{data.messageCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CommunicationPatterns: React.FC = () => {
  const [patterns, setPatterns] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/analytics/communication-patterns?weeks=2`, { cache: 'no-store' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Failed to load patterns (${res.status})`);
        }
        const data = await res.json();
        setPatterns(data);
      } catch (error) {
        console.error('Error fetching communication patterns:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Analyzing your communication patterns...</span>
      </div>
    );
  }

  if (!patterns) {
    return (
      <div className="space-y-2">
        {error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : null}
        <div>No communication data available yet. Check back later.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">📊 Communication Patterns</h2>
        <p className="text-muted-foreground">
          Insights into your communication style and patterns. Last updated: {format(new Date(), 'MMM d, yyyy')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">By Recipient</TabsTrigger>
          <TabsTrigger value="habits">Your Habits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <h3 className="text-lg font-semibold">⏰ Time of Day Analysis</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <TimeOfDayCard time="🌅 Morning (5 AM - 12 PM)" data={patterns.timeOfDay.morning} />
            <TimeOfDayCard time="🌞 Afternoon (12 PM - 5 PM)" data={patterns.timeOfDay.afternoon} />
            <TimeOfDayCard time="🌆 Evening (5 PM - 10 PM)" data={patterns.timeOfDay.evening} />
            <TimeOfDayCard time="🌙 Late Night (10 PM - 5 AM)" data={patterns.timeOfDay.late_night} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>😊 Positive Triggers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {patterns.sentimentTriggers.positive.length > 0 ? (
                    patterns.sentimentTriggers.positive.map((trigger: string) => (
                      <span key={trigger} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {trigger}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No significant positive triggers found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>😕 Negative Triggers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {patterns.sentimentTriggers.negative.length > 0 ? (
                    patterns.sentimentTriggers.negative.map((trigger: string) => (
                      <span key={trigger} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        {trigger}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No significant negative triggers found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <h3 className="text-lg font-semibold">👥 Recipient Patterns</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patterns.recipientPatterns.slice(0, 6).map((recipient: any) => (
              <Card key={recipient.email}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{recipient.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{recipient.email}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Messages:</span>
                      <span>{recipient.messageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sentiment:</span>
                      <span className={recipient.sentiment > 0 ? 'text-green-500' : 'text-red-500'}>
                        {recipient.sentiment > 0 ? '+' : ''}{recipient.sentiment.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Best Time:</span>
                      <span>{recipient.bestTimeToContact}</span>
                    </div>
                    {recipient.topicClusters.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mt-2">Common Topics:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {recipient.topicClusters.map((topic: string) => (
                            <span key={topic} className="px-2 py-0.5 bg-muted rounded-full text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <h3 className="text-lg font-semibold">📝 Your Communication Habits</h3>
          
          <Card>
            <CardHeader>
              <CardTitle>⏱️ Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground">Fastest Average Response Time:</p>
                  <p className="text-2xl font-bold">{patterns.communicationHabits.fastestResponseTime}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Most Engaged Contacts:</p>
                  <div className="flex gap-2 mt-2">
                    {patterns.communicationHabits.mostEngagedRecipients.map((name: string) => (
                      <span key={name} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📅 Sentiment by Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(patterns.communicationHabits.sentimentByDay).map(([day, data]: [string, any]) => (
                  <div key={day} className="border rounded-lg p-4 text-center">
                    <div className="text-sm font-medium">{day}</div>
                    <div className={`text-2xl font-bold ${
                      data.sentiment > 0.1 ? 'text-green-500' : 
                      data.sentiment < -0.1 ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {data.sentiment > 0 ? '+' : ''}{data.sentiment.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">{data.count} messages</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationPatterns;
