"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface BriefingData {
  key_themes?: string[];
  action_items?: Array<{
    id: string;
    title: string;
    due_date?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  blockers?: Array<{
    id: string;
    title: string;
    owner?: string;
    status: 'unresolved' | 'in_progress' | 'resolved';
  }>;
  kudos?: Array<{
    id: string;
    message: string;
    from: string;
    date: string;
  }>;
}

export default function BriefingDigest() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const response = await fetch('/api/v1/generate-brief');
        if (!response.ok) {
          throw new Error('Failed to fetch briefing');
        }
        const data = await response.json();
        setBriefing(data);
      } catch (err) {
        console.error('Error fetching briefing:', err);
        setError('Failed to load briefing. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBriefing();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-destructive">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!briefing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>No briefing data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Themes */}
      {briefing.key_themes && briefing.key_themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {briefing.key_themes.map((theme, index) => (
                <li key={index} className="text-foreground">
                  {theme}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {briefing.action_items && briefing.action_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {briefing.action_items.map((item) => (
                <li key={item.id} className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 mr-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-foreground">{item.title}</p>
                    {item.due_date && (
                      <p className="text-sm text-muted-foreground">Due: {item.due_date}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Blockers */}
      {briefing.blockers && briefing.blockers.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle>Blockers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {briefing.blockers.map((blocker) => (
                <li key={blocker.id} className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center mt-0.5 mr-3">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                  </div>
                  <div>
                    <p className="text-foreground">{blocker.title}</p>
                    {blocker.owner && (
                      <p className="text-sm text-muted-foreground">Owner: {blocker.owner}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Kudos */}
      {briefing.kudos && briefing.kudos.length > 0 && (
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle>Kudos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {briefing.kudos.map((kudo) => (
                <div key={kudo.id} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-foreground">"{kudo.message}"</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    — {kudo.from}, {kudo.date}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
