import { EnhancedActionCenterProps } from './EnhancedActionCenter';

// Helper function to generate random trend
const getRandomTrend = (): 'up' | 'down' | 'neutral' => {
  const trends: ('up' | 'down' | 'neutral')[] = ['up', 'down', 'neutral'];
  return trends[Math.floor(Math.random() * trends.length)];
};

export const mockEnhancedData: EnhancedActionCenterProps['data'] = {
  topics: {
    pending: [
      {
        id: 't1',
        title: 'Q3 Product Launch Planning',
        participants: ['Alex Johnson', 'Jamie Smith', 'Taylor Wong', 'Morgan Lee'],
        lastActivity: '2023-08-04T14:30:00Z',
        project: 'Product Roadmap',
        messageTypes: {
          email: 2,
          slack: 5,
          meeting: 1,
          teams: 0
        },
        sentiment: 0.4,
        urgency: 'high',
        items: [
          {
            id: 'm1',
            type: 'email',
            title: 'Re: Q3 Launch Timeline',
            link: '#',
            timestamp: '2023-08-04T14:30:00Z',
            participants: ['Alex Johnson'],
            preview: 'Here are my thoughts on the revised timeline...'
          },
          {
            id: 'm2',
            type: 'slack',
            title: 'Design assets for launch',
            link: '#',
            timestamp: '2023-08-04T13:15:00Z',
            participants: ['Jamie Smith', 'Taylor Wong'],
            preview: 'I\'ve uploaded the latest design assets...'
          }
        ]
      },
      {
        id: 't2',
        title: 'Customer Feedback Analysis',
        participants: ['Casey Kim', 'Jordan Taylor', 'Riley Chen'],
        lastActivity: '2023-08-03T11:20:00Z',
        project: 'Customer Experience',
        messageTypes: {
          email: 1,
          slack: 3,
          meeting: 2,
          teams: 0
        },
        sentiment: -0.2,
        urgency: 'medium',
        items: [
          {
            id: 'm3',
            type: 'meeting',
            title: 'Feedback Review - August',
            link: '#',
            timestamp: '2023-08-03T11:20:00Z',
            participants: ['Casey Kim', 'Jordan Taylor', 'Riley Chen'],
            preview: 'Meeting notes and action items...'
          }
        ]
      }
    ],
    awaiting: [
      {
        id: 't3',
        title: 'API Integration Discussion',
        participants: ['Sam Wilson', 'Pat Lee', 'Chris Zhang'],
        lastActivity: '2023-08-04T16:45:00Z',
        project: 'Platform Integration',
        messageTypes: {
          email: 0,
          slack: 4,
          meeting: 0,
          teams: 1
        },
        sentiment: 0.7,
        urgency: 'medium',
        items: [
          {
            id: 'm4',
            type: 'slack',
            title: 'API documentation link',
            link: '#',
            timestamp: '2023-08-04T16:45:00Z',
            participants: ['Sam Wilson'],
            preview: 'Here\'s the link to the API documentation...'
          }
        ]
      }
    ]
  },
  messageCounts: {
    pending: 2,
    awaiting: 1
  },
  
  sentimentByProject: [
    {
      project: 'Product Roadmap',
      sentiment: 0.4,
      trend: getRandomTrend(),
      messages: 8,
      messageTypes: {
        email: 3,
        slack: 4,
        meeting: 1
      }
    },
    {
      project: 'Customer Experience',
      sentiment: -0.2,
      trend: getRandomTrend(),
      messages: 6,
      messageTypes: {
        email: 2,
        slack: 3,
        meeting: 1
      }
    },
    {
      project: 'Platform Integration',
      sentiment: 0.7,
      trend: getRandomTrend(),
      messages: 5,
      messageTypes: {
        email: 1,
        slack: 3,
        meeting: 1
      }
    }
  ],
  
  sentimentByContact: [
    {
      name: 'Alex Johnson',
      sentiment: 0.5,
      trend: getRandomTrend(),
      lastContact: '2023-08-04T14:30:00Z',
      channel: 'email',
      messageCount: 12
    },
    {
      name: 'Jamie Smith',
      sentiment: 0.2,
      trend: getRandomTrend(),
      lastContact: '2023-08-04T13:15:00Z',
      channel: 'slack',
      messageCount: 8
    },
    {
      name: 'Casey Kim',
      sentiment: -0.3,
      trend: getRandomTrend(),
      lastContact: '2023-08-03T11:20:00Z',
      channel: 'meeting',
      messageCount: 5
    },
    {
      name: 'Sam Wilson',
      sentiment: 0.6,
      trend: getRandomTrend(),
      lastContact: '2023-08-04T16:45:00Z',
      channel: 'slack',
      messageCount: 15
    },
    {
      name: 'Taylor Wong',
      sentiment: 0.1,
      trend: getRandomTrend(),
      lastContact: '2023-08-04T09:30:00Z',
      channel: 'email',
      messageCount: 6
    }
  ]
};
