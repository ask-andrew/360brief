declare module '@/lib/utils/date' {
  export function calculateNextDelivery(
    time: string, 
    frequency: 'daily' | 'weekly' | 'weekdays' | 'monthly'
  ): Date;
}
