// Next.js API route for clustering preferences
// PUT /api/clustering/preferences/[user_id]

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface PreferencesUpdate {
  industry?: string;
  role?: string;
  priority_keywords?: string[];
  key_contacts?: string[];
}

export async function PUT(
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

    // Ensure user can only update their own preferences
    if (params.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const preferences: PreferencesUpdate = await request.json();

    // Forward request to Python clustering service
    const clusteringServiceUrl = process.env.CLUSTERING_SERVICE_URL || 'http://localhost:8001';

    const response = await fetch(
      `${clusteringServiceUrl}/api/clustering/preferences/${params.user_id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Clustering preferences service error:', errorText);
      return NextResponse.json(
        { error: 'Preferences service failed', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Clustering preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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

    // Ensure user can only access their own preferences
    if (params.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get preferences from Supabase directly
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('industry, role, priority_keywords, key_contacts, clustering_preferences')
      .eq('user_id', params.user_id)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: preferences || {
        industry: null,
        role: null,
        priority_keywords: [],
        key_contacts: [],
        clustering_preferences: {}
      }
    });

  } catch (error) {
    console.error('Clustering preferences GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}