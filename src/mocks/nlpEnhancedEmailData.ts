import { UnifiedData } from '@/types/unified';

export const nlpEnhancedEmailData: UnifiedData = {
  emails: [
    {
      id: '001',
      subject: 'Urgent: Project Milestone Review Needed',
      body: `Hi team,

We need to review the current status of the Phoenix project. There are some critical tasks that require immediate attention. 

Key action items:
1. Complete the backend API integration by Friday
2. Schedule a meeting with the design team to discuss UI improvements
3. Prepare a comprehensive project status report

The project is currently facing some challenges with resource allocation and we need to align on the next steps.

Urgent matters include resolving the authentication module bottleneck and updating the project timeline.

Best regards,
Project Manager`,
      from: 'project.manager@company.com',
      to: ['team@company.com'],
      date: new Date().toISOString(),
      metadata: {
        actionItems: [
          'Complete backend API integration by Friday',
          'Schedule meeting with design team',
          'Prepare project status report'
        ],
        meetingReferences: ['Schedule a meeting with the design team'],
        projectContext: {
          name: 'Phoenix',
          keywords: ['project status', 'milestone', 'resource allocation']
        },
        insights: {
          hasActionItems: true,
          hasMeetings: true,
          hasProjectContext: true,
          isPositive: false,
          isUrgent: true
        },
        nlpInsights: {
          sentiment: {
            type: 'negative',
            score: -2,
            emotionalTones: ['stressed'],
            urgency: 'high'
          },
          intent: {
            primary: 'Project Update',
            secondary: ['Coordination', 'Problem Solving'],
            complexity: 'complex',
            relatedContexts: ['Team Collaboration']
          }
        }
      }
    },
    {
      id: '002',
      subject: 'Great Progress on Customer Onboarding Flow',
      body: `Team,

I'm excited to share some fantastic updates on our customer onboarding project. We've made significant strides in simplifying the user experience and reducing friction.

Key achievements:
- Reduced signup process from 5 to 2 steps
- Implemented seamless social media authentication
- Improved conversion rate by 35%

Next steps:
1. Conduct user testing on the new flow
2. Prepare a detailed analytics report
3. Schedule a demo for the leadership team

Our hard work is really paying off, and I'm proud of how the team has come together to solve this challenge.

Cheers,
Head of Product`,
      from: 'head.of.product@company.com',
      to: ['product.team@company.com'],
      date: new Date().toISOString(),
      metadata: {
        actionItems: [
          'Conduct user testing on new onboarding flow',
          'Prepare detailed analytics report',
          'Schedule demo for leadership team'
        ],
        meetingReferences: ['Schedule a demo for the leadership team'],
        projectContext: {
          name: 'Customer Onboarding',
          keywords: ['user experience', 'conversion rate', 'authentication']
        },
        insights: {
          hasActionItems: true,
          hasMeetings: true,
          hasProjectContext: true,
          isPositive: true,
          isUrgent: false
        },
        nlpInsights: {
          sentiment: {
            type: 'positive',
            score: 3,
            emotionalTones: ['optimistic', 'professional'],
            urgency: 'low'
          },
          intent: {
            primary: 'Project Update',
            secondary: ['Coordination'],
            complexity: 'moderate',
            relatedContexts: ['Team Collaboration']
          }
        }
      }
    }
  ],
  incidents: [],
  calendarEvents: [
    {
      id: 'meeting001',
      title: 'Phoenix Project Milestone Review',
      description: 'Comprehensive review of project status and next steps',
      start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour meeting
      attendees: ['project.manager@company.com', 'team@company.com'],
      location: 'Virtual Meeting'
    }
  ],
  tickets: [],
  generated_at: new Date().toISOString()
};

// Function to generate a brief with the enhanced data
export function generateNLPEnhancedBrief() {
  // Use the existing generateStyledBrief function from your brief generation logic
  import('@/server/briefs/generateBrief').then(({ generateStyledBrief }) => {
    const briefData = generateStyledBrief(nlpEnhancedEmailData, 'mission_brief');
    console.log(JSON.stringify(briefData, null, 2));
    return briefData;
  });
}