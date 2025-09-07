import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // REMOVED PYTHON SERVICE DEPENDENCY - Status should reflect real Gmail integration
  throw new Error('Status endpoint removed - use main analytics endpoint for real data status');
}