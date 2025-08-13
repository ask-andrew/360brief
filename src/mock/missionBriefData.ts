import { BriefStyle } from '../types/brief';

export interface BriefItem {
  id: string;
  type: 'email' | 'calendar';
  title: string;
  summary: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  metadata: {
    from?: string;
    to?: string[];
    date: string;
    time?: string;
    duration?: number;
    location?: string;
  };
}

export const missionBriefData: {
  style: BriefStyle;
  dateRange: string;
  summary: string;
  items: BriefItem[];
  actionItems: string[];
  trends: string[];
} = {
  style: 'mission',
  dateRange: 'August 12-13, 2025',
  summary: 'Critical updates requiring immediate attention on Q3 product launch and team capacity issues.',
  
  items: [
    {
      id: 'email-1',
      type: 'email',
      title: 'URGENT: Q3 Launch Blocked by Engineering',
      summary: 'Engineering reports critical path dependencies that could delay Q3 launch by 2 weeks. Team needs executive decision on scope adjustment.',
      priority: 'high',
      actionRequired: true,
      metadata: {
        from: 'cto@company.com',
        to: ['you@company.com', 'product@company.com'],
        date: '2025-08-13',
        time: '09:15 AM'
      }
    },
    {
      id: 'calendar-1',
      type: 'calendar',
      title: 'Q3 Launch Review with Leadership',
      summary: 'Final review of Q3 launch plan with all department heads. Must present updated timeline and address concerns from engineering.',
      priority: 'high',
      actionRequired: true,
      metadata: {
        date: '2025-08-13',
        time: '2:00 PM',
        duration: 60,
        location: 'Conference Room A'
      }
    },
    {
      id: 'email-2',
      type: 'email',
      title: 'Budget Approval: Engineering Headcount',
      summary: 'HR requests approval for 2 additional senior engineers to address capacity issues. Budget impact: $320k/year.',
      priority: 'high',
      actionRequired: true,
      metadata: {
        from: 'hr@company.com',
        to: ['you@company.com', 'finance@company.com'],
        date: '2025-08-12',
        time: '3:45 PM'
      }
    },
    {
      id: 'calendar-2',
      type: 'calendar',
      title: '1:1 with Marketing Director',
      summary: 'Discuss Q4 campaign strategy and alignment with product roadmap. Need to review proposed messaging.',
      priority: 'medium',
      actionRequired: false,
      metadata: {
        date: '2025-08-14',
        time: '10:00 AM',
        duration: 30,
        location: 'Zoom'
      }
    },
    {
      id: 'email-3',
      type: 'email',
      title: 'Board Meeting Materials Review',
      summary: 'Draft materials for next week\'s board meeting attached for your review. Focus on Q3 projections and risk assessment.',
      priority: 'medium',
      actionRequired: false,
      metadata: {
        from: 'board@company.com',
        to: ['you@company.com'],
        date: '2025-08-12',
        time: '11:30 AM'
      }
    }
  ],
  
  actionItems: [
    'Approve/Deny engineering headcount request by EOD',
    'Review and provide feedback on Q3 launch timeline adjustments',
    'Prepare talking points for board meeting materials review'
  ],
  
  trends: [
    '3+ mentions of engineering capacity issues across communications',
    '2 pending budget approvals requiring attention',
    'Increased urgency around Q3 launch timeline'
  ]
};

export default missionBriefData;
