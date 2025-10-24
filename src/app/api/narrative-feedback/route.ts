// src/app/api/narrative-feedback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface NarrativeFeedbackBody {
  // Brief generation metadata
  brief_id?: string
  engine_used: string
  generation_timestamp: string

  // Input data
  input_emails_count: number
  input_clusters_count: number
  cluster_data: any[] // Full cluster information

  // LLM synthesis data (if used)
  llm_prompt?: string
  llm_model?: string
  llm_response_time_ms?: number

  // Generated output
  generated_markdown: string
  executive_summary?: string

  // User feedback
  feedback_type: 'helpful' | 'not_helpful'
  feedback_comments?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NarrativeFeedbackBody

    // Basic validation
    if (!body.engine_used || !body.generation_timestamp || !body.generated_markdown) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['helpful', 'not_helpful'].includes(body.feedback_type)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Insert feedback record
    const { error: insertError } = await supabase
      .from('narrative_feedback')
      .insert({
        user_id: user.id,
        brief_id: body.brief_id,
        engine_used: body.engine_used,
        generation_timestamp: body.generation_timestamp,
        input_emails_count: body.input_emails_count,
        input_clusters_count: body.input_clusters_count,
        cluster_data: body.cluster_data,
        llm_prompt: body.llm_prompt,
        llm_model: body.llm_model,
        llm_response_time_ms: body.llm_response_time_ms,
        generated_markdown: body.generated_markdown,
        executive_summary: body.executive_summary,
        feedback_type: body.feedback_type,
        feedback_comments: body.feedback_comments,
        feedback_timestamp: new Date().toISOString(),
        // The trigger will automatically calculate these fields
        markdown_length: body.generated_markdown.length,
        clusters_covered: body.cluster_data.length,
        actions_mentioned: (body.generated_markdown.match(/(Action|Decision|Approve|Review|Schedule|Meeting)/gi) || []).length
      })

    if (insertError) {
      console.error('Error inserting narrative feedback:', insertError)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully'
    })

  } catch (error: any) {
    console.error('Narrative feedback API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error?.message
    }, { status: 500 })
  }
}

// Get feedback analytics for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: feedback, error } = await supabase
      .from('narrative_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching narrative feedback:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json({ feedback })

  } catch (error: any) {
    console.error('Narrative feedback GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error?.message
    }, { status: 500 })
  }
}
