import { useEffect, useMemo, useState } from 'react';

export type AnalyticsDataParams = {
  // Define any parameters needed for analytics data fetching, e.g., date ranges, filters
  startDate?: string;
  endDate?: string;
  // Add other relevant parameters as needed
};

export type UseAnalyticsDataResult<T = any> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

// Simple client-side cache by key (in-memory for session)
const cache = new Map<string, any>();

function buildKey(params: AnalyticsDataParams): string {
  return JSON.stringify({
    startDate: params.startDate ?? null,
    endDate: params.endDate ?? null,
    // Include other parameters in the key
  });
}

export function useAnalyticsData<T = any>(params: AnalyticsDataParams = {}): UseAnalyticsDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState<number>(0); // Used to force refetch

  const key = useMemo(() => buildKey(params), [params]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      // Serve from in-memory cache if present
      if (cache.has(key)) {
        const cached = cache.get(key);
        setData(cached);
        setLoading(false);
        return;
      }

      try {
        const url = new URL('/api/analytics', window.location.origin);
        url.searchParams.set('use_real_data', 'true'); // Always request real data
        if (params.startDate) url.searchParams.set('startDate', params.startDate);
        if (params.endDate) url.searchParams.set('endDate', params.endDate);
        // Add other parameters to searchParams as needed

        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        cache.set(key, json);
        setData(json as T);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const refetch = () => setNonce((n) => n + 1);

  return { data, loading, error, refetch };
}
