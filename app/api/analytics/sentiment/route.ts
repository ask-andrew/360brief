
import { NextResponse } from 'next/server';
import { analyzeTextWithAI, analyzeTextWithFallback } from '@/utils/sentiment';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const result = await analyzeTextWithAI(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sentiment analysis API:', error);
    // Fallback to rule-based analysis on any error
    try {
        const body = await request.json();
        const { text } = body;
        const result = analyzeTextWithFallback(text);
        return NextResponse.json(result);
    } catch (fallbackError) {
        console.error('Error in fallback sentiment analysis API:', fallbackError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
}
