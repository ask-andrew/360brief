'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type DigestStyle = 'mission-brief' | 'management-consulting' | 'startup-velocity' | 'newsletter';
type Frequency = 'daily' | 'weekly' | 'weekdays' | 'custom';
type DeliveryMode = 'email' | 'slack' | 'audio';

interface UserPreferences {
  digestStyle: DigestStyle;
  frequency: Frequency;
  deliveryMode: DeliveryMode;
  filterMarketing: boolean;
  timezone: string;
  digestTime: string;
  priorityKeywords: string[];
  keyContacts: string[];
}

export default function PreferencesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    digestStyle: 'mission-brief',
    frequency: 'daily',
    deliveryMode: 'email',
    filterMarketing: true,
    timezone: 'UTC',
    digestTime: '07:00',
    priorityKeywords: [],
    keyContacts: []
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newContact, setNewContact] = useState('');

  // Fetch user preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences');
        if (!response.ok) {
          throw new Error('Failed to fetch preferences');
        }
        const data = await response.json();
        setPreferences(data);
      } catch (error) {
        console.error('Error fetching preferences:', error);
        toast.error('Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Save preferences to the server
  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding a new priority keyword
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !preferences.priorityKeywords?.includes(newKeyword.trim())) {
      setPreferences(prev => ({
        ...prev,
        priorityKeywords: [...(prev.priorityKeywords || []), newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  // Handle removing a priority keyword
  const handleRemoveKeyword = (keywordToRemove: string) => {
    setPreferences(prev => ({
      ...prev,
      priorityKeywords: (prev.priorityKeywords || []).filter(k => k !== keywordToRemove)
    }));
  };

  // Handle adding a new key contact
  const handleAddContact = () => {
    if (newContact.trim() && !preferences.keyContacts?.includes(newContact.trim())) {
      setPreferences(prev => ({
        ...prev,
        keyContacts: [...(prev.keyContacts || []), newContact.trim()]
      }));
      setNewContact('');
    }
  };

  // Handle removing a key contact
  const handleRemoveContact = (contactToRemove: string) => {
    setPreferences(prev => ({
      ...prev,
      keyContacts: (prev.keyContacts || []).filter(c => c !== contactToRemove)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground">Customize your 360Brief experience</p>
        </div>
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Digest Style */}
        <Card>
          <CardHeader>
            <CardTitle>Digest Style</CardTitle>
            <CardDescription>Choose how your digest is formatted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Select 
                value={preferences.digestStyle || 'mission-brief'} 
                onValueChange={(value: DigestStyle) => setPreferences({...preferences, digestStyle: value})}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mission-brief">Mission Brief</SelectItem>
                  <SelectItem value="management-consulting">Management Consulting</SelectItem>
                  <SelectItem value="startup-velocity">Startup Velocity</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {preferences.digestStyle === 'mission-brief' && 'Concise, action-oriented briefs for quick decision making.'}
                {preferences.digestStyle === 'management-consulting' && 'Structured, data-driven insights with strategic recommendations.'}
                {preferences.digestStyle === 'startup-velocity' && 'Fast-paced updates focused on growth and execution.'}
                {preferences.digestStyle === 'newsletter' && 'Narrative-style digests that read like a curated newsletter.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Frequency and Timing */}
        <Card>
          <CardHeader>
            <CardTitle>Frequency & Timing</CardTitle>
            <CardDescription>When and how often you want to receive your digest</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={preferences.frequency || 'daily'} 
                  onValueChange={(value: Frequency) => setPreferences({...preferences, frequency: value})}
                >
                  <SelectTrigger id="frequency" className="w-[200px]">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="weekdays">Weekdays Only</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="digestTime">Preferred Time</Label>
                <Input
                  id="digestTime"
                  type="time"
                  value={preferences.digestTime || '07:00'}
                  onChange={(e) => setPreferences({...preferences, digestTime: e.target.value})}
                  className="w-[150px]"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Select 
                  value={preferences.timezone || 'UTC'} 
                  onValueChange={(value) => setPreferences({...preferences, timezone: value})}
                >
                  <SelectTrigger id="timezone" className="w-[300px]">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Method */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Method</CardTitle>
            <CardDescription>How you want to receive your digest</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Select 
                value={preferences.deliveryMode || 'email'} 
                onValueChange={(value: DeliveryMode) => setPreferences({...preferences, deliveryMode: value})}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="audio">Audio Podcast</SelectItem>
                </SelectContent>
              </Select>
              {preferences.deliveryMode === 'slack' && (
                <p className="text-sm text-muted-foreground">
                  Connect your Slack workspace in the integrations settings.
                </p>
              )}
              {preferences.deliveryMode === 'audio' && (
                <p className="text-sm text-muted-foreground">
                  Audio digests will be available in your podcast app of choice.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Content Preferences</CardTitle>
            <CardDescription>Customize what appears in your digest</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-0.5">
                <Label htmlFor="filter-marketing">Filter Marketing Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically filter out promotional and marketing content
                </p>
              </div>
              <Switch 
                id="filter-marketing" 
                checked={preferences.filterMarketing !== false} 
                onCheckedChange={(checked) => setPreferences({...preferences, filterMarketing: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Priority Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Keywords</CardTitle>
            <CardDescription>
              Add keywords to highlight in your digest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a keyword (e.g., 'urgent', 'review')"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
                <Button onClick={handleAddKeyword} variant="outline">
                  Add
                </Button>
              </div>
              
              {preferences.priorityKeywords && preferences.priorityKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.priorityKeywords.map((keyword) => (
                    <div key={keyword} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm">
                      {keyword}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No priority keywords added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Key Contacts</CardTitle>
            <CardDescription>
              Important contacts to highlight in your digest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Add an email address"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
                />
                <Button onClick={handleAddContact} variant="outline">
                  Add
                </Button>
              </div>
              
              {preferences.keyContacts && preferences.keyContacts.length > 0 ? (
                <ul className="space-y-2">
                  {preferences.keyContacts.map((contact) => (
                    <li key={contact} className="flex items-center justify-between">
                      <span className="text-sm">{contact}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveContact(contact)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No key contacts added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
