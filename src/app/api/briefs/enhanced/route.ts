import { NextRequest, NextResponse } from 'next/server'

// This route produces the enhanced clustered brief format expected by
// `EnhancedBriefDashboard.tsx` (digest_items, executive_summary, processing_metadata).
// It composes from the existing /api/brief endpoint to avoid duplicating logic.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const useRealData = url.searchParams.get('use_real_data') !== 'false'
  const style = url.searchParams.get('style') || 'mission_brief'
  const scenario = url.searchParams.get('scenario') || 'normal'

  try {
    // Call the existing intelligence brief route to get a rich dataset
    const baseUrl = new URL(req.url)
    baseUrl.pathname = '/api/brief'
    // forward basic params
    baseUrl.searchParams.set('user_id', 'andrew.ledet@gmail.com')
    baseUrl.searchParams.set('days_back', '7')
    baseUrl.searchParams.set('filter_marketing', 'true')
    baseUrl.searchParams.set('use_intelligence', 'true')
    // Enable real data fetching when requested
    baseUrl.searchParams.set('use_real_data', 'true') // Always use real data for enhanced briefs

    const res = await fetch(baseUrl.toString(), { method: 'GET', headers: { 'Content-Type': 'application/json' } })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Failed to load base brief', details: text }, { status: 502 })
    }

    const brief: any = await res.json()

    // Transform to clustered format expected by the dashboard
    // digest_items is an array of clusters with items under each
    const signals = Array.isArray(brief.businessSignals) ? brief.businessSignals : []

    // Helper to build items in a normalized shape
    const mapSignalToItem = (sig: any) => ({
      id: `sig-${Math.random().toString(36).slice(2)}`,
      subject: sig.title || 'Untitled',
      content: sig.description || '',
      stakeholders: Array.isArray(sig.stakeholders) ? sig.stakeholders : [],
      financial_impact: typeof sig.amount === 'number' ? sig.amount : 0,
      from: sig.source || undefined,
      date: undefined,
    })

    const clusterByType = (type: string, title: string) => {
      const items = signals.filter((s: any) => (s.type || '').toLowerCase() === type).map(mapSignalToItem)
      return items.length > 0
        ? {
            title,
            signal_type: type,
            summary: `${title} (${items.length} items)` ,
            metrics: {
              decisions: type === 'decision' ? items.length : 0,
              blockers: type === 'blocker' ? items.length : 0,
              achievements: type === 'achievement' ? items.length : 0,
            },
            items,
          }
        : null
    }

    const decisionCluster = clusterByType('decision', 'Decisions Requiring Your Approval')
    const blockerCluster = clusterByType('blocker', 'Critical Blockers & Issues')
    const achievementCluster = clusterByType('achievement', 'Team Achievements & Momentum')

    const digest_items = [decisionCluster, blockerCluster, achievementCluster].filter(Boolean)

    const data = {
      userId: brief.userId || 'unknown',
      generatedAt: brief.generatedAt || new Date().toISOString(),
      style,
      subject: 'Executive Intelligence Brief',
      tldr: brief.executiveSummary || brief.summary || '',
      dataSource: useRealData ? 'real' : 'mock',
      scenario,
      digest_items,
      executive_summary: {
        key_insights: Array.isArray(brief.keyInsights)
          ? brief.keyInsights.map((k: any) => `${k.title}: ${k.description}`)
          : [],
      },
      processing_metadata: {
        total_emails_processed: brief.processing_metadata?.emails_processed ?? 0,
        intelligence_engine: 'ExecutiveIntelligenceEngine_v3',
        data_source: brief.processing_metadata?.data_source || 'mock',
        real_emails_fetched: brief.processing_metadata?.real_emails_fetched || 0,
        debug: {
          topic_thresh: url.searchParams.get('topic_thresh') || '0.22',
          topic_topn: url.searchParams.get('topic_topn') || '20',
          topic_bigrams: url.searchParams.get('topic_bigrams') || 'true',
        },
      },
      rawAnalyticsData: {
        // optionally expose items for narrative synthesis when available in the future
        emails: brief.processing_metadata?.real_emails_fetched > 0 ? [] : [], // Don't expose raw emails in basic mode
      },
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
