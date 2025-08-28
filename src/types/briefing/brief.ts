import { TimeRange, Timestamped, Owned } from '../common';

/**
 * Types for executive briefs and related data
 */

export type BriefStyle =
  | 'mission_brief'
  | 'management_consulting'
  | 'startup_velocity'
  | 'newsletter';

export interface Audience {
  to?: string[];
  cc?: string[];
  from?: string;
}

export interface ClientInfo {
  name?: string;
  revenueARR?: number;
  revenueSharePct?: number;
}

export interface RenewalProbability {
  before?: number; // 0-100
  after?: number;  // 0-100
}

export interface BriefContext {
  client?: ClientInfo;
  renewalProbability?: RenewalProbability;
  usersAffected?: number;
  outageDurationHours?: number;
  rootCause?: string;
  reputationalRiskNote?: string;
  scenario?: string;
}

export interface BriefMetrics {
  emails?: number;
  meetings?: number;
  trendLabel?: 'Higher than usual' | 'Lower than usual' | 'Normal';
  volumeByDate?: Record<string, number>;
}

export interface BriefHighlightRefs {
  emailIds?: string[];
  eventIds?: string[];
  ticketIds?: string[];
}

export interface BriefHighlight {
  title: string;
  summary: string;
  badges?: Array<'on_track' | 'at_risk' | 'blocked' | 'critical'>;
  cta?: { label: string; url: string };
  refs?: BriefHighlightRefs;
}

export interface ExecutiveBrief extends Timestamped, Owned {
  id?: string;
  userId: string;
  generatedAt: string; // ISO date string
  timeframe?: TimeRange;
  style: BriefStyle;
  version: string; // e.g., "1.0"
  persona?: { name?: string; role?: string; companySize?: number };
  audience?: Audience;
  subject?: string;
  tldr: string;
  context?: BriefContext;
  metrics?: BriefMetrics;
  highlights?: BriefHighlight[];

  blockers?: Array<{ 
    title: string; 
    owner?: string; 
    nextStep?: string 
  }>;

  nextSteps?: Array<{ 
    title: string; 
    assignee?: string; 
    due?: string 
  }>;

  missionBrief?: {
    currentStatus?: {
      primaryIssue?: string;
      businessImpact?: string[];
    };
    immediateActions?: Array<{
      action: string;
      owner: string;
      deadline: string;
      dependencies?: string[];
    }>;
    keyQuestions?: Array<{ 
      question: string; 
      priority: 'high' | 'medium' | 'low' 
    }>;
  };

  managementConsulting?: {
    problemStatement?: string;
    rootCauseAnalysis?: string;
    recommendedActions?: Array<{
      action: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      owner?: string;
      timeline?: string;
    }>;
  };

  startupVelocity?: {
    keyMetrics?: Array<{
      name: string;
      value: number | string;
      trend: 'up' | 'down' | 'neutral';
      target?: number | string;
    }>;
    velocityCheck?: string;
    whatIsBroken?: {
      technical?: string[];
      relationship?: string[];
      team?: string[];
    };
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
