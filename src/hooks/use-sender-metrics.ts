import { useQuery } from '@tanstack/react-query';
import { SenderEngagementMetric } from '@/app/api/analytics/sender-metrics/route';

export function useSenderMetrics() {
  return useQuery<SenderEngagementMetric[]>({
    queryKey: ['sender-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/sender-metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch sender metrics');
      }
      const { data } = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
