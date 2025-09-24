import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchUnifiedData } from '@/services/unifiedDataService';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unifiedData = await fetchUnifiedData(user.id, { useCase: 'radar' });
    const emails = (unifiedData as any)?.emails || [];

    const riskRadarServiceUrl = process.env.RADAR_API_URL;
    if (!riskRadarServiceUrl) {
      throw new Error('RADAR_API_URL is not defined');
    }
    const response = await fetch(riskRadarServiceUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Risk radar service failed with status: ${response.status}`);
    }

    const radarData = await response.json();
    return NextResponse.json(radarData);

  } catch (e: any) {
    console.error('Radar GET failed', { message: e?.message, stack: e?.stack });
    return NextResponse.json({ error: e?.message ?? 'Failed to build radar' }, { status: 500 });
  }
}
