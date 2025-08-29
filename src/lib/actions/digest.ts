import { ScheduledDigest } from '@/types/digest';

// Mock data for development
const mockDigests: ScheduledDigest[] = [
  {
    id: '1',
    scheduleId: 'schedule-1',
    name: 'Morning Briefing',
    time: '09:00',
    frequency: 'daily',
    timezone: 'UTC',
    recipients: ['user@example.com'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    scheduleId: 'schedule-2',
    name: 'Weekly Summary',
    time: '18:00',
    frequency: 'weekly',
    timezone: 'UTC',
    recipients: ['user@example.com'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getDigestSchedules(): Promise<ScheduledDigest[]> {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDigests), 500);
  });
}

export async function createDigestSchedule(digest: Omit<ScheduledDigest, 'id'>): Promise<ScheduledDigest> {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    const newDigest = {
      ...digest,
      id: Math.random().toString(36).substring(2, 9),
    };
    mockDigests.push(newDigest);
    setTimeout(() => resolve(newDigest), 500);
  });
}

export async function updateDigestSchedule(id: string, updates: Partial<ScheduledDigest>): Promise<ScheduledDigest> {
  // In a real app, this would be an API call
  return new Promise((resolve, reject) => {
    const index = mockDigests.findIndex(d => d.id === id);
    if (index === -1) {
      return reject(new Error('Digest not found'));
    }
    const updatedDigest = { ...mockDigests[index], ...updates };
    mockDigests[index] = updatedDigest;
    setTimeout(() => resolve(updatedDigest), 500);
  });
}

export async function deleteDigestSchedule(id: string): Promise<void> {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    const index = mockDigests.findIndex(d => d.id === id);
    if (index !== -1) {
      mockDigests.splice(index, 1);
    }
    setTimeout(resolve, 500);
  });
}
