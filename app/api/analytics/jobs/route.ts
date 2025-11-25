/**
 * Analytics Jobs API - Create Job
 * POST /api/analytics/jobs
 * 
 * Creates a new background analytics job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobService } from '@/services/analytics/jobService';
import type { JobType } from '@/types/analytics-jobs';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { job_type, metadata } = body;

    // Validate job type
    const validJobTypes: JobType[] = ['fetch_messages', 'compute_analytics', 'full_sync'];
    if (!job_type || !validJobTypes.includes(job_type)) {
      return NextResponse.json(
        { error: 'Invalid job_type. Must be one of: fetch_messages, compute_analytics, full_sync' },
        { status: 400 }
      );
    }

    // Check if user already has a running job of this type
    const jobService = getJobService();
    const hasRunning = await jobService.hasRunningJob(user.id, job_type);

    if (hasRunning) {
      // Get the latest running job
      const latestJob = await jobService.getLatestJob(user.id, job_type);
      return NextResponse.json(
        {
          error: 'A job of this type is already running',
          existing_job: latestJob,
        },
        { status: 409 }
      );
    }

    // Create the job
    const job = await jobService.createJob({
      user_id: user.id,
      job_type,
      metadata: metadata || {},
    });

    console.log(`📝 Created analytics job: ${job.id} for user ${user.id}`);

    // TODO: Trigger actual background processing
    // This could be done via:
    // 1. Serverless function (Vercel/Netlify)
    // 2. Background worker (BullMQ, Inngest)
    // 3. Edge function
    // For now, we'll create the job and let a separate process pick it up

    return NextResponse.json({
      success: true,
      job,
      message: 'Analytics job created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating analytics job:', error);
    return NextResponse.json(
      {
        error: 'Failed to create analytics job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/jobs
 * 
 * List user's analytics jobs
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jobType = searchParams.get('job_type');
    const limit = searchParams.get('limit');

    // Get jobs
    const jobService = getJobService();
    const jobs = await jobService.getUserJobs(user.id, {
      status: status as any,
      jobType: jobType as any,
      limit: limit ? parseInt(limit) : 10,
    });

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });

  } catch (error) {
    console.error('Error fetching analytics jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
