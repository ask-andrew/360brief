
import { aiService } from '@/services/ai/aiService';
import { AI_CONFIG } from '@/config/ai';
import { analyzeTextWithFallback } from '@/utils/sentiment';


export interface Message {
  id: string;
  subject: string;
  body: string;
  timestamp: string;
  from: string;
  to?: string;
  isRead?: boolean;
  isSent: boolean;
}

interface SentimentResult {
  positive: number; // percentage
  negative: number; // percentage
  neutral: number;  // percentage
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total: number;
  overall_trend: 'positive' | 'neutral' | 'negative';
  by_day: Record<string, { positive: number; neutral: number; negative: number; count: number }>;
  negative_messages: Array<Message & { sentiment_score: number; reason?: string }>;
  sentiment_scores: number[];
  analyzed_at: string;
}

// Cache for storing sentiment analysis results
const sentimentCache = new Map<string, SentimentResult>();

export async function analyzeSentiment(messages: Message[]): Promise<SentimentResult> {
  console.log(`[Sentiment Analysis] Starting analysis of ${messages.length} messages`);
  
  if (!messages.length) {
    console.log('[Sentiment Analysis] No messages to analyze');
    return {
      positive: 0,
      negative: 0,
      neutral: 100,
      positive_count: 0,
      negative_count: 0,
      neutral_count: 0,
      total: 0,
      overall_trend: 'neutral',
      by_day: {},
      negative_messages: [],
      sentiment_scores: [],
      analyzed_at: new Date().toISOString()
    };
  }

  try {
    // Log sample messages for debugging
    console.log('[Sentiment Analysis] Sample messages:', {
      firstMessage: messages[0]?.body?.substring(0, 100) + '...',
      messageCount: messages.length,
      hasSubjects: messages.some(m => m.subject),
      avgLength: messages.reduce((sum, m) => sum + (m.body?.length || 0), 0) / messages.length
    });
    // Process messages in batches to avoid rate limiting
    const BATCH_SIZE = 5; // Reduced batch size for better error handling
    const batches = [];
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      batches.push(messages.slice(i, i + BATCH_SIZE));
    }

    const allResults = [];
    
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`[Sentiment Analysis] Processing batch ${batchIndex + 1}/${batches.length}`);
      
      const batchResults = await Promise.all(
        batch.map(async (message) => {
          try {
            const cacheKey = `${message.id}_${message.body?.length || 0}`;
            const cached = sentimentCache.get(cacheKey);
          
            if (cached) {
              return {
                ...message,
                sentiment_score: cached.sentiment_scores[0] || 0,
                reason: 'From cache'
              };
            }

            const text = `${message.subject} ${message.body}`.trim();
            if (!text) {
              return {
                ...message,
                sentiment_score: 0,
                reason: 'Empty message'
              };
            }

            const response = await fetch('/api/analytics/sentiment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error('Sentiment analysis API request failed');
            }

            const { score, reason } = await response.json();
            
            // Cache the result
            sentimentCache.set(cacheKey, {
              positive: score > 0.1 ? 1 : 0,
              negative: score < -0.1 ? 1 : 0,
              neutral: score >= -0.1 && score <= 0.1 ? 1 : 0,
              positive_count: score > 0.1 ? 1 : 0,
              negative_count: score < -0.1 ? 1 : 0,
              neutral_count: score >= -0.1 && score <= 0.1 ? 1 : 0,
              total: 1,
              overall_trend: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
              by_day: {},
              negative_messages: score < -0.1 ? [{
                ...message,
                sentiment_score: score,
                reason
              }] : [],
              sentiment_scores: [score],
              analyzed_at: new Date().toISOString()
            });
            
            return {
              ...message,
              sentiment_score: score,
              reason
            };
          } catch (error) {
            console.error('Error processing message:', message.id, error);
            return {
              ...message,
              sentiment_score: 0,
              reason: 'Error in analysis'
            };
          }
        })
      );
      allResults.push(...batchResults);
    }

    // Calculate statistics
    const sentimentScores = allResults.map(m => m.sentiment_score);
    const totalScore = sentimentScores.reduce((sum, score) => sum + score, 0);
    const avgScore = sentimentScores.length > 0 ? totalScore / sentimentScores.length : 0;
    
    // Categorize messages with adjusted thresholds
    const positiveMessages = sentimentScores.filter(score => score > 0.1);
    const negativeMessages = sentimentScores.filter(score => score < -0.1);
    const neutralMessages = sentimentScores.filter(score => score >= -0.1 && score <= 0.1);
    
    const positive = positiveMessages.length;
    const negative = negativeMessages.length;
    const neutral = neutralMessages.length;
    
    // Group by day
    const by_day: Record<string, { positive: number; neutral: number; negative: number; count: number }> = {};
    
    allResults.forEach(({ timestamp, sentiment_score }) => {
      const date = new Date(timestamp).toISOString().split('T')[0];
      if (!by_day[date]) {
        by_day[date] = { positive: 0, neutral: 0, negative: 0, count: 0 };
      }
      
      if (sentiment_score > 0.2) by_day[date].positive++;
      else if (sentiment_score < -0.2) by_day[date].negative++;
      else by_day[date].neutral++;
      
      by_day[date].count++;
    });

    // Get top negative messages with reasons
    const negative_messages = allResults
      .filter(m => m.sentiment_score < -0.2)
      .sort((a, b) => a.sentiment_score - b.sentiment_score)
      .slice(0, 5);

    return {
      positive: Math.round((positive / messages.length) * 100) || 0,
      negative: Math.round((negative / messages.length) * 100) || 0,
      neutral: Math.round((neutral / messages.length) * 100) || 0,
      positive_count: positive,
      negative_count: negative,
      neutral_count: neutral,
      total: messages.length,
      overall_trend: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral',
      by_day,
      negative_messages,
      sentiment_scores: sentimentScores,
      analyzed_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in analyzeSentiment:', error);
    throw error;
  }
}

export interface InsightOptions {
  provider?: 'gemini' | 'mistral';
}

export interface InsightMessage {
  subject: string;
  body: string;
  reason?: string;
}

export interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  overall_trend: string;
  negative_messages: InsightMessage[];
}

export async function generateInsights(
  sentimentData: SentimentData,
  options: InsightOptions = {}
): Promise<string> {
  // Check if any AI provider is configured
  const isAnyAIConfigured = AI_CONFIG.providers.gemini.apiKey || AI_CONFIG.providers.mistral.apiKey;
  if (!isAnyAIConfigured) {
    // Using console.error to make it more visible in logs.
    console.error("AI Insights Error: No AI provider is configured. Please set GEMINI_API_KEY or MISTRAL_API_KEY in your environment variables. Using fallback insights.");
    return generateFallbackInsights(sentimentData);
  }

  try {
    // Prepare negative examples with more context
    const negativeExamples = sentimentData.negative_messages
      .slice(0, 3)
      .map((msg, i) => ({
        subject: msg.subject || 'No Subject',
        preview: msg.body.substring(0, 150) + (msg.body.length > 150 ? '...' : ''),
        reason: msg.reason || 'No specific reason provided',
        sentiment: getSentimentIntensity(msg.body)
      }));

    // Calculate key metrics
    const totalMessages = sentimentData.positive + sentimentData.neutral + sentimentData.negative;
    const negativeRatio = totalMessages > 0 ? sentimentData.negative / totalMessages : 0;
    const hasCriticalIssues = negativeRatio > 0.3; // More than 30% negative is critical

    // Build the prompt with structured data
    const prompt = `You are an executive communication analyst. Analyze this sentiment data and provide structured, actionable insights.

SENTIMENT OVERVIEW:
- Overall Sentiment: ${sentimentData.overall_trend.toUpperCase()}
- Positive Messages: ${sentimentData.positive}%
- Neutral Messages: ${sentimentData.neutral}%
- Negative Messages: ${sentimentData.negative}%
- Critical Issue Detected: ${hasCriticalIssues ? 'YES' : 'NO'}

NEGATIVE MESSAGE EXAMPLES:
${negativeExamples.map((ex, i) => 
  `[Example ${i + 1} - ${ex.sentiment}]
  Subject: ${ex.subject}
  Preview: ${ex.preview}
  Reason: ${ex.reason}`
).join('\n\n')}

YOUR TASK:
Generate a structured JSON response with the following format:
{
  "overview": "1-2 sentence summary of the overall communication health",
  "key_issues": [
    {
      "title": "Specific issue identified",
      "description": "Brief description with data points",
      "confidence": 0-100,
      "impact": "high/medium/low",
      "recommendations": [
        {
          "action": "Specific, actionable step",
          "priority": "high/medium/low",
          "owner": "Suggested role/team",
          "timeline": "Suggested timeline"
        }
      ]
    }
  ],
  "quick_wins": [
    {
      "action": "Quick action that can be taken immediately",
      "expected_impact": "Expected outcome"
    }
  ],
  "metrics_to_watch": [
    {
      "metric": "Specific metric to monitor",
      "current_value": "Current value",
      "target": "Target value",
      "timeframe": "Expected timeframe"
    }
  ]
}

Focus on:
1. Specific patterns in negative feedback
2. Actionable recommendations with clear owners
3. Quick wins that can show immediate improvement
4. Metrics to track progress
5. Industry-specific best practices for communication
6. Root cause analysis for negative sentiment

Return ONLY the JSON object, no additional text or formatting.`;

    try {
      const response = await aiService.generateContent(prompt, {
        provider: options.provider,
        temperature: 0.3, // Lower temperature for more focused, consistent output
        maxTokens: 2000
      });

      // Parse and format the response
      try {
        const insights = JSON.parse(response);
        return formatInsights(insights);
      } catch (e) {
        console.error('Error parsing AI response:', e);
        return response; // Fallback to raw response if parsing fails
      }
    } catch (error) {
      console.error('Error generating insights with AI:', error);
      return generateFallbackInsights(sentimentData);
    }
  } catch (error) {
    console.error('Error in generateInsights:', error);
    return generateFallbackInsights(sentimentData);
  }
}

// Helper function to format insights into a readable format
function formatInsights(insights: any): string {
  if (!insights) return 'No insights available.';
  
  let result = `## 📊 Communication Health Overview\n${insights.overview || 'No overview available.'}\n\n`;

  if (insights.key_issues?.length > 0) {
    result += "## 🔍 Key Issues & Recommendations\n";
    insights.key_issues.forEach((issue: any, index: number) => {
      result += `\n### ⚠️ ${issue.title || 'Issue'} ${issue.confidence ? `(Confidence: ${issue.confidence}%)` : ''}\n`;
      result += `${issue.description || 'No description provided.'}\n\n`;
      
      if (issue.recommendations?.length > 0) {
        result += "**Recommended Actions:**\n";
        issue.recommendations.forEach((rec: any, i: number) => {
          result += `${i + 1}. ${rec.action || 'No action specified'} `;
          result += `[Priority: ${rec.priority ? rec.priority.toUpperCase() : 'MEDIUM'}`;
          if (rec.owner) result += ` | Owner: ${rec.owner}`;
          if (rec.timeline) result += ` | Timeline: ${rec.timeline}`;
          result += "]\n";
        });
      }
    });
  }

  if (insights.quick_wins?.length > 0) {
    result += "\n## 🚀 Quick Wins\n";
    insights.quick_wins.forEach((win: any, i: number) => {
      result += `${i + 1}. **${win.action || 'Action'}**\n   → ${win.expected_impact || 'Impact not specified'}\n`;
    });
  }

  if (insights.metrics_to_watch?.length > 0) {
    result += "\n## 📈 Metrics to Watch\n";
    insights.metrics_to_watch.forEach((metric: any, i: number) => {
      result += `- **${metric.metric || 'Metric'}`;
      if (metric.current_value) result += `: ${metric.current_value}`;
      if (metric.target) result += ` (Target: ${metric.target}${metric.timeframe ? ` by ${metric.timeframe}` : ''})`;
      result += "\n";
    });
  }

  return result;
}

// Fallback implementation if AI fails
function generateFallbackInsights(sentimentData: SentimentData): string {
  const totalMessages = sentimentData.positive + sentimentData.neutral + sentimentData.negative;
  const negativeRatio = totalMessages > 0 ? sentimentData.negative / totalMessages : 0;
  
  let mainIssue = "No critical issues detected.";
  let recommendation = "Continue current communication patterns.";
  let quickWins = [
    "Review recent positive interactions to identify successful patterns",
    "Send a quick check-in message to key stakeholders"
  ];
  let metrics = [
    {
      metric: "Negative Sentiment %",
      current_value: `${sentimentData.negative}%`,
      target: "< 15%",
      timeframe: "Next 30 days"
    }
  ];

  if (negativeRatio > 0.3) {
    mainIssue = "High negative sentiment detected in communications.";
    recommendation = "1. Review negative message samples for common themes\n" +
                   "2. Schedule 1:1s with key stakeholders\n" +
                   "3. Implement immediate response protocol for urgent issues";
    quickWins = [
      "Acknowledge concerns in negative messages with personalized responses",
      "Set up automated alerts for future negative sentiment spikes"
    ];
    metrics.push({
      metric: "Response Time to Negative Feedback",
      current_value: "Not measured",
      target: "< 24 hours",
      timeframe: "Immediate"
    });
  } else if (negativeRatio > 0.15) {
    mainIssue = "Moderate negative sentiment detected.";
    recommendation = "1. Monitor negative trends weekly\n" +
                   "2. Address top negative patterns in team meetings\n" +
                   "3. Consider targeted communication training";
    quickWins = [
      "Send a brief survey to understand specific pain points",
      "Highlight recent positive interactions in team communications"
    ];
  }

  return `## Communication Health Overview
Current sentiment is ${sentimentData.overall_trend} with ${sentimentData.negative}% negative messages.

### Key Issue
${mainIssue}

### Recommended Actions
${recommendation}

### Quick Wins
${quickWins.map((win, i) => `${i + 1}. ${win}`).join('\n')}

### Metrics to Watch
${metrics.map(m => 
  `- **${m.metric}**: ${m.current_value} (Target: ${m.target}${m.timeframe ? ` by ${m.timeframe}` : ''})`
).join('\n')}

*Note: These are automatically generated recommendations. For more personalized insights, please try again later or contact support.*`;
}

// Helper to analyze sentiment intensity
function getSentimentIntensity(text: string): string {
    if (!text) return 'Neutral';
    const { score } = analyzeTextWithFallback(text);
    if (score > 0.6) return 'Very Positive';
    if (score > 0.2) return 'Positive';
    if (score > -0.2) return 'Neutral';
    if (score > -0.6) return 'Negative';
    return 'Very Negative';
  }

export default {
  analyzeSentiment,
  generateInsights,
};

