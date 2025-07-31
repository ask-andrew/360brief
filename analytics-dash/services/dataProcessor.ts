
import type { MockData, ProcessedData, Email, SlackMessage, Meeting, TopContactDataPoint, ActivityHour, TopPartnerDataPoint, TopicSentimentDataPoint, HeatmapDataPoint } from '../types';
import { EXECUTIVE_EMAIL, INTERNAL_DOMAIN } from '../constants';

const getOtherParticipant = (comm: Email | SlackMessage | Meeting, self: string): string[] => {
    if ('attendees' in comm) { // Meeting
        return comm.attendees.filter(a => a !== self);
    }
    if ('to' in comm) { // Email
        const all = [...comm.to, ...comm.cc, comm.from];
        return all.filter(p => p !== self && p);
    }
    // SlackMessage
    const slackSelf = 'exec';
    if (comm.direction === 'sent') {
        // If it's a DM, the channel is the user.
        if (comm.channelType === 'im') {
            return [comm.channel];
        }
        return []; // Ignore channel messages for contact-based metrics
    } else { // received
        if (comm.user !== slackSelf) {
            return [comm.user];
        }
        return [];
    }
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function analyzeSentimentByTopic(emails: Email[], direction: 'sent' | 'received'): TopicSentimentDataPoint[] {
    const topicCounts: { [key: string]: { positive: number; negative: number; neutral: number; } } = {};

    const getDomain = (email: string) => {
        const domain = email.split('@')[1];
        return domain === INTERNAL_DOMAIN ? null : domain;
    };

    emails.forEach(email => {
        const topics = new Set<string>();

        // 1. Extract project names from subject
        const projectMatch = email.subject.match(/Project (\w+)/i);
        if (projectMatch && projectMatch[1]) {
            topics.add(`Project ${capitalize(projectMatch[1])}`);
        }
        
        // 2. Extract keywords from subject for non-project emails
        if (topics.size === 0) {
            const subjectKeywordsMatch = email.subject.match(/(?:^|\s)(Q\d \w+|proposal|feedback|draft|projections)/i);
            if (subjectKeywordsMatch && subjectKeywordsMatch[1]){
                topics.add(capitalize(subjectKeywordsMatch[1]));
            }
        }

        // 3. For received emails, use the sender's domain as a topic.
        if (direction === 'received') {
            const domain = getDomain(email.from);
            if(domain) topics.add(domain);
        }
        // 4. For sent emails, use the recipients' domains as topics.
        else {
            email.to.forEach(recipient => {
                const domain = getDomain(recipient);
                if(domain) topics.add(domain);
            });
        }
        
        // If no other topic, use a generic one
        if (topics.size === 0) {
            topics.add('General Communication');
        }

        topics.forEach(topic => {
            if (!topicCounts[topic]) {
                topicCounts[topic] = { positive: 0, negative: 0, neutral: 0 };
            }
            topicCounts[topic][email.sentiment]++;
        });
    });

    return Object.entries(topicCounts)
        .map(([topic, counts]) => ({
            topic,
            ...counts,
            total: counts.positive + counts.negative + counts.neutral
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 15); // Limit to top 15 topics
}


const sentimentToScore = (sentiment: 'positive' | 'negative' | 'neutral'): number => {
    if (sentiment === 'positive') return 1;
    if (sentiment === 'negative') return -1;
    return 0;
};

const DAY_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function generateHeatmapData(emails: Email[]): HeatmapDataPoint[] {
    const heatmap: { [key: string]: { totalScore: number; count: number } } = {};

    emails.forEach(email => {
        // Only include weekdays 8am-6pm for clarity
        const day = email.timestamp.getDay();
        const hour = email.timestamp.getHours();

        if (day >= 1 && day <= 5 && hour >= 8 && hour < 18) {
            const key = `${day}-${hour}`;
            if (!heatmap[key]) {
                heatmap[key] = { totalScore: 0, count: 0 };
            }
            heatmap[key].totalScore += sentimentToScore(email.sentiment);
            heatmap[key].count++;
        }
    });

    return Object.entries(heatmap).map(([key, data]) => {
        const [day, hour] = key.split('-');
        return {
            day: DAY_MAP[parseInt(day)],
            hour: parseInt(hour),
            value: data.count > 0 ? data.totalScore / data.count : 0,
            count: data.count,
        };
    });
}


export const processData = (mockData: MockData): ProcessedData => {
    const { emails, slackMessages, meetings, contacts: richContacts } = mockData;
    
    const slackNameToEmailMap = new Map(richContacts.map(c => [c.email.split('@')[0], c.email]));

    // --- I. Executive Summary ---
    const communicationPulse = [
        { name: 'Email', value: emails.length },
        { name: 'Slack', value: slackMessages.length },
        { name: 'Meetings', value: meetings.length }, 
    ];

    const allInteractions = [
        ...emails.map(e => ({...e, interactionType: 'email' as const})),
        ...slackMessages.map(s => ({...s, interactionType: 'slack' as const})),
        ...meetings.map(m => ({...m, interactionType: 'meetings' as const}))
    ];
    
    const contactCountsByType = allInteractions.reduce((acc, item) => {
        let participants: string[] = [];
        if (item.interactionType === 'email') participants = getOtherParticipant(item as Email, EXECUTIVE_EMAIL);
        else if (item.interactionType === 'slack') {
             const slackUsers = getOtherParticipant(item as SlackMessage, 'exec');
             slackUsers.forEach(user => {
                 const email = slackNameToEmailMap.get(user);
                 if (email) participants.push(email);
             });
        }
        else if (item.interactionType === 'meetings') participants = getOtherParticipant(item as Meeting, EXECUTIVE_EMAIL);

        participants.forEach(p => {
            const name = p.split('@')[0];
            if (!acc[name]) {
                acc[name] = { email: 0, slack: 0, meetings: 0 };
            }
            acc[name][item.interactionType]++;
        });
        return acc;
    }, {} as Record<string, { email: number; slack: number; meetings: number; }>);

    const topContacts: TopContactDataPoint[] = Object.entries(contactCountsByType)
        .map(([name, counts]) => ({
            name,
            ...counts,
            total: counts.email + counts.slack + counts.meetings
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(({ total, ...rest }) => rest);
        
    const activityByHour: ActivityHour[] = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}`, emails: 0, slack: 0 }));
    emails.forEach(email => {
        if (email.direction === 'sent') {
            const hour = email.timestamp.getUTCHours();
            activityByHour[hour].emails++;
        }
    });
    slackMessages.forEach(msg => {
        if (msg.direction === 'sent') {
            const hour = msg.timestamp.getUTCHours();
            activityByHour[hour].slack++;
        }
    });
    
    const totalMeetingMinutes = meetings.reduce((sum, m) => sum + m.duration, 0);
    const avgDurationValue = meetings.length > 0 ? Math.round(totalMeetingMinutes / meetings.length) : 0;
    const meetingStats = {
        avgDuration: { value: avgDurationValue, trend: '+5m vs last period', trendDirection: 'down' as const },
        totalHours: { value: Math.round(totalMeetingMinutes / 60), trend: '+2h vs last period', trendDirection: 'down' as const },
        meetingsPerWeek: { value: Math.round(meetings.length / 4), trend: '-1 vs last period', trendDirection: 'up' as const },
    };

    // --- II. Email Analytics ---
    const emailVolume = emails.reduce((acc, email) => {
        const date = email.timestamp.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { date, sent: 0, received: 0 };
        acc[date][email.direction]++;
        return acc;
    }, {} as Record<string, { date: string, sent: number, received: number }>);

    const threadsByThreadId = emails.reduce((acc, email) => {
        const thread = acc.get(email.threadId) || { messages: [] as Email[], hasReply: false, lastReceived: null as Email | null };
        thread.messages.push(email);
        if (email.direction === 'sent') {
            thread.hasReply = true;
        }
        if (email.direction === 'received') {
            if (!thread.lastReceived || email.timestamp > thread.lastReceived.timestamp) {
                thread.lastReceived = email;
            }
        }
        acc.set(email.threadId, thread);
        return acc;
    }, new Map<string, { messages: Email[], hasReply: boolean, lastReceived: Email | null }>());
    
    const unrepliedThreads = Array.from(threadsByThreadId.values())
        .filter(thread => !thread.hasReply && thread.lastReceived)
        .map(thread => {
            const lastMessage = thread.lastReceived!;
            return {
                subject: lastMessage.subject.substring(0, 25) + (lastMessage.subject.length > 25 ? '...' : ''),
                from: lastMessage.from.split('@')[0],
                received: lastMessage.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                rawDate: lastMessage.timestamp,
                link: lastMessage.link,
                important: lastMessage.important
            };
        });

    const waitingForReply = Array.from(threadsByThreadId.values())
        .map(thread => {
            // Find the last message in the thread
            const lastMessage = thread.messages.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
            return { lastMessage, thread };
        })
        .filter(({ lastMessage }) => lastMessage.direction === 'sent')
        .map(({ lastMessage }) => {
            const recipients = lastMessage.to.map(t => t.split('@')[0]).join(', ');
            return {
                subject: lastMessage.subject.substring(0, 25) + (lastMessage.subject.length > 25 ? '...' : ''),
                to: recipients,
                sent: lastMessage.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                rawDate: lastMessage.timestamp,
                link: lastMessage.link,
                important: lastMessage.important
            }
        });

    // --- III. Slack Analytics ---
    const slackVolume = slackMessages.reduce((acc, msg) => {
        const date = msg.timestamp.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { date, dm: 0, channel: 0 };
        if (msg.channelType === 'im') acc[date].dm++;
        else acc[date].channel++;
        return acc;
    }, {} as Record<string, { date: string, dm: number, channel: number }>);
    
    // --- IV. Meeting Analytics ---
    const timeAllocation = meetings.reduce((acc, meeting) => {
        const existing = acc.find(item => item.name === meeting.type);
        if (existing) {
            existing.value += meeting.duration;
        } else {
            acc.push({ name: meeting.type, value: meeting.duration });
        }
        return acc;
    }, [] as { name: string, value: number }[]);
        
    // --- V. Relationship Insights ---
    const topPartners: TopPartnerDataPoint[] = Object.entries(contactCountsByType)
        .map(([contact, counts]) => ({
            contact,
            ...counts,
            total: counts.email + counts.slack + counts.meetings
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    
    const reciprocity = topPartners.map(p => {
        const email = slackNameToEmailMap.get(p.contact) || richContacts.find(c => c.email.startsWith(p.contact))?.email;
        if (!email) return { contact: p.contact, ratio: 'N/A'};

        const sent = emails.filter(e => e.direction === 'sent' && e.to.includes(email)).length +
            slackMessages.filter(s => s.direction === 'sent' && s.channelType === 'im' && slackNameToEmailMap.get(s.channel) === email).length;
        const received = emails.filter(e => e.direction === 'received' && e.from === email).length +
            slackMessages.filter(s => s.direction === 'received' && slackNameToEmailMap.get(s.user) === email).length;
        return { contact: p.contact, ratio: received > 0 ? `${(sent/received).toFixed(1)} : 1` : `${sent} : 0` };
    });

    // --- VI. Sentiment Analysis ---
    const sentEmails = emails.filter(e => e.direction === 'sent');
    const receivedEmails = emails.filter(e => e.direction === 'received');
    
    const sentimentAnalysis = {
        sentTopics: analyzeSentimentByTopic(sentEmails, 'sent'),
        receivedTopics: analyzeSentimentByTopic(receivedEmails, 'received'),
        sentHeatmap: generateHeatmapData(sentEmails),
        receivedHeatmap: generateHeatmapData(receivedEmails),
    };

    return {
        summary: { communicationPulse, topContacts, activityByHour, meetingStats },
        email: { 
            volume: Object.values(emailVolume).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
            unrepliedThreads,
            waitingForReply
        },
        slack: { 
            volume: Object.values(slackVolume).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        },
        meetings: { timeAllocation },
        relationships: { topPartners, reciprocity },
        sentimentAnalysis,
    };
};
