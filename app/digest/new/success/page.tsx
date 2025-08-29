'use client';

import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { CheckCircle, Clock, Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { format, addHours } from 'date-fns';
import Link from 'next/link';

interface SearchParams {
  name?: string;
  time?: string;
  frequency?: string;
}

function DigestSuccessContent() {
  const searchParams = useSearchParams() as unknown as URLSearchParams & SearchParams;
  const digestName = searchParams.get?.('name') 
    ? decodeURIComponent(searchParams.get('name') as string) 
    : 'Your digest';
  const scheduleTime = searchParams.get?.('time') || '09:00';
  const frequency = searchParams.get?.('frequency') || 'daily';

  // Calculate next delivery time
  const now = new Date();
  let nextDelivery = new Date();
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  
  // Set to today's scheduled time
  nextDelivery.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, set to tomorrow
  if (nextDelivery <= now) {
    nextDelivery.setDate(nextDelivery.getDate() + 1);
  }

  // Format frequency text
  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'daily': return 'every day';
      case 'weekly': return 'every week';
      case 'weekdays': return 'every weekday';
      default: return `on a ${freq} basis`;
    }
  };

  // Check if we should show "first digest coming soon"
  const showImmediateDelivery = true; // Set based on your business logic

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {digestName} is all set! 🎉
      </h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        {showImmediateDelivery && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center justify-center">
              <Mail className="mr-2 h-5 w-5" />
              Your first digest is on its way!
            </h3>
            <p className="text-blue-700">
              Check your inbox in just a few minutes for your first digest.
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="flex items-center text-gray-700">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            <span>Next delivery: <span className="font-medium">{format(nextDelivery, 'EEEE, MMMM d')} at {format(nextDelivery, 'h:mm a')}</span></span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          Your digest will be delivered {getFrequencyText(frequency)} at {scheduleTime}.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/digest/new">Create Another Digest</Link>
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Need to make changes? You can edit your digest settings anytime from your dashboard.</p>
      </div>
    </div>
  );
}

export default function DigestSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Loading...
        </h1>
      </div>
    }>
      <DigestSuccessContent />
    </Suspense>
  );
}
