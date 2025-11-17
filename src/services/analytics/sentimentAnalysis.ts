import { aiService } from '@/services/ai/aiService';

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
  positive: number;
  negative: number;
  neutral: number;
  overall_trend: 'positive' | 'neutral' | 'negative';
  by_day: Record<string, { positive: number; neutral: number; negative: number; count: number }>;
  negative_messages: Array<Message & { sentiment_score: number; reason?: string }>;
  sentiment_scores: number[];
  analyzed_at: string;
}

// Cache for storing sentiment analysis results
const sentimentCache = new Map<string, SentimentResult>();

// Preprocess text for better analysis
export function preprocessText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .trim();
}

// Analyze sentiment using AI with provider fallback
export async function analyzeTextWithAI(text: string): Promise<{ score: number; reason?: string }> {
  if (!text.trim()) return { score: 0, reason: 'Empty text' };
  
  // Truncate very long text to avoid token limits
  const truncatedText = text.length > 1000 ? text.substring(0, 1000) + '...' : text;

  try {
    const prompt = `Analyze the sentiment of this message and provide a score from -1 (very negative) to 1 (very positive). 
    Be decisive in your scoring - if there's any positive or negative sentiment, reflect that in the score.
    
    Message: "${truncatedText}"
    
    Respond in JSON format: {"score": number, "reason": string}`;

    // Try Gemini first, then fall back to Mistral
    const response = await aiService.generateContent(prompt, {
      provider: 'gemini',
      temperature: 0.2, // Lower temperature for more consistent results
      maxTokens: 150,
      systemPrompt: 'You are a sentiment analysis assistant. Be decisive in your sentiment scoring. Provide a clear sentiment score and a brief explanation.'
    }).catch(async (geminiError) => {
      console.log('Gemini failed, falling back to Mistral:', geminiError);
      return aiService.generateContent(prompt, {
        provider: 'mistral',
        temperature: 0.2,
        maxTokens: 150
      });
    });

    // Parse the response
    try {
      const result = typeof response === 'string' ? JSON.parse(response) : response;
      const rawScore = parseFloat(result.score);
      const score = isNaN(rawScore) ? 0 : Math.max(-1, Math.min(1, rawScore));
      
      // Make the scoring more decisive
      const decisiveScore = Math.abs(score) > 0.1 ? 
        (score > 0 ? 0.7 : -0.7) : 0;
      
      return {
        score: decisiveScore,
        reason: result.reason || 'No reason provided'
      };
    } catch (e) {
      console.warn('Failed to parse AI response, using fallback analysis');
      return analyzeTextWithFallback(text);
    }
  } catch (error) {
    console.error('AI sentiment analysis failed, using fallback:', error);
    return analyzeTextWithFallback(text);
  }
}

// Enhanced sentiment analysis with more sophisticated word lists and context analysis
function analyzeTextWithFallback(text: string): { score: number; reason: string } {
  // Expanded word lists with weights - more comprehensive and business-context aware
  const positiveWords: {[key: string]: number} = {
    // Strong positive (2.5x)
    'excellent': 2.5, 'outstanding': 2.5, 'amazing': 2.5, 'perfect': 2.5, 'fantastic': 2.5,
    'exceptional': 2.5, 'superb': 2.5, 'brilliant': 2.5, 'impressive': 2.5, 'delighted': 2.5,
    // Moderate positive (2x)
    'great': 2, 'good': 2, 'thanks': 2, 'thank you': 2, 'appreciate': 2,
    'happy': 2, 'pleased': 2, 'awesome': 2, 'love': 2, 'wonderful': 2,
    'success': 2, 'achievement': 2, 'progress': 1.5, 'improved': 1.5, 'better': 1.5,
    'solved': 2, 'fixed': 2, 'completed': 1.5, 'launched': 1.5, 'delivered': 1.5,
    // Mild positive (1.2x)
    'nice': 1.2, 'cool': 1.2, 'sweet': 1.2, 'yay': 1.2, 'welcome': 1.2,
    'okay': 1, 'fine': 1, 'acceptable': 1, 'satisfactory': 1, 'decent': 1
  };

  const negativeWords: {[key: string]: number} = {
    // Strong negative (-2.5x)
    'terrible': -2.5, 'awful': -2.5, 'horrible': -2.5, 'hate': -2.5, 'worst': -2.5,
    'disaster': -2.5, 'failure': -2.5, 'unacceptable': -2.5, 'broken': -2.5, 'useless': -2.5,
    // Moderate negative (-2x)
    'bad': -2, 'poor': -2, 'issue': -2, 'problem': -2, 'angry': -2,
    'upset': -2, 'disappointed': -2, 'frustrated': -2, 'concerned': -2,
    'critical': -2, 'urgent': -1.5, 'delay': -1.5, 'late': -1.5, 'missed': -1.5,
    'error': -2, 'bug': -2, 'crash': -2.5, 'outage': -2.5, 'downtime': -2.5,
    // Mild negative (-1.2x)
    'worry': -1.2, 'unhappy': -1.2, 'sad': -1.2, 'confused': -1.2, 'concern': -1.2,
    'unclear': -1, 'confusing': -1, 'difficult': -1, 'hard': -1, 'tough': -1
  };

  // More comprehensive negation handling
  const negations = [
    'not', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 
    'don\'t', 'doesn\'t', 'didn\'t', 'never', 'no', 'none',
    'hardly', 'barely', 'scarcely', 'seldom', 'rarely'
  ];
  
  // More comprehensive intensifiers
  const intensifiers: {[key: string]: number} = {
    // Strong intensifiers (2x)
    'extremely': 2, 'incredibly': 2, 'absolutely': 2, 'completely': 2, 'totally': 2,
    'utterly': 2, 'exceptionally': 2, 'remarkably': 2,
    // Medium intensifiers (1.7x)
    'very': 1.7, 'really': 1.7, 'highly': 1.7, 'truly': 1.7, 'particularly': 1.7,
    'especially': 1.7, 'seriously': 1.7, 'genuinely': 1.7, 'definitely': 1.7, 'certainly': 1.7,
    // Mild intensifiers (1.3x)
    'quite': 1.3, 'pretty': 1.3, 'fairly': 1.3, 'somewhat': 1.1, 'slightly': 1.1,
    'a bit': 1.1, 'a little': 1.1, 'rather': 1.2, 'relatively': 1.1, 'moderately': 1.1
  };

  // Handle negated intensifiers (e.g., "not very good")
  const negatedIntensifiers: Record<string, number> = {
    'not very': 0.5, 'not too': 0.5, 'not that': 0.5, 'not so': 0.5,
    'not really': 0.4, 'not exactly': 0.4, 'not particularly': 0.3
  };

  // Clean and prepare the text
  const cleanText = text.toLowerCase().replace(/[^\w\s']/g, ' ');
  const words = cleanText.split(/\s+/).filter(w => w.trim() !== '');
  
  let score = 0;
  let reason = 'Neutral language';
  let detectedWords: string[] = [];
  
  // Analyze each word with context
  for (let i = 0; i < words.length; i++) {
    const word = words[i].trim();
    if (!word) continue;
    
    let wordScore = 0;
    let modifier = 1;
    
    // Check for negated intensifiers (e.g., "not very good")
    if (i < words.length - 1) {
      const bigram = `${words[i]} ${words[i+1]}`;
      if (negatedIntensifiers[bigram]) {
        modifier *= negatedIntensifiers[bigram];
        i++; // Skip next word
      }
    }
    
    // Check for negation before the word
    if (i > 0 && negations.includes(words[i-1].toLowerCase())) {
      modifier = -0.8; // Slightly less than -1 to account for double negatives
    }
    
    // Check for intensifiers before the word
    if (i > 0 && intensifiers[words[i-1].toLowerCase()]) {
      modifier *= intensifiers[words[i-1].toLowerCase()];
    }
    
    // Check positive words
    if (positiveWords[word] !== undefined) {
      wordScore = positiveWords[word] * modifier;
      detectedWords.push(word);
    } 
    // Check negative words
    else if (negativeWords[word] !== undefined) {
      wordScore = negativeWords[word] * modifier;
      detectedWords.push(word);
    }
    
    // Check for exclamation marks (can intensify sentiment)
    if (word.endsWith('!')) {
      wordScore *= 1.5; // Increased from 1.3
    }
    
    // Check for question marks (can indicate uncertainty)
    if (word.endsWith('?')) {
      wordScore *= 0.6; // Increased from 0.7
    }
    
    // Check for ALL CAPS (can indicate intensity)
    if (word === word.toUpperCase() && word.length > 2) {
      wordScore *= 1.4;
    }
    
    score += wordScore;
  }
  
  // More sensitive normalization (dividing by 3 instead of 5)
  let normalizedScore = Math.max(-1, Math.min(1, score / 3));
  
  // Make the score more decisive with non-linear scaling
  if (Math.abs(normalizedScore) > 0.05) {
    const sign = Math.sign(normalizedScore);
    const absScore = Math.abs(normalizedScore);
    // Apply a non-linear scaling to make moderate scores more pronounced
    const scaledScore = sign * (0.5 + (absScore * 0.5));
    normalizedScore = Math.max(-1, Math.min(1, scaledScore));
  }
  
  // Generate more detailed reason based on score and detected words
  if (detectedWords.length > 0) {
    // Lower thresholds for detection (0.1 instead of 0.3)
    let sentiment: string;
    let intensity: string;
    
    if (normalizedScore > 0.7) {
      sentiment = 'Very positive';
      intensity = 'strongly positive';
    } else if (normalizedScore > 0.3) {
      sentiment = 'Positive';
      intensity = 'positive';
    } else if (normalizedScore > 0.1) {
      sentiment = 'Slightly positive';
      intensity = 'mildly positive';
    } else if (normalizedScore < -0.7) {
      sentiment = 'Very negative';
      intensity = 'strongly negative';
    } else if (normalizedScore < -0.3) {
      sentiment = 'Negative';
      intensity = 'negative';
    } else if (normalizedScore < -0.1) {
      sentiment = 'Slightly negative';
      intensity = 'mildly negative';
    } else {
      sentiment = 'Neutral';
      intensity = 'neutral';
    }
    
    const wordList = detectedWords.slice(0, 4).join(', ');
    const additionalCount = detectedWords.length > 4 ? ` and ${detectedWords.length - 4} more` : '';
    
    reason = `${sentiment} sentiment detected (${intensity} words: ${wordList}${additionalCount})`;
  } else if (text.length < 5) {
    reason = 'Insufficient text for analysis';
  } else {
    reason = 'Neutral sentiment (no strong indicators detected)';
  }
  
  return {
    score: normalizedScore,
    reason
  };
}

export async function analyzeSentiment(messages: Message[]): Promise<SentimentResult> {
  console.log(`[Sentiment Analysis] Starting analysis of ${messages.length} messages`);
  
  if (!messages.length) {
    console.log('[Sentiment Analysis] No messages to analyze');
    return {
      positive: 0,
      negative: 0,
      neutral: 100,
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
    let processedCount = 0;
    
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`[Sentiment Analysis] Processing batch ${batchIndex + 1}/${batches.length}`);
      
      try {
        const batchResults = await Promise.all(
          batch.map(async (message, msgIndex) => {
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

            const { score, reason } = await analyzeTextWithAI(text);
            
            // Cache the result
            sentimentCache.set(cacheKey, {
              positive: score > 0.1 ? 1 : 0,
              negative: score < -0.1 ? 1 : 0,
              neutral: score >= -0.1 && score <= 0.1 ? 1 : 0,
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
      } catch (batchError) {
        console.error(`[Sentiment Analysis] Batch ${batchIndex + 1} failed:`, batchError);
        // On batch failure, fall back to rule-based for this batch
        const fallbackResults = batch.map((message) => {
          const text = `${message.subject} ${message.body}`.trim();
          const { score, reason } = analyzeTextWithFallback(text);
          return { ...message, sentiment_score: score, reason: reason || 'Fallback analysis' };
        });
        allResults.push(...fallbackResults);
      }
    }

    // Calculate statistics
    const sentimentScores = allResults.map(m => m.sentiment_score);
    const totalScore = sentimentScores.reduce((sum, score) => sum + score, 0);
    const avgScore = sentimentScores.length > 0 ? totalScore / sentimentScores.length : 0;
    
    // Categorize messages with adjusted thresholds
    const positive = sentimentScores.filter(score => score > 0.1).length;
    const negative = sentimentScores.filter(score => score < -0.1).length;
    const neutral = sentimentScores.length - positive - negative;
    
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
      overall_trend: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral',
      by_day,
      negative_messages,
      sentiment_scores: sentimentScores,
      analyzed_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in analyzeSentiment:', error);
    // Fallback to simple analysis if AI fails
    return analyzeMessagesWithFallback(messages);
  }
}

// Fallback implementation if AI analysis fails
export function analyzeMessagesWithFallback(messages: Message[]): SentimentResult {
  const sentimentScores = messages.map(message => {
    const text = `${message.subject} ${message.body}`.toLowerCase();
    const { score } = analyzeTextWithFallback(text);
    return {
      ...message,
      sentiment_score: score,
      reason: 'Fallback analysis'
    };
  });

  const totalScore = sentimentScores.reduce((sum, { sentiment_score }) => sum + sentiment_score, 0);
  const avgScore = totalScore / messages.length;
  
  const positive = sentimentScores.filter(m => m.sentiment_score > 0.2).length;
  const negative = sentimentScores.filter(m => m.sentiment_score < -0.2).length;
  const neutral = messages.length - positive - negative;

  return {
    positive: Math.round((positive / messages.length) * 100) || 0,
    negative: Math.round((negative / messages.length) * 100) || 0,
    neutral: Math.round((neutral / messages.length) * 100) || 0,
    overall_trend: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral',
    by_day: {},
    negative_messages: [],
    sentiment_scores: sentimentScores.map(m => m.sentiment_score),
    analyzed_at: new Date().toISOString()
  };
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
  analyzeTextWithFallback,
  analyzeTextWithAI,
  preprocessText,
  analyzeMessagesWithFallback
};
