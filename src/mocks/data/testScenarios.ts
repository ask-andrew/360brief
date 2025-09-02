// Test scenarios for enhanced brief generation
import { UnifiedData } from '@/types/unified';

export const crisisScenario: UnifiedData = {
  generated_at: new Date().toISOString(),
  emails: [
    {
      id: 'email-1',
      subject: 'URGENT: TechFlow Corp Service Down - CEO Escalation',
      body: 'Service outage affecting all users. CEO David Kim demanding immediate response. Revenue at risk.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      from: 'support@techflow.com',
      to: ['ops@company.com'],
      labels: ['crisis', 'escalation'],
    },
    {
      id: 'email-2', 
      subject: 'Customer Complaints Flooding In - TechFlow Outage',
      body: 'Multiple customers threatening to cancel contracts due to ongoing service disruption.',
      date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      from: 'cs@company.com',
      to: ['leadership@company.com'],
      labels: ['churn-risk'],
    },
    {
      id: 'email-3',
      subject: 'Re: TechFlow Crisis Response - Infrastructure Team Update',
      body: 'Database cluster partially restored. Estimated 2 hours to full recovery. Preparing detailed post-mortem.',
      date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      from: 'infrastructure@company.com',
      to: ['leadership@company.com', 'ops@company.com'],
      labels: ['incident-update'],
    },
    {
      id: 'email-4',
      subject: 'URGENT: Legal Review Needed - TechFlow Service Credits',
      body: 'Need immediate legal approval for $240K in service credits to retain TechFlow account.',
      date: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      from: 'legal@company.com',
      to: ['ceo@company.com', 'cfo@company.com'],
      labels: ['legal', 'financial-impact'],
    }
  ],
  incidents: [
    {
      id: 'incident-1',
      title: 'TechFlow Corp Database Cluster Failure',
      description: 'Primary database cluster failure causing cascading system failures',
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      endedAt: undefined, // Still ongoing
      severity: 'sev1',
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
      title: '🚨 EMERGENCY: TechFlow Crisis Response Call',
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
  generated_at: new Date().toISOString(),
  emails: [
    {
      id: 'email-1',
      subject: 'Re: Q4 Marketing Campaign - Budget Approval Needed',
      body: 'Hi Sarah, thanks for the detailed proposal. The $15K budget looks reasonable for the digital campaign. Can you schedule a call with finance this week to finalize? Let me know your availability. Best, Mike',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      from: 'mike.chen@acmecorp.com',
      to: ['sarah.martinez@yourcompany.com'],
      labels: ['action-required', 'budget'],
    },
    {
      id: 'email-2',
      subject: 'Client Check-in: Zenith Solutions Implementation',
      body: 'Good morning! Quick update on the Zenith Solutions project. Phase 1 completed successfully - they\'re very happy with the integration. Phase 2 kickoff meeting scheduled for next Tuesday at 2 PM. They mentioned interest in expanding scope. Will send pre-meeting agenda by Friday.',
      date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      from: 'alex.rodriguez@yourcompany.com',
      to: ['sarah.martinez@yourcompany.com', 'team@yourcompany.com'],
      labels: ['client-success', 'project-update'],
    },
    {
      id: 'email-3',
      subject: 'Industry Report: SaaS Growth Trends 2024',
      body: 'The latest industry report shows 23% growth in our sector. Key insights: AI integration is driving adoption, customer retention improving with better onboarding. Recommended reading before next week\'s strategy meeting. Full report attached.',
      date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      from: 'insights@techresearch.com',
      to: ['sarah.martinez@yourcompany.com'],
      labels: ['research', 'strategy'],
    },
    {
      id: 'email-4',
      subject: 'Team Coffee Chat - New Hire Introduction',
      body: 'Hey everyone! Excited to introduce our new marketing coordinator, Jamie Park, who joins us next Monday. Let\'s do a team coffee at 3 PM in the main conference room. Jamie has great experience with content marketing and will be leading our blog strategy.',
      date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      from: 'lisa.thompson@yourcompany.com',
      to: ['team@yourcompany.com'],
      labels: ['team-building', 'new-hire'],
    },
    {
      id: 'email-5',
      subject: 'Vendor Invoice Approval - CloudHost Services',
      body: 'Hi Sarah, attached is the monthly invoice from CloudHost for $2,847. Usage was higher due to the product launch traffic spike. Everything looks accurate. Please approve when convenient. Thanks, David',
      date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      from: 'david.kim@yourcompany.com',
      to: ['sarah.martinez@yourcompany.com'],
      labels: ['approval-needed', 'finance'],
    },
    {
      id: 'email-6',
      subject: 'Conference Speaker Invitation - TechSummit 2024',
      body: 'Dear Sarah Martinez, we were impressed by your recent article on customer success metrics. Would you be interested in speaking at TechSummit 2024 (June 15-17, Austin)? The session would be 30 minutes on "Data-Driven Customer Success." Travel and accommodation covered.',
      date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      from: 'speakers@techsummit.com',
      to: ['sarah.martinez@yourcompany.com'],
      labels: ['opportunity', 'speaking'],
    },
    {
      id: 'email-7',
      subject: 'Weekly Newsletter - Customer Success Insights',
      body: 'This week\'s top stories: 1) How to reduce churn with proactive outreach 2) New case study: 40% improvement in NPS scores 3) Upcoming webinar: Advanced segmentation strategies. Click to read more.',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      from: 'newsletter@customersuccess.io',
      to: ['sarah.martinez@yourcompany.com'],
      labels: ['newsletter', 'learning'],
    },
    {
      id: 'email-8',
      subject: 'Lunch Meeting Confirmation - Partnership Discussion',
      body: 'Hi Sarah, confirming our lunch meeting tomorrow (Thursday) at 12:30 PM at The Corner Bistro. Looking forward to discussing the potential partnership between our companies. I\'ll bring the proposal draft we discussed.',
      date: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      from: 'jennifer.wong@partnerco.com',
      to: ['sarah.martinez@yourcompany.com'],
      labels: ['meeting-confirmation', 'partnership'],
    }
  ],
  incidents: [],
  tickets: [
    {
      id: 'ticket-1',
      title: 'Complete Q4 Security Audit Requirements',
      description: 'Finalize SOC 2 compliance documentation and security controls review',
      priority: 'p1',
      status: 'in_progress',
      owner: 'Security Team',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    },
    {
      id: 'ticket-2',
      title: 'Acme Corp Integration Setup',
      description: 'Configure API access and onboarding flow for new $500K client',
      priority: 'p1',
      status: 'open',
      owner: 'Integration Team',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    },
    {
      id: 'ticket-3',
      title: 'Upgrade Authentication System',
      description: 'Implement OAuth 2.0 for better security',
      priority: 'p2',
      status: 'in_progress',
      owner: 'Dev Team Alpha',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    },
    {
      id: 'ticket-4',
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
  generated_at: new Date().toISOString(),
  emails: [
    {
      id: 'email-1',
      subject: 'Proposal Request - Fortune 500 Expansion',
      body: 'Major enterprise opportunity requiring immediate proposal. Potential $5M ARR.',
      date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      from: 'enterprise@prospect.com',
      to: ['sales@company.com'],
      labels: ['opportunity', 'proposal'],
    },
    {
      id: 'email-2',
      subject: 'Partnership Opportunity - Strategic Integration',
      body: 'Technology partnership proposal from industry leader.',
      date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      from: 'partnerships@bigtech.com',
      to: ['bd@company.com'],
      labels: ['partnership', 'opportunity'],
    },
    {
      id: 'email-3',
      subject: 'Product Launch Feedback - Overwhelming Positive Response',
      body: 'New feature launch exceeded expectations. 40% adoption rate in first week. TechCrunch wants to interview CEO.',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      from: 'product@company.com',
      to: ['all@company.com'],
      labels: ['launch', 'success'],
    },
    {
      id: 'email-4',
      subject: 'Series B Funding - Investor Interest Heating Up',
      body: 'Multiple VCs expressing strong interest after product launch. Scheduling term sheet discussions for next week.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      from: 'finance@company.com',
      to: ['ceo@company.com', 'cofounders@company.com'],
      labels: ['funding', 'opportunity'],
    },
    {
      id: 'email-5',
      subject: 'Enterprise Pipeline Update - Record Q4',
      body: 'Q4 enterprise pipeline now at $12M. Sales team requesting additional resources to close before year-end.',
      date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      from: 'sales@company.com',
      to: ['leadership@company.com'],
      labels: ['pipeline', 'growth'],
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
    },
    {
      id: 'ticket-2',
      title: 'Hire Additional Sales Engineers',
      description: 'Recruit 3 senior sales engineers to handle enterprise pipeline growth',
      priority: 'p1',
      status: 'open',
      owner: 'HR Team',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    },
    {
      id: 'ticket-3',
      title: 'Prepare Series B Documentation',
      description: 'Finalize pitch deck, financials, and legal docs for funding round',
      priority: 'p0',
      status: 'in_progress',
      owner: 'Finance Team',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
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