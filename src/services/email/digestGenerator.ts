import { emailTemplateRenderer } from './templateRenderer';
import { format, addDays } from 'date-fns';

type DigestContent = {
  subject: string;
  html: string;
  text: string;
};

type DigestOptions = {
  style: 'mission-brief';
  detailLevel: 'concise' | 'detailed';
  timezone?: string;
};

export class DigestGenerator {
  private formatDate(date: Date, timezone: string = 'UTC'): string {
    // In a real implementation, use a library like date-fns-tz for timezone support
    return format(date, 'MMMM d, yyyy h:mm a');
  }

  private formatDeadline(deadline: Date, timezone: string = 'UTC'): string {
    const now = new Date();
    const diffInHours = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours <= 0) {
      return 'ASAP';
    } else if (diffInHours <= 24) {
      return `Today at ${format(deadline, 'h:mm a')}`;
    } else if (diffInHours <= 48) {
      return `Tomorrow at ${format(deadline, 'h:mm a')}`;
    } else if (diffInHours <= 7 * 24) {
      return format(deadline, 'EEEE [at] h:mm a');
    } else {
      return format(deadline, 'MMMM d [at] h:mm a');
    }
  }

  private generateConciseMissionBrief(data: any): Promise<DigestContent> {
    const subject = data.subject || 'Mission Brief';
    
    return emailTemplateRenderer.renderMissionBriefEmail({
      style: 'concise',
      subject,
      situation: {
        summary: data.situation?.summary || 'No updates available.'
      },
      action: {
        description: data.action?.description || 'No immediate actions required.',
        deadline: data.action?.deadline ? this.formatDeadline(new Date(data.action.deadline)) : 'No deadline'
      },
      impact: data.impact?.summary,
      updates: data.updates?.map((update: any) => ({
        status: update.status || 'neutral',
        description: update.description,
        details: update.details
      })) || [],
      cta: data.cta || { text: 'View Details', url: '#' }
    }).then(html => ({
      subject: `🚨 ${subject}`,
      html,
      text: this.generatePlainTextFromHtml(html)
    }));
  }

  private generateDetailedMissionBrief(data: any): Promise<DigestContent> {
    const subject = data.subject || 'Detailed Mission Brief';
    
    return emailTemplateRenderer.renderMissionBriefEmail({
      style: 'detailed',
      subject,
      summary: data.summary || 'Your daily mission briefing with key updates and action items.',
      situation: {
        detailed: data.situation?.detailed || 'No detailed situation available.',
        metrics: data.situation?.metrics || []
      },
      action: {
        description: data.action?.description || 'No immediate actions required.',
        priority: data.action?.priority || 'Medium',
        deadline: data.action?.deadline ? this.formatDeadline(new Date(data.action.deadline)) : 'No deadline',
        owners: data.action?.owners || ['Unassigned']
      },
      impact: {
        overview: data.impact?.overview || 'No impact analysis available.',
        metrics: data.impact?.metrics || []
      },
      updates: data.updates?.map((update: any) => ({
        title: update.title,
        status: update.status || 'neutral',
        description: update.description,
        details: update.details,
        metrics: update.metrics || []
      })) || [],
      nextSteps: data.nextSteps || ['Review the information above and take necessary actions.'],
      cta: data.cta || { text: 'View Full Report', url: '#' },
      secondaryCta: data.secondaryCta
    }).then(html => ({
      subject: `📋 ${subject}`,
      html,
      text: this.generatePlainTextFromHtml(html)
    }));
  }

  private generatePlainTextFromHtml(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public async generateDigest(data: any, options: DigestOptions): Promise<DigestContent> {
    try {
      switch (options.style) {
        case 'mission-brief':
          if (options.detailLevel === 'concise') {
            return this.generateConciseMissionBrief(data);
          } else {
            return this.generateDetailedMissionBrief(data);
          }
        default:
          throw new Error(`Unsupported digest style: ${options.style}`);
      }
    } catch (error) {
      console.error('Error generating digest:', error);
      throw new Error('Failed to generate email digest');
    }
  }
}

// Singleton instance
export const digestGenerator = new DigestGenerator();
