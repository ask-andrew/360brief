import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default async function DigestPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  // Get the digest data from the database
  const { data: digest, error } = await supabase
    .from('digests')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !digest) {
    return notFound();
  }

  // Parse the digest content
  const content = typeof digest.content === 'string' 
    ? JSON.parse(digest.content) 
    : digest.content;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            360°Brief Weekly Digest
          </h1>
          <p className="text-gray-600">
            {content.dateRange}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <SummaryCard 
            title="Emails"
            value={content.summary.emailCount}
            icon="mail"
            description="Total emails received"
          />
          <SummaryCard 
            title="Events"
            value={content.summary.eventCount}
            icon="calendar"
            description="Calendar events"
          />
          <SummaryCard 
            title="Important"
            value={content.summary.importantItems}
            icon="alertCircle"
            description="Items needing attention"
          />
        </div>

        {/* Insights */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.barChart2 className="h-5 w-5 text-blue-500" />
              Weekly Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Top Senders</h3>
                <ul className="space-y-2">
                  {content.insights.topSenders.map((sender: any, i: number) => (
                    <li key={i} className="flex justify-between">
                      <span className="text-gray-600">{sender.name}</span>
                      <span className="font-medium">{sender.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Busiest Day</h3>
                <p className="text-2xl font-bold">{content.insights.busiestDay}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Meeting Time</h3>
                <p className="text-2xl font-bold">{content.insights.meetingHours} hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Emails */}
        {content.emails.length > 0 && (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.mail className="h-5 w-5 text-blue-500" />
                Important Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {content.emails.map((email: any, i: number) => (
                  <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{email.subject}</h3>
                        <p className="text-sm text-gray-500">
                          From: {email.from} • {email.date}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Icons.externalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <p className="mt-2 text-gray-600">
                      {email.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        {content.events.length > 0 && (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.calendar className="h-5 w-5 text-blue-500" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {content.events.map((event: any, i: number) => (
                  <div key={i} className="flex justify-between items-start p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                      <h3 className="font-medium">{event.summary}</h3>
                      <p className="text-sm text-gray-500">
                        {event.start} - {event.end}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Icons.calendarPlus className="h-4 w-4 mr-2" />
                      Add to Calendar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-12">
          <p>This is a secure, shareable link to your weekly digest.</p>
          <p className="mt-2">
            <a href="/" className="text-blue-500 hover:underline">
              Go to Dashboard
            </a>
            {' • '}
            <a href="/preferences" className="text-blue-500 hover:underline">
              Update Preferences
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper component for summary cards
function SummaryCard({ title, value, icon, description }: { 
  title: string; 
  value: number; 
  icon: keyof typeof Icons;
  description: string;
}) {
  const Icon = Icons[icon] || Icons.helpCircle;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-50">
            <Icon className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}
