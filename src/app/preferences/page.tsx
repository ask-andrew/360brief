'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type DigestStyle = 'mission-brief' | 'management-consulting' | 'startup-velocity' | 'newsletter';
type Frequency = 'daily' | 'weekly' | 'weekdays' | 'custom';
type DeliveryMode = 'email' | 'slack' | 'audio';

interface UserPreferences {
  digestStyle: DigestStyle;
  frequency: Frequency;
  deliveryMode: DeliveryMode;
  filterMarketing: boolean;
  customDays?: number[];
  customTime?: string;
}

export default function PreferencesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    digestStyle: 'mission-brief',
    frequency: 'weekly',
    deliveryMode: 'email',
    filterMarketing: true,
    customTime: '08:00',
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences', {
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch preferences');
        }
        
        const data = await response.json();
        setPreferences({
          digestStyle: data.digestStyle || 'mission-brief',
          frequency: data.frequency || 'weekly',
          deliveryMode: data.deliveryMode || 'email',
          filterMarketing: data.filterMarketing !== undefined ? data.filterMarketing : true,
          customDays: data.customDays || [],
          customTime: data.customTime || '08:00',
        });
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
        toast.error('Failed to load preferences. Using default settings.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...preferences,
          // Ensure we don't send undefined values
          customDays: preferences.customDays || [],
          customTime: preferences.customTime || '08:00',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      const data = await response.json();
      setPreferences({
        digestStyle: data.digestStyle,
        frequency: data.frequency,
        deliveryMode: data.deliveryMode,
        filterMarketing: data.filterMarketing,
        customDays: data.customDays,
        customTime: data.customTime,
      });
      
      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Digest Preferences</h1>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Digest Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="digestStyle" className="font-normal">
                  Select your preferred digest style
                </Label>
                <Select 
                  value={preferences.digestStyle}
                  onValueChange={(value: DigestStyle) => 
                    setPreferences({...preferences, digestStyle: value})
                  }
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mission-brief">Mission Brief</SelectItem>
                    <SelectItem value="management-consulting">Management Consulting</SelectItem>
                    <SelectItem value="startup-velocity">Startup Velocity</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {preferences.digestStyle === 'mission-brief' && (
                  <p>Direct, concise updates with clear action items and priorities.</p>
                )}
                {preferences.digestStyle === 'management-consulting' && (
                  <p>Structured with strategic insights and data-driven analysis.</p>
                )}
                {preferences.digestStyle === 'startup-velocity' && (
                  <p>Fast-paced updates focused on growth metrics and quick wins.</p>
                )}
                {preferences.digestStyle === 'newsletter' && (
                  <p>Narrative format with comprehensive coverage and insights.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Delivery Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Frequency</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['daily', 'weekly', 'weekdays'].map((freq) => (
                  <div 
                    key={freq}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      preferences.frequency === freq 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setPreferences({...preferences, frequency: freq as Frequency})}
                  >
                    <div className="font-medium capitalize">{freq}</div>
                    <div className="text-sm text-muted-foreground">
                      {freq === 'daily' ? 'Every day' : 
                       freq === 'weekly' ? 'Once a week' : 'Monday to Friday'}
                    </div>
                  </div>
                ))}
              </div>
              
              {preferences.frequency === 'custom' && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Custom Schedule</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                      <Button
                        key={day}
                        variant={preferences.customDays?.includes(i) ? 'default' : 'outline'}
                        size="sm"
                        type="button"
                        onClick={() => {
                          const newDays = preferences.customDays || [];
                          const updatedDays = newDays.includes(i)
                            ? newDays.filter(d => d !== i)
                            : [...newDays, i];
                          setPreferences({...preferences, customDays: updatedDays});
                        }}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  type="button"
                  onClick={() => setPreferences({
                    ...preferences, 
                    frequency: preferences.frequency === 'custom' ? 'weekly' : 'custom'
                  })}
                >
                  {preferences.frequency === 'custom' ? 'Use preset schedule' : 'Set custom schedule'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Delivery Time</h3>
              <input
                type="time"
                value={preferences.customTime}
                onChange={(e) => setPreferences({...preferences, customTime: e.target.value})}
                className="p-2 border rounded-md"
              />
              <p className="text-sm text-muted-foreground">
                Time is based on your current timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Delivery Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'email' as const, label: 'Email', desc: 'Receive in your inbox' },
                  { value: 'slack' as const, label: 'Slack', desc: 'Direct message in Slack' },
                  { value: 'audio' as const, label: 'Audio Podcast', desc: 'Listen on the go' },
                ].map((method) => (
                  <div 
                    key={method.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      preferences.deliveryMode === method.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setPreferences({...preferences, deliveryMode: method.value})}
                  >
                    <div className="font-medium">{method.label}</div>
                    <div className="text-sm text-muted-foreground">{method.desc}</div>
                  </div>
                ))}
              </div>
              
              {preferences.deliveryMode === 'slack' && (
                <div className="mt-2 p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Connect your Slack workspace in the <a href="/integrations" className="text-primary hover:underline">Integrations</a> page.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Content Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="filterMarketing" className="font-medium">
                  Filter out marketing messages
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically detect and filter out promotional content
                </p>
              </div>
              <Switch 
                id="filterMarketing"
                checked={preferences.filterMarketing}
                onCheckedChange={(checked) => 
                  setPreferences({...preferences, filterMarketing: checked})
                }
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}
