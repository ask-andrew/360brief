"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CommunicationStyle = 
  | 'mission-brief' 
  | 'management-consulting' 
  | 'startup-velocity' 
  | 'newsletter';

const communicationStyles = [
  { id: 'mission-brief' as const, name: 'Mission Brief' },
  { id: 'management-consulting' as const, name: 'Management Consulting' },
  { id: 'startup-velocity' as const, name: 'Startup Velocity' },
  { id: 'newsletter' as const, name: 'Newsletter' },
];

type BriefingData = {
  // simple view fields
  updates?: Array<{
    title: string;
    summary: string;
    actionItems?: string[];
  }>;
  actionItems?: Array<{
    title: string;
    dueDate?: string;
    description?: string;
  }>;

  // richer view fields used later in the component
  time_range?: { start: string | Date; end: string | Date };
  key_themes?: Array<string | { title?: string; description?: string }>;
  action_items?: Array<{ id: string; title: string; description?: string; due_date?: string }>;
  metrics?: Array<{ name: string; value: string } >;
  upcoming_events?: Array<{ date: string; title: string; description?: string }>;
};

export default function BriefingDigest({
  isDetailed = false,
  onToggleDetail,
}: {
  isDetailed?: boolean;
  onToggleDetail?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<CommunicationStyle>('mission-brief');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);

  const handleStyleChange = (value: CommunicationStyle) => {
    setStyle(value);
  };

  const fetchBriefing = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/briefs/current', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch briefing: ${res.status} ${res.statusText}`);
      }
      const apiData = await res.json();
      setBriefing(apiData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load briefing data';
      setError(errorMessage);
      console.error('Briefing fetch error:', err);
      setBriefing(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBriefing();
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  // removed duplicate early renderContent and early return block

  const renderStartupVelocity = () => (
    <div className="space-y-6">
      {isDetailed ? (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">🚀 Current Velocity Check</h3>
          <div className="space-y-2">
            <p className="leading-relaxed">We’re in a pivotal moment with a major client escalation. This is where execution speed and clarity matter most.</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">🚧 What’s Actually Broken</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Database cluster failure with cascading dependencies</li>
              <li>15,000 end users impacted</li>
              <li>Renewal probability impact and competitive vulnerability</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">⚡ What Were Shipping Next 6 Hours</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>09:00 – Emergency response call: alignment + recovery timeline</li>
              <li>10:00 – Deep-dive root cause & prevention mapping</li>
              <li>11:00 – Customer retention strategy package</li>
              <li>12:00 – Executive briefing and go/no-go on resources</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">💰 Budget Reality Check</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Emergency Technical: $15K (infra + specialists + overtime)</li>
              <li>Customer Retention: $25K (credits + AM intensive support)</li>
              <li>Total: $40K to protect $2.4M ARR</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🚀 Quick Wins</h3>
          <div className="space-y-2">
            {briefing?.action_items?.slice(0, 3).map((item, i) => (
              <div key={item.id} className="flex items-start">
                <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  {item.description && (
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderNewsletter = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">
          {isDetailed ? 'The 360 Report' : '360 Brief'}
        </h2>
        <p className="text-muted-foreground">
          {briefing?.time_range ? 
            `${format(new Date(briefing.time_range.start), 'MMMM d, yyyy')} - ${format(new Date(briefing.time_range.end), 'MMMM d, yyyy')}` : 
            format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      {isDetailed ? (
        // Detailed Newsletter View ("Newspaper")
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wide text-primary">TOP STORIES</span>
            <h3 className="text-2xl font-semibold text-foreground">Good Morning. Here’s the latest:</h3>
            <ul className="mt-2 space-y-1">
              <li className="text-foreground">• Service Crisis: outage affecting users, database failure at root</li>
              <li className="text-foreground">• Revenue Risk: renewal probability dropped significantly</li>
              <li className="text-foreground">• Executive Response: emergency calls and CEO briefing scheduled</li>
              <li className="text-foreground">• Investment Decision: $40K crisis response requires authorization</li>
              <li className="text-foreground">• Timeline Critical: 48-hour window for relationship recovery</li>
            </ul>
          </div>

          <div className="prose prose-sm max-w-none text-foreground">
            <h4>Feature: When Your Biggest Client Goes Dark</h4>
            <p>Database cluster failures triggered cascading issues, impacting thousands of end users and elevating competitive risk. Renewal probability compressed, requiring an executive-led recovery plan.</p>
          </div>
        </div>
      ) : (
        // Concise Newsletter View
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-base font-semibold mb-2 text-foreground">📊 Key Metrics</h4>
              <ul className="space-y-2">
                {briefing?.metrics?.slice(0, 3).map((metric, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{metric.name}</span>
                    <span className="font-medium text-foreground">{metric.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-2 text-foreground">🔑 Actions</h4>
              <ul className="space-y-2">
                {briefing?.action_items?.slice(0, 3).map((item) => (
                  <li key={item.id} className="text-sm">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground mr-2 align-middle" />
                    <span className="align-middle">{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Mission Brief (Detailed/Concise)
  const renderMissionBrief = () => (
    <div className="space-y-6">
      {isDetailed ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">Mission Brief</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">Critical</span>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">BLUF: Critical client outage impacting revenue and renewal probability. Immediate executive engagement required.</p>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary">CURRENT STATUS</span>
            <div className="mt-2 space-y-1 text-foreground">
              <p><span className="font-semibold">Primary Issue:</span> Major client outage with cascading failures.</p>
              <p><span className="font-semibold">Business Impact:</span> Revenue at risk, renewal probability reduced, reputational exposure.</p>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary">IMMEDIATE ACTION ITEMS</span>
            <div className="mt-2 space-y-3 border-l pl-4">
              <div className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                <p className="text-foreground flex items-center gap-2"><Clock className="h-3 w-3 text-primary" /><span className="font-medium">09:00</span> – Emergency response call</p>
              </div>
              <div className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                <p className="text-foreground flex items-center gap-2"><Clock className="h-3 w-3 text-primary" /><span className="font-medium">10:00</span> – Internal damage assessment</p>
              </div>
              <div className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                <p className="text-foreground flex items-center gap-2"><Clock className="h-3 w-3 text-primary" /><span className="font-medium">11:00</span> – Account retention strategy</p>
              </div>
              <div className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                <p className="text-foreground flex items-center gap-2"><Clock className="h-3 w-3 text-primary" /><span className="font-medium">12:00</span> – Executive briefing</p>
              </div>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary">RESOURCE AUTHORIZATION NEEDED</span>
            <div className="mt-2 overflow-hidden rounded-md border">
              <div className="grid grid-cols-2 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground">
                <div>Category</div>
                <div className="text-right">Amount</div>
              </div>
              <div className="divide-y">
                <div className="grid grid-cols-2 px-3 py-2 text-sm">
                  <div>Emergency Technical</div>
                  <div className="text-right">$15,000</div>
                </div>
                <div className="grid grid-cols-2 px-3 py-2 text-sm">
                  <div>Customer Retention</div>
                  <div className="text-right">$25,000</div>
                </div>
                <div className="grid grid-cols-2 bg-muted/30 px-3 py-2 text-sm font-semibold">
                  <div>Total</div>
                  <div className="text-right">$40,000</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary">NEXT 48 HOURS CRITICAL</span>
            <p className="mt-2 text-foreground">Executive-level engagement and transparent communications are essential to recover relationship health.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold">Current Status</h4>
            <p className="text-sm text-foreground">Client outage impacting users and renewal likelihood. Recovery in motion.</p>
          </div>
          <div>
            <h4 className="text-base font-semibold">Next Steps</h4>
            <ul className="text-sm list-disc pl-6 space-y-1">
              <li>9:00 response call</li>
              <li>10:00 RCA & prevention</li>
              <li>11:00 retention strategy</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  // Management Consulting (Detailed/Concise)
  const renderManagementConsulting = () => (
    <div className="space-y-6">
      {isDetailed ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">Management Consulting</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">Critical</span>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">Executive Summary: TechFlow disruption is a strategic inflection point. Immediate stabilization, relationship recovery, and prevention investments recommended.</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wide text-primary">EXECUTIVE SUMMARY</span>
            <p className="text-foreground">Critical client disruption requires immediate strategic intervention to protect revenue and reputation.</p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">SITUATION ANALYSIS</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>ARR risk increased; renewal probability decreased</li>
              <li>Competitive vulnerability and reputational exposure</li>
              <li>Root cause: preventable infra failure; monitoring gaps</li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">STRATEGIC RESPONSE FRAMEWORK</h4>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Immediate stabilization and transparent comms</li>
              <li>48-hour relationship recovery plan</li>
              <li>30-day prevention & resilience program</li>
            </ol>
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">INVESTMENT RECOMMENDATION</h4>
            <p className="text-foreground">Authorize $40K to protect $2.4M ARR (≈1.7% mitigation cost).</p>
            <div className="mt-3 overflow-hidden rounded-md border">
              <div className="grid grid-cols-2 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground">
                <div>Category</div>
                <div className="text-right">Amount</div>
              </div>
              <div className="divide-y">
                <div className="grid grid-cols-2 px-3 py-2 text-sm">
                  <div>Emergency Technical</div>
                  <div className="text-right">$15,000</div>
                </div>
                <div className="grid grid-cols-2 px-3 py-2 text-sm">
                  <div>Customer Retention</div>
                  <div className="text-right">$25,000</div>
                </div>
                <div className="grid grid-cols-2 bg-muted/30 px-3 py-2 text-sm font-semibold">
                  <div>Total</div>
                  <div className="text-right">$40,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-base font-semibold">Executive Summary</h4>
          <p className="text-sm text-foreground">Immediate strategic response recommended; focused on stabilization, relationship recovery, and prevention.</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/4 mt-6" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/5 mt-6" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isGenerating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </div>
      );
    }

    switch (style) {
      case 'mission-brief':
        return renderMissionBrief();
      case 'management-consulting':
        return renderManagementConsulting();
      case 'startup-velocity':
        return renderStartupVelocity();
      case 'newsletter':
      default:
        return renderNewsletter();
    }
  };

  const dateText = briefing?.time_range
    ? `${format(new Date(briefing.time_range.start), 'MMM d')} - ${format(
        new Date(briefing.time_range.end),
        'MMM d, yyyy'
      )}`
    : format(new Date(), 'MMMM d, yyyy');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {style === 'mission-brief' && 'Mission Brief'}
            {style === 'management-consulting' && 'Executive Briefing'}
            {style === 'startup-velocity' && 'Startup Pulse'}
            {style === 'newsletter' && '360 Brief'}
          </h2>
          <p className="text-sm text-muted-foreground">{dateText}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={style} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mission-brief">Mission Brief</SelectItem>
              <SelectItem value="management-consulting">Management Consulting</SelectItem>
              <SelectItem value="startup-velocity">Startup Velocity</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isGenerating}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
          
          {onToggleDetail && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleDetail}
              className="hidden sm:inline-flex"
            >
              {isDetailed ? 'Show Less' : 'Show More'}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
