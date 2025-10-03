#!/usr/bin/env python3
"""
Gmail Data Processor - Smart Gmail Data Processing for Executive Intelligence

This processor optimizes Gmail data extraction for executive briefing generation.
It focuses on privacy-first, process-and-discard approach while extracting maximum
intelligence value from email communications.

Key features:
- Smart filtering to exclude marketing/promotional content
- Privacy-focused metadata extraction
- Executive-relevant content scoring
- Efficient batch processing with rate limiting
"""

import re
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import base64
import json

logger = logging.getLogger(__name__)

@dataclass
class ProcessedEmail:
    id: str
    subject: str
    body: str
    from_info: Dict[str, str]
    to_info: List[str]
    date: str
    snippet: str
    thread_id: str
    labels: List[str]
    metadata: Dict[str, Any]
    executive_score: float

class GmailDataProcessor:
    """
    Smart Gmail Data Processor for Executive Intelligence

    Processes Gmail data with focus on executive-relevant content extraction
    while maintaining privacy and efficiency.
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Marketing/promotional email indicators
        self.marketing_indicators = [
            'unsubscribe', 'newsletter', 'promotional', 'marketing',
            'noreply', 'no-reply', 'donotreply', 'do-not-reply',
            'bulk', 'campaign', 'mailchimp', 'constantcontact',
            'offer', 'deal', 'sale', 'discount', 'coupon',
            'subscribe now', 'limited time', 'act now'
        ]

        # Executive-relevant sender patterns
        self.executive_senders = [
            r'@(?:gov|mil)$',  # Government emails
            r'(?i)(ceo|cto|cfo|vp|president|director|manager)',
            r'(?i)(board|executive|leadership|senior)',
            r'(?i)(legal|compliance|audit|finance)',
            r'(?i)(investor|shareholder|board)'
        ]

        # High-priority keywords for executive attention
        self.executive_keywords = [
            'urgent', 'critical', 'decision', 'approval', 'budget',
            'contract', 'legal', 'compliance', 'audit', 'board',
            'investor', 'revenue', 'profit', 'loss', 'risk',
            'deadline', 'merger', 'acquisition', 'partnership',
            'crisis', 'emergency', 'escalation', 'lawsuit',
            'regulation', 'policy', 'strategy', 'competitor'
        ]

        # Content patterns that indicate executive relevance
        self.executive_patterns = [
            r'(?i)(board meeting|executive team|leadership)',
            r'(?i)(quarterly results|annual report|financial)',
            r'(?i)(budget approval|spending|investment)',
            r'(?i)(contract.*sign|agreement.*review)',
            r'(?i)(legal.*matter|compliance.*issue)',
            r'(?i)(strategic.*decision|policy.*change)',
            r'(?i)(risk.*assessment|audit.*finding)',
            r'(?i)(investor.*relation|shareholder)',
            r'(?i)(merger|acquisition|partnership)',
            r'(?i)(crisis.*management|emergency.*response)'
        ]

    def is_marketing_email(self, email_data: Dict) -> bool:
        """Determine if email is marketing/promotional content"""
        subject = email_data.get('subject', '').lower()
        body = email_data.get('body', '').lower()
        sender = email_data.get('from', '').lower()
        snippet = email_data.get('snippet', '').lower()

        # Check for marketing indicators
        combined_text = f"{subject} {body} {sender} {snippet}"

        # Strong marketing indicators
        for indicator in self.marketing_indicators:
            if indicator in combined_text:
                return True

        # Check Gmail labels
        labels = email_data.get('labels', [])
        marketing_labels = ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'SPAM']
        if any(label in labels for label in marketing_labels):
            return True

        # Check for promotional patterns
        promotional_patterns = [
            r'(?i)(click here|visit our website|shop now)',
            r'(?i)(free trial|limited offer|expires soon)',
            r'(?i)(newsletter|subscription|mailing list)',
            r'(?i)(% off|discount|sale|promo code)',
            r'(?i)(unsubscribe|opt.?out|remove.*list)'
        ]

        for pattern in promotional_patterns:
            if re.search(pattern, combined_text):
                return True

        return False

    def calculate_executive_score(self, email_data: Dict) -> float:
        """Calculate executive relevance score (0-100)"""
        score = 0.0

        subject = email_data.get('subject', '').lower()
        body = email_data.get('body', '').lower()
        sender = email_data.get('from', '').lower()
        snippet = email_data.get('snippet', '').lower()
        combined_text = f"{subject} {body} {snippet}"

        # Base score factors
        base_score = 30.0  # Default for non-marketing emails

        # Sender importance (0-25 points)
        sender_score = 0.0
        for pattern in self.executive_senders:
            if re.search(pattern, sender):
                sender_score = 25.0
                break

        # Check for executive titles in sender name
        if any(title in sender for title in ['ceo', 'cto', 'cfo', 'vp', 'president', 'director']):
            sender_score = max(sender_score, 20.0)

        # Keywords relevance (0-30 points)
        keyword_score = 0.0
        keyword_matches = sum(1 for keyword in self.executive_keywords if keyword in combined_text)
        keyword_score = min(keyword_matches * 3.0, 30.0)

        # Executive patterns (0-25 points)
        pattern_score = 0.0
        for pattern in self.executive_patterns:
            if re.search(pattern, combined_text):
                pattern_score += 5.0
        pattern_score = min(pattern_score, 25.0)

        # Content quality indicators (0-20 points)
        quality_score = 0.0

        # Length indicator (substantial emails more likely important)
        if len(body) > 500:
            quality_score += 5.0
        if len(body) > 1500:
            quality_score += 5.0

        # Internal/external communication
        if '@' in body and len(body) > 200:  # Email thread
            quality_score += 3.0

        # Urgency indicators
        urgency_words = ['urgent', 'asap', 'immediately', 'critical', 'deadline']
        if any(word in combined_text for word in urgency_words):
            quality_score += 7.0

        # Financial indicators
        if re.search(r'\$[\d,]+|\b\d+\s*(?:million|billion|thousand)\b', combined_text):
            quality_score += 5.0

        quality_score = min(quality_score, 20.0)

        # Calculate final score
        final_score = base_score + sender_score + keyword_score + pattern_score + quality_score

        # Penalties for low-value content
        if len(combined_text) < 50:  # Very short emails
            final_score *= 0.7

        if 'out of office' in combined_text or 'vacation' in combined_text:
            final_score *= 0.3

        return min(final_score, 100.0)

    def extract_email_metadata(self, email_data: Dict) -> Dict[str, Any]:
        """Extract metadata for executive intelligence"""
        metadata = {
            'processing_timestamp': datetime.now().isoformat(),
            'is_marketing': self.is_marketing_email(email_data),
            'executive_score': self.calculate_executive_score(email_data),
            'content_indicators': {
                'has_attachments': email_data.get('has_attachments', False),
                'is_thread': bool(email_data.get('thread_id')),
                'word_count': len(email_data.get('body', '').split()),
                'contains_financial_terms': bool(re.search(r'\$[\d,]+|budget|cost|revenue|profit', email_data.get('body', ''), re.IGNORECASE)),
                'contains_deadline': bool(re.search(r'deadline|due.*by|urgent|asap', email_data.get('body', ''), re.IGNORECASE)),
                'contains_decision_language': bool(re.search(r'decision|approve|sign|authorize', email_data.get('body', ''), re.IGNORECASE))
            }
        }

        return metadata

    def parse_sender_info(self, from_header: str) -> Dict[str, str]:
        """Parse sender information from email header"""
        if not from_header:
            return {'name': 'Unknown', 'email': 'unknown@example.com'}

        # Handle "Name <email@domain.com>" format
        match = re.match(r'^(.+?)\s*<(.+?)>$', from_header.strip())
        if match:
            name = match.group(1).strip().strip('"\'')
            email = match.group(2).strip()
            return {'name': name, 'email': email}

        # Handle plain email format
        if '@' in from_header:
            return {'name': from_header.split('@')[0], 'email': from_header.strip()}

        # Fallback
        return {'name': from_header.strip(), 'email': 'unknown@example.com'}

    def parse_to_info(self, to_header: str) -> List[str]:
        """Parse recipient information"""
        if not to_header:
            return []

        # Split by comma and clean up
        recipients = []
        for recipient in to_header.split(','):
            recipient = recipient.strip()
            if recipient:
                # Extract email if in "Name <email>" format
                match = re.search(r'<(.+?)>', recipient)
                if match:
                    recipients.append(match.group(1))
                elif '@' in recipient:
                    recipients.append(recipient)

        return recipients[:10]  # Limit to 10 recipients

    def clean_email_body(self, raw_body: str) -> str:
        """Clean and extract meaningful content from email body"""
        if not raw_body:
            return ""

        # Remove HTML tags
        clean_body = re.sub(r'<[^>]+>', '', raw_body)

        # Clean up common email artifacts
        clean_body = re.sub(r'&nbsp;|\u00a0', ' ', clean_body)  # Non-breaking spaces
        clean_body = re.sub(r'&[a-zA-Z]+;', '', clean_body)  # HTML entities
        clean_body = re.sub(r'\s+', ' ', clean_body)  # Multiple whitespace

        # Remove email signatures (common patterns)
        signature_patterns = [
            r'\n\s*--\s*\n.*',  # Standard signature separator
            r'\n\s*Best regards?,.*',
            r'\n\s*Sincerely,.*',
            r'\n\s*Thanks?,.*\n[A-Z][a-z]+ [A-Z][a-z]+',  # Thanks, Name
            r'\n\s*Sent from my.*',  # Mobile signatures
        ]

        for pattern in signature_patterns:
            clean_body = re.sub(pattern, '', clean_body, flags=re.DOTALL | re.IGNORECASE)

        # Remove excessive quoted content (keep some for context)
        lines = clean_body.split('\n')
        non_quoted_lines = []
        quote_count = 0

        for line in lines:
            if line.strip().startswith('>') or line.strip().startswith('On ') and ' wrote:' in line:
                quote_count += 1
                if quote_count <= 3:  # Keep first few quoted lines for context
                    non_quoted_lines.append(line)
            else:
                quote_count = 0
                non_quoted_lines.append(line)

        clean_body = '\n'.join(non_quoted_lines)

        # Limit length for processing efficiency
        if len(clean_body) > 3000:
            clean_body = clean_body[:3000] + '...'

        return clean_body.strip()

    async def process_gmail_messages(self, gmail_messages: List[Dict],
                                   filter_marketing: bool = True,
                                   min_executive_score: float = 40.0) -> List[ProcessedEmail]:
        """
        Process Gmail messages for executive intelligence

        Args:
            gmail_messages: Raw Gmail message data
            filter_marketing: Whether to filter out marketing emails
            min_executive_score: Minimum score for inclusion (0-100)

        Returns:
            List of ProcessedEmail objects ready for intelligence analysis
        """

        self.logger.info(f"📧 Processing {len(gmail_messages)} Gmail messages")

        processed_emails = []
        filtered_count = 0
        marketing_count = 0

        for i, message in enumerate(gmail_messages):
            try:
                # Extract basic email data
                email_data = {
                    'id': message.get('id', f'msg_{i}'),
                    'subject': message.get('subject', '(no subject)'),
                    'body': self.clean_email_body(message.get('body', message.get('snippet', ''))),
                    'from': message.get('from', ''),
                    'to': message.get('to', []),
                    'date': message.get('date', ''),
                    'snippet': message.get('snippet', ''),
                    'thread_id': message.get('threadId', message.get('thread_id', '')),
                    'labels': message.get('labels', message.get('labelIds', [])),
                    'has_attachments': message.get('has_attachments', False)
                }

                # Check if marketing email
                if filter_marketing and self.is_marketing_email(email_data):
                    marketing_count += 1
                    continue

                # Calculate executive score
                executive_score = self.calculate_executive_score(email_data)

                # Filter by minimum score
                if executive_score < min_executive_score:
                    filtered_count += 1
                    continue

                # Parse sender and recipient information
                from_info = self.parse_sender_info(email_data['from'])
                to_info = self.parse_to_info(','.join(email_data['to']) if isinstance(email_data['to'], list) else email_data['to'])

                # Extract metadata
                metadata = self.extract_email_metadata(email_data)
                metadata['executive_score'] = executive_score

                # Create processed email object
                processed_email = ProcessedEmail(
                    id=email_data['id'],
                    subject=email_data['subject'],
                    body=email_data['body'],
                    from_info=from_info,
                    to_info=to_info,
                    date=email_data['date'],
                    snippet=email_data['snippet'],
                    thread_id=email_data['thread_id'],
                    labels=email_data['labels'],
                    metadata=metadata,
                    executive_score=executive_score
                )

                processed_emails.append(processed_email)

            except Exception as e:
                self.logger.warning(f"Failed to process email {i}: {e}")
                continue

        # Sort by executive score (highest first)
        processed_emails.sort(key=lambda x: x.executive_score, reverse=True)

        self.logger.info(f"✅ Processed {len(processed_emails)} executive-relevant emails")
        self.logger.info(f"📊 Filtered out {marketing_count} marketing emails, {filtered_count} low-score emails")

        return processed_emails

    def convert_to_intelligence_format(self, processed_emails: List[ProcessedEmail]) -> List[Dict[str, Any]]:
        """Convert processed emails to format expected by intelligence engine"""
        intelligence_emails = []

        for email in processed_emails:
            intelligence_email = {
                'id': email.id,
                'subject': email.subject,
                'body': email.body,
                'from': email.from_info,
                'to': email.to_info,
                'date': email.date,
                'snippet': email.snippet,
                'threadId': email.thread_id,
                'labels': email.labels,
                'metadata': email.metadata,
                'executive_score': email.executive_score
            }
            intelligence_emails.append(intelligence_email)

        return intelligence_emails

async def process_gmail_data_for_brief(gmail_messages: List[Dict],
                                     user_id: str = None,
                                     filter_marketing: bool = True,
                                     min_executive_score: float = 40.0) -> Dict[str, Any]:
    """
    Main function to process Gmail data for executive brief generation

    This function:
    1. Processes raw Gmail messages
    2. Filters marketing/promotional content
    3. Scores emails for executive relevance
    4. Prepares data for intelligence engine

    Args:
        gmail_messages: Raw Gmail message data
        user_id: User identifier
        filter_marketing: Whether to filter marketing emails
        min_executive_score: Minimum relevance score for inclusion

    Returns:
        Dictionary with processed email data and statistics
    """

    processor = GmailDataProcessor()

    # Process the emails
    processed_emails = await processor.process_gmail_messages(
        gmail_messages,
        filter_marketing=filter_marketing,
        min_executive_score=min_executive_score
    )

    # Convert to intelligence engine format
    intelligence_emails = processor.convert_to_intelligence_format(processed_emails)

    # Generate processing statistics
    total_processed = len(processed_emails)
    high_priority_count = len([e for e in processed_emails if e.executive_score >= 70])
    avg_score = sum(e.executive_score for e in processed_emails) / max(total_processed, 1)

    processing_stats = {
        'original_count': len(gmail_messages),
        'processed_count': total_processed,
        'high_priority_count': high_priority_count,
        'average_executive_score': round(avg_score, 1),
        'processing_timestamp': datetime.now().isoformat(),
        'filter_settings': {
            'marketing_filtered': filter_marketing,
            'min_executive_score': min_executive_score
        }
    }

    logger.info(f"📊 Gmail processing complete: {total_processed} executive-relevant emails from {len(gmail_messages)} total")
    logger.info(f"🎯 {high_priority_count} high-priority emails (score ≥70), average score: {avg_score:.1f}")

    return {
        'processed_emails': intelligence_emails,
        'processing_stats': processing_stats,
        'user_id': user_id
    }