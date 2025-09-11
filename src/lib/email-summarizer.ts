/**
 * Email Summarization and Analysis Utilities
 * Extracts meaningful insights from email content and metadata
 */

export interface EmailInsight {
  priority: 'high' | 'medium' | 'low';
  hasActionItems: boolean;
  isUrgent: boolean;
  category: 'strategic' | 'operational' | 'financial' | 'client' | 'people' | 'compliance' | 'decision' | 'personal' | 'notification' | 'marketing' | 'other';
  subcategory?: string; // More specific categorization
  sentiment: 'positive' | 'neutral' | 'negative';
  actionItems: string[];
  keyTopics: string[];
  responseRequired: boolean;
  executiveLevel: 'c-suite' | 'vp' | 'director' | 'manager' | 'individual'; // Target audience level
  businessImpact: 'high' | 'medium' | 'low'; // Potential business impact
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

// Executive-level work categorization
const EXECUTIVE_KEYWORDS = {
  strategic: ['strategy', 'roadmap', 'vision', 'direction', 'partnership', 'acquisition', 'merger', 'expansion'],
  operational: ['project', 'delivery', 'implementation', 'launch', 'rollout', 'deployment', 'milestone'],
  financial: ['budget', 'revenue', 'cost', 'investment', 'funding', 'profit', 'loss', 'forecast', 'quarterly'],
  people: ['hiring', 'performance', 'team', 'leadership', 'culture', 'retention', 'promotion', 'restructure'],
  client: ['customer', 'client', 'enterprise', 'account', 'relationship', 'escalation', 'renewal', 'churn'],
  compliance: ['audit', 'compliance', 'regulation', 'policy', 'governance', 'risk', 'security', 'privacy'],
  decision: ['approval', 'decision', 'recommendation', 'proposal', 'review', 'assessment', 'evaluation']
};

// Combine all work keywords for general work detection
const WORK_KEYWORDS = Object.values(EXECUTIVE_KEYWORDS).flat();

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
 * Extract insights from email content and metadata with executive focus
 */
export function analyzeEmail(email: EmailData): EmailInsight {
  const text = `${email.subject} ${email.body}`.toLowerCase();
  const subject = email.subject.toLowerCase();
  
  // Determine category and subcategory
  const { category, subcategory } = categorizeEmail(email, text);
  
  // Determine executive level and business impact
  const executiveLevel = determineExecutiveLevel(email, text, category);
  const businessImpact = assessBusinessImpact(email, text, category);
  
  // Check for urgency indicators - enhanced for executive context
  const isUrgent = URGENT_KEYWORDS.some(keyword => text.includes(keyword)) ||
                   subject.includes('urgent') ||
                   subject.includes('asap') ||
                   subject.includes('immediate') ||
                   text.includes('escalation') ||
                   text.includes('critical') ||
                   email.labels?.includes('IMPORTANT') ||
                   businessImpact === 'high';
  
  // Check for action items - executive focused
  const hasActionItems = ACTION_KEYWORDS.some(keyword => text.includes(keyword)) ||
                        text.includes('?') ||
                        text.includes('decision') ||
                        text.includes('approval') ||
                        text.includes('review') ||
                        subject.includes('re:') ||
                        category === 'decision';
  
  // Extract action items
  const actionItems = extractActionItems(email.body);
  
  // Enhanced priority determination for executive context
  let priority: 'high' | 'medium' | 'low' = 'medium';
  
  if (isUrgent || businessImpact === 'high' || 
      category === 'strategic' || category === 'compliance' ||
      (category === 'client' && text.includes('escalation')) ||
      (category === 'financial' && text.includes('quarterly')) ||
      executiveLevel === 'c-suite') {
    priority = 'high';
  } else if (businessImpact === 'medium' || 
             category === 'decision' || category === 'client' || 
             category === 'operational' || category === 'people' ||
             actionItems.length > 0 ||
             executiveLevel === 'vp' || executiveLevel === 'director') {
    priority = 'medium';
  } else if (category === 'marketing' || category === 'notification' || 
             businessImpact === 'low' || executiveLevel === 'individual') {
    priority = 'low';
  }
  
  // Enhanced response requirement detection
  const responseRequired = hasActionItems ||
                          text.includes('reply') ||
                          text.includes('respond') ||
                          text.includes('feedback') ||
                          text.includes('approval') ||
                          text.includes('decision') ||
                          text.includes('?') ||
                          category === 'decision';
  
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
    subcategory,
    sentiment,
    actionItems,
    keyTopics,
    responseRequired,
    executiveLevel,
    businessImpact,
    deadline
  };
}

/**
 * Categorize email based on content and metadata with executive focus
 */
function categorizeEmail(email: EmailData, text: string): { category: EmailInsight['category'], subcategory: string } {
  // Early filtering for non-business content
  if (email.labels?.includes('CATEGORY_PROMOTIONS') || 
      MARKETING_INDICATORS.some(keyword => text.includes(keyword))) {
    return { category: 'marketing', subcategory: 'promotional' };
  }
  
  if (email.labels?.includes('CATEGORY_UPDATES')) {
    return { category: 'notification', subcategory: 'system_update' };
  }
  
  if (email.labels?.includes('CATEGORY_PERSONAL')) {
    return { category: 'personal', subcategory: 'personal_communication' };
  }
  
  // Executive-level business categorization
  const fromDomain = email.from.split('@')[1]?.toLowerCase() || '';
  const subject = email.subject.toLowerCase();
  
  // Strategic business communications
  if (EXECUTIVE_KEYWORDS.strategic.some(keyword => text.includes(keyword)) ||
      subject.includes('strategy') || subject.includes('roadmap') || subject.includes('vision')) {
    return { category: 'strategic', subcategory: 'business_strategy' };
  }
  
  // Client/customer communications - high executive priority
  if (EXECUTIVE_KEYWORDS.client.some(keyword => text.includes(keyword)) ||
      subject.includes('client') || subject.includes('customer') || text.includes('escalation')) {
    return { category: 'client', subcategory: 'client_relationship' };
  }
  
  // Financial matters - always executive priority
  if (EXECUTIVE_KEYWORDS.financial.some(keyword => text.includes(keyword)) ||
      FINANCE_KEYWORDS.some(keyword => text.includes(keyword)) ||
      subject.includes('budget') || subject.includes('quarterly')) {
    return { category: 'financial', subcategory: 'financial_planning' };
  }
  
  // People/HR matters
  if (EXECUTIVE_KEYWORDS.people.some(keyword => text.includes(keyword)) ||
      subject.includes('hiring') || subject.includes('performance')) {
    return { category: 'people', subcategory: 'human_resources' };
  }
  
  // Compliance and governance
  if (EXECUTIVE_KEYWORDS.compliance.some(keyword => text.includes(keyword)) ||
      subject.includes('audit') || subject.includes('compliance')) {
    return { category: 'compliance', subcategory: 'governance' };
  }
  
  // Decision requests - critical for executives
  if (EXECUTIVE_KEYWORDS.decision.some(keyword => text.includes(keyword)) ||
      subject.includes('approval') || subject.includes('decision') || text.includes('recommend')) {
    return { category: 'decision', subcategory: 'approval_request' };
  }
  
  // Operational matters
  if (EXECUTIVE_KEYWORDS.operational.some(keyword => text.includes(keyword)) ||
      subject.includes('project') || subject.includes('delivery')) {
    return { category: 'operational', subcategory: 'project_management' };
  }
  
  // Check for work-related domains and content
  const workDomains = ['company.com', 'corp.com', 'inc.com', '.org', '.edu'];
  const isWorkDomain = workDomains.some(domain => fromDomain.includes(domain)) ||
                       fromDomain.includes('slack') || fromDomain.includes('teams') ||
                       fromDomain.includes('zoom') || fromDomain.includes('microsoft');
  
  if (isWorkDomain || WORK_KEYWORDS.some(keyword => text.includes(keyword))) {
    return { category: 'operational', subcategory: 'general_business' };
  }
  
  // Health-related communications
  if (HEALTH_KEYWORDS.some(keyword => text.includes(keyword)) ||
      fromDomain.includes('health') || fromDomain.includes('medical')) {
    return { category: 'other', subcategory: 'healthcare' };
  }
  
  return { category: 'other', subcategory: 'uncategorized' };
}

/**
 * Determine the executive level this email should reach
 */
function determineExecutiveLevel(email: EmailData, text: string, category: EmailInsight['category']): EmailInsight['executiveLevel'] {
  // C-suite level indicators
  const cSuiteIndicators = ['merger', 'acquisition', 'strategy', 'vision', 'board', 'investor', 
                           'quarterly results', 'annual', 'ipo', 'funding', 'venture', 'critical decision'];
  
  if (cSuiteIndicators.some(indicator => text.includes(indicator)) ||
      category === 'strategic' || 
      (category === 'financial' && (text.includes('budget') || text.includes('quarterly')))) {
    return 'c-suite';
  }
  
  // VP level indicators
  const vpIndicators = ['department', 'division', 'major project', 'strategic initiative', 
                       'cross-functional', 'enterprise', 'partnership', 'compliance'];
  
  if (vpIndicators.some(indicator => text.includes(indicator)) ||
      category === 'client' || category === 'compliance' || category === 'people') {
    return 'vp';
  }
  
  // Director level indicators
  const directorIndicators = ['team lead', 'project manager', 'delivery', 'milestone', 'roadmap'];
  
  if (directorIndicators.some(indicator => text.includes(indicator)) ||
      category === 'operational') {
    return 'director';
  }
  
  // Manager level for general business communications
  if (category !== 'other' && category !== 'personal') {
    return 'manager';
  }
  
  return 'individual';
}

/**
 * Assess potential business impact of the email
 */
function assessBusinessImpact(email: EmailData, text: string, category: EmailInsight['category']): EmailInsight['businessImpact'] {
  const highImpactIndicators = ['urgent', 'critical', 'escalation', 'crisis', 'emergency', 
                               'deadline today', 'immediate', 'asap', 'board', 'investor',
                               'major client', 'enterprise account', 'compliance issue'];
  
  // High impact categories or indicators
  if (category === 'strategic' || category === 'compliance' ||
      (category === 'client' && text.includes('escalation')) ||
      (category === 'financial' && (text.includes('urgent') || text.includes('quarterly'))) ||
      highImpactIndicators.some(indicator => text.includes(indicator))) {
    return 'high';
  }
  
  const mediumImpactIndicators = ['project', 'decision', 'approval', 'review', 'meeting',
                                 'client', 'customer', 'deadline', 'budget'];
  
  // Medium impact for most business communications
  if (category === 'decision' || category === 'client' || category === 'financial' ||
      category === 'operational' || category === 'people' ||
      mediumImpactIndicators.some(indicator => text.includes(indicator))) {
    return 'medium';
  }
  
  // Low impact for notifications, personal, and other
  return 'low';
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
 * Filter out low-value emails for executive briefings
 */
export function isNonMarketing(email: EmailData): boolean {
  // Quick check for obvious marketing/promotional content first
  if (email.labels?.includes('CATEGORY_PROMOTIONS') ||
      email.labels?.includes('CATEGORY_SOCIAL')) {
    return false;
  }
  
  // Filter out obvious automated/system emails
  const emailText = `${email.subject} ${email.body}`.toLowerCase();
  const obviousLowValueIndicators = [
    'unsubscribe', 'newsletter', 'noreply@', 'no-reply@', 'donotreply@',
    'automated message', 'system generated', 'do not reply'
  ];
  
  if (obviousLowValueIndicators.some(indicator => emailText.includes(indicator))) {
    return false;
  }
  
  // Now run full analysis only if needed
  const insight = analyzeEmail(email);
  
  // Exclude only clear marketing and notifications - be more permissive for business emails
  if (insight.category === 'marketing' || 
      insight.category === 'notification') {
    return false;
  }
  
  // For everything else, be more permissive - let most business emails through
  // Only exclude if explicitly low business impact AND low executive level AND no actions
  if (insight.businessImpact === 'low' && 
      insight.executiveLevel === 'individual' && 
      !insight.hasActionItems && 
      !insight.isUrgent) {
    return false;
  }
  
  // Default to keeping the email if we're not sure
  return true;
}

/**
 * Get an executive-focused summary of the email for briefs
 */
export function getEmailSummary(email: EmailData): string {
  const insight = analyzeEmail(email);
  
  // Start with category and priority indicators for executive scanning
  const categoryPrefix = insight.businessImpact === 'high' ? '🔴' : 
                        insight.businessImpact === 'medium' ? '🟡' : '🟢';
  
  const categoryLabel = insight.category.toUpperCase();
  
  let summary = `${categoryPrefix} [${categoryLabel}] ${email.subject}`;
  
  // Add sender context - prioritize executive level communications
  const fromDomain = email.from.split('@')[1]?.toLowerCase() || '';
  const fromName = email.from.split('<')[0].trim();
  
  if (insight.executiveLevel === 'c-suite' || insight.executiveLevel === 'vp') {
    summary += ` (from ${fromName})`;
  } else if (!fromDomain.includes('noreply') && !fromDomain.includes('no-reply')) {
    summary += ` (${fromName})`;
  }
  
  // Add urgency and action indicators
  const indicators = [];
  if (insight.isUrgent) indicators.push('URGENT');
  if (insight.hasActionItems) indicators.push('ACTION REQUIRED');
  if (insight.responseRequired) indicators.push('RESPONSE NEEDED');
  if (insight.deadline) indicators.push(`Due: ${insight.deadline}`);
  
  if (indicators.length > 0) {
    summary += ` [${indicators.join(', ')}]`;
  }
  
  // Add first action item if available and important
  if (insight.actionItems.length > 0 && insight.businessImpact !== 'low') {
    const firstAction = insight.actionItems[0].substring(0, 80);
    summary += ` → ${firstAction}`;
  }
  
  // Truncate to reasonable length for executive consumption
  return summary.substring(0, 250) + (summary.length > 250 ? '...' : '');
}