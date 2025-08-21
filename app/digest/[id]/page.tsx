import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default async function DigestPage(props: any) {
  const { params } = props || { params: {} };
  const supabase = await createClient();
  
  // Get the digest data from the database
  const { data: digest, error } = await supabase
    .from('digests')
    .select('*')
    .eq('id', params?.id)
    .single();

  if (error || !digest) {
    return notFound();
  }

  // Parse the brief content (ExecutiveBrief)
  const brief = typeof digest.content === 'string' 
    ? JSON.parse(digest.content) 
    : digest.content;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {brief.subject || 'Executive Brief'}
          </h1>
          {brief.tldr && (
            <p className="text-gray-700 max-w-2xl mx-auto">
              {brief.tldr}
            </p>
          )}
        </div>

        {/* Metrics */}
        {brief.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {typeof brief.metrics.emails === 'number' && (
              <SummaryCard 
                title="Emails"
                value={brief.metrics.emails}
                icon="mail"
                description="Emails in period"
              />
            )}
            {typeof brief.metrics.meetings === 'number' && (
              <SummaryCard 
                title="Meetings"
                value={brief.metrics.meetings}
                icon="calendar"
                description="Meetings in period"
              />
            )}
            {brief.metrics.trendLabel && (
              <SummaryCard 
                title="Trend"
                value={0}
                icon="barChart2"
                description={brief.metrics.trendLabel}
              />
            )}
          </div>
        )}

        {/* Highlights */}
        {Array.isArray(brief.highlights) && brief.highlights.length > 0 && (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.star className="h-5 w-5 text-blue-500" />
                Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {brief.highlights.map((h: any, i: number) => (
                  <div key={i} className="border-l-4 border-blue-500 pl-4 py-2 space-y-1">
                    <div className="font-medium">{h.title}</div>
                    {h.summary && <div className="text-sm text-gray-600">{h.summary}</div>}
                    {Array.isArray(h.bullets) && h.bullets.length > 0 && (
                      <ul className="list-disc ml-5 mt-1 text-sm text-gray-700">
                        {h.bullets.map((b: string, j: number) => (<li key={j}>{b}</li>))}
                      </ul>
                    )}
                    {h.cta?.url && (
                      <div className="pt-1">
                        <a href={h.cta.url} className="inline-flex items-center text-sm text-blue-600 hover:underline">
                          {h.cta.label || 'Open latest message'}
                          <Icons.arrowRight className="h-4 w-4 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {Array.isArray(brief.nextSteps) && brief.nextSteps.length > 0 && (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.arrowRight className="h-5 w-5 text-blue-500" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {brief.nextSteps.map((n: any, i: number) => (
                  <div key={i} className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{n.title}</div>
                      <div className="text-sm text-gray-600">
                        {n.assignee ? `Owner: ${n.assignee}` : ''}
                        {n.due ? `${n.assignee ? ' • ' : ''}Due: ${n.due}` : ''}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Icons.check className="h-4 w-4 mr-2" />
                      Mark done
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Style-specific preview (optional minimal) */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.layout className="h-5 w-5 text-blue-500" />
              Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {brief.style || 'mission_brief'}
            </div>
          </CardContent>
        </Card>

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
