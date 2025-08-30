// Test scenarios for enhanced brief generation
import { UnifiedData } from '@/types/unified';

export const crisisScenario: UnifiedData = {
  emails: [
    {
      id: 'email-1',
      subject: 'URGENT: TechFlow Corp Service Down - CEO Escalation',
      body: 'Service outage affecting all users. CEO David Kim demanding immediate response. Revenue at risk.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      from: { email: 'support@techflow.com', name: 'TechFlow Support' },
      to: [{ email: 'ops@company.com', name: 'Operations Team' }],
      priority: 'high',
      labels: ['crisis', 'escalation'],
    },
    {
      id: 'email-2', 
      subject: 'Customer Complaints Flooding In - TechFlow Outage',
      body: 'Multiple customers threatening to cancel contracts due to ongoing service disruption.',
      date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      from: { email: 'cs@company.com', name: 'Customer Success' },
      to: [{ email: 'leadership@company.com', name: 'Leadership Team' }],
      priority: 'high',
      labels: ['churn-risk'],
    }
  ],
  incidents: [
    {
      id: 'incident-1',
      title: 'TechFlow Corp Database Cluster Failure',
      description: 'Primary database cluster failure causing cascading system failures',
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      endedAt: null, // Still ongoing
      severity: 'critical',
      status: 'investigating',
      owner: 'Mike Chen',
      affectedUsers: 15000,
      arrAtRisk: 2400000,
    }
  ],
  tickets: [
    {
      id: 'ticket-1',
      title: 'Implement Database Failover Mechanism',
      description: 'Critical infrastructure improvement to prevent future outages',
      priority: 'p0',
      status: 'open',
      owner: 'Sarah Johnson',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday (overdue)
    },
    {
      id: 'ticket-2', 
      title: 'Emergency Communication Protocol',
      description: 'Establish automated customer notification system for incidents',
      priority: 'p1',
      status: 'blocked',
      owner: 'Lisa Rodriguez',
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    },
    {
      id: 'ticket-3',
      title: 'TechFlow Account Recovery Plan',
      description: 'Develop retention strategy and service credits framework',
      priority: 'p0',
      status: 'in_progress',
      owner: 'Alex Thompson',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    }
  ],
  calendarEvents: [
    {
      id: 'event-1',
      title: 'EMERGENCY: TechFlow Crisis Response Call',
      description: 'Executive alignment on incident response and customer retention',
      start: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
      end: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'ceo@company.com', name: 'CEO' },
        { email: 'cto@company.com', name: 'CTO' },
        { email: 'mike.chen@company.com', name: 'Mike Chen' },
        { email: 'lisa.rodriguez@company.com', name: 'Lisa Rodriguez' }
      ],
    },
    {
      id: 'event-2',
      title: 'Board Meeting - Q4 Review',
      description: 'Quarterly business review with board members',
      start: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
      end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'board@company.com', name: 'Board Members' }
      ],
    }
  ]
};

export const normalOperationsScenario: UnifiedData = {
  emails: [
    {
      id: 'email-1',
      subject: 'Weekly Project Status Update',
      body: 'All projects on track. New feature deployment scheduled for Friday.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      from: { email: 'pm@company.com', name: 'Project Manager' },
      to: [{ email: 'team@company.com', name: 'Team' }],
      priority: 'normal',
      labels: ['status-update'],
    },
    {
      id: 'email-2',
      subject: 'New Customer Onboarding - Acme Corp', 
      body: 'Successful onboarding of new enterprise client. $500K ARR.',
      date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      from: { email: 'sales@company.com', name: 'Sales Team' },
      to: [{ email: 'leadership@company.com', name: 'Leadership' }],
      priority: 'normal',
      labels: ['opportunity', 'expansion'],
    }
  ],
  incidents: [],
  tickets: [
    {
      id: 'ticket-1',
      title: 'Upgrade Authentication System',
      description: 'Implement OAuth 2.0 for better security',
      priority: 'p2',
      status: 'in_progress',
      owner: 'Dev Team Alpha',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    },
    {
      id: 'ticket-2',
      title: 'Performance Optimization - API Response Times',
      description: 'Reduce average API response time by 30%',
      priority: 'p2',
      status: 'open',
      owner: 'Performance Team',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    }
  ],
  calendarEvents: [
    {
      id: 'event-1',
      title: 'Sprint Planning Meeting',
      description: 'Plan next sprint backlog and assignments',
      start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'team@company.com', name: 'Development Team' }
      ],
    },
    {
      id: 'event-2',
      title: 'Customer Success Review',
      description: 'Review customer health scores and expansion opportunities',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'cs@company.com', name: 'Customer Success' },
        { email: 'sales@company.com', name: 'Sales' }
      ],
    }
  ]
};

export const highActivityScenario: UnifiedData = {
  emails: [
    {
      id: 'email-1',
      subject: 'Proposal Request - Fortune 500 Expansion',
      body: 'Major enterprise opportunity requiring immediate proposal. Potential $5M ARR.',
      date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      from: { email: 'enterprise@prospect.com', name: 'Enterprise Prospect' },
      to: [{ email: 'sales@company.com', name: 'Sales Team' }],
      priority: 'high',
      labels: ['opportunity', 'proposal'],
    },
    {
      id: 'email-2',
      subject: 'Partnership Opportunity - Strategic Integration',
      body: 'Technology partnership proposal from industry leader.',
      date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      from: { email: 'partnerships@bigtech.com', name: 'BigTech Partnerships' },
      to: [{ email: 'bd@company.com', name: 'Business Development' }],
      priority: 'high',
      labels: ['partnership', 'opportunity'],
    },
    {
      id: 'email-3',
      subject: 'Product Launch Feedback - Overwhelming Positive Response',
      body: 'New feature launch exceeded expectations. 40% adoption rate in first week.',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      from: { email: 'product@company.com', name: 'Product Team' },
      to: [{ email: 'all@company.com', name: 'All Hands' }],
      priority: 'normal',
      labels: ['launch', 'success'],
    }
  ],
  incidents: [],
  tickets: [
    {
      id: 'ticket-1',
      title: 'Scale Infrastructure for Enterprise Client',
      description: 'Prepare infrastructure for 100K+ user onboarding',
      priority: 'p1',
      status: 'in_progress',
      owner: 'Infrastructure Team',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    }
  ],
  calendarEvents: [
    {
      id: 'event-1',
      title: 'Fortune 500 Prospect Demo',
      description: 'Executive demo for potential $5M client',
      start: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'ceo@company.com', name: 'CEO' },
        { email: 'cto@company.com', name: 'CTO' },
        { email: 'sales@company.com', name: 'Sales Lead' }
      ],
    },
    {
      id: 'event-2',
      title: 'Product Launch Review Meeting',
      description: 'Analyze launch metrics and plan next iterations',
      start: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
      end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'product@company.com', name: 'Product Team' },
        { email: 'marketing@company.com', name: 'Marketing Team' }
      ],
    },
    {
      id: 'event-3',
      title: 'Partnership Strategy Session',
      description: 'Strategic planning for BigTech partnership',
      start: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // 7 hours from now
      end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'bd@company.com', name: 'Business Development' },
        { email: 'legal@company.com', name: 'Legal Team' }
      ],
    },
    {
      id: 'event-4',
      title: 'All Hands - Company Update',
      description: 'Company-wide meeting on recent successes and roadmap',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'all@company.com', name: 'All Employees' }
      ],
    },
    {
      id: 'event-5',
      title: 'Investor Update Call',
      description: 'Monthly investor update on metrics and growth',
      start: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Tomorrow afternoon
      end: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
      attendees: [
        { email: 'investors@company.com', name: 'Investor Relations' }
      ],
    }
  ]
};