import { NextResponse } from 'next/server';
import { unifiedSample } from '@/mocks/data/unifiedSample';
import { generateBrief } from '@/server/briefs/generateBrief';

export async function GET() {
  // TODO: Replace unifiedSample with call to UnifiedDataService once integrated.
  const data = generateBrief(unifiedSample);
  return NextResponse.json(data);
}
