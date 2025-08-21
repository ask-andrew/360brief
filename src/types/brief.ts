// Executive Brief output schema
export type BriefStyle =
  | 'mission_brief'
  | 'management_consulting'
  | 'startup_velocity'
  | 'newsletter';

export interface ExecutiveBrief {
  id?: string;
  userId: string;
  generatedAt: string; // ISO
  timeframe?: { start: string; end: string };
  style: BriefStyle;
  version: string; // e.g., "1.0"
  persona?: { name?: string; role?: string; companySize?: number };

  audience?: { to?: string[]; cc?: string[]; from?: string };
  subject?: string;
  tldr: string;

  context?: {
    client?: { name?: string; revenueARR?: number; revenueSharePct?: number };
    renewalProbability?: { before?: number; after?: number }; // e.g., 0-100
    usersAffected?: number;
    outageDurationHours?: number;
    rootCause?: string;
    reputationalRiskNote?: string;
    scenario?: string;
  };

  metrics?: {
    emails?: number;
    meetings?: number;
    trendLabel?: 'Higher than usual' | 'Lower than usual' | 'Normal';
    volumeByDate?: Record<string, number>;
  };

  highlights?: Array<{
    title: string;
    summary: string;
    badges?: Array<'on_track' | 'at_risk' | 'blocked' | 'critical'>;
    cta?: { label: string; url: string };
    refs?: { emailIds?: string[]; eventIds?: string[]; ticketIds?: string[] };
  }>;

  blockers?: Array<{ title: string; owner?: string; nextStep?: string }>;
  nextSteps?: Array<{ title: string; assignee?: string; due?: string }>;

  missionBrief?: {
    currentStatus?: {
      primaryIssue?: string;
      businessImpact?: Array<string>;
    };
    immediateActions?: Array<{
      title: string;
      dueBy?: string; // ISO or time text
      participants?: string[];
      objective?: string;
      preparation?: string;
      timelineNote?: string;
    }>;
    resourceAuthorization?: {
      totalAmount?: number;
      items?: Array<{
        category: string;
        amount: number;
        bullets?: string[];
      }>;
    };
    escalationContacts?: Array<{ role: string; name: string; note?: string }>;
    windowEmphasisNote?: string;
  };

  consulting?: {
    executiveSummary?: string;
    situationAnalysis?: {
      financialImpact?: Array<string>;
      rootCauseFramework?: string;
      stakeholderMatrix?: Array<string>;
    };
    strategyFramework?: Array<{
      phase: string;
      description: string;
      timeframe?: string;
    }>;
    investmentRecommendation?: {
      total: number;
      breakdown: Array<{ label: string; amount: number; bullets?: string[] }>;
      roiNote?: string;
    };
    criticalSuccessFactors?: Array<string>;
    recommendedActions?: Array<string>;
  };

  startupVelocity?: {
    velocityCheck?: string;
    whatIsBroken?: { technical?: Array<string>; relationship?: Array<string>; team?: Array<string> };
    nextSixHours?: Array<{
      timeLabel: string;
      participants?: string[];
      goal?: string;
      prep?: string;
    }>;
    budget?: {
      total: number;
      items: Array<{ label: string; amount: number; bullets?: string[] }>;
      simpleROI?: string;
    };
    whyThisCouldBeAmazing?: string;
    windowEmphasisNote?: string;
    closingPrompt?: string;
  };

  newsletter?: {
    headlines: Array<string>;
    featureTitle?: string;
    featureParagraphs?: Array<string>;
    analysis?: Array<string>;
    moreCoverage?: Array<string>;
    expertInsights?: Array<string>;
    kudos?: Array<{ name: string; role?: string; kudosSuggestion: string }>;
    aheadBlockers?: Array<string>;
    recommendedReads?: Array<string>;
  };

  notes?: string;
  rawRefs?: { emailIds?: string[]; eventIds?: string[]; ticketIds?: string[] };
}
