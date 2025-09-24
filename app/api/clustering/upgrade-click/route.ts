// Next.js API route for tracking upgrade clicks
// POST /api/clustering/upgrade-click

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface UpgradeClickRequest {
  user_id: string;
  digest_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpgradeClickRequest = await request.json();

    // Validate required fields
    if (!body.user_id || !body.digest_id) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, digest_id' },
        { status: 400 }
      );
    }

    // Ensure user can only track their own clicks
    if (body.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Forward request to Python clustering service
    const clusteringServiceUrl = process.env.CLUSTERING_SERVICE_URL || 'http://localhost:8001';

    const response = await fetch(`${clusteringServiceUrl}/api/clustering/upgrade-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upgrade click tracking service error:', errorText);
      // Don't fail hard on tracking errors
      console.warn('Failed to track upgrade click, continuing...');
    }

    // Also log to our own analytics if needed
    try {
      await supabase
        .from('user_events')
        .insert({
          user_id: body.user_id,
          event_type: 'clustering_upgrade_click',
          event_data: { digest_id: body.digest_id },
          created_at: new Date().toISOString()
        });
    } catch (insertError) {
      console.warn('Failed to log upgrade click event:', insertError);
    }

    return NextResponse.json({ success: true, message: 'Upgrade click tracked' });

  } catch (error) {
    console.error('Upgrade click tracking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}