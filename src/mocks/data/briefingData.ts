import type { BriefingData } from '@/types/briefing';

// Helper function to get dates relative to today
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// Mock data for testing the BriefingDigest component
export const mockBriefingData: BriefingData = {
  generated_at: new Date().toISOString(),
  time_range: {
    start: formatDate(today),
    end: formatDate(nextWeek)
  },
  key_themes: [
    "Q3 revenue projections show 18.7% growth, exceeding targets by 3.2% due to strong APAC performance",
    "Horizon product launch delayed by 12 days (new launch: Sep 15) due to semiconductor supply chain disruptions",
    "Customer satisfaction (CSAT) scores dropped to 82% (from 90% last month) - primary pain points in support response times",
    "Competitor 'NexusTech' launched 'NexusFlow' with 87% feature parity to our flagship product at 20% lower price point",
    "Engineering team velocity increased to 42 story points/sprint (from 35) after implementing CI/CD improvements",
    "New GDPR compliance requirements mandate data processing agreement updates for EU customers by EOM",
    "Sales pipeline shows 28% increase in enterprise deals but 15% longer sales cycles"
  ],
  action_items: [
    {
      id: 'ai-1',
      title: 'Approve final Q3 marketing budget allocation',
      description: 'Marketing team has proposed reallocating 15% of Q3 budget to digital channels based on recent performance metrics. Requires executive sign-off.',
      due_date: formatDate(tomorrow),
      priority: 'high',
      owner: 'Alex Johnson',
      status: 'pending_review',
      related_to: 'Q3 Marketing Strategy',
      estimated_time: '30 minutes',
      dependencies: ['Q3 Performance Report']
    },
    {
      id: 'ai-2',
      title: 'Lead cross-functional sync on Horizon launch adjustments',
      description: 'Coordinate with Product, Marketing, and Support leads to realign launch timeline and communications strategy. Key discussion points: customer communications, partner updates, and revised go-to-market plan.',
      due_date: formatDate(tomorrow),
      priority: 'high',
      owner: 'Sam Lee',
      status: 'in_progress',
      related_to: 'Horizon Product Launch',
      estimated_time: '60 minutes',
      dependencies: ['Supply Chain Update']
    },
    {
      id: 'ai-3',
      title: 'Finalize board presentation for Q3 review',
      description: 'Incorporate latest financials, product roadmap updates, and competitive analysis. Focus on: revenue growth strategy, operational efficiency metrics, and risk mitigation plans.',
      due_date: formatDate(nextWeek),
      priority: 'medium',
      owner: 'Jordan Smith',
      status: 'not_started',
      related_to: 'Q3 Board Meeting',
      estimated_time: '3 hours',
      dependencies: ['Final Q3 Financials']
    },
    {
      id: 'ai-4',
      title: 'Review and sign updated data processing agreements',
      description: 'Legal team has updated DPAs to comply with new GDPR requirements. Need to review changes and sign before they can be sent to EU customers.',
      due_date: formatDate(tomorrow),
      priority: 'high',
      owner: 'Taylor Wilson',
      status: 'pending_review',
      related_to: 'GDPR Compliance',
      estimated_time: '45 minutes',
      dependencies: ['Legal Review Complete']
    },
    {
      id: 'ai-5',
      title: 'Approve hiring plan for Q4 engineering team expansion',
      description: 'Engineering leadership has proposed adding 3 senior backend engineers and 2 frontend developers to accelerate feature development. Budget impact: $1.2M annualized.',
      due_date: formatDate(nextWeek),
      priority: 'high',
      owner: 'Jordan Smith',
      status: 'not_started',
      related_to: 'Team Growth',
      estimated_time: '1 hour',
      dependencies: ['Q3 Financials Approved']
    },
    {
      id: 'ai-5b',
      title: 'Keynote speech at TechForward conference',
      description: '30-minute presentation on "The Future of AI in Enterprise" at 2:00 PM. Need to review final slides with Comms team by EOD.',
      due_date: formatDate(tomorrow),
      priority: 'high',
      owner: 'Alex Johnson',
      status: 'in_progress',
      related_to: 'Public Speaking',
      estimated_time: '2 hours',
      dependencies: ['Slides Draft']
    },
    {
      id: 'ai-6',
      title: 'Review and provide feedback on new hire candidates',
      description: 'HR has shortlisted 5 candidates for the Senior Engineering Manager role. Each interview is 45 minutes with 15-minute breaks in between.',
      due_date: formatDate(nextWeek),
      priority: 'medium',
      owner: 'Jordan Smith',
      status: 'not_started',
      related_to: 'Hiring',
      estimated_time: '5 hours',
      dependencies: ['Interview Schedule']
    }
  ],
  blockers: [
    {
      id: 'blocker-1',
      title: 'Critical API rate limits impacting data sync (90% threshold reached)',
      owner: 'Dev Team',
      status: 'unresolved',
      impact: 'high',
      description: 'Our primary data provider has throttled our API calls after unexpected surge in usage. Current syncs are failing 65% of requests, affecting reporting accuracy.',
      first_reported: formatDate(yesterday),
      escalation_path: ['CTO', 'VP Engineering'],
      potential_solutions: [
        'Implement exponential backoff in sync service',
        'Request higher rate limit from provider',
        'Cache frequently accessed data'
      ]
    },
    {
      id: 'blocker-2',
      title: 'Vendor contract renewal delayed - potential service disruption',
      owner: 'Legal Team',
      status: 'in_progress',
      impact: 'high',
      description: 'Contract renewal with CloudScale (our primary infrastructure provider) is 14 days past due. Risk of 30% price increase if not resolved by month end.',
      first_reported: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      escalation_path: ['CFO', 'General Counsel'],
      potential_solutions: [
        'Approve revised terms with 15% increase',
        'Begin migration to alternative provider',
        'Negotiate shorter term extension'
      ]
    },
    {
      id: 'blocker-3',
      title: 'Security audit findings require immediate attention',
      owner: 'Security Team',
      status: 'unresolved',
      impact: 'critical',
      description: 'Penetration test revealed 3 critical vulnerabilities requiring patching within 7 days to maintain SOC 2 compliance.',
      first_reported: formatDate(today),
      escalation_path: ['CISO', 'VP Engineering'],
      potential_solutions: [
        'Deploy emergency patch release',
        'Temporarily disable affected features',
        'Implement WAF rules as temporary mitigation'
      ]
    },
    {
      id: 'bl-1',
      title: 'API integration delayed by third-party vendor',
      status: 'in_progress',
      impact: 'high',
      owner: 'Taylor Chen'
    },
    {
      id: 'bl-2',
      title: 'Design system update causing UI inconsistencies',
      status: 'unresolved',
      impact: 'medium',
      owner: 'Morgan Taylor'
    }
  ],
  kudos: [
    {
      id: 'kudo-1',
      message: 'Outstanding leadership during the client crisis last week. Your calm decision-making saved a $2M annual contract and strengthened our relationship with TechCorp.',
      from: 'Sarah Chen, VP Client Success',
      date: formatDate(yesterday),
      category: 'Leadership',
      impact: 'Saved key client relationship during service disruption',
      related_to: 'TechCorp Account'
    },
    {
      id: 'kudo-2',
      message: 'Your innovative solution to the data pipeline issue improved processing speed by 300%! The engineering team is already seeing the benefits in reduced compute costs.',
      from: 'Mike Rodriguez, CTO',
      date: formatDate(yesterday),
      category: 'Innovation',
      impact: 'Reduced monthly cloud costs by ~$15K',
      related_to: 'Data Pipeline Optimization'
    },
    {
      id: 'kudo-3',
      message: 'The team really appreciated your mentorship during the hackathon. Your feedback helped shape three potential product features we\'re now considering for Q4!',
      from: 'Engineering Team',
      date: formatDate(today),
      category: 'Mentorship',
      impact: 'Boosted team morale and innovation',
      related_to: 'Q3 Hackathon'
    },
    {
      id: 'ku-1',
      message: 'Great job leading the client call yesterday! The client was very impressed with our presentation.',
      from: 'Casey Kim',
      date: formatDate(today)
    },
    {
      id: 'ku-2',
      message: 'Thanks for stepping in to help with the production issue over the weekend. Your dedication is noticed!',
      from: 'Jamie Wilson',
      date: formatDate(new Date(today.getTime() - 86400000)) // yesterday
    }
  ],
  project_updates: [
    {
      id: 'project-1',
      name: 'Horizon Platform Launch',
      status: 'at_risk',
      progress: 78,
      last_updated: formatDate(today),
      owner: 'Product Team',
      description: 'Next-gen analytics platform with AI-powered insights',
      key_achievements: [
        'Core analytics engine completed',
        'Successfully onboarded 15 beta customers',
        'Achieved 99.9% uptime in stress tests'
      ],
      risks: [
        'Backend performance degrades at 10K concurrent users',
        'Mobile app integration delayed by 2 weeks'
      ],
      next_milestone: 'Public Beta Launch',
      milestone_date: '2023-10-15',
      budget_status: '5% under budget',
      team_morale: 'high',
      dependencies: ['Cloud Infrastructure', 'Security Review']
    },
    {
      id: 'project-2',
      name: 'Customer Data Platform Migration',
      status: 'on_track',
      progress: 92,
      last_updated: formatDate(today),
      owner: 'Data Team',
      description: 'Transition to new customer data infrastructure',
      key_achievements: [
        'Migrated 12TB of historical data',
        'Reduced query times by 65%',
        'Trained all teams on new platform'
      ],
      risks: [
        'Legacy system decommissioning behind schedule'
      ],
      next_milestone: 'Full Cutover',
      milestone_date: '2023-09-30',
      budget_status: 'on track',
      team_morale: 'medium',
      dependencies: ['QA Sign-off', 'Customer Comms']
    },
    {
      id: 'project-3',
      name: 'Global Partner Program',
      status: 'behind',
      progress: 35,
      last_updated: formatDate(yesterday),
      owner: 'Business Development',
      description: 'Launch partner ecosystem with 10+ integration partners',
      key_achievements: [
        'Signed 4 of 10 target partners',
        'Developed partner portal MVP'
      ],
      risks: [
        'Slow partner onboarding due to legal reviews',
        'Resource constraints in partner support'
      ],
      next_milestone: 'Beta Launch with First Partners',
      milestone_date: '2023-10-01',
      budget_status: '10% over budget',
      team_morale: 'low',
      dependencies: ['Legal Approvals', 'Partner Training']
    },
    {
      id: 'pu-1',
      name: 'Mobile App Redesign',
      status: 'on_track',
      progress: 75,
      last_updated: formatDate(today),
      owner: 'Riley Chen'
    },
    {
      id: 'pu-2',
      name: 'Data Migration',
      status: 'at_risk',
      progress: 40,
      last_updated: formatDate(today),
      owner: 'Jordan Smith'
    },
    {
      id: 'pu-3',
      name: 'New Feature Rollout',
      status: 'behind',
      progress: 20,
      last_updated: formatDate(today),
      owner: 'Alex Johnson'
    }
  ]
};

export default mockBriefingData;
