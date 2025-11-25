import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobService } from '@/services/analytics/jobService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobId = params.id;
    const jobService = getJobService();
    
    // Get the specific job
    const job = await jobService.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Ensure user can only access their own jobs
    if (job.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`📋 Retrieved job ${jobId} for user ${session.user.id}, status: ${job.status}`);

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Get job error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
