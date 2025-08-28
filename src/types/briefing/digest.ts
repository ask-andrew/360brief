import { Timestamped, Owned } from '../common';

/**
 * Types for digests and scheduled digests
 */

export type DigestFrequency = 'daily' | 'weekly' | 'weekdays' | 'custom';

export interface DigestSchedule extends Timestamped, Owned {
  id: string;
  name: string;
  time: string; // In 'HH:MM' 24-hour format
  timezone: string; // e.g., 'America/New_York'
  frequency: DigestFrequency;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for custom frequency
  isActive: boolean;
  nextDelivery?: string; // ISO date string
  lastDeliveredAt?: string; // ISO date string
  templateId?: string;
  recipients: string[]; // Array of user IDs or email addresses
  metadata?: {
    customMessage?: string;
    includeAttachments?: boolean;
    format?: 'html' | 'markdown' | 'plaintext';
  };
}

export interface DigestContent {
  id: string;
  title: string;
  summary: string;
  content: string;
  contentType: 'brief' | 'summary' | 'full';
  sourceIds: string[];
  relatedItems?: Array<{
    id: string;
    type: 'email' | 'document' | 'meeting' | 'task' | 'other';
    title: string;
    url?: string;
  }>;
  metadata?: Record<string, unknown>;
  generatedAt: string; // ISO date string
}

export interface Digest extends Timestamped, Owned {
  id: string;
  scheduleId?: string;
  title: string;
  content: DigestContent[];
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  sentAt?: string; // ISO date string
  openedAt?: string; // ISO date string
  openCount?: number;
  metadata?: {
    deliveryMethod?: 'email' | 'slack' | 'in_app';
    previewText?: string;
    tags?: string[];
  };
}

export interface DigestTemplate extends Timestamped, Owned {
  id: string;
  name: string;
  description?: string;
  content: string; // Could be HTML, Markdown, or a template string
  variables: string[]; // List of template variables
  isDefault: boolean;
  metadata?: Record<string, unknown>;
}
