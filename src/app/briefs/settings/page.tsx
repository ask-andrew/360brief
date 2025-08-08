'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function BriefsSettingsPage() {
  const [isDetailed, setIsDetailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultView: 'concise',
    deliveryTime: '08:00',
    deliveryDays: ['monday', 'wednesday', 'friday'],
    emailNotifications: true,
    pushNotifications: false,
  });

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('briefs_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
      setIsDetailed(JSON.parse(savedSettings).defaultView === 'detailed');
    }
  }, []);

  // Save settings
  const saveSettings = (newSettings: any) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      const updatedSettings = { ...settings, ...newSettings };
      localStorage.setItem('briefs_settings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      setIsSaving(false);
    }, 500);
  };

  const handleViewChange = (detailed: boolean) => {
    setIsDetailed(detailed);
    saveSettings({ ...settings, defaultView: detailed ? 'detailed' : 'concise' });
  };

  const toggleDay = (day: string) => {
    const updatedDays = settings.deliveryDays.includes(day)
      ? settings.deliveryDays.filter(d => d !== day)
      : [...settings.deliveryDays, day];
    saveSettings({ ...settings, deliveryDays: updatedDays });
  };

  const days = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Briefs Settings</h1>
        <p className="text-muted-foreground">Customize how you receive and view your briefs</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Display Preferences</CardTitle>
            <CardDescription>Customize how your briefs appear</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="default-view">Default View</Label>
              <div className="flex items-center space-x-4">
                <Button 
                  variant={!isDetailed ? 'default' : 'outline'}
                  onClick={() => handleViewChange(false)}
                  disabled={isSaving}
                >
                  Concise
                </Button>
                <Button 
                  variant={isDetailed ? 'default' : 'outline'}
                  onClick={() => handleViewChange(true)}
                  disabled={isSaving}
                >
                  Detailed
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {isDetailed 
                  ? 'Detailed view shows more context and additional information.' 
                  : 'Concise view shows only the most critical information.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Delivery Schedule</CardTitle>
                <CardDescription>When and how you receive your briefs</CardDescription>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Coming Soon
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Delivery Days</Label>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <Button
                    key={day.id}
                    variant={settings.deliveryDays.includes(day.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(day.id)}
                    disabled={isSaving}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-time">Delivery Time</Label>
              <input
                type="time"
                id="delivery-time"
                value={settings.deliveryTime}
                onChange={(e) => saveSettings({ ...settings, deliveryTime: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive briefs via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => saveSettings({ ...settings, emailNotifications: checked })}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notifications when new briefs are available
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => saveSettings({ ...settings, pushNotifications: checked })}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
