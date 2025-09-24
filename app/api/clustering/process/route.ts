// Next.js API route for clustering processing
// Bridges frontend to Python clustering service

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

interface ClusteringRequest {
  user_id: string;
  digest_id: string;
  emails: EmailItemAPI[];
  user_tier?: 'free' | 'paid';
  force_method?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ClusteringRequest = await request.json();

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

    // Get user tier from database
    const { data: userProfile } = await supabase
      .from('user_preferences')
      .select('subscription_tier')
      .eq('user_id', session.user.id)
      .single();

    const userTier = userProfile?.subscription_tier || 'free';

    // Forward request to Python clustering service
    const clusteringServiceUrl = process.env.CLUSTERING_SERVICE_URL || 'http://localhost:8001';

    const clusteringResponse = await fetch(`${clusteringServiceUrl}/api/clustering/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        user_tier: body.user_tier || userTier,
      }),
    });

    if (!clusteringResponse.ok) {
      const errorText = await clusteringResponse.text();
      console.error('Clustering service error:', errorText);
      return NextResponse.json(
        { error: 'Clustering service failed', details: errorText },
        { status: 500 }
      );
    }

    const result = await clusteringResponse.json();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Clustering API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Clustering service endpoint',
      endpoints: {
        'POST /api/clustering/process': 'Process email clustering',
        'GET /api/clustering/analytics/{user_id}': 'Get clustering analytics',
        'PUT /api/clustering/preferences/{user_id}': 'Update clustering preferences'
      }
    },
    { status: 200 }
  );
}