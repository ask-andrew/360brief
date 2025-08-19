import { NextResponse } from 'next/server';
import { mockBriefingData } from '@/mocks/data/briefingData';

export const dynamic = 'force-dynamic'; // Ensure we don't cache this endpoint

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json(mockBriefingData);
}

export async function POST() {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return NextResponse.json(mockBriefingData);
}
