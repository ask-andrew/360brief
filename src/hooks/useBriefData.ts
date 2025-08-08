import { useEffect, useMemo, useState } from 'react';

export type BriefDataParams = {
  // ISO date strings
  startDate?: string;
  endDate?: string;
  channels?: Array<'email' | 'slack' | 'meeting'>;
};

export type UseBriefDataResult<T = any> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

// Simple client-side cache by key (in-memory for session)
const cache = new Map<string, any>();

function buildKey(params: BriefDataParams): string {
  return JSON.stringify({
    startDate: params.startDate ?? null,
    endDate: params.endDate ?? null,
    channels: (params.channels ?? []).slice().sort(),
  });
}

export function useBriefData<T = any>(params: BriefDataParams = {}): UseBriefDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState<number>(0);

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
        const url = new URL('/api/brief-data', window.location.origin);
        if (params.startDate) url.searchParams.set('startDate', params.startDate);
        if (params.endDate) url.searchParams.set('endDate', params.endDate);
        if (params.channels && params.channels.length) {
          url.searchParams.set('channels', params.channels.join(','));
        }

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
