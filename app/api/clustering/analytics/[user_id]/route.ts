// Next.js API route for clustering analytics
// GET /api/clustering/analytics/[user_id]

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user can only access their own analytics
    if (params.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days') || '30';

    // Forward request to Python clustering service
    const clusteringServiceUrl = process.env.CLUSTERING_SERVICE_URL || 'http://localhost:8001';

    const response = await fetch(
      `${clusteringServiceUrl}/api/clustering/analytics/${params.user_id}?days=${days}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Clustering analytics service error:', errorText);
      return NextResponse.json(
        { error: 'Analytics service failed', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Clustering analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}