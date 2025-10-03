// Next.js API route for clustering integration with existing digest flow
// POST /api/clustering/integrate

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface EmailItemAPI {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: string;
  thread_id?: string;
  labels?: string[];
  has_attachments?: boolean;
  metadata?: Record<string, any>;
}

interface IntegrateRequest {
  user_id: string;
  digest_id: string;
  emails: EmailItemAPI[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: IntegrateRequest = await request.json();

    // Validate required fields
    if (!body.user_id || !body.digest_id || !body.emails) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, digest_id, emails' },
        { status: 400 }
      );
    }

    // Ensure user can only process their own data
    if (body.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Forward request to Python analytics service (which has clustering built in)
    const clusteringServiceUrl = process.env.ANALYTICS_API_URL || 'http://localhost:8000';

    const response = await fetch(`${clusteringServiceUrl}/generate-brief`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: body.user_id,
        emails: body.emails.map(email => ({
          id: email.id,
          subject: email.subject,
          body: email.body,
          from: {
            name: email.from && email.from.includes('<') ? email.from.split('<')[0].trim() : (email.from || 'Unknown'),
            email: email.from && email.from.includes('<') ? email.from.match(/<(.+)>/)?.[1] || email.from : (email.from || 'unknown@example.com')
          },
          to: email.to,
          date: email.date,
          threadId: email.thread_id || email.id,
          snippet: email.body?.substring(0, 150) || ""
        })),
        days_back: 7,
        filter_marketing: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Clustering integration service error:', errorText);
      return NextResponse.json(
        { error: 'Clustering integration failed', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();

    // The result contains digest_items with clustering metadata
    // This format is compatible with existing digest generation
    return NextResponse.json(result);

  } catch (error) {
    console.error('Clustering integration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}