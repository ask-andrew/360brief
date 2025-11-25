import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/ai';

type AIProvider = 'gemini' | 'mistral';

interface AIGenerateOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class AIService {
  private gemini: any;
  private mistral: any;

  constructor() {
    if (AI_CONFIG.providers.gemini.enabled && AI_CONFIG.providers.gemini.apiKey) {
      this.gemini = new GoogleGenerativeAI(AI_CONFIG.providers.gemini.apiKey);
    }

    if (AI_CONFIG.providers.mistral.enabled && AI_CONFIG.providers.mistral.apiKey) {
      this.mistral = {
        baseUrl: 'https://api.mistral.ai/v1',
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.providers.mistral.apiKey}`,
          'Content-Type': 'application/json'
        }
      };
    }
  }

  async generateContent(
    prompt: string,
    options: AIGenerateOptions = {}
  ): Promise<string> {
    const provider = options.provider || AI_CONFIG.defaultProvider;
    
    try {
      if (provider === 'gemini' && this.gemini) {
        return this.generateWithGemini(prompt, options);
      } else if (provider === 'mistral' && this.mistral) {
        return this.generateWithMistral(prompt, options);
      }
      throw new Error(`No suitable AI provider available for ${provider}`);
    } catch (error) {
      console.error(`Error generating content with ${provider}:`, error);
      throw error;
    }
  }

  private async generateWithGemini(
    prompt: string,
    options: AIGenerateOptions
  ): Promise<string> {
    const model = this.gemini.getGenerativeModel({ 
      model: options.model || AI_CONFIG.providers.gemini.model 
    });

    const result = await model.generateContent({
      contents: [{ 
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
      },
    });

    return result.response.text();
  }

  private async generateWithMistral(
    prompt: string,
    options: AIGenerateOptions
  ): Promise<string> {
    const response = await fetch(`${this.mistral.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.mistral.headers,
      body: JSON.stringify({
        model: options.model || AI_CONFIG.providers.mistral.model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 1000,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mistral API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

export const aiService = new AIService();
