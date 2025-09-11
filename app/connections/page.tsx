'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedGoogleAuth } from '@/components/auth/UnifiedGoogleAuth';
import { Button } from '@/components/ui/button';

export default function ConnectionsPreferencesPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Connections</h1>
        <p className="mt-4 text-gray-600">You need to sign in to manage your connections.</p>
        <div className="mt-6">
          <Link href="/login?next=/connections">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Connections</h1>
        <p className="mt-2 text-gray-600">Connect and manage your external accounts.</p>
      </div>

      <section className="rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Google</h2>
            <p className="text-sm text-gray-600">Connect your Gmail and Calendar.</p>
          </div>
          <UnifiedGoogleAuth variant="outline" redirectPath="/connections" />
        </div>
        <div className="mt-4">
          <p className="text-sm text-green-600">
            Unified Google authentication - single sign-in for Gmail access
          </p>
        </div>
      </section>
    </div>
  );
}
