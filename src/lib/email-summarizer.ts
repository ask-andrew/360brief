// Stub implementation for email summarizer to fix build errors
// This provides basic email analysis functionality

export interface EmailInsights {
    priority: 'high' | 'medium' | 'low';
    hasActionItems: boolean;
    isUrgent: boolean;
    category?: string;
    sentiment?: string;
    actionItems?: string[];
    keyTopics?: string[];
    responseRequired?: boolean;
    deadline?: string;
}

export function analyzeEmail(emailData: any): EmailInsights {
    const subject = emailData.subject || '';
    const body = emailData.body || '';
    const text = `${subject} ${body}`.toLowerCase();

    // Simple keyword-based analysis
    const isUrgent = /urgent|asap|critical|important|high priority/i.test(text);
    const hasQuestion = /\?/.test(text);
    const hasActionWords = /please|need|require|must|should|deadline|due|action required/i.test(text);

    return {
        priority: isUrgent ? 'high' : hasQuestion ? 'medium' : 'low',
        hasActionItems: hasActionWords || hasQuestion,
        isUrgent,
        category: 'general',
        sentiment: 'neutral',
        actionItems: [],
        keyTopics: [],
        responseRequired: hasQuestion,
        deadline: undefined
    };
}

export function isNonMarketing(emailData: any): boolean {
    const subject = emailData.subject || '';
    const from = emailData.from || '';
    const labels = emailData.labels || [];

    // Filter out obvious marketing/promotional emails
    const marketingKeywords = /unsubscribe|newsletter|promotion|deal|offer|discount|sale/i;
    const hasMarketingKeywords = marketingKeywords.test(subject) || marketingKeywords.test(from);
    const hasPromotionLabel = labels.some((label: string) =>
        label.toLowerCase().includes('promotion') || label.toLowerCase().includes('spam')
    );

    return !hasMarketingKeywords && !hasPromotionLabel;
}

export function getEmailSummary(emailData: any): string {
    const subject = emailData.subject || 'No subject';
    const from = emailData.from || 'Unknown sender';
    const body = emailData.body || '';

    // Create a brief summary
    const preview = body.substring(0, 100) + (body.length > 100 ? '...' : '');
    return `From: ${from}\nSubject: ${subject}\n${preview}`;
}
