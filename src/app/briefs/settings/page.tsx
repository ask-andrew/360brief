
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type BriefStyle = 'mission_brief' | 'management_consulting' | 'startup_velocity' | 'newsletter';

export default function BriefsSettingsPage() {
  const [isDetailed, setIsDetailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [style, setStyle] = useState<BriefStyle>('mission_brief');
  const [settings, setSettings] = useState({
    preferred_format: 'concise', // 'concise' | 'detailed'
    digest_time: '08:00',
    deliveryDays: ['monday', 'wednesday', 'friday'],
    email_notifications: true,
    push_notifications: false,
  });

  // Connected Google accounts
  const [accounts, setAccounts] = useState<{ id: string; email: string; account_type: 'personal'|'business' }[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Load saved settings from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/user/preferences', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load preferences');
        const prefs = await res.json();
        if (!mounted) return;
        setStyle((prefs.digest_style as BriefStyle) || 'mission_brief');
        setIsDetailed((prefs.preferred_format as string) === 'detailed');
        setSettings((s) => ({
          ...s,
          preferred_format: prefs.preferred_format || 'concise',
          digest_time: prefs.digest_time || '08:00',
          email_notifications: prefs.email_notifications ?? true,
          push_notifications: prefs.push_notifications ?? false,
        }));
      } catch (e) {
        console.warn('Preferences load failed', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load connected accounts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingAccounts(true);
        const res = await fetch('/api/user/connected-accounts', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load accounts');
        const json = await res.json();
        if (!mounted) return;
        setAccounts((json.accounts || []).map((a: any) => ({ id: a.id, email: a.email, account_type: a.account_type })));
      } catch (e) {
        console.warn('Connected accounts load failed', e);
      } finally {
        setLoadingAccounts(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Save settings to API (partial updates)
  const saveSettings = async (newSettings: any) => {
    setIsSaving(true);
    try {
      const body = { ...newSettings };
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save preferences');
      const prefs = await res.json();
      setSettings((prev) => ({
        ...prev,
        preferred_format: prefs.preferred_format ?? prev.preferred_format,
        digest_time: prefs.digest_time ?? prev.digest_time,
        email_notifications: prefs.email_notifications ?? prev.email_notifications,
        push_notifications: prefs.push_notifications ?? prev.push_notifications,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewChange = (detailed: boolean) => {
    setIsDetailed(detailed);
    saveSettings({ preferred_format: detailed ? 'detailed' : 'concise' });
  };

  const handleStyleChange = async (newStyle: BriefStyle) => {
    setStyle(newStyle);
    await saveSettings({ digest_style: newStyle });
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connected Google Accounts</CardTitle>
                <CardDescription>Connect multiple Gmail/Calendar accounts and label them</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  const res = await fetch(`/api/auth/google/authorize?account_type=personal&redirect=${encodeURIComponent('/briefs/settings')}`);
                  const json = await res.json();
                  if (json.url) window.location.href = json.url as string;
                }}
              >
                Connect Personal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const res = await fetch(`/api/auth/google/authorize?account_type=business&redirect=${encodeURIComponent('/briefs/settings')}`);
                  const json = await res.json();
                  if (json.url) window.location.href = json.url as string;
                }}
              >
                Connect Business
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Linked Accounts</Label>
              {loadingAccounts ? (
                <p className="text-sm text-muted-foreground">Loading accounts…</p>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No accounts connected yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={acc.account_type === 'business' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                          {acc.account_type}
                        </Badge>
                        <span className="text-sm font-medium">{acc.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const nextType = acc.account_type === 'personal' ? 'business' : 'personal';
                            const res = await fetch(`/api/user/connected-accounts/${acc.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ account_type: nextType }),
                            });
                            if (res.ok) {
                              const { account } = await res.json();
                              setAccounts((prev) => prev.map((a) => a.id === acc.id ? { ...a, account_type: account.account_type } : a));
                            }
                          }}
                        >
                          Toggle Type
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            const res = await fetch(`/api/user/connected-accounts/${acc.id}`, { method: 'DELETE' });
                            if (res.ok) setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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

            <div className="space-y-2">
              <Label>Brief Style</Label>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'mission_brief', label: 'Mission Brief' },
                  { id: 'management_consulting', label: 'Consulting' },
                  { id: 'startup_velocity', label: 'Startup' },
                  { id: 'newsletter', label: 'Newsletter' },
                ] as { id: BriefStyle; label: string }[]).map((opt) => (
                  <Button
                    key={opt.id}
                    variant={style === opt.id ? 'default' : 'outline'}
                    onClick={() => handleStyleChange(opt.id)}
                    disabled={isSaving}
                    size="sm"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                This controls how your brief is written and rendered.
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
                value={settings.digest_time}
                onChange={(e) => saveSettings({ digest_time: e.target.value })}
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
                checked={settings.email_notifications}
                onCheckedChange={(checked) => saveSettings({ email_notifications: checked })}
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
                checked={settings.push_notifications}
                onCheckedChange={(checked) => saveSettings({ push_notifications: checked })}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
