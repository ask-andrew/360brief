import { Timestamped } from './common';

export interface DigestSchedule extends Timestamped {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'weekdays';
  time: string; // HH:MM format
  timezone: string;
  recipients: string[];
  isActive: boolean;
  lastSent?: string;
  nextSend?: string;
  userId: string; // Required for creation
  owner_id?: string;
  includeEmails?: boolean;
  includeCalendar?: boolean;
  summaryLength?: 'short' | 'medium' | 'long';
}

export interface CreateDigestSchedule {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'weekdays';
  time: string;
  timezone: string;
  recipients?: string[];
  isActive?: boolean;
  userId: string;
  includeEmails?: boolean;
  includeCalendar?: boolean;
  summaryLength?: 'brief' | 'detailed' | 'comprehensive';
}

export interface ScheduledDigest extends Timestamped {
  id: string;
  scheduleId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'weekdays';
  time: string;
  timezone: string;
  recipients: string[];
  isActive: boolean;
  lastSent?: string;
  nextSend?: string;
  nextDelivery?: string | Date;
}

export interface RenderedTemplate {
  html: string;
  text: string;
}

export interface DigestContent {
  subject: string;
  html: string | RenderedTemplate;
  text: string;
  secondaryCta?: any;
}