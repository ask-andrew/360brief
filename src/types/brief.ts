import { BriefingData } from './briefing';

export interface BriefGenerationRequest {
  userId: string;
  timeRange?: {
    start: string;
    end: string;
  };
  sources?: string[];
  format?: 'concise' | 'detailed' | 'comprehensive';
}

export interface BriefGenerationResponse {
  briefId: string;
  data: BriefingData;
  generatedAt: string;
  status: 'success' | 'error';
  error?: string;
}

export interface ExecutiveBrief {
  id: string;
  title: string;
  summary: string;
  data: BriefingData;
  generatedAt: string;
  userId: string;
  timeframe?: { start: string; end: string };
  style?: BriefStyle;
  version?: string;
  tldr?: string;
  highlights?: string[];
  blockers?: string[];
  nextSteps?: string[];
  metrics?: any[];
  missionBrief?: any;
  consulting?: any;
  startupVelocity?: any;
  newsletter?: any;
}

export type BriefStyle = 'concise' | 'detailed' | 'comprehensive' | 'mission_brief' | 'management_consulting' | 'startup_velocity' | 'newsletter';