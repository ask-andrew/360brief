import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchUnifiedData } from '@/services/unifiedDataService';

interface EmailData {
  id: string;
  subject: string;
  body: string;
  sender: string;
  to?: string[];
  date?: string;
  labels?: string[];
  isRead?: boolean;
  metadata?: {
    insights?: {
      priority?: string;
      hasActionItems?: boolean;
      isUrgent?: boolean;
      category?: string;
      sentiment?: string;
      actionItems?: string[];
      keyTopics?: string[];
      responseRequired?: boolean;
    };
  };
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🔍 Radar API: Fetching data for user ${user.id}`);

    // Try to get real data first
    let emails: EmailData[] = [];
    try {
      const unifiedData = await fetchUnifiedData(user.id, {
        useCase: 'analytics',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        endDate: new Date().toISOString()
      });

      // Convert unified data emails to our EmailData format
      const unifiedEmails = (unifiedData.emails as any[]) || [];
      emails = unifiedEmails.map(email => ({
        id: email.id || '',
        subject: email.subject || '',
        body: email.body || '',
        sender: email.from || email.sender || '',
        to: Array.isArray(email.to) ? email.to : [email.to || ''],
        date: email.date || '',
        labels: email.labels || [],
        isRead: email.isRead || false,
        metadata: email.metadata || {}
      }));

      console.log(`✅ Radar API: Got ${emails.length} real emails from unified data`);

      // Filter for actionable emails only (those with insights)
      const actionableEmails = emails.filter(email =>
        email.metadata?.insights?.hasActionItems ||
        email.metadata?.insights?.isUrgent ||
        email.metadata?.insights?.priority === 'high'
      );

      if (actionableEmails.length > 0) {
        emails = actionableEmails.slice(0, 20); // Limit to 20 most actionable emails
        console.log(`🎯 Radar API: Using ${emails.length} actionable emails for analysis`);
      } else if (unifiedEmails.length > 0) {
        emails = emails.slice(0, 15); // Fallback to recent emails
        console.log(`📧 Radar API: Using ${emails.length} recent emails for analysis`);
      }

    } catch (error) {
      console.log(`⚠️ Radar API: Failed to fetch real data:`, error);
    }

    // If no real data available, use demo data for showcase
    if (emails.length === 0) {
      console.log(`📊 Radar API: No real data available, using demo data for showcase`);
      emails = [
        // Project Delivery issues - More specific scenarios
        {
          id: 'demo-proj-1',
          subject: 'Authentication module blocked - Sprint 3 delay',
          body: 'The development team is stuck on the authentication module. We need help from the backend team to resolve the blocking issues that are delaying our sprint. This is impacting our delivery timeline.',
          sender: 'john.doe@company.com',
          metadata: {
            insights: {
              hasActionItems: true,
              isUrgent: true,
              priority: 'high',
              category: 'project-delivery'
            }
          }
        },
        {
          id: 'demo-proj-2',
          subject: 'Critical dependency delay in Q4 product launch',
          body: 'External vendor InnovateX is experiencing production issues causing a ~week delay in our critical component delivery. This could impact our Q4 launch schedule.',
          sender: 'sarah.manager@company.com',
          metadata: {
            insights: {
              hasActionItems: true,
              isUrgent: true,
              priority: 'high',
              category: 'project-delivery'
            }
          }
        },

        // Business Growth opportunities - Specific opportunities
        {
          id: 'demo-growth-1',
          subject: 'European market expansion opportunity - 40% potential',
          body: 'Competitor analysis reveals a gap in the European market for our SaaS solution. Early customer feedback suggests strong demand with potential 40% market share capture.',
          sender: 'mike.lead@company.com',
          metadata: {
            insights: {
              hasActionItems: true,
              isUrgent: false,
              priority: 'medium',
              category: 'business-growth'
            }
          }
        },

        // Customer Success issues - Real customer scenarios
        {
          id: 'demo-customer-1',
          subject: 'DataCorp P0 escalation - 50+ users affected',
          body: 'Enterprise customer DataCorp is experiencing critical data loss affecting 50+ users. This is a high-severity incident requiring immediate engineering response.',
          sender: 'support.lead@company.com',
          metadata: {
            insights: {
              hasActionItems: true,
              isUrgent: true,
              priority: 'high',
              category: 'customer-success'
            }
          }
        },
        {
          id: 'demo-customer-2',
          subject: 'TechGiant contract renewal at risk - 30 days',
          body: 'Key client TechGiant is expressing dissatisfaction with response times. Contract renewal in 30 days - need executive intervention to prevent churn.',
          sender: 'account.manager@company.com',
          metadata: {
            insights: {
              hasActionItems: true,
              isUrgent: true,
              priority: 'high',
              category: 'customer-success'
            }
          }
        },

        // Team Dynamics issues - Specific team problems
        {
          id: 'demo-team-1',
          subject: 'Frontend-backend communication breakdown',
          body: 'Engineering team is experiencing communication breakdown between frontend and backend teams. Multiple projects competing for same resources causing delays.',
          sender: 'eng.manager@company.com',
          metadata: {
            insights: {
              hasActionItems: true,
              isUrgent: false,
              priority: 'medium',
              category: 'team-dynamics'
            }
          }
        },

        // Resource Management issues - Capacity problems
        {
          id: 'demo-resource-1',
          subject: 'Team capacity at 120% - Q4 initiatives at risk',
          body: 'Current team capacity at 120% utilization. Multiple high-priority projects competing for limited resources. Need to prioritize or acquire additional capacity.',
          sender: 'hr.director@company.com',
          metadata: {
            insights: {
              hasActionItems: true,
              isUrgent: true,
              priority: 'high',
              category: 'resource-management'
            }
          }
        },

        // External Factors - Regulatory compliance
        {
          id: 'demo-external-1',
          subject: 'GDPR compliance deadline - 90 days remaining',
          body: 'Recent regulatory updates in data privacy laws may impact our product roadmap. Legal team recommends immediate compliance assessment.',
          sender: 'legal.counsel@company.com',
          metadata: {
            insights: {
              hasActionItems: true,
              isUrgent: false,
              priority: 'medium',
              category: 'external-factors'
            }
          }
        }
      ];
    }

    const riskRadarServiceUrl = process.env.RADAR_API_URL;
    if (!riskRadarServiceUrl) {
      throw new Error('RADAR_API_URL is not defined');
    }

    console.log(`🚀 Radar API: Sending ${emails.length} emails to radar service`);

    const response = await fetch(`${riskRadarServiceUrl}/generate-radar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails }),
    });

    if (!response.ok) {
      throw new Error(`Risk radar service failed with status: ${response.status}`);
    }

    const radarData = await response.json();
    console.log(`✅ Radar API: Received ${radarData.length} radar insights`);

    return NextResponse.json(radarData);

  } catch (e: any) {
    console.error('Radar GET failed', { message: e?.message, stack: e?.stack });
    return NextResponse.json({ error: e?.message ?? 'Failed to build radar' }, { status: 500 });
  }
}
