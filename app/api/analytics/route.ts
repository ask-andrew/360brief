import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  console.log('/api/analytics endpoint hit');
  
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const analyticsServiceUrl = process.env.ANALYTICS_API_URL;
    if (!analyticsServiceUrl) {
      throw new Error('ANALYTICS_API_URL is not defined');
    }

    const response = await fetch(`${analyticsServiceUrl}/analytics?use_real_data=true&user_id=${user.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch analytics from Python service');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from python analytics service:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
