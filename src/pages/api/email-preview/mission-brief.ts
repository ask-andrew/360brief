import { NextApiRequest, NextApiResponse } from 'next';
import { digestGenerator } from '@/services/email/digestGenerator';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * API endpoint to preview the Mission Brief email template
 * Example: /api/email-preview/mission-brief?style=concise
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Received request with query:', req.query);
    
    const style = (req.query.style as 'concise' | 'detailed' | undefined) || 'concise';
    
    if (!['concise', 'detailed'].includes(style)) {
      console.error('Invalid style parameter:', style);
      return res.status(400).json({ 
        error: 'Invalid style parameter', 
        message: 'Style must be either "concise" or "detailed"' 
      });
    }
    
    // Sample data for demonstration
    const sampleData = {
      subject: 'Project Orion: Critical Update',
      summary: 'Project Orion is facing critical delays that require immediate attention.',
      situation: {
        summary: 'Project Orion is 7 days behind schedule due to critical API dependency failures.',
        detailed: 'The integration with the CloudSync API has encountered unexpected rate limiting and authentication issues, causing significant delays in our development timeline. The team has been working around the clock to resolve these issues, but we need executive direction to proceed.',
        metrics: [
          { value: '7 days', label: 'Behind Schedule' },
          { value: '3', label: 'Blocked Tasks' },
          { value: 'High', label: 'Priority' }
        ]
      },
      action: {
        description: 'Approve additional resources for the backend team to address the API integration issues immediately.',
        priority: 'High',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        owners: ['Alex Chen (Tech Lead)', 'Jamie Smith (Backend)']
      },
      impact: {
        summary: 'Failure to resolve these issues could delay our Q3 product launch by 2-3 weeks.',
        overview: 'The current delays put our Q3 revenue targets at risk and could impact our Series B fundraising timeline. Based on current projections, we stand to lose approximately $2M in potential revenue if we miss the launch window.',
        metrics: [
          { label: 'Revenue at Risk', value: '$2M', color: '#DC2626' },
          { label: 'Users Impacted', value: '15K', color: '#D97706' },
          { label: 'Timeline Impact', value: '2-3 weeks', color: '#B45309' }
        ]
      },
      updates: [
        {
          title: 'API Integration Blockers',
          status: 'critical',
          description: 'CloudSync API authentication failing for high-volume requests',
          details: 'The vendor has acknowledged the issue but requires 48 hours to implement a fix on their end.',
          metrics: [
            { label: 'Failure Rate', value: '87%' },
            { label: 'Outage Duration', value: '18h' }
          ]
        },
        {
          title: 'Team Capacity',
          status: 'warning',
          description: 'Backend team at 110% capacity',
          details: 'Team has been working overtime for the past week. Risk of burnout increasing.',
          metrics: [
            { label: 'Weekly Hours', value: '65h' },
            { label: 'Velocity', value: '-15%' }
          ]
        },
        {
          title: 'Contingency Plan',
          status: 'normal',
          description: 'Fallback implementation in progress',
          details: 'Temporary solution being developed while we wait for vendor fix.',
          metrics: [
            { label: 'ETA', value: '36h' },
            { label: 'Confidence', value: 'High' }
          ]
        }
      ],
      nextSteps: [
        'Approve additional resources for backend team',
        'Schedule emergency sync with CloudSync account team',
        'Prepare comms for potential timeline impact',
        'Review contingency plan with product team'
      ],
      cta: {
        text: 'View Full Report',
        url: 'https://app.360brief.com/projects/orion/dashboard'
      },
      secondaryCta: {
        text: 'Join Emergency Sync',
        url: 'https://meet.google.com/abc-xyz-123'
      }
    };

    console.log('Generating digest with style:', style);
    
    const digest = await digestGenerator.generateDigest(sampleData, {
      style: 'mission-brief',
      detailLevel: style
    });

    console.log('Successfully generated digest');
    
    // Set headers to return HTML
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(digest.html);
  } catch (error) {
    console.error('Error generating email preview:');
    console.error(error);
    
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      return res.status(500).json({ 
        error: 'Failed to generate email preview',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate email preview',
      message: 'An unknown error occurred'
    });
  }
}
