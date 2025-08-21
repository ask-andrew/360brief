export interface ScheduledDigest {
  id: string;
  name: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'weekdays';
  nextDelivery?: Date;
  // Add other fields as needed
}
