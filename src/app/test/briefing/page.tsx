'use client';

import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import BriefingDigest from '@/components/briefing/BriefingDigest';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BriefingTestPage() {
  const [isDetailed, setIsDetailed] = useState(false);

  // Load saved view preference
  useEffect(() => {
    const savedSettings = localStorage.getItem('briefs_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setIsDetailed(settings.defaultView === 'detailed');
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AppSidebar />
      
      <main className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="flex flex-col space-y-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Briefing Digest</h1>
            <p className="text-muted-foreground">
              Preview different communication styles and formats
            </p>
          </div>
          
          <div className="h-4"></div>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <BriefingDigest isDetailed={isDetailed} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
