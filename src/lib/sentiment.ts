
import { aiService } from '@/services/ai/aiService';
import { AI_CONFIG } from '@/config/ai';

// Preprocess text for better analysis
export function preprocessText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s']/g, ' ') // Remove special characters, keeping spaces and apostrophes
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .trim();
}

// Analyze sentiment using AI with provider fallback
export async function analyzeTextWithAI(text: string): Promise<{ score: number; reason?: string }> {
  if (!text.trim()) return { score: 0, reason: 'Empty text' };

  // Check if any AI provider is configured
  const isAnyAIConfigured = AI_CONFIG.providers.gemini.apiKey || AI_CONFIG.providers.mistral.apiKey;
  if (!isAnyAIConfigured) {
    // Using console.error to make it more visible in logs.
    console.error("AI Insights Error: No AI provider is configured. Please set GEMINI_API_KEY or MISTRAL_API_KEY in your environment variables. Using fallback analysis.");
    return analyzeTextWithFallback(text);
  }
  
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
export function analyzeTextWithFallback(text: string): { score: number; reason: string } {
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
  const cleanText = text.toLowerCase().replace(/[^a-zA-Z0-9\s']/g, ' ');
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
