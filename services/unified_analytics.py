#!/usr/bin/env python3
"""
Unified Analytics Service for 360Brief
Combines summarization and executive intelligence generation on port 8000
"""

import logging
import json
from flask import Flask, request, jsonify, Response
from datetime import datetime, timedelta
import re
from typing import List, Dict, Any
import os
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# --- Email Content Cleaning ---
def clean_email_content(text: str) -> str:
    """Clean email content of HTML, formatting artifacts, and noise"""
    if not text:
        return ""

    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)

    # Remove common email artifacts
    text = re.sub(r'(font-family:|font-size:|color:|style:|class=)[^;}\s]*[;}]?', '', text)
    text = re.sub(r'[{}]', ' ', text)  # Remove remaining braces

    # Remove email headers and signatures
    text = re.sub(r'^(From:|To:|Subject:|Date:|Sent:|Received:).*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'(On .* wrote:|-----Original Message----)', '', text)
    text = re.sub(r'> .*$', '', text, flags=re.MULTILINE)  # Remove quoted text

    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n', text)

    # Remove common disclaimers and footers
    text = re.sub(r'(if you are not.*intended recipient.*|this message.*confidential.*)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'(unsubscribe|privacy policy|terms of service)', '', text, flags=re.IGNORECASE)

    return text.strip()

# --- Model Loading ---
class SummarizationModel:
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        logger.info(f"Initializing model on device: {'CUDA' if self.device == 0 else 'CPU'}")

        model_name = "facebook/bart-large-cnn"
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            self.summarizer = pipeline(
                "summarization",
                model=model,
                tokenizer=tokenizer,
                device=self.device
            )
            logger.info("Summarization model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.summarizer = None

    def summarize(self, text: str) -> dict:
        """Generates a summary and extracts key points and actions."""
        if not self.summarizer or not text.strip():
            return {
                'summary': 'No content provided or model not available.',
                'key_points': [],
                'actions': []
            }

        try:
            summary_text = self.summarizer(
                text,
                max_length=150,
                min_length=30,
                do_sample=False,
                truncation=True
            )[0]['summary_text']

            # Simple extraction for key points and actions
            sentences = [s.strip() for s in summary_text.split('.') if s.strip()]
            action_keywords = ['review', 'approve', 'send', 'schedule', 'confirm', 'provide', 'let me know']

            actions = [s for s in sentences if any(keyword in s.lower() for keyword in action_keywords)]
            key_points = [s for s in sentences if s not in actions]

            return {
                'summary': summary_text,
                'key_points': key_points if key_points else ['No key information identified.'],
                'actions': actions if actions else ['No specific actions identified.']
            }
        except Exception as e:
            logger.error(f"Error during summarization: {e}")
            return {
                'summary': 'Failed to generate summary.',
                'key_points': [],
                'actions': [],
                'error': str(e)
            }

# Initialize model globally
summarization_model = SummarizationModel()

def extract_key_insights(emails: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract key insights from emails for executive briefing"""

    # Initialize counters and collections
    action_items = []
    decisions_needed = []
    project_updates = []
    blockers = []
    achievements = []
    key_contacts = {}
    urgent_items = []

    # Keywords for classification
    action_keywords = ['action', 'todo', 'task', 'need', 'require', 'must', 'should', 'please', 'asap', 'urgent']
    decision_keywords = ['decide', 'decision', 'approve', 'approval', 'confirm', 'review', 'feedback']
    blocker_keywords = ['blocked', 'blocker', 'stuck', 'issue', 'problem', 'delay', 'risk', 'concern']
    achievement_keywords = ['completed', 'achieved', 'success', 'launched', 'delivered', 'won', 'milestone']
    project_keywords = ['project', 'initiative', 'program', 'sprint', 'release', 'phase']

    for email in emails:
        subject = email.get('subject', '').lower()
        raw_body = email.get('body', '')

        # Clean email body: remove HTML, excessive whitespace, email artifacts
        body = clean_email_content(raw_body).lower()

        # Handle from field - can be string or dict with email/name
        from_data = email.get('from', '')
        if isinstance(from_data, dict):
            from_email = from_data.get('email', from_data.get('name', ''))
        else:
            from_email = from_data

        date = email.get('date', '')

        # Skip marketing/promotional emails
        if any(word in subject for word in ['unsubscribe', 'newsletter', 'deal', 'sale', 'offer']):
            continue

        # Track key contacts
        if from_email:
            if from_email not in key_contacts:
                key_contacts[from_email] = 0
            key_contacts[from_email] += 1

        # Extract action items using smart content analysis
        if any(keyword in body for keyword in action_keywords):
            # Use cleaned body for better action extraction
            cleaned_body = clean_email_content(raw_body)
            sentences = [s.strip() for s in re.split('[.!?]', cleaned_body) if s.strip()]

            # Find the most actionable sentence
            best_action = None
            for sentence in sentences:
                if any(keyword in sentence.lower() for keyword in action_keywords) and len(sentence) > 20:
                    # Prefer sentences with specific action words
                    if any(word in sentence.lower() for word in ['please', 'need', 'should', 'must', 'asap']):
                        best_action = sentence[:150]
                        break
                    elif not best_action:
                        best_action = sentence[:150]

            if best_action:
                action_items.append({
                    'item': best_action,
                    'from': from_email,
                    'subject': email.get('subject', 'No subject'),
                    'date': date,
                    'priority': 'high' if any(urgent in body for urgent in ['urgent', 'asap', 'critical']) else 'medium'
                })

        # Extract decisions needed
        if any(keyword in body for keyword in decision_keywords):
            decisions_needed.append({
                'topic': email.get('subject', 'No subject'),
                'from': from_email,
                'date': date,
                'snippet': body[:150]
            })

        # Extract blockers
        if any(keyword in body for keyword in blocker_keywords):
            blockers.append({
                'issue': email.get('subject', 'No subject'),
                'from': from_email,
                'date': date,
                'context': body[:200]
            })

        # Extract achievements
        if any(keyword in body for keyword in achievement_keywords):
            achievements.append({
                'achievement': email.get('subject', 'No subject'),
                'from': from_email,
                'date': date,
                'details': body[:200]
            })

        # Extract project updates
        if any(keyword in body for keyword in project_keywords):
            project_updates.append({
                'project': email.get('subject', 'No subject'),
                'from': from_email,
                'date': date,
                'update': body[:200]
            })

        # Check for urgent items
        if 'urgent' in subject or 'asap' in subject or 'urgent' in body[:200]:
            urgent_items.append({
                'item': email.get('subject', 'No subject'),
                'from': from_email,
                'date': date
            })

    # Get top contacts
    top_contacts = sorted(key_contacts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        'total_emails': len(emails),
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
            'total_achievements': len(achievements)
        }
    }

def generate_executive_brief(insights: Dict[str, Any]) -> Dict[str, Any]:
    """Generate an executive brief in mission brief format"""

    # Generate TLDR
    critical_count = len(insights['urgent_items']) + len(insights['blockers'])
    total_actions = insights['stats']['total_action_items']

    tldr = f"{total_actions} total actions, {critical_count} critical. "
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

# --- API Endpoints ---

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'unified_analytics', 'version': '3.0'})

@app.route('/summarize', methods=['POST'])
def summarize():
    """Legacy summarization endpoint for compatibility"""
    if not summarization_model.summarizer:
        return jsonify({"error": "Summarization model is not available."}), 503

    data = request.get_json()
    if not data or 'emails' not in data or not isinstance(data['emails'], list):
        return jsonify({"error": "Invalid input. Expected a JSON object with an 'emails' list."}), 400

    results = []
    for email in data['emails']:
        email_id = email.get('id')
        content = email.get('content')

        if not email_id or not content:
            continue

        summary_data = summarization_model.summarize(content)
        summary_data['id'] = email_id
        results.append(summary_data)

    return jsonify({"summaries": results})

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

        logger.info(f"Brief generated successfully with {len(insights['action_items'])} action items")

        return jsonify(brief)

    except Exception as e:
        logger.error(f"Error generating brief: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analytics/stream', methods=['GET'])
def analytics_stream():
    """Stream analytics endpoint - returns data for dashboard"""
    user_id = request.args.get('user_id')
    data_sources = request.args.get('data_sources', 'gmail')
    days_back = int(request.args.get('days_back', '7'))

    logger.info(f"Analytics stream requested for user: {user_id}")

    # For now, return a structure that the frontend expects
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

@app.route('/process-email-batch', methods=['POST'])
def process_email_batch():
    """Process a batch of emails for intelligence extraction"""
    try:
        data = request.get_json()
        emails = data.get('emails', [])

        logger.info(f"Processing batch of {len(emails)} emails")

        # Extract intelligence from emails
        relevant = []
        filtered = 0

        for email in emails:
            content = email.get('content', '').lower()
            subject = email.get('subject', '').lower()

            # Filter out marketing/promotional emails
            if any(word in subject or word in content[:200] for word in
                   ['unsubscribe', 'newsletter', 'deal', 'sale', 'offer', 'promotion']):
                filtered += 1
                continue

            # Categorize email
            email_type = 'general'
            if any(word in content for word in ['urgent', 'asap', 'critical', 'emergency']):
                email_type = 'urgent'
            elif any(word in content for word in ['project', 'milestone', 'sprint', 'release']):
                email_type = 'project_update'
            elif any(word in content for word in ['blocked', 'issue', 'problem', 'stuck']):
                email_type = 'blocker'
            elif any(word in content for word in ['completed', 'achieved', 'success', 'launched']):
                email_type = 'achievement'

            relevant.append({
                'sender': email.get('sender', ''),
                'subject': email.get('subject', ''),
                'type': email_type,
                'key_summary': email.get('subject', ''),
                'date': email.get('date', '')
            })

        return jsonify({
            'relevant': len(relevant),
            'filtered': filtered,
            'results': relevant
        })

    except Exception as e:
        logger.error(f"Error processing email batch: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8002))
    logger.info(f"Starting Unified Analytics Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)