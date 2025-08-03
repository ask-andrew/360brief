import { faker } from '@faker-js/faker';

interface EmailActivityData {
  date: string;
  received: number;
  sent: number;
  important: number;
}

interface TimeDistributionItem {
  name: string;
  value: number;
  color: string;
}

interface PriorityItem {
  id: string;
  title: string;
  urgency: number;
  importance: number;
  type: 'email' | 'task' | 'meeting';
}

interface ExampleUser {
  name: string;
  email: string;
  role: string;
  interactionCount: number;
  lastInteraction?: string;
  company?: string;
}

export interface ExampleDashboardData {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  stats: {
    emails: {
      total: number;
      unread: number;
      important: number;
      responseTime: string;
      responseRate: string;
    };
    meetings: {
      upcoming: number;
      completed: number;
      timeInMeetings: string;
      averageDuration: string;
    };
    productivity: {
      focusTime: string;
      tasksCompleted: number;
      priorityItems: number;
      completionRate: string;
    };
  };
  analytics: {
    emailActivity: EmailActivityData[];
    timeDistribution: TimeDistributionItem[];
    priorityItems: PriorityItem[];
  };
  topContacts: ExampleUser[];
  recentActivity: Array<{
    id: string;
    type: 'email' | 'meeting' | 'task';
    title: string;
    description: string;
    time: string;
    action?: string;
  }>;
  upcomingMeetings: Array<{
    id: string;
    title: string;
    time: string;
    participants: string[];
    duration: string;
    description: string;
    location: string;
  }>;
  insights: Array<{
    id: string;
    type: 'warning' | 'success';
    title: string;
    description: string;
    action: string;
  }>;
}

// Generate consistent data for demo purposes
const generateConsistentData = (): { 
  emailData: EmailActivityData[]; 
  timeDistribution: TimeDistributionItem[]; 
  priorityItems: PriorityItem[]; 
} => {
  const now = new Date();
  const days = 7;
  const emailData = [];
  const timeDistribution = [
    { name: 'Meetings', value: 35, color: '#3b82f6' },
    { name: 'Emails', value: 25, color: '#10b981' },
    { name: 'Focus Time', value: 20, color: '#f59e0b' },
    { name: 'Tasks', value: 15, color: '#8b5cf6' },
    { name: 'Other', value: 5, color: '#ec4899' },
  ];

  // Generate email activity data for the last 7 days
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    emailData.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      received: faker.number.int({ min: 15, max: 45 }),
      sent: faker.number.int({ min: 5, max: 20 }),
      important: faker.number.int({ min: 2, max: 10 }),
    });
  }

  // Generate priority items
  const priorityItems = [
    {
      id: '1',
      title: 'Review Q3 financial report',
      urgency: 5,
      importance: 5,
      type: 'task' as const,
    },
    {
      id: '2',
      title: 'Team sync with Engineering',
      urgency: 4,
      importance: 5,
      type: 'meeting' as const,
    },
    {
      id: '3',
      title: 'Follow up on client proposal',
      urgency: 5,
      importance: 4,
      type: 'email' as const,
    },
    {
      id: '4',
      title: 'Update project roadmap',
      urgency: 3,
      importance: 4,
      type: 'task' as const,
    },
  ];

  return { 
    emailData, 
    timeDistribution, 
    priorityItems 
  };
}

export function generateExampleData(): ExampleDashboardData {
  // Generate realistic user data
  const user: ExampleDashboardData['user'] = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    role: 'CEO',
    avatar: '/avatars/ceo.jpg',
  };

  // Generate stats data
  const stats: ExampleDashboardData['stats'] = {
    emails: {
      total: 237,
      unread: 18,
      important: 12,
      responseTime: '1.8h',
      responseRate: '87%',
    },
    meetings: {
      upcoming: 7,
      completed: 5,
      timeInMeetings: '9.2h',
      averageDuration: '52m',
    },
    productivity: {
      focusTime: '4.5h',
      tasksCompleted: 14,
      priorityItems: 7,
      completionRate: '78%',
    },
  };

  // Generate analytics data
  const analytics: ExampleDashboardData['analytics'] = {
    emailActivity: [],
    timeDistribution: [],
    priorityItems: [],
  };

  // Generate consistent data for the example
  const { emailData, timeDistribution, priorityItems } = generateConsistentData();
  analytics.emailActivity = emailData;
  analytics.timeDistribution = timeDistribution;
  analytics.priorityItems = priorityItems;

  // Generate top contacts
  const topContacts: ExampleDashboardData['topContacts'] = [
    {
      name: 'Sarah Chen',
      role: 'VP of Engineering',
      email: 'sarah.chen@example.com',
      interactionCount: 12,
      lastInteraction: '2h ago',
      company: 'TechCorp',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of Product',
      email: 'michael.rodriguez@example.com',
      interactionCount: 8,
      lastInteraction: '5h ago',
      company: 'TechCorp',
    },
    {
      name: 'Priya Patel',
      role: 'CFO',
      email: 'priya.patel@example.com',
      interactionCount: 6,
      lastInteraction: '1d ago',
      company: 'TechCorp',
    },
    {
      name: 'David Kim',
      role: 'CTO',
      email: 'david.kim@example.com',
      interactionCount: 5,
      lastInteraction: '1d ago',
      company: 'TechCorp',
    },
    {
      name: 'Emily Wilson',
      role: 'VP of Marketing',
      email: 'emily.wilson@example.com',
      interactionCount: 4,
      lastInteraction: '2d ago',
      company: 'TechCorp',
    },
  ];

  // Generate upcoming meetings
  const upcomingMeetings: ExampleDashboardData['upcomingMeetings'] = [
    {
      id: 'm1',
      title: 'Q3 Financial Review',
      time: '10:00 AM - 11:30 AM',
      participants: ['Sarah Chen', 'Priya Patel', 'David Kim'],
      duration: '1h 30m',
      description: 'Review of Q3 financial performance and projections',
      location: 'Conference Room A',
    },
    {
      id: 'm2',
      title: 'Product Roadmap Planning',
      time: '1:00 PM - 2:30 PM',
      participants: ['Michael Rodriguez', 'Engineering Leads'],
      duration: '1h 30m',
      description: 'Planning session for next quarter product roadmap',
      location: 'Zoom',
    },
    {
      id: 'm3',
      title: 'Marketing Strategy Sync',
      time: '3:00 PM - 4:00 PM',
      participants: ['Emily Wilson', 'Marketing Team'],
      duration: '1h',
      description: 'Discussion on upcoming marketing campaigns',
      location: 'Conference Room B',
    },
  ];

  // Generate recent activity
  const recentActivity: ExampleDashboardData['recentActivity'] = [
    {
      id: faker.string.uuid(),
      type: 'email' as const,
      title: 'Q2 Budget Review',
      description: 'From: finance@company.com',
      time: '2 hours ago',
      action: 'Reply',
    },
    {
      id: faker.string.uuid(),
      type: 'meeting' as const,
      title: 'Team Sync',
      description: 'Starts in 30 minutes',
      time: 'Today, 10:30 AM',
      action: 'Join',
    },
    {
      id: faker.string.uuid(),
      type: 'task' as const,
      title: 'Review Project Proposal',
      description: 'Due tomorrow',
      time: 'Today',
      action: 'View',
    },
  ];

  return {
    user,
    stats,
    analytics,
    topContacts,
    upcomingMeetings,
    recentActivity,
  };
}

// Generate a single instance of example data
export const exampleDashboardData: ExampleDashboardData = generateExampleData();
