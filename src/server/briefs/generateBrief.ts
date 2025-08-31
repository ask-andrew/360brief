import { BriefingData, ActionItem, Metric, Event as BriefEvent, Theme } from '@/types/briefing';
import { UnifiedData, IncidentItem, TicketItem, CalendarEventItem } from '@/types/unified';

function iso(date: Date | string): string {
  return typeof date === 'string' ? date : date.toISOString();
}

function durationHours(incident: IncidentItem): number | null {
  if (!incident.endedAt) return null;
  const start = new Date(incident.startedAt).getTime();
  const end = new Date(incident.endedAt).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
}

function pickTimeRange(unified: UnifiedData): { start: string; end: string } | undefined {
  const times: number[] = [];
  unified.emails.forEach(e => times.push(new Date(e.date).getTime()));
  unified.incidents.forEach(i => {
    times.push(new Date(i.startedAt).getTime());
    if (i.endedAt) times.push(new Date(i.endedAt).getTime());
  });
  unified.calendarEvents.forEach(c => {
    times.push(new Date(c.start).getTime());
    times.push(new Date(c.end).getTime());
  });
  unified.tickets.forEach(t => {
    if (t.dueDate) times.push(new Date(t.dueDate).getTime());
  });
  if (!times.length) return undefined;
  const start = new Date(Math.min(...times));
  const end = new Date(Math.max(...times));
  return { start: iso(start), end: iso(end) };
}

function buildMetrics(unified: UnifiedData): Metric[] {
  const metrics: Metric[] = [];
  
  // Incident-related metrics
  const arrAtRisk = unified.incidents.reduce((sum, i) => sum + (i.arrAtRisk ?? 0), 0);
  const affectedUsers = unified.incidents.reduce((sum, i) => sum + (i.affectedUsers ?? 0), 0);
  const activeIncidents = unified.incidents.filter(i => !i.endedAt).length;
  const longestIncident = unified.incidents
    .map(durationHours)
    .filter((h): h is number => h !== null)
    .sort((a, b) => b - a)[0];

  if (arrAtRisk) metrics.push({ name: 'ARR at Risk', value: `$${arrAtRisk.toLocaleString()}` });
  if (typeof longestIncident === 'number') metrics.push({ name: 'Outage Duration', value: `${longestIncident.toFixed(1)}h` });
  if (affectedUsers) metrics.push({ name: 'Affected Users', value: affectedUsers.toLocaleString() });
  if (activeIncidents > 0) metrics.push({ name: 'Active Incidents', value: activeIncidents.toString() });

  // Email activity metrics
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const recentEmails = unified.emails.filter(e => new Date(e.date) > yesterday).length;
  if (recentEmails > 0) metrics.push({ name: 'Recent Messages', value: recentEmails.toString() });

  // Ticket metrics
  const criticalTickets = unified.tickets.filter(t => 
    (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'closed'
  ).length;
  const overdueTickets = unified.tickets.filter(t => 
    t.dueDate && new Date(t.dueDate) < today && t.status !== 'closed'
  ).length;
  
  if (criticalTickets > 0) metrics.push({ name: 'Critical Tickets', value: criticalTickets.toString() });
  if (overdueTickets > 0) metrics.push({ name: 'Overdue Items', value: overdueTickets.toString() });

  // Calendar metrics
  const todayEvents = unified.calendarEvents.filter(e => {
    const eventDate = new Date(e.start).toDateString();
    return eventDate === today.toDateString();
  }).length;
  if (todayEvents > 0) metrics.push({ name: 'Today\'s Meetings', value: todayEvents.toString() });

  return metrics;
}

function detectThemes(unified: UnifiedData): Theme[] {
  const themes: Theme[] = [];
  
  // Crisis management themes
  const activeIncidents = unified.incidents.filter(i => !i.endedAt);
  const recentIncidents = unified.incidents.filter(i => {
    const incidentTime = new Date(i.startedAt).getTime();
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    return incidentTime > last24Hours;
  });
  
  if (activeIncidents.length > 0) {
    themes.push({ title: 'Crisis Response', description: 'Active incidents require immediate attention and coordination' });
  } else if (recentIncidents.length > 0) {
    themes.push({ title: 'Recovery & Learning', description: 'Recent incidents need post-mortem and prevention measures' });
  }

  // Risk mitigation themes
  const criticalTickets = unified.tickets.filter(t => 
    (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'closed'
  );
  const overdueTickets = unified.tickets.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'closed'
  );
  
  if (criticalTickets.length >= 3) {
    themes.push({ title: 'Risk Mitigation', description: 'Multiple critical issues require prioritization and resource allocation' });
  } else if (overdueTickets.length > 0) {
    themes.push({ title: 'Execution Focus', description: 'Overdue items need immediate closure to maintain momentum' });
  }

  // Customer relationship themes
  const churnSignals = unified.emails.filter(e => 
    /churn|cancel|renewal|risk|escalat|complaint|issue/i.test(e.subject + ' ' + e.body)
  );
  const supportEmails = unified.emails.filter(e => 
    /support|help|problem|bug|error|fail/i.test(e.subject + ' ' + e.body)
  );
  
  if (churnSignals.length >= 2) {
    themes.push({ title: 'Customer Retention', description: 'Multiple retention risks require strategic intervention' });
  } else if (supportEmails.length >= 5) {
    themes.push({ title: 'Customer Success', description: 'High support volume indicates need for proactive engagement' });
  }

  // Growth and opportunity themes
  const opportunityEmails = unified.emails.filter(e => 
    /opportunity|proposal|expansion|upsell|new.*client|prospect/i.test(e.subject + ' ' + e.body)
  );
  const meetingCount = unified.calendarEvents.filter(e => {
    const eventDate = new Date(e.start);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= tomorrow;
  }).length;

  if (opportunityEmails.length >= 2) {
    themes.push({ title: 'Growth Opportunities', description: 'Active prospects and expansion opportunities need attention' });
  } else if (meetingCount >= 5) {
    themes.push({ title: 'High Activity', description: 'Heavy meeting schedule requires preparation and follow-up coordination' });
  }

  // Operational efficiency theme
  const blockingTickets = unified.tickets.filter(t => t.status === 'blocked');
  if (blockingTickets.length >= 2) {
    themes.push({ title: 'Operational Efficiency', description: 'Multiple blocked items indicate process or dependency issues' });
  }

  // Default theme if nothing specific detected
  if (themes.length === 0) {
    themes.push({ title: 'Business as Usual', description: 'Regular operations with standard monitoring and execution' });
  }

  return themes.slice(0, 3); // Limit to top 3 themes
}

function mapActionItems(unified: UnifiedData): ActionItem[] {
  const items: ActionItem[] = [];
  const now = new Date();
  
  // 1. Active incidents (highest priority)
  unified.incidents
    .filter(i => !i.endedAt)
    .forEach((i) => {
      items.push({
        id: `INC-${i.id}`,
        title: `🔴 INCIDENT: ${i.title}`,
        description: i.description || 'Active incident requiring immediate attention',
        priority: 'high',
        status: 'in_progress',
        related_to: 'incident',
      });
    });

  // 2. Overdue critical tickets
  unified.tickets
    .filter(t => 
      t.status !== 'closed' && 
      (t.priority === 'p0' || t.priority === 'p1') &&
      t.dueDate && new Date(t.dueDate) < now
    )
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3)
    .forEach((t) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id: `T-${t.id}`,
        title: `⚠️ OVERDUE (${daysOverdue}d): ${t.title}`,
        description: t.description || 'Critical item past due date',
        due_date: t.dueDate,
        priority: 'high',
        owner: t.owner,
        status: t.status === 'blocked' ? 'pending_review' : 'in_progress',
        related_to: 'ticket',
      });
    });

  // 3. Recent incidents needing follow-up
  const last48Hours = now.getTime() - 48 * 60 * 60 * 1000;
  unified.incidents
    .filter(i => i.endedAt && new Date(i.startedAt).getTime() > last48Hours)
    .slice(0, 2)
    .forEach((i) => {
      items.push({
        id: `POST-${i.id}`,
        title: `📋 Post-mortem: ${i.title}`,
        description: 'Complete root cause analysis and prevention measures',
        priority: 'medium',
        status: 'not_started',
        related_to: 'incident',
      });
    });

  // 4. Critical tickets (current)
  unified.tickets
    .filter(t => 
      t.status !== 'closed' && 
      (t.priority === 'p0' || t.priority === 'p1') &&
      (!t.dueDate || new Date(t.dueDate) >= now)
    )
    .sort((a, b) => {
      // Sort by due date, then by priority
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.priority === 'p0' ? -1 : 1;
    })
    .slice(0, 4)
    .forEach((t) => {
      const dueToday = t.dueDate && new Date(t.dueDate).toDateString() === now.toDateString();
      items.push({
        id: `T-${t.id}`,
        title: `${dueToday ? '🎯 TODAY: ' : ''}${t.title}`,
        description: t.description || 'High priority task',
        due_date: t.dueDate,
        priority: t.priority === 'p0' ? 'high' : 'medium',
        owner: t.owner,
        status: t.status === 'open' ? 'not_started' : t.status === 'blocked' ? 'pending_review' : 'in_progress',
        related_to: 'ticket',
      });
    });

  // 5. Blocked items (need attention)
  unified.tickets
    .filter(t => t.status === 'blocked')
    .slice(0, 2)
    .forEach((t) => {
      items.push({
        id: `BLOCKED-${t.id}`,
        title: `🚧 BLOCKED: ${t.title}`,
        description: t.description || 'Blocked item requiring unblocking action',
        due_date: t.dueDate,
        priority: t.priority === 'p0' || t.priority === 'p1' ? 'high' : 'medium',
        owner: t.owner,
        status: 'pending_review',
        related_to: 'ticket',
      });
    });

  // Deduplicate and limit to top 10 most important items
  const uniqueItems = items.filter((item, index, self) => 
    index === self.findIndex(i => i.id === item.id)
  );
  
  return uniqueItems.slice(0, 10);
}

function mapEvents(unified: UnifiedData): BriefEvent[] {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const endOfTomorrow = new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Get events from now until end of tomorrow, sorted by time
  const relevantEvents = unified.calendarEvents
    .filter(e => {
      const eventStart = new Date(e.start);
      return eventStart >= now && eventStart <= endOfTomorrow;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 8);

  return relevantEvents.map<BriefEvent>((c) => {
    const eventStart = new Date(c.start);
    const isToday = eventStart.toDateString() === now.toDateString();
    const isSoon = (eventStart.getTime() - now.getTime()) < 2 * 60 * 60 * 1000; // Next 2 hours
    
    // Categorize meeting types based on title/attendees  
    let meetingType: 'meeting' | 'deadline' | 'launch' | 'review' | 'other' = 'meeting';
    const title = c.title.toLowerCase();
    const attendeeCount = c.attendees?.length || 0;
    
    if (title.includes('board') || title.includes('executive') || title.includes('ceo') || title.includes('investor')) {
      meetingType = 'other';
    } else if (title.includes('review') || title.includes('retrospective')) {
      meetingType = 'review';
    } else if (title.includes('launch') || title.includes('deploy') || title.includes('release')) {
      meetingType = 'launch';
    } else if (title.includes('deadline') || title.includes('due')) {
      meetingType = 'deadline';
    }

    return {
      id: c.id,
      title: `${isSoon ? '🔴 SOON: ' : isToday ? '📅 TODAY: ' : ''}${c.title}`,
      description: c.description ?? `${attendeeCount ? `${attendeeCount} attendees` : 'Meeting'}`,
      date: c.start,
      type: meetingType,
      attendees: c.attendees,
      location: c.location,
    };
  });
}

export function generateBrief(unified: UnifiedData): BriefingData {
  return {
    key_themes: detectThemes(unified),
    action_items: mapActionItems(unified),
    metrics: buildMetrics(unified),
    upcoming_events: mapEvents(unified),
    generated_at: iso(new Date()),
    time_range: pickTimeRange(unified),
  };
}

// Style-aware brief generation with enhanced formatting
export function generateStyledBrief(
  unified: UnifiedData, 
  style: 'mission_brief' | 'startup_velocity' | 'management_consulting' | 'newsletter' = 'mission_brief'
): any {
  const baseBrief = generateBrief(unified);
  const context = analyzeBusinessContext(unified);
  const insights = generateDataInsights(unified);
  const attribution = generateDataAttribution(unified);
  
  switch (style) {
    case 'mission_brief':
      return formatMissionBrief(baseBrief, context, unified, insights, attribution);
    case 'startup_velocity':
      return formatStartupVelocityBrief(baseBrief, context, unified, insights, attribution);
    case 'management_consulting':
      return formatConsultingBrief(baseBrief, context, unified, insights, attribution);
    case 'newsletter':
      return formatNewsletterBrief(baseBrief, context, unified, insights, attribution);
    default:
      return baseBrief;
  }
}

// Analyze business context for more intelligent brief generation
function analyzeBusinessContext(unified: UnifiedData) {
  const hasActiveIncidents = unified.incidents.some(i => !i.endedAt);
  const totalARR = unified.incidents.reduce((sum, i) => sum + (i.arrAtRisk ?? 0), 0);
  const criticalIssuesCount = unified.tickets.filter(t => 
    (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'closed'
  ).length;
  const recentEmailVolume = unified.emails.filter(e => {
    const emailTime = new Date(e.date).getTime();
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    return emailTime > last24Hours;
  }).length;
  
  const urgencyLevel = hasActiveIncidents ? 'crisis' : 
    (criticalIssuesCount >= 3 || totalARR > 1000000) ? 'high' : 
    (criticalIssuesCount > 0 || recentEmailVolume > 10) ? 'medium' : 'low';

  return {
    urgencyLevel,
    hasActiveIncidents,
    totalARR,
    criticalIssuesCount,
    recentEmailVolume,
    mainStakeholders: extractMainStakeholders(unified),
  };
}

function extractMainStakeholders(unified: UnifiedData): string[] {
  const stakeholders = new Set<string>();
  
  // Extract from incident data
  unified.incidents.forEach(i => {
    if (i.owner) stakeholders.add(i.owner);
  });
  
  // Extract from tickets
  unified.tickets.forEach(t => {
    if (t.owner) stakeholders.add(t.owner);
  });
  
  // Extract from calendar events (meeting organizers/key attendees)
  unified.calendarEvents.forEach(e => {
    if (e.attendees && e.attendees.length > 0 && e.attendees.length <= 5) {
      e.attendees.slice(0, 2).forEach(a => {
        const name = typeof a === 'string' ? a : a.name || a.email;
        stakeholders.add(name);
      });
    }
  });
  
  return Array.from(stakeholders).slice(0, 5);
}

// Generate actionable insights from data patterns
function generateDataInsights(unified: UnifiedData): any {
  const now = new Date();
  const last24Hours = now.getTime() - 24 * 60 * 60 * 1000;
  const last7Days = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  // Communication patterns
  const recentEmails = unified.emails.filter(e => new Date(e.date).getTime() > last24Hours);
  const weeklyEmails = unified.emails.filter(e => new Date(e.date).getTime() > last7Days);
  const urgentEmails = unified.emails.filter(e => 
    /urgent|asap|critical|emergency|immediate/i.test(e.subject + ' ' + e.body)
  );

  // Meeting analysis
  const todayMeetings = unified.calendarEvents.filter(e => {
    const eventDate = new Date(e.start).toDateString();
    return eventDate === now.toDateString();
  });
  const tomorrowMeetings = unified.calendarEvents.filter(e => {
    const eventDate = new Date(e.start);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return eventDate.toDateString() === tomorrow.toDateString();
  });

  // Project momentum indicators
  const activeProjects = new Set();
  unified.tickets.forEach(t => {
    if (t.status !== 'closed' && t.title) {
      // Extract potential project names from ticket titles
      const projectMatch = t.title.match(/(\w+\s+\w+)(?:\s+[-:])/);
      if (projectMatch) activeProjects.add(projectMatch[1]);
    }
  });

  // Risk indicators
  const overdueItems = unified.tickets.filter(t => 
    t.dueDate && new Date(t.dueDate) < now && t.status !== 'closed'
  );
  const blockedItems = unified.tickets.filter(t => t.status === 'blocked');

  // Communication frequency analysis
  const communicationTrend = recentEmails.length > weeklyEmails.length / 7 * 1.5 ? 'high' : 
    recentEmails.length < weeklyEmails.length / 7 * 0.5 ? 'low' : 'normal';

  return {
    communication: {
      recentVolume: recentEmails.length,
      weeklyVolume: weeklyEmails.length,
      urgentCount: urgentEmails.length,
      trend: communicationTrend,
      keyTopics: extractKeyTopics(unified.emails),
    },
    meetings: {
      todayCount: todayMeetings.length,
      tomorrowCount: tomorrowMeetings.length,
      upcomingImportant: todayMeetings.filter(m => 
        /board|executive|ceo|investor|client|customer/i.test(m.title)
      ),
    },
    projects: {
      activeCount: activeProjects.size,
      atRiskCount: overdueItems.length + blockedItems.length,
      momentum: overdueItems.length > 3 ? 'declining' : blockedItems.length > 2 ? 'blocked' : 'steady',
    },
    risks: {
      overdue: overdueItems.length,
      blocked: blockedItems.length,
      incidents: unified.incidents.filter(i => !i.endedAt).length,
    }
  };
}

// Extract key topics from email content
function extractKeyTopics(emails: any[]): string[] {
  const topicCounts = new Map<string, number>();
  
  emails.forEach(email => {
    const text = (email.subject + ' ' + email.body).toLowerCase();
    
    // Look for project/business keywords
    const keywords = [
      'budget', 'revenue', 'client', 'customer', 'launch', 'release',
      'meeting', 'demo', 'proposal', 'contract', 'renewal', 'expansion',
      'hiring', 'onboarding', 'quarterly', 'review', 'performance',
      'incident', 'outage', 'bug', 'issue', 'urgent', 'critical'
    ];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
      }
    });
  });
  
  // Return top 5 topics
  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

// Generate data source attribution
function generateDataAttribution(unified: UnifiedData): string {
  const parts = [];
  
  if (unified.emails.length > 0) {
    parts.push(`${unified.emails.length} messages`);
  }
  if (unified.calendarEvents.length > 0) {
    parts.push(`${unified.calendarEvents.length} meetings`);
  }
  if (unified.tickets.length > 0) {
    parts.push(`${unified.tickets.length} tasks`);
  }
  if (unified.incidents.length > 0) {
    parts.push(`${unified.incidents.length} incidents`);
  }
  
  if (parts.length === 0) return 'Based on available data';
  
  const timeRange = pickTimeRange(unified);
  const timeStr = timeRange ? 
    ` from ${new Date(timeRange.start).toLocaleDateString()} to ${new Date(timeRange.end).toLocaleDateString()}` : 
    ' from recent activity';
  
  return `Based on ${parts.join(', ')}${timeStr}`;
}

function formatMissionBrief(brief: BriefingData, context: any, unified: UnifiedData): any {
  const urgentActions = brief.action_items.filter(a => a.priority === 'high').slice(0, 4);
  const resourceNeeds = calculateResourceNeeds(context, unified);
  
  return {
    userId: 'user@example.com',
    generatedAt: brief.generated_at,
    style: 'mission_brief',
    version: '2.0',
    subject: generateMissionSubject(context, brief),
    tldr: generateMissionTLDR(context, brief),
    missionBrief: {
      currentStatus: {
        primaryIssue: context.hasActiveIncidents ? 
          `Active incident requiring immediate executive coordination` :
          `${context.criticalIssuesCount} critical items requiring prioritization`,
        businessImpact: generateBusinessImpact(context, unified),
      },
      immediateActions: urgentActions.map(action => ({
        title: action.title,
        objective: action.description,
        owner: action.owner || 'TBD',
        dueDate: action.due_date,
      })),
      resourceAuthorization: resourceNeeds,
      escalationContacts: context.mainStakeholders.map((name: string) => ({
        name,
        role: 'Key Stakeholder',
        note: 'Standing by for coordination'
      })),
      windowEmphasisNote: context.urgencyLevel === 'crisis' ? 
        'First 24 hours determine recovery success; executive engagement required.' :
        'Timely execution critical for maintaining operational momentum.',
    }
  };
}

function formatStartupVelocityBrief(brief: BriefingData, context: any, unified: UnifiedData): any {
  return {
    userId: 'user@example.com',
    generatedAt: brief.generated_at,
    style: 'startup_velocity',
    version: '2.0',
    subject: context.urgencyLevel === 'crisis' ? 
      '🚨 Crisis Mode - Time to Show What We\'re Made Of' :
      '⚡ Daily Velocity Check - Let\'s Ship It',
    tldr: generateStartupTLDR(context, brief),
    startupVelocity: {
      velocityCheck: context.urgencyLevel === 'crisis' ? 
        'We\'re in a defining moment. This will either break us or make us legendary.' :
        'Another day to push limits and create something amazing.',
      whatIsBroken: categorizeIssues(unified),
      nextSixHours: generateTimeboxedActions(brief.action_items),
      budget: calculateResourceNeeds(context, unified),
      whyThisCouldBeAmazing: 'Every challenge is a chance to level up our game.',
      closingPrompt: 'Ready to move fast and build things?'
    }
  };
}

function formatConsultingBrief(brief: BriefingData, context: any, unified: UnifiedData): any {
  return {
    userId: 'user@example.com',
    generatedAt: brief.generated_at,
    style: 'management_consulting',
    version: '2.0',
    subject: 'Strategic Operations Brief: Priority Assessment & Resource Allocation',
    tldr: generateConsultingTLDR(context, brief),
    consulting: {
      executiveSummary: generateExecutiveSummary(context, brief),
      situationAnalysis: {
        financialImpact: generateFinancialAnalysis(context, unified),
        rootCauseFramework: analyzeRootCauses(unified),
        stakeholderMatrix: context.mainStakeholders,
      },
      strategyFramework: generateStrategyPhases(brief.action_items),
      investmentRecommendation: calculateResourceNeeds(context, unified),
      criticalSuccessFactors: generateSuccessFactors(context),
      recommendedActions: brief.action_items.slice(0, 5).map(a => a.title),
    }
  };
}

function formatNewsletterBrief(brief: BriefingData, context: any, unified: UnifiedData): any {
  return {
    userId: 'user@example.com',
    generatedAt: brief.generated_at,
    style: 'newsletter',
    version: '2.0',
    subject: `Morning Brief: ${context.hasActiveIncidents ? 'Crisis Update' : 'Operations Summary'}`,
    tldr: generateNewsletterTLDR(context, brief),
    newsletter: {
      headlines: generateHeadlines(brief, context),
      featureTitle: context.urgencyLevel === 'crisis' ? 
        'Crisis Response: When Everything Depends on the Next 24 Hours' :
        'Operations Snapshot: Today\'s Key Developments',
      featureParagraphs: generateFeatureParagraphs(context, unified),
      analysis: generateAnalysis(brief, context),
      moreCoverage: generateMoreCoverage(unified),
      expertInsights: ['Proactive communication builds stronger partnerships than perfect execution.'],
      kudos: identifyKudos(unified),
      aheadBlockers: brief.action_items.filter(a => a.status === 'pending_review').slice(0, 3).map(a => a.title),
    }
  };
}

// Helper functions for content generation
function generateMissionSubject(context: any, brief: BriefingData): string {
  if (context.hasActiveIncidents) {
    return '🔴 CRITICAL - Active Incident Coordination Required';
  }
  if (context.urgencyLevel === 'high') {
    return '⚠️ HIGH PRIORITY - Multiple Critical Issues Need Attention';
  }
  return '📊 Operations Brief - Priority Actions & Status Update';
}

function generateMissionTLDR(context: any, brief: BriefingData): string {
  const actionCount = brief.action_items.length;
  const criticalCount = brief.action_items.filter(a => a.priority === 'high').length;
  
  if (context.hasActiveIncidents) {
    return `Active incident in progress; ${criticalCount} critical actions requiring immediate coordination and resource allocation.`;
  }
  return `${actionCount} total actions, ${criticalCount} critical. ${context.urgencyLevel === 'high' ? 'Executive attention required.' : 'Standard operational tempo.'}`;
}

function generateStartupTLDR(context: any, brief: BriefingData): string {
  if (context.hasActiveIncidents) {
    return 'Major issue happening; time to rally the team and show what we can do under pressure.';
  }
  return `${brief.action_items.length} things to crush today; let's maintain velocity and ship something awesome.`;
}

function generateConsultingTLDR(context: any, brief: BriefingData): string {
  return `Strategic assessment reveals ${brief.action_items.length} priority items requiring structured approach and resource optimization.`;
}

function generateNewsletterTLDR(context: any, brief: BriefingData): string {
  const themes = brief.key_themes.map(t => typeof t === 'string' ? t : t.title.toLowerCase()).join(', ');
  return `Key themes: ${themes}; ${brief.action_items.length} action items tracked.`;
}

// Additional helper functions would continue here...
function generateBusinessImpact(context: any, unified: UnifiedData): string[] {
  const impact = [];
  if (context.totalARR > 0) impact.push(`Revenue at risk: $${context.totalARR.toLocaleString()}`);
  if (context.hasActiveIncidents) impact.push('Service disruption affecting user experience');
  if (context.criticalIssuesCount > 0) impact.push(`${context.criticalIssuesCount} critical operational issues`);
  return impact.length > 0 ? impact : ['Standard operational status'];
}

function calculateResourceNeeds(context: any, unified: UnifiedData): any {
  const baseAmount = context.hasActiveIncidents ? 25000 : 
    context.urgencyLevel === 'high' ? 15000 : 5000;
  
  return {
    total: baseAmount,
    items: [
      {
        category: 'Technical Resources',
        amount: Math.floor(baseAmount * 0.6),
        bullets: ['Engineering support', 'Infrastructure scaling', 'Monitoring enhancement']
      },
      {
        category: 'Operations Support', 
        amount: Math.floor(baseAmount * 0.4),
        bullets: ['Project coordination', 'Communication management', 'Process optimization']
      }
    ]
  };
}

function categorizeIssues(unified: UnifiedData): any {
  return {
    technical: unified.incidents.map(i => i.title),
    operational: unified.tickets.filter(t => t.priority === 'p0' || t.priority === 'p1').map(t => t.title),
    team: ['High coordination and productivity']
  };
}

function generateTimeboxedActions(actions: any[]): any[] {
  return actions.slice(0, 4).map((action, index) => ({
    timeLabel: `${9 + index}:00 - ${action.title}`,
    goal: action.description,
    owner: action.owner || 'TBD'
  }));
}

function generateExecutiveSummary(context: any, brief: BriefingData): string {
  return context.urgencyLevel === 'crisis' ? 
    'Critical incident requires immediate executive coordination and resource allocation within next 24 hours.' :
    'Standard operational tempo with focused execution on high-priority initiatives.';
}

function generateFinancialAnalysis(context: any, unified: UnifiedData): string[] {
  const analysis = [];
  if (context.totalARR > 0) analysis.push(`Direct revenue exposure: $${context.totalARR.toLocaleString()}`);
  analysis.push('Resource allocation optimized for maximum operational efficiency');
  if (context.criticalIssuesCount > 2) analysis.push('Multiple priority items suggest resource constraint');
  return analysis;
}

function analyzeRootCauses(unified: UnifiedData): string {
  if (unified.incidents.length > 0) {
    return 'Infrastructure incidents indicate need for enhanced monitoring and redundancy planning.';
  }
  return 'Standard operational issues requiring systematic resolution and process refinement.';
}

function generateStrategyPhases(actions: any[]): any[] {
  return [
    {
      phase: 'Phase 1: Immediate Execution (Next 24 Hours)',
      description: 'Address critical and overdue items with focused resource allocation'
    },
    {
      phase: 'Phase 2: Process Optimization (48-Hour Window)', 
      description: 'Systematic resolution of medium-priority items and process improvements'
    },
    {
      phase: 'Phase 3: Strategic Enhancement (7-Day Implementation)',
      description: 'Long-term operational improvements and prevention measures'
    }
  ];
}

function generateSuccessFactors(context: any): string[] {
  const factors = ['Clear ownership and accountability for all critical items'];
  if (context.hasActiveIncidents) factors.push('Rapid incident response and transparent communication');
  factors.push('Proactive stakeholder engagement and regular status updates');
  return factors;
}

function generateHeadlines(brief: BriefingData, context: any): string[] {
  const headlines = [];
  if (context.hasActiveIncidents) headlines.push('Service Incident: Active response coordination in progress');
  headlines.push(`Operations Status: ${brief.action_items.length} tracked items, ${brief.action_items.filter(a => a.priority === 'high').length} high priority`);
  headlines.push(`Team Activity: ${context.mainStakeholders.length} key stakeholders engaged`);
  return headlines;
}

function generateFeatureParagraphs(context: any, unified: UnifiedData): string[] {
  const paragraphs = [];
  if (context.hasActiveIncidents) {
    paragraphs.push('Current incident response demonstrates our operational resilience and team coordination.');
  }
  paragraphs.push('Today\'s operational focus balances immediate needs with strategic objectives.');
  if (context.recentEmailVolume > 15) {
    paragraphs.push('High communication volume indicates active stakeholder engagement and project momentum.');
  }
  return paragraphs;
}

function generateAnalysis(brief: BriefingData, context: any): string[] {
  return [
    `Priority Management: ${brief.action_items.filter(a => a.priority === 'high').length} high-priority items require immediate attention`,
    `Resource Allocation: Current operational tempo ${context.urgencyLevel === 'high' ? 'requires additional support' : 'within normal parameters'}`,
    'Communication Flow: Active stakeholder coordination maintaining project momentum'
  ];
}

function generateMoreCoverage(unified: UnifiedData): string[] {
  const coverage = [];
  if (unified.incidents.length > 0) coverage.push('Incident Response: Coordinated technical and communication protocols');
  coverage.push('Project Coordination: Cross-functional alignment and deliverable tracking');
  coverage.push('Team Performance: Sustained productivity under operational demands');
  return coverage;
}

function identifyKudos(unified: UnifiedData): Array<{name: string, role: string, kudosSuggestion: string}> {
  const kudos: Array<{name: string, role: string, kudosSuggestion: string}> = [];
  unified.incidents.forEach(i => {
    if (i.owner) kudos.push({ name: i.owner, role: 'Incident Response', kudosSuggestion: 'Outstanding crisis leadership' });
  });
  unified.tickets.filter(t => t.priority === 'p0' && t.owner).slice(0, 2).forEach(t => {
    kudos.push({ name: t.owner!, role: 'Operations', kudosSuggestion: 'Critical issue resolution' });
  });
  return kudos.slice(0, 3);
}
