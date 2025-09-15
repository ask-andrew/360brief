# services/data_processing/real_intelligence_processor.py

import re
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import logging

class RealExecutiveIntelligenceProcessor:
    """
    Process real email content into actionable executive intelligence
    Remove all mock data and extract genuine insights
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def process_real_emails(self, emails: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process actual email content to extract executive intelligence
        """
        if not emails:
            return self._generate_empty_state_response()

        # Extract full content from real emails
        processed_emails = []
        for email in emails:
            processed = await self._extract_full_email_content(email)
            if processed:
                processed_emails.append(processed)

        if not processed_emails:
            return self._generate_empty_state_response()

        # Generate real insights
        insights = {
            'real_themes': await self._extract_real_themes(processed_emails),
            'real_people': await self._extract_real_people(processed_emails),
            'real_action_items': await self._extract_real_action_items(processed_emails),
            'real_urgency_items': await self._identify_urgent_items(processed_emails),
            'real_patterns': await self._identify_real_patterns(processed_emails),
            'email_analysis': self._analyze_email_characteristics(processed_emails)
        }

        # Generate executive brief from real data
        return await self._generate_real_executive_brief(insights, processed_emails)

    async def _extract_full_email_content(self, email: Dict) -> Optional[Dict]:
        """Extract full content from email, not just snippets"""
        try:
            # Get full body content
            body = email.get('body', '')
            if len(body) < 50:  # If body too short, try snippet
                body = email.get('snippet', '')

            # Clean and process the content
            cleaned_body = self._clean_email_content(body)

            if len(cleaned_body) < 20:  # Skip emails with no substantial content
                return None

            return {
                'id': email.get('id'),
                'subject': email.get('subject', ''),
                'from_name': email.get('from', {}).get('name', ''),
                'from_email': email.get('from', {}).get('email', ''),
                'body': cleaned_body,
                'full_body': body,  # Keep original for further analysis
                'date': email.get('date', ''),
                'snippet': email.get('snippet', ''),
                'thread_id': email.get('threadId', '')
            }
        except Exception as e:
            self.logger.error(f"Error processing email {email.get('id')}: {e}")
            return None

    def _clean_email_content(self, content: str) -> str:
        """Clean email content for analysis"""
        if not content:
            return ""

        # Remove HTML tags
        content = re.sub(r'<[^>]+>', ' ', content)

        # Remove email artifacts
        content = re.sub(r'On.*wrote:', '', content, flags=re.DOTALL)
        content = re.sub(r'From:.*To:.*Subject:.*', '', content, flags=re.DOTALL)

        # Remove excessive whitespace
        content = re.sub(r'\s+', ' ', content).strip()

        # Decode HTML entities
        content = content.replace('&#39;', "'").replace('&gt;', '>').replace('&lt;', '<')

        return content

    async def _extract_real_themes(self, emails: List[Dict]) -> List[Dict[str, Any]]:
        """Extract real themes from actual email content"""

        # Combine all email content
        all_text = " ".join([
            f"{email['subject']} {email['body']}"
            for email in emails
        ])

        if len(all_text.strip()) < 100:
            return []

        # Extract meaningful keywords/themes
        themes = self._extract_keywords_from_text(all_text)

        # Analyze theme frequency and context
        theme_analysis = []
        for theme, frequency in themes.most_common(10):
            if frequency > 1:  # Only include themes mentioned multiple times
                context = self._get_theme_context(theme, emails)
                theme_analysis.append({
                    'theme': theme,
                    'frequency': frequency,
                    'context': context,
                    'description': f"Mentioned {frequency} times across communications"
                })

        return theme_analysis

    def _extract_keywords_from_text(self, text: str) -> Counter:
        """Extract meaningful keywords from text"""
        # Simple but effective keyword extraction
        words = re.findall(r'\b[A-Za-z]{3,}\b', text.lower())

        # Filter out common words
        stopwords = {
            'the', 'and', 'you', 'that', 'this', 'for', 'are', 'with', 'have', 'will',
            'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time',
            'would', 'there', 'could', 'other', 'more', 'very', 'what', 'know', 'just',
            'first', 'get', 'over', 'think', 'also', 'your', 'work', 'life', 'only',
            'new', 'years', 'way', 'may', 'say', 'come', 'use', 'her', 'than', 'now',
            'well', 'man', 'here', 'where', 'those', 'much', 'go', 'through', 'back',
            'good', 'should', 'because', 'want', 'even', 'still', 'being', 'how',
            'email', 'message', 'gmail', 'com', 'sent', 'received', 'thanks', 'best',
            'regards', 'please', 'let', 'can', 'hi', 'hello', 'dear'
        }

        # Filter meaningful words
        meaningful_words = [
            word for word in words
            if word not in stopwords and len(word) > 3
        ]

        return Counter(meaningful_words)

    def _get_theme_context(self, theme: str, emails: List[Dict]) -> str:
        """Get context for where theme appears"""
        contexts = []
        for email in emails:
            content = f"{email['subject']} {email['body']}".lower()
            if theme in content:
                # Extract sentence containing the theme
                sentences = content.split('.')
                for sentence in sentences:
                    if theme in sentence:
                        contexts.append(sentence.strip()[:100])
                        break

        return "; ".join(contexts[:2])  # Return first 2 contexts

    async def _extract_real_people(self, emails: List[Dict]) -> List[Dict[str, Any]]:
        """Extract real people from email communications"""
        people_count = Counter()
        people_context = defaultdict(list)

        for email in emails:
            # Count sender
            if email['from_name'] and email['from_name'].strip():
                name = email['from_name'].strip()
                people_count[name] += 1
                people_context[name].append({
                    'role': 'sender',
                    'subject': email['subject'],
                    'date': email['date']
                })

            # Extract mentioned people from content
            mentioned_people = self._extract_people_from_content(email['body'])
            for person in mentioned_people:
                people_count[person] += 1
                people_context[person].append({
                    'role': 'mentioned',
                    'subject': email['subject'],
                    'context': 'mentioned in email'
                })

        # Format people list
        people_list = []
        for name, count in people_count.most_common(10):
            if count > 0:  # Only include people with actual interactions
                people_list.append({
                    'name': name,
                    'interactions': count,
                    'role': 'Key Contact',
                    'context': people_context[name][:3]  # Top 3 interactions
                })

        return people_list

    def _extract_people_from_content(self, content: str) -> List[str]:
        """Extract people names from email content"""
        # Simple name extraction - look for capitalized words that could be names
        potential_names = re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', content)

        # Filter out common false positives
        filtered_names = []
        for name in potential_names:
            if not any(word in name.lower() for word in ['email', 'gmail', 'from', 'to', 'subject']):
                filtered_names.append(name)

        return filtered_names[:5]  # Limit to avoid noise

    async def _extract_real_action_items(self, emails: List[Dict]) -> List[Dict[str, Any]]:
        """Extract real action items from email content"""
        action_items = []

        for email in emails:
            content = f"{email['subject']} {email['body']}"
            actions = self._identify_action_phrases(content)

            for action in actions:
                action_items.append({
                    'title': f"📧 {email['subject'][:50]}...",
                    'description': action,
                    'from': email['from_name'],
                    'urgency': self._assess_urgency(content),
                    'source_email': email['id']
                })

        return action_items[:10]  # Limit to most important

    def _identify_action_phrases(self, content: str) -> List[str]:
        """Identify action-oriented phrases in content"""
        action_patterns = [
            r'(?i)(please\s+\w+.*?)[\.\n]',
            r'(?i)(need\s+to\s+\w+.*?)[\.\n]',
            r'(?i)(can\s+you\s+\w+.*?)[\.\n]',
            r'(?i)(let\s+me\s+know.*?)[\.\n]',
            r'(?i)(follow\s+up.*?)[\.\n]',
            r'(?i)(action\s+required.*?)[\.\n]'
        ]

        actions = []
        for pattern in action_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if len(match.strip()) > 10:  # Avoid very short matches
                    actions.append(match.strip()[:200])  # Limit length

        return actions[:3]  # Top 3 actions per email

    def _assess_urgency(self, content: str) -> str:
        """Assess urgency level of content"""
        urgent_words = ['urgent', 'asap', 'immediately', 'critical', 'emergency']
        high_words = ['important', 'priority', 'deadline', 'tomorrow']

        content_lower = content.lower()

        if any(word in content_lower for word in urgent_words):
            return 'urgent'
        elif any(word in content_lower for word in high_words):
            return 'high'
        else:
            return 'medium'

    async def _identify_urgent_items(self, emails: List[Dict]) -> List[Dict[str, Any]]:
        """Identify items requiring immediate attention"""
        urgent_items = []

        for email in emails:
            urgency = self._assess_urgency(f"{email['subject']} {email['body']}")

            if urgency in ['urgent', 'high']:
                urgent_items.append({
                    'subject': email['subject'],
                    'from': email['from_name'],
                    'urgency': urgency,
                    'content_preview': email['body'][:200] + '...',
                    'requires_response': self._requires_response(email['body'])
                })

        return urgent_items

    def _requires_response(self, content: str) -> bool:
        """Determine if email requires a response"""
        response_indicators = [
            '?', 'please respond', 'let me know', 'need your', 'can you',
            'what do you think', 'your thoughts', 'feedback'
        ]

        content_lower = content.lower()
        return any(indicator in content_lower for indicator in response_indicators)

    async def _identify_real_patterns(self, emails: List[Dict]) -> List[str]:
        """Identify real patterns in communication"""
        patterns = []

        # Analyze subjects for patterns
        subjects = [email['subject'] for email in emails]
        subject_words = []
        for subject in subjects:
            subject_words.extend(subject.lower().split())

        common_subject_words = Counter(subject_words).most_common(5)

        for word, count in common_subject_words:
            if count > 1 and len(word) > 3:
                patterns.append(f"• {count} emails mention '{word}'")

        # Analyze senders
        senders = Counter([email['from_name'] for email in emails if email['from_name']])
        if senders:
            top_sender, count = senders.most_common(1)[0]
            patterns.append(f"• Most active contact: {top_sender} ({count} emails)")

        # Analyze timing
        if len(emails) > 1:
            patterns.append(f"• {len(emails)} communications in current period")

        return patterns[:5]

    def _analyze_email_characteristics(self, emails: List[Dict]) -> Dict[str, Any]:
        """Analyze characteristics of email communications"""
        total_emails = len(emails)

        if total_emails == 0:
            return {'total': 0, 'analysis': 'No emails to analyze'}

        # Calculate average body length
        body_lengths = [len(email['body']) for email in emails if email['body']]
        avg_length = sum(body_lengths) / len(body_lengths) if body_lengths else 0

        # Count emails requiring response
        response_needed = sum(1 for email in emails if self._requires_response(email['body']))

        return {
            'total_processed': total_emails,
            'avg_content_length': int(avg_length),
            'emails_requiring_response': response_needed,
            'content_quality': 'substantial' if avg_length > 100 else 'brief'
        }

    async def _generate_real_executive_brief(
        self,
        insights: Dict[str, Any],
        emails: List[Dict]
    ) -> Dict[str, Any]:
        """Generate executive brief from real insights"""

        # Remove all mock data and use only real insights
        return {
            'userId': 'andrew.ledet@gmail.com',
            'generatedAt': datetime.utcnow().isoformat(),
            'style': 'mission_brief',
            'version': '3.0_real_data',
            'dataSource': 'real_email_intelligence',

            # Real executive summary
            'executiveSummary': self._generate_real_summary(insights, emails),

            # Real themes from email content
            'keyThemes': insights['real_themes'],

            # Real people from communications
            'keyPeople': insights['real_people'],

            # Real action items from email content
            'emailsAwaitingResponse': insights['real_action_items'],

            # Real patterns identified
            'trends': insights['real_patterns'],

            # Real processing metadata
            'processing_metadata': {
                'real_data_processing': True,
                'mock_data_removed': True,
                'total_emails_analyzed': len(emails),
                'themes_extracted': len(insights['real_themes']),
                'people_identified': len(insights['real_people']),
                'patterns_found': len(insights['real_patterns']),
                'content_analysis': insights['email_analysis']
            },

            # Remove fake achievements section entirely
            'winbox': [],  # Will be populated only with real achievements when detected

            # Real urgency assessment
            'urgentItems': insights['real_urgency_items']
        }

    def _generate_real_summary(self, insights: Dict, emails: List[Dict]) -> str:
        """Generate real executive summary from actual data"""
        if not emails:
            return "No emails processed in current period."

        total_emails = len(emails)
        urgent_count = len(insights['real_urgency_items'])
        themes_count = len(insights['real_themes'])

        summary_parts = [
            f"**Communication Analysis - {datetime.now().strftime('%B %d, %Y')}**",
            f"",
            f"**Volume**: {total_emails} email communications analyzed",
        ]

        if urgent_count > 0:
            summary_parts.append(f"**Priority**: {urgent_count} items requiring attention")

        if themes_count > 0:
            top_theme = insights['real_themes'][0]['theme'] if insights['real_themes'] else None
            if top_theme:
                summary_parts.append(f"**Primary Focus**: {top_theme} (most discussed topic)")

        if insights['real_people']:
            active_contact = insights['real_people'][0]['name']
            summary_parts.append(f"**Key Contact**: {active_contact}")

        return "\n".join(summary_parts)

    def _generate_empty_state_response(self) -> Dict[str, Any]:
        """Generate response when no meaningful data is available"""
        return {
            'userId': 'andrew.ledet@gmail.com',
            'generatedAt': datetime.utcnow().isoformat(),
            'style': 'mission_brief',
            'version': '3.0_real_data',
            'dataSource': 'no_data_available',
            'executiveSummary': 'No substantial communications found in current period.',
            'keyThemes': [],
            'keyPeople': [],
            'emailsAwaitingResponse': [],
            'trends': ['• No significant patterns detected'],
            'winbox': [],
            'processing_metadata': {
                'real_data_processing': True,
                'total_emails_analyzed': 0,
                'reason': 'insufficient_content'
            }
        }

# Usage in FastAPI endpoint
async def process_real_executive_data(emails_data: List[Dict]) -> Dict[str, Any]:
    """Main function to process real executive data"""
    processor = RealExecutiveIntelligenceProcessor()
    return await processor.process_real_emails(emails_data)