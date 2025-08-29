import { UnifiedData } from '@/types/unified';
import { ExecutiveBrief, BriefStyle } from '@/types/brief';
import { computeInsights } from './insightEngine';

export type GenerateOptions = {
  userId: string;
  style?: BriefStyle;
  timeframe?: { start: string; end: string };
};

export async function generateExecutiveBrief(
  unified: UnifiedData,
  opts: GenerateOptions
): Promise<ExecutiveBrief> {
  const style: BriefStyle = opts.style || 'mission_brief';
  const generatedAt = new Date().toISOString();

  // Simple metrics from unified data (can be extended)
  const emails = unified.emails?.length ?? 0;
  const meetings = unified.calendarEvents?.length ?? 0;

  // Naive TL;DR using incidents if present, else counts
  const topIncident = unified.incidents?.[0];
  const tldr = topIncident
    ? `Service incident: ${topIncident.title} (sev: ${topIncident.severity}). Users affected: ${topIncident.affectedUsers ?? 'N/A'}. ARR at risk: $${topIncident.arrAtRisk ?? 0}.`
    : `Activity snapshot: ${emails} emails, ${meetings} meetings in the period.`;

  const brief: ExecutiveBrief = {
    id: `brief-${Date.now()}`,
    title: 'Executive Brief',
    summary: tldr,
    data: {} as any, // Will be filled by insights engine
    userId: opts.userId,
    generatedAt,
    timeframe: opts.timeframe,
    style,
    version: '1.0',
    tldr,
    metrics: [{ name: 'emails', value: emails.toString() }, { name: 'meetings', value: meetings.toString() }],
    highlights: [],
    blockers: [],
    nextSteps: [],
  };

  // Compute insights from unified data and merge
  const insights = computeInsights(unified);
  brief.highlights = insights.highlights;
  brief.blockers = insights.blockers;
  brief.nextSteps = insights.nextSteps;
  if (insights.trendLabel) {
    (brief.metrics as any).trendLabel = insights.trendLabel;
  }

  // Seed style-specific defaults (minimal; will be enriched later)
  if (style === 'mission_brief') {
    brief.missionBrief = {
      currentStatus: topIncident
        ? {
            primaryIssue: `${topIncident.title} (${topIncident.severity})`,
            businessImpact: [
              topIncident.affectedUsers ? `${topIncident.affectedUsers} users impacted` : undefined,
              topIncident.arrAtRisk ? `ARR at risk ~$${topIncident.arrAtRisk}` : undefined,
            ].filter(Boolean) as string[],
          }
        : undefined,
    };
  } else if (style === 'management_consulting') {
    brief.consulting = {
      executiveSummary: tldr,
    };
  } else if (style === 'startup_velocity') {
    brief.startupVelocity = {
      velocityCheck: 'High-priority client escalation detected. Move fast with clarity.',
    };
  } else if (style === 'newsletter') {
    brief.newsletter = {
      headlines: [tldr],
    };
  }

  return brief;
}
