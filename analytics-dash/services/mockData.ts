
import type { Email, SlackMessage, Meeting, MockData, Contact } from '../types';
import { EXECUTIVE_EMAIL, INTERNAL_DOMAIN } from '../constants';

const contacts: Contact[] = [
  { email: 'alice@client-a.com' },
  { email: 'bob.j@client-b.org' },
  { email: 'charlie.team@' + INTERNAL_DOMAIN },
  { email: 'david.p@' + INTERNAL_DOMAIN },
  { email: 'emily@partner.net' },
  { email: 'frank.g@' + INTERNAL_DOMAIN },
  { email: 'grace@vendor.co' },
  { email: 'heidi@' + INTERNAL_DOMAIN },
  { email: 'ivan@investors.com' },
  { email: 'judy.s@' + INTERNAL_DOMAIN },
  { email: 'kyle@prospect-one.com' },
  { email: 'laura@prospect-two.com' }
];

const contactEmails = contacts.map(c => c.email);
const slackUsers = contacts.map(c => c.email.split('@')[0]);

const randomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generates a realistic timestamp biased towards working hours and weekdays.
 * @param daysAgo - How many days back the timestamp can be.
 * @returns A Date object.
 */
export const generateRealisticTimestamp = (daysAgo: number = 30): Date => {
    const now = new Date();
    const date = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);

    // Bias towards weekdays (1-5)
    if (Math.random() < 0.8) { // 80% chance of being a weekday
        let day = date.getDay();
        if (day === 0) date.setDate(date.getDate() + 1); // If Sunday, move to Monday
        if (day === 6) date.setDate(date.getDate() - 1); // If Saturday, move to Friday
    }

    // Bias towards working hours (8 AM - 6 PM UTC)
    let hour;
    const randomFactor = Math.random();
    if (randomFactor < 0.7) { // 70% chance of being 9am-5pm
        hour = randomInt(9, 17);
    } else if (randomFactor < 0.9) { // 20% chance of being 8am-6pm shoulder hours
        hour = randomElement([8, 18]);
    } else { // 10% chance of being off-hours
        hour = randomInt(0, 7);
    }
    date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59));
    
    return date;
};


const generateEmails = (count: number): Email[] => {
  const emails: Email[] = [];
  const positiveKeywords = ['great job', 'success', 'approved', 'excellent', 'fantastic', 'love it', 'well done', 'achieved', 'milestone'];
  const negativeKeywords = ['issue', 'problem', 'urgent', 'delay', 'concern', 'fix this', 'blocker', 'missed deadline', 'escalation'];
  const neutralKeywords = ['update', 'meeting', 'fyi', 'checking in', 'sync', 'report', 'next steps', 'agenda'];

  for (let i = 0; i < count; i++) {
    const direction = Math.random() > 0.4 ? 'sent' : 'received';
    const contact = randomElement(contactEmails);
    const timestamp = generateRealisticTimestamp();
    const id = `email_${i}`;
    let subject = `Re: Project Phoenix Meeting ${randomInt(1,10)}`;
    let body = `Hi team,\n\nJust a quick update on Project Phoenix. We're on track for our next milestone. Let's discuss details in the next sync.\n\nBest,\nExec`;
    let sentiment: Email['sentiment'] = 'neutral';
    
    const sentimentRoll = Math.random();
    if (sentimentRoll < 0.25) { // 25% chance of negative
        const keyword = randomElement(negativeKeywords);
        subject = `[URGENT] ${keyword} with Project Falcon`;
        body = `Hi,\n\nWe need to address an ${keyword} with the latest build. This is a major blocker for the team. Please advise on next steps immediately.\n\nThanks,\nExec`;
        sentiment = 'negative';
    } else if (sentimentRoll < 0.6) { // 35% chance of positive
        const keyword = randomElement(positiveKeywords);
        subject = `Great news on Project Phoenix!`;
        body = `Team,\n\nFantastic work on hitting the Q2 target. This is a huge ${keyword} for us. Let's celebrate this success.\n\nCheers,\nExec`;
        sentiment = 'positive';
    } else { // 40% neutral
         const keyword = randomElement(neutralKeywords);
         subject = `FYI: ${keyword} on Project Phoenix`;
         body = `Hi team,\n\nThis is an ${keyword} regarding our progress. We have a ${keyword} scheduled for tomorrow to go over the details.\n\nBest,\nExec`;
         sentiment = 'neutral';
    }

    emails.push({
      id,
      threadId: `thread_${randomInt(1, 50)}`,
      from: direction === 'sent' ? EXECUTIVE_EMAIL : contact,
      to: direction === 'sent' ? [contact] : [EXECUTIVE_EMAIL],
      cc: Math.random() > 0.8 ? [randomElement(contactEmails)] : [],
      subject,
      body,
      sentiment,
      timestamp,
      direction,
      link: `/#/email/${id}`,
      important: sentiment === 'negative' || subject.toLowerCase().includes('urgent') || Math.random() < 0.05
    });
  }

  // Ensure some unreplied threads exist for the demo
  const unrepliedSubjects = [
    "Urgent: Follow-up on Q3 projections",
    "Quick question about the new proposal",
    "Client feedback on the demo"
  ];

  for (let i = 0; i < unrepliedSubjects.length; i++) {
      const contact = randomElement(contactEmails.filter(e => !e.includes(INTERNAL_DOMAIN)));
      const timestamp = new Date(Date.now() - randomInt(1, 7) * 24 * 60 * 60 * 1000); // within last week
      const id = `email_unreplied_${i}`;
      const subject = unrepliedSubjects[i];
      emails.push({
          id,
          threadId: `thread_unreplied_${i}`,
          from: contact,
          to: [EXECUTIVE_EMAIL],
          cc: [],
          subject,
          body: `Hi, I was hoping to get your thoughts on the Q3 projections. There are a few points I'm concerned about. It's quite urgent.`,
          sentiment: 'negative',
          timestamp,
          direction: 'received',
          link: `/#/email/${id}`,
          important: subject.toLowerCase().includes('urgent')
      });
  }
  
  // Ensure some "waiting for reply" threads exist
  const waitingSubjects = [
    "Update on Project Falcon",
    "My thoughts on the latest draft",
    "Action items from our sync"
  ];
  for (let i = 0; i < waitingSubjects.length; i++) {
      const contact = randomElement(contactEmails.filter(e => e.includes(INTERNAL_DOMAIN)));
      const timestamp = new Date(Date.now() - randomInt(2,5) * 24 * 60 * 60 * 1000);
      const subject = waitingSubjects[i];
       // Optional received message first
       if (Math.random() > 0.5) {
            const initialId = `email_waiting_initial_${i}`;
            emails.push({
                id: initialId,
                threadId: `thread_waiting_${i}`,
                from: contact,
                to: [EXECUTIVE_EMAIL],
                cc: [],
                subject: subject,
                body: 'Following up on this.',
                sentiment: 'neutral',
                timestamp: new Date(timestamp.getTime() - 60000 * 60),
                direction: 'received',
                link: `/#/email/${initialId}`,
                important: false
            });
       }
       const replyId = `email_waiting_reply_${i}`;
       emails.push({
          id: replyId,
          threadId: `thread_waiting_${i}`,
          from: EXECUTIVE_EMAIL,
          to: [contact],
          cc: [],
          subject,
          body: 'Here are my thoughts on the draft. Let me know if you have any questions.',
          sentiment: 'neutral',
          timestamp,
          direction: 'sent',
          link: `/#/email/${replyId}`,
          important: Math.random() < 0.1
      });
  }


  return emails;
};

const generateSlackMessages = (count: number): SlackMessage[] => {
  const messages: SlackMessage[] = [];
  const channels = ['#proj-phoenix', '#team-leads', '#general', '#random'];
  for (let i = 0; i < count; i++) {
    const direction = Math.random() > 0.3 ? 'sent' : 'received';
    const channelType = Math.random() > 0.6 ? 'channel' : 'im';
    const user = randomElement(slackUsers);
    const timestamp = generateRealisticTimestamp();
    messages.push({
      id: `slack_${i}`,
      threadId: Math.random() > 0.7 ? `slack_thread_${randomInt(1, 20)}` : undefined,
      user: direction === 'sent' ? 'exec' : user,
      channel: channelType === 'channel' ? randomElement(channels) : user,
      channelType,
      text: 'Hey, can you look at the latest doc?',
      timestamp,
      direction,
    });
  }
  return messages;
};

const generateMeetings = (count: number): Meeting[] => {
    const meetings: Meeting[] = [];
    const meetingTypes: Meeting['type'][] = ['1:1', 'Team', 'External', 'Internal Project'];
    for (let i = 0; i < count; i++) {
        const startTime = generateRealisticTimestamp();
        const duration = randomElement([30, 60, 90]);
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
        const type = randomElement(meetingTypes);
        let attendees: string[];
        const internalEmails = contacts.filter(c => c.email.includes(INTERNAL_DOMAIN)).map(c => c.email);
        const externalEmails = contacts.filter(c => !c.email.includes(INTERNAL_DOMAIN)).map(c => c.email);

        switch(type) {
            case '1:1':
                attendees = [EXECUTIVE_EMAIL, randomElement(internalEmails)];
                break;
            case 'Team':
                attendees = [EXECUTIVE_EMAIL, ...Array.from({length: randomInt(3,5)}, () => randomElement(internalEmails))];
                break;
            case 'External':
                attendees = [EXECUTIVE_EMAIL, randomElement(externalEmails), ...Array.from({length: randomInt(1,2)}, () => randomElement(internalEmails))];
                break;
            case 'Internal Project':
                attendees = [EXECUTIVE_EMAIL, ...Array.from({length: randomInt(2,6)}, () => randomElement(internalEmails))];
                break;
        }

        meetings.push({
            id: `meeting_${i}`,
            subject: `${type} Sync: Project Phoenix`,
            organizer: Math.random() > 0.5 ? EXECUTIVE_EMAIL : randomElement(attendees),
            attendees: [...new Set(attendees)],
            startTime,
            endTime,
            duration,
            type
        });
    }
    return meetings;
};

export const generateMockData = (): MockData => ({
  emails: generateEmails(500),
  slackMessages: generateSlackMessages(1200),
  meetings: generateMeetings(80),
  contacts: contacts
});
