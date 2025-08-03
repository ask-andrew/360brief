import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WeeklyDigestEmailProps {
  userName?: string;
  dateRange: string;
  summary: {
    emailCount: number;
    eventCount: number;
    importantItems: number;
  };
  insights: {
    topSenders: Array<{ name: string; count: number }>;
    busiestDay: string;
    meetingHours: number;
  };
  recentEmails: Array<{
    subject: string;
    from: string;
    snippet: string;
    date: string;
  }>;
  upcomingEvents: Array<{
    summary: string;
    start: string;
    end: string;
    location?: string;
  }>;
  baseUrl?: string;
}

export const WeeklyDigestEmail = ({
  userName = 'there',
  dateRange,
  summary,
  insights,
  recentEmails = [],
  upcomingEvents = [],
  baseUrl = 'https://360brief.app',
}: WeeklyDigestEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Weekly Digest - {dateRange}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>360°Brief</Text>
        <Text style={greeting}>Hi {userName},</Text>
        <Text style={paragraph}>
          Here's your weekly digest for {dateRange}. You had {summary.emailCount} emails and {summary.eventCount} events this week.
        </Text>
        
        {/* Summary Section */}
        <Section style={card}>
          <Text style={cardTitle}>📊 Weekly Summary</Text>
          <Text style={cardText}>
            • {summary.emailCount} emails received<br />
            • {summary.eventCount} calendar events<br />
            • {summary.importantItems} important items need your attention
          </Text>
        </Section>

        {/* Insights Section */}
        <Section style={card}>
          <Text style={cardTitle}>🔍 Insights</Text>
          <Text style={cardText}>
            <strong>Top Senders:</strong><br />
            {insights.topSenders.map((sender, i) => (
              <span key={i}>
                {i + 1}. {sender.name} ({sender.count} emails)<br />
              </span>
            ))}
            <br />
            <strong>Busiest Day:</strong> {insights.busiestDay}<br />
            <strong>Total Meeting Hours:</strong> {insights.meetingHours} hours
          </Text>
        </Section>

        {/* Important Emails */}
        {recentEmails.length > 0 && (
          <Section style={card}>
            <Text style={cardTitle}>📧 Important Emails</Text>
            {recentEmails.map((email, i) => (
              <div key={i} style={emailItem}>
                <Text style={emailSubject}>{email.subject}</Text>
                <Text style={emailMeta}>
                  From: {email.from} • {email.date}
                </Text>
                <Text style={emailSnippet}>{email.snippet}</Text>
                <Hr style={divider} />
              </div>
            ))}
          </Section>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <Section style={card}>
            <Text style={cardTitle}>📅 Upcoming Events</Text>
            {upcomingEvents.map((event, i) => (
              <div key={i} style={eventItem}>
                <Text style={eventTitle}>{event.summary}</Text>
                <Text style={eventMeta}>
                  {event.start} - {event.end}
                  {event.location && ` • ${event.location}`}
                </Text>
              </div>
            ))}
          </Section>
        )}

        <Section style={ctaSection}>
          <Button style={button} href={`${baseUrl}/digest`}>
            View Full Digest
          </Button>
        </Section>

        <Text style={footer}>
          You're receiving this email because you're subscribed to weekly digests from 360°Brief.
          <br />
          <a href={`${baseUrl}/preferences`} style={link}>
            Update preferences
          </a>{' '}
          •{' '}
          <a href={`${baseUrl}/unsubscribe`} style={link}>
            Unsubscribe
          </a>
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#3d5af1',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const greeting = {
  fontSize: '20px',
  lineHeight: '1.5',
  margin: '0 0 16px',
  padding: '0 24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 24px',
  padding: '0 24px',
};

const card = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '0 24px 16px',
  padding: '20px',
};

const cardTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const cardText = {
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const emailItem = {
  marginBottom: '16px',
};

const emailSubject = {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const emailMeta = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 8px',
};

const emailSnippet = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '0',
  whiteSpace: 'pre-line' as const,
};

const eventItem = {
  marginBottom: '12px',
};

const eventTitle = {
  fontSize: '15px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const eventMeta = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0',
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '16px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3d5af1',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '32px 0 0',
  padding: '0 24px',
  textAlign: 'center' as const,
};

const link = {
  color: '#3d5af1',
  textDecoration: 'underline',
};
