/**
 * Email Summarization and Analysis Utilities
 * Extracts meaningful insights from email content and metadata
 */

export interface EmailInsight {
  priority: 'high' | 'medium' | 'low';
  hasActionItems: boolean;
  isUrgent: boolean;
  category: 'work' | 'personal' | 'notification' | 'marketing' | 'finance' | 'healthcare' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  actionItems: string[];
  keyTopics: string[];
  responseRequired: boolean;
  deadline?: string;
}

interface EmailData {
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: string;
  labels?: string[];
}

// Keywords that indicate high priority/urgency
const URGENT_KEYWORDS = [
  'urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline',
  'today', 'tomorrow', 'due', 'overdue', 'time sensitive', 'action required'
];

// Keywords that indicate action items
const ACTION_KEYWORDS = [
  'please', 'can you', 'could you', 'need you to', 'action required',
  'follow up', 'review', 'approve', 'sign', 'complete', 'submit',
  'confirm', 'respond', 'reply', 'schedule', 'meeting', 'call'
];

// Work-related keywords
const WORK_KEYWORDS = [
  'project', 'meeting', 'deadline', 'proposal', 'budget', 'report',
  'team', 'client', 'customer', 'contract', 'invoice', 'strategy',
  'analysis', 'presentation', 'document', 'approval', 'review'
];

// Marketing/promotional indicators
const MARKETING_INDICATORS = [
  'unsubscribe', 'promotional', 'offer', 'sale', 'discount', 'deal',
  'limited time', 'act now', 'free', 'savings', 'newsletter', 'update'
];

// Financial keywords
const FINANCE_KEYWORDS = [
  'payment', 'invoice', 'bill', 'statement', 'account', 'balance',
  'transaction', 'charge', 'refund', 'credit', 'debit', 'mortgage',
  'loan', 'bank', 'financial'
];

// Healthcare keywords
const HEALTH_KEYWORDS = [
  'appointment', 'doctor', 'medical', 'health', 'lab', 'results',
  'prescription', 'clinic', 'hospital', 'patient', 'visit'
];

/**
 * Extract insights from email content and metadata
 */
export function analyzeEmail(email: EmailData): EmailInsight {
  const text = `${email.subject} ${email.body}`.toLowerCase();
  const subject = email.subject.toLowerCase();
  
  // Determine category
  const category = categorizeEmail(email, text);
  
  // Check for urgency indicators
  const isUrgent = URGENT_KEYWORDS.some(keyword => text.includes(keyword)) ||
                   subject.includes('urgent') ||
                   subject.includes('asap') ||
                   email.labels?.includes('IMPORTANT') ||
                   false;
  
  // Check for action items
  const hasActionItems = ACTION_KEYWORDS.some(keyword => text.includes(keyword)) ||
                        text.includes('?') ||
                        subject.includes('re:') ||
                        false;
  
  // Extract action items
  const actionItems = extractActionItems(email.body);
  
  // Determine priority
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (isUrgent || actionItems.length > 0 || category === 'work') {
    priority = 'high';
  } else if (category === 'marketing' || category === 'notification') {
    priority = 'low';
  }
  
  // Check if response is required
  const responseRequired = hasActionItems ||
                          text.includes('reply') ||
                          text.includes('respond') ||
                          text.includes('?') ||
                          false;
  
  // Extract key topics
  const keyTopics = extractKeyTopics(text);
  
  // Simple sentiment analysis
  const sentiment = analyzeSentiment(text);
  
  // Look for deadlines
  const deadline = extractDeadline(text);
  
  return {
    priority,
    hasActionItems: actionItems.length > 0,
    isUrgent,
    category,
    sentiment,
    actionItems,
    keyTopics,
    responseRequired,
    deadline
  };
}

/**
 * Categorize email based on content and metadata
 */
function categorizeEmail(email: EmailData, text: string): EmailInsight['category'] {
  // Check Gmail labels first
  if (email.labels?.includes('CATEGORY_PROMOTIONS')) return 'marketing';
  if (email.labels?.includes('CATEGORY_UPDATES')) return 'notification';
  if (email.labels?.includes('CATEGORY_PERSONAL')) return 'personal';
  
  // Check sender domain patterns
  const fromDomain = email.from.split('@')[1]?.toLowerCase() || '';
  if (fromDomain.includes('bank') || fromDomain.includes('credit') || 
      fromDomain.includes('payment') || fromDomain.includes('financial')) {
    return 'finance';
  }
  
  if (fromDomain.includes('health') || fromDomain.includes('medical') ||
      fromDomain.includes('clinic') || fromDomain.includes('hospital')) {
    return 'healthcare';
  }
  
  // Content-based categorization
  if (MARKETING_INDICATORS.some(keyword => text.includes(keyword))) {
    return 'marketing';
  }
  
  if (FINANCE_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'finance';
  }
  
  if (HEALTH_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'healthcare';
  }
  
  if (WORK_KEYWORDS.some(keyword => text.includes(keyword))) {
    return 'work';
  }
  
  // Check if from a work domain (common business domains)
  const workDomains = ['company.com', 'corp.com', 'inc.com'];
  if (workDomains.some(domain => fromDomain.includes(domain)) ||
      fromDomain.includes('slack') || fromDomain.includes('teams')) {
    return 'work';
  }
  
  return 'other';
}

/**
 * Extract actionable items from email body
 */
function extractActionItems(body: string): string[] {
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const actionItems: string[] = [];
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase().trim();
    
    // Look for action-oriented sentences
    if (ACTION_KEYWORDS.some(keyword => lower.includes(keyword))) {
      // Clean up and add the action item
      const cleaned = sentence.trim().replace(/^[^a-zA-Z]*/, '').substring(0, 150);
      if (cleaned.length > 10) {
        actionItems.push(cleaned);
      }
    }
    
    // Look for questions
    if (lower.includes('?')) {
      const cleaned = sentence.trim().substring(0, 150);
      if (cleaned.length > 10) {
        actionItems.push(cleaned);
      }
    }
  }
  
  return actionItems.slice(0, 3); // Limit to 3 most important
}

/**
 * Extract key topics from email text
 */
function extractKeyTopics(text: string): string[] {
  const topics: string[] = [];
  
  // Common business topics
  const topicPatterns = [
    /project\s+(\w+)/gi,
    /meeting\s+(?:about|regarding|for)\s+([^.!?]+)/gi,
    /(\w+\s+launch)/gi,
    /(\w+\s+budget)/gi,
    /(\w+\s+deadline)/gi,
    /quarterly?\s+(\w+)/gi
  ];
  
  for (const pattern of topicPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      topics.push(...matches.slice(0, 2));
    }
  }
  
  return topics.slice(0, 5);
}

/**
 * Simple sentiment analysis
 */
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['great', 'excellent', 'good', 'success', 'congratulations', 'thank'];
  const negativeWords = ['urgent', 'problem', 'issue', 'error', 'failed', 'wrong', 'concern'];
  
  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Extract deadline information
 */
function extractDeadline(text: string): string | undefined {
  const deadlinePatterns = [
    /due\s+(?:by\s+)?(\w+\s+\d+)/gi,
    /deadline\s+(?:is\s+)?(\w+\s+\d+)/gi,
    /by\s+(\w+day)/gi,
    /before\s+(\w+\s+\d+)/gi
  ];
  
  for (const pattern of deadlinePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}

/**
 * Filter out marketing/promotional emails
 */
export function isNonMarketing(email: EmailData): boolean {
  const insight = analyzeEmail(email);
  return insight.category !== 'marketing' && 
         insight.category !== 'notification' &&
         !email.labels?.includes('CATEGORY_PROMOTIONS') &&
         !email.labels?.includes('CATEGORY_SOCIAL');
}

/**
 * Get a brief summary of the email for briefs
 */
export function getEmailSummary(email: EmailData): string {
  const insight = analyzeEmail(email);
  
  let summary = `From ${email.from}: ${email.subject}`;
  
  if (insight.actionItems.length > 0) {
    summary += ` (Action required: ${insight.actionItems[0]})`;
  }
  
  if (insight.deadline) {
    summary += ` [Deadline: ${insight.deadline}]`;
  }
  
  return summary.substring(0, 200);
}