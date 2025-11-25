/**
 * Analytics Job Status API
 * GET /api/analytics/jobs/[id]
 * 
 * Get status and progress of a specific analytics job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobService } from '@/services/analytics/jobService';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const jobId = params.id;

    // Get job
    const jobService = getJobService();
    const job = await jobService.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (job.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view this job' },
        { status: 403 }
      );
    }

    // Calculate progress percentage
    const progressPercentage = job.total > 0 
      ? Math.round((job.progress / job.total) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      job,
      progress: {
        current: job.progress,
        total: job.total,
        percentage: progressPercentage,
        status: job.status,
        current_step: job.metadata?.current_step,
      },
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/analytics/jobs/[id]
 * 
 * Update job status (for background workers)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This endpoint should be protected by API key for background workers
    // For now, we'll use the service role authentication
    
    const jobId = params.id;
    const body = await request.json();

    // Update job
    const jobService = getJobService();
    const job = await jobService.updateJob(jobId, body);

    return NextResponse.json({
      success: true,
      job,
    });

  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      {
        error: 'Failed to update job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/jobs/[id]
 * 
 * Cancel/delete a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const jobId = params.id;

    // Get job to verify ownership
    const jobService = getJobService();
    const job = await jobService.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this job' },
        { status: 403 }
      );
    }

    // Delete job
    await jobService.deleteJob(jobId);

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
