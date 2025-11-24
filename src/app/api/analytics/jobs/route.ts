import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobService } from '@/services/analytics/jobService';
import { createClient as createSbClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    let { data: { session } } = await supabase.auth.getSession();

    // Bearer token fallback
    if (!session) {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7)
        : '';
      if (token) {
        const admin = createSbClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: userData } = await admin.auth.getUser(token);
        if (userData?.user) {
          session = { user: { id: userData.user.id } as any } as any;
        }
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { job_type = 'fetch_messages', metadata = {} } = body;

    // Use the proper job service that the worker expects
    const jobService = getJobService();
    
    const job = await jobService.createJob({
      user_id: session.user.id,
      job_type,
      metadata: {
        ...metadata,
        days_back: metadata.days_back || 7,
        max_messages: Math.min(metadata.max_messages || 500, 1000)
      }
    });

    console.log(`✅ Created analytics job: ${job.id} for user ${session.user.id}`);

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('Create job error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    let { data: { session } } = await supabase.auth.getSession();

    // Bearer token fallback
    if (!session) {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7)
        : '';
      if (token) {
        const admin = createSbClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: userData } = await admin.auth.getUser(token);
        if (userData?.user) {
          session = { user: { id: userData.user.id } as any } as any;
        }
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Use the proper job service
    const jobService = getJobService();
    const jobs = await jobService.getUserJobs(session.user.id, { limit });

    console.log(`📋 Retrieved ${jobs.length} jobs for user ${session.user.id}`);

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
