#!/usr/bin/env python3
"""
Enhanced Analytics Service for 360Brief
Provides real email processing and executive intelligence generation
"""

import logging
import json
from flask import Flask, request, jsonify, Response
from datetime import datetime, timedelta
import re
from typing import List, Dict, Any
from collections import defaultdict
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def group_similar_emails(emails: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Group similar emails by subject patterns and content themes"""

    groups = defaultdict(list)

    for email in emails:
        subject = email.get('subject', '').lower()
        body = email.get('body', '').lower()

        # Skip marketing/promotional emails - enhanced filtering
        marketing_keywords = [
            'unsubscribe', 'newsletter', 'deal', 'sale', 'offer', 'digest', 'weekly',
            'daily', 'rewards', 'program', 'special', 'limited time', 'discount',
            'free shipping', 'coupon', 'promotion', 'subscribe', 'marketing',
            'campaign', 'learn more', 'webinar', 'ebook', 'download', 'masterclass',
            'course', 'training', 'seminar', 'workshop', 'lunch', 'dinner',
            'food delivery', 'restaurant', 'pizza', 'delivery', 'order now'
        ]

        marketing_domains = [
            'myrewardsprogram.net', 'substack.com', 'noreply@', 'no-reply@',
            'donotreply@', 'marketing@', 'newsletter@', 'promo@', 'offers@',
            'email.informeddelivery.usps.com', 'learning@ivy.com', 'yogawithninag.com',
            'mypatientvisit.com', 'derickdermatology.com'
        ]

        from_data = email.get('from', '')
        if isinstance(from_data, dict):
            from_email = from_data.get('email', '')
        else:
            from_email = from_data.lower()

        # Check if it's a marketing email by subject keywords
        if any(word in subject for word in marketing_keywords):
            continue

        # Check if it's from a marketing domain or email pattern
        if any(domain in from_email for domain in marketing_domains):
            continue

        # Skip emails with marketing phrases in the body
        body_text = email.get('body', '').lower()
        if any(phrase in body_text for phrase in ['click here', 'unsubscribe', 'view in browser', 'privacy policy']):
            continue

        # Group by subject patterns (remove Re:, Fwd:, etc.)
        clean_subject = re.sub(r'^(re|fwd|fw):\s*', '', subject).strip()

        # Extract key terms for grouping
        key_terms = []

        # Extract common project/topic keywords
        project_patterns = [
            r'\b(project|sprint|release|milestone|launch)\s+([a-z0-9-_]+)',
            r'\b([a-z0-9-_]+)\s+(project|initiative|program)',
            r'\b(meeting|call|discussion)\s+([a-z0-9-_\s]+)',
            r'\b(issue|ticket|bug)\s+#?([a-z0-9-_]+)',
            r'\b(feature|enhancement|update)\s+([a-z0-9-_\s]+)'
        ]

        for pattern in project_patterns:
            matches = re.findall(pattern, clean_subject + ' ' + body[:200])
            for match in matches:
                if isinstance(match, tuple):
                    key_terms.extend([term.strip() for term in match if len(term.strip()) > 2])
                else:
                    key_terms.append(match.strip())

        # Create group key based on key terms or subject
        if key_terms:
            group_key = ' '.join(sorted(set(key_terms))[:2])  # Use top 2 key terms
        else:
            # Fall back to first 3 words of subject
            words = clean_subject.split()[:3]
            group_key = ' '.join(words) if words else 'misc'

        groups[group_key].append(email)

    # Filter out groups with only 1 email unless they're high priority
    filtered_groups = {}
    for key, emails_in_group in groups.items():
        if len(emails_in_group) > 1:
            filtered_groups[key] = emails_in_group
        else:
            # Keep single emails if they contain urgent/important keywords
            email = emails_in_group[0]
            if any(word in email.get('subject', '').lower() for word in ['urgent', 'asap', 'critical', 'issue', 'bug']):
                filtered_groups[key] = emails_in_group
            else:
                # Add to misc group
                if 'misc' not in filtered_groups:
                    filtered_groups['misc'] = []
                filtered_groups['misc'].extend(emails_in_group)

    return filtered_groups

def extract_key_insights(emails: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract key insights from emails for executive briefing"""

    # Group similar emails first
    email_groups = group_similar_emails(emails)

    # Initialize counters and collections
    action_items = []
    decisions_needed = []
    project_updates = []
    blockers = []
    achievements = []
    key_contacts = {}
    urgent_items = []

    # Track themes and patterns
    topic_summaries = []

    # Keywords for classification
    action_keywords = ['action', 'todo', 'task', 'need', 'require', 'must', 'should', 'please', 'asap', 'urgent']
    decision_keywords = ['decide', 'decision', 'approve', 'approval', 'confirm', 'review', 'feedback']
    blocker_keywords = ['blocked', 'blocker', 'stuck', 'issue', 'problem', 'delay', 'risk', 'concern']
    achievement_keywords = ['completed', 'achieved', 'success', 'launched', 'delivered', 'won', 'milestone']
    project_keywords = ['project', 'initiative', 'program', 'sprint', 'release', 'phase']

    # Process each group to extract insights
    for group_key, group_emails in email_groups.items():
        if not group_emails:
            continue

        # Create a summary for this topic/group
        group_senders = set()
        group_actions = []
        group_subjects = []

        for email in group_emails:
            subject = email.get('subject', '').lower()
            body = email.get('body', '').lower()
            from_data = email.get('from', '')
            if isinstance(from_data, dict):
                from_email = from_data.get('email', '')
            else:
                from_email = from_data
            date = email.get('date', '')

            group_senders.add(from_email)
            group_subjects.append(email.get('subject', 'No subject'))

            # Track key contacts
            if from_email:
                if from_email not in key_contacts:
                    key_contacts[from_email] = 0
                key_contacts[from_email] += 1

            # Extract action items
            if any(keyword in body for keyword in action_keywords):
                sentences = re.split('[.!?]', body)
                for sentence in sentences:
                    if any(keyword in sentence for keyword in action_keywords) and len(sentence) > 20:
                        action_items.append({
                            'item': sentence.strip()[:200],
                            'from': from_email,
                            'subject': email.get('subject', 'No subject'),
                            'date': date,
                            'group': group_key
                        })
                        group_actions.append(sentence.strip()[:100])
                        break

            # Extract decisions needed
            if any(keyword in body for keyword in decision_keywords):
                decisions_needed.append({
                    'topic': email.get('subject', 'No subject'),
                    'from': from_email,
                    'date': date,
                    'snippet': body[:150],
                    'group': group_key
                })

            # Extract blockers
            if any(keyword in body for keyword in blocker_keywords):
                blockers.append({
                    'issue': email.get('subject', 'No subject'),
                    'from': from_email,
                    'date': date,
                    'context': body[:200],
                    'group': group_key
                })

            # Extract achievements
            if any(keyword in body for keyword in achievement_keywords):
                achievements.append({
                    'achievement': email.get('subject', 'No subject'),
                    'from': from_email,
                    'date': date,
                    'details': body[:200],
                    'group': group_key
                })

            # Extract project updates
            if any(keyword in body for keyword in project_keywords):
                project_updates.append({
                    'project': email.get('subject', 'No subject'),
                    'from': from_email,
                    'date': date,
                    'update': body[:200],
                    'group': group_key
                })

            # Check for urgent items
            if 'urgent' in subject or 'asap' in subject or 'urgent' in body[:200]:
                urgent_items.append({
                    'item': email.get('subject', 'No subject'),
                    'from': from_email,
                    'date': date,
                    'group': group_key
                })

        # Create topic summary for groups with multiple emails
        if len(group_emails) > 1:
            topic_summaries.append({
                'topic': group_key.title(),
                'email_count': len(group_emails),
                'participants': list(group_senders),
                'sample_subjects': group_subjects[:3],
                'actions_identified': len(group_actions),
                'summary': f"{len(group_emails)} related emails about {group_key}, involving {len(group_senders)} participants"
            })

    # Get top contacts
    top_contacts = sorted(key_contacts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        'total_emails': len(emails),
        'email_groups': len(email_groups),
        'topic_summaries': topic_summaries[:5],
        'action_items': action_items[:10],  # Top 10
        'decisions_needed': decisions_needed[:5],
        'project_updates': project_updates[:10],
        'blockers': blockers[:5],
        'achievements': achievements[:5],
        'urgent_items': urgent_items[:5],
        'top_contacts': [{'email': c[0], 'count': c[1]} for c in top_contacts],
        'stats': {
            'total_action_items': len(action_items),
            'total_decisions': len(decisions_needed),
            'total_blockers': len(blockers),
            'total_achievements': len(achievements),
            'total_groups': len(email_groups)
        }
    }

def generate_executive_brief(insights: Dict[str, Any]) -> Dict[str, Any]:
    """Generate an executive brief in mission brief format"""

    # Generate TLDR
    critical_count = len(insights['urgent_items']) + len(insights['blockers'])
    total_actions = insights['stats']['total_action_items']
    topic_count = insights.get('email_groups', 0)

    tldr = f"{total_actions} total actions, {critical_count} critical"
    if topic_count > 0:
        tldr += f", {topic_count} topic groups identified. "
    else:
        tldr += ". "

    if critical_count > 2:
        tldr += "High operational tempo."
    elif critical_count > 0:
        tldr += "Elevated operational tempo."
    else:
        tldr += "Standard operational tempo."

    # Generate immediate actions from action items and urgent items
    immediate_actions = []

    # Add urgent items first
    for item in insights['urgent_items'][:5]:
        immediate_actions.append({
            'title': f"🔥 {item['item'][:50]}...",
            'objective': f"URGENT: {item['item']} (from {item['from']})",
            'owner': 'TBD',
            'dueDate': (datetime.now() + timedelta(hours=24)).isoformat()
        })

    # Add high-priority action items
    for action in insights['action_items'][:8]:
        if len(immediate_actions) >= 8:
            break
        immediate_actions.append({
            'title': f"📧 {action['subject'][:50]}",
            'objective': f"{action['item'][:150]} (from {action['from']})",
            'owner': 'TBD',
            'dueDate': (datetime.now() + timedelta(days=1)).isoformat()
        })

    # Generate business impact
    business_impact = []

    # Add topic summary info
    if insights.get('topic_summaries'):
        top_topics = sorted(insights['topic_summaries'], key=lambda x: x['email_count'], reverse=True)[:3]
        for topic in top_topics:
            business_impact.append(f"{topic['email_count']} emails about {topic['topic']} ({topic['actions_identified']} actions)")

    if insights['stats']['total_blockers'] > 0:
        business_impact.append(f"{insights['stats']['total_blockers']} blockers requiring resolution")
    if insights['stats']['total_decisions'] > 0:
        business_impact.append(f"{insights['stats']['total_decisions']} decisions pending approval")
    if insights['stats']['total_achievements'] > 0:
        business_impact.append(f"{insights['stats']['total_achievements']} recent achievements to celebrate")

    if not business_impact:
        business_impact = ["Standard operational status"]

    # Generate winbox (achievements)
    winbox = []
    for achievement in insights['achievements'][:3]:
        winbox.append({
            'title': achievement['achievement'],
            'description': achievement['details'][:100] + '...' if len(achievement['details']) > 100 else achievement['details'],
            'date': achievement['date']
        })

    # Generate trends
    trends = []

    # Add topic-based trends
    if insights.get('topic_summaries'):
        top_topics = sorted(insights['topic_summaries'], key=lambda x: x['email_count'], reverse=True)[:2]
        for topic in top_topics:
            trends.append(f"• {topic['email_count']} related emails about {topic['topic']} with {len(topic['participants'])} participants")

    if insights['stats']['total_action_items'] > 5:
        trends.append("• High volume of action items requiring attention")
    if insights['stats']['total_blockers'] > 0:
        trends.append(f"• {insights['stats']['total_blockers']} active blockers impacting progress")
    if insights['stats']['total_achievements'] > 0:
        trends.append(f"• {insights['stats']['total_achievements']} positive outcomes this period")

    if not trends:
        trends = ["• Standard operational tempo with routine communications"]

    return {
        'userId': 'generated',
        'generatedAt': datetime.now().isoformat(),
        'style': 'mission_brief',
        'version': '2.0',
        'subject': '📊 Executive Intelligence Brief - Priority Actions & Status Update',
        'tldr': tldr,
        'missionBrief': {
            'currentStatus': {
                'primaryIssue': f"{critical_count} critical items requiring prioritization" if critical_count > 0 else "0 critical items requiring prioritization",
                'businessImpact': business_impact
            },
            'immediateActions': immediate_actions,
            'resourceAuthorization': {
                'total': 5000,
                'items': [
                    {
                        'category': 'Technical Resources',
                        'amount': 3000,
                        'bullets': [
                            'Engineering support',
                            'Infrastructure scaling',
                            'Monitoring enhancement'
                        ]
                    },
                    {
                        'category': 'Operations Support',
                        'amount': 2000,
                        'bullets': [
                            'Project coordination',
                            'Communication management',
                            'Process optimization'
                        ]
                    }
                ]
            },
            'escalationContacts': [
                {'name': contact['email'], 'count': contact['count']}
                for contact in insights['top_contacts'][:3]
            ],
            'windowEmphasisNote': 'Timely execution critical for maintaining operational momentum.' if critical_count > 0 else 'Standard execution timeframes apply.'
        },
        'winbox': winbox,
        'trends': trends,
        'processing_metadata': {
            'total_emails_processed': insights['total_emails'],
            'processing_method': 'enhanced_intelligence',
            'insights_extracted': {
                'action_items': insights['stats']['total_action_items'],
                'decisions': insights['stats']['total_decisions'],
                'blockers': insights['stats']['total_blockers'],
                'achievements': insights['stats']['total_achievements']
            },
            'version': '2.0'
        }
    }

@app.route('/analytics/stream', methods=['GET'])
def analytics_stream():
    """Stream analytics endpoint - returns data for dashboard"""
    user_id = request.args.get('user_id')
    data_sources = request.args.get('data_sources', 'gmail')
    days_back = int(request.args.get('days_back', '7'))

    logger.info(f"Analytics stream requested for user: {user_id}")

    # For now, return a structure that the frontend expects
    # In production, this would fetch real data from database
    return jsonify({
        'status': 'success',
        'user_id': user_id,
        'emails': [],  # Will be populated by the frontend's own Gmail fetching
        'insights': {
            'total_processed': 0,
            'processing_method': 'streaming',
            'themes': [],
            'recommendations': []
        },
        'generated_at': datetime.now().isoformat()
    })

@app.route('/generate-brief', methods=['POST'])
def generate_brief():
    """Generate an executive brief from email data"""
    try:
        data = request.get_json()
        emails = data.get('emails', [])
        user_id = data.get('user_id')

        logger.info(f"Generating brief for user {user_id} with {len(emails)} emails")

        if not emails:
            return jsonify({
                'error': 'No emails provided',
                'sections': [],
                'insights': {}
            }), 400

        # Extract insights
        insights = extract_key_insights(emails)

        # Generate executive brief
        brief = generate_executive_brief(insights)

        logger.info(f"Brief generated successfully with {len(brief['missionBrief']['immediateActions'])} actions")

        return jsonify(brief)

    except Exception as e:
        logger.error(f"Error generating brief: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/summarize', methods=['POST'])
def summarize():
    """Legacy summarization endpoint for compatibility"""
    try:
        data = request.get_json()
        emails = data.get('emails', [])

        logger.info(f"Summarizing {len(emails)} emails")

        summaries = []
        for email in emails:
            email_id = email.get('id')
            content = email.get('content', '')

            # Simple extractive summary (first 150 chars)
            summary = content[:150] + '...' if len(content) > 150 else content

            # Extract key points (simple heuristic)
            sentences = re.split('[.!?]', content)
            key_points = [s.strip() for s in sentences[:3] if len(s.strip()) > 20]

            # Extract actions (look for action keywords)
            action_keywords = ['please', 'need', 'require', 'must', 'should', 'action']
            actions = []
            for sentence in sentences:
                if any(keyword in sentence.lower() for keyword in action_keywords):
                    actions.append(sentence.strip())
                    if len(actions) >= 2:
                        break

            summaries.append({
                'id': email_id,
                'summary': summary,
                'key_points': key_points or ['Email content summarized'],
                'actions': actions or ['No specific actions identified']
            })

        return jsonify({'summaries': summaries})

    except Exception as e:
        logger.error(f"Error in summarization: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'enhanced_analytics', 'version': '2.0'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    logger.info(f"Starting Enhanced Analytics Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)