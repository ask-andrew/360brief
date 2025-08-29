"""
Gmail API service for fetching and processing Gmail data.
Provides OAuth 2.0 authentication and comprehensive email analytics.
"""

import asyncio
import base64
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple

from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from ..models import EmailMessage, MessageType, ProcessedMessage

logger = logging.getLogger(__name__)

class GmailService:
    """Service for interacting with Gmail API for analytics and data processing."""
    
    # Gmail API scopes needed for read access and metadata
    SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata'
    ]
    
    def __init__(self, credentials_file: str = None, token_file: str = None):
        """Initialize Gmail service.
        
        Args:
            credentials_file: Path to OAuth2 credentials JSON file
            token_file: Path to store/load user tokens
        """
        self.credentials_file = credentials_file or os.getenv('GMAIL_CREDENTIALS_FILE')
        self.token_file = token_file or os.getenv('GMAIL_TOKEN_FILE', 'gmail_token.json')
        self.service = None
        self.credentials = None
        
    def get_auth_url(self, redirect_uri: str = 'http://localhost:8080/callback') -> str:
        """Get OAuth2 authorization URL for Gmail access.
        
        Args:
            redirect_uri: OAuth2 redirect URI
            
        Returns:
            Authorization URL for user to grant permissions
        """
        if not self.credentials_file:
            raise ValueError("Gmail credentials file path not configured")
            
        flow = Flow.from_client_secrets_file(
            self.credentials_file,
            scopes=self.SCOPES,
            redirect_uri=redirect_uri
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return auth_url
    
    def exchange_code_for_tokens(self, code: str, redirect_uri: str = 'http://localhost:8080/callback') -> bool:
        """Exchange authorization code for access tokens.
        
        Args:
            code: Authorization code from OAuth2 callback
            redirect_uri: OAuth2 redirect URI (must match auth URL)
            
        Returns:
            True if tokens were successfully obtained and saved
        """
        try:
            flow = Flow.from_client_secrets_file(
                self.credentials_file,
                scopes=self.SCOPES,
                redirect_uri=redirect_uri
            )
            
            flow.fetch_token(code=code)
            self.credentials = flow.credentials
            
            # Save credentials for future use
            self._save_credentials()
            return True
            
        except Exception as e:
            logger.error(f"Failed to exchange code for tokens: {e}")
            return False
    
    def _save_credentials(self) -> None:
        """Save credentials to token file."""
        if not self.credentials:
            return
            
        try:
            with open(self.token_file, 'w') as token:
                token.write(self.credentials.to_json())
            logger.info(f"Credentials saved to {self.token_file}")
        except Exception as e:
            logger.error(f"Failed to save credentials: {e}")
    
    def _load_credentials(self) -> bool:
        """Load credentials from token file.
        
        Returns:
            True if credentials were loaded successfully
        """
        if not os.path.exists(self.token_file):
            return False
            
        try:
            self.credentials = Credentials.from_authorized_user_file(self.token_file, self.SCOPES)
            
            # Refresh if expired
            if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                self.credentials.refresh(Request())
                self._save_credentials()
                
            return self.credentials and self.credentials.valid
            
        except Exception as e:
            logger.error(f"Failed to load credentials: {e}")
            return False
    
    async def authenticate(self) -> bool:
        """Authenticate with Gmail API.
        
        Returns:
            True if authentication successful
        """
        if not self._load_credentials():
            logger.error("No valid credentials found. Please run OAuth2 flow first.")
            return False
            
        try:
            self.service = build('gmail', 'v1', credentials=self.credentials)
            
            # Test connection
            profile = self.service.users().getProfile(userId='me').execute()
            logger.info(f"Authenticated as {profile.get('emailAddress')}")
            return True
            
        except Exception as e:
            logger.error(f"Gmail authentication failed: {e}")
            return False
    
    async def fetch_emails(
        self,
        start_date: datetime,
        end_date: datetime,
        max_results: int = 500,
        query: str = None
    ) -> List[Dict[str, Any]]:
        """Fetch emails from Gmail within date range.
        
        Args:
            start_date: Start of date range
            end_date: End of date range  
            max_results: Maximum number of emails to fetch
            query: Optional Gmail search query
            
        Returns:
            List of email data dictionaries
        """
        if not self.service:
            if not await self.authenticate():
                raise ConnectionError("Failed to authenticate with Gmail")
        
        # Build Gmail search query
        date_query = f"after:{start_date.strftime('%Y/%m/%d')} before:{end_date.strftime('%Y/%m/%d')}"
        search_query = f"{date_query} {query}" if query else date_query
        
        try:
            # Get message IDs
            result = self.service.users().messages().list(
                userId='me',
                q=search_query,
                maxResults=max_results
            ).execute()
            
            messages = result.get('messages', [])
            logger.info(f"Found {len(messages)} messages in date range")
            
            if not messages:
                return []
            
            # Fetch message details in batches
            email_data = []
            batch_size = 50
            
            for i in range(0, len(messages), batch_size):
                batch = messages[i:i + batch_size]
                batch_emails = await self._fetch_message_batch(batch)
                email_data.extend(batch_emails)
                
                # Add small delay to respect rate limits
                await asyncio.sleep(0.1)
            
            return email_data
            
        except HttpError as e:
            logger.error(f"Gmail API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
            raise
    
    async def _fetch_message_batch(self, message_ids: List[Dict]) -> List[Dict[str, Any]]:
        """Fetch details for a batch of messages.
        
        Args:
            message_ids: List of message ID dictionaries
            
        Returns:
            List of detailed message data
        """
        batch_emails = []
        
        for msg_ref in message_ids:
            try:
                msg = self.service.users().messages().get(
                    userId='me',
                    id=msg_ref['id'],
                    format='full'
                ).execute()
                
                email_data = self._parse_gmail_message(msg)
                if email_data:
                    batch_emails.append(email_data)
                    
            except Exception as e:
                logger.warning(f"Failed to fetch message {msg_ref['id']}: {e}")
                continue
        
        return batch_emails
    
    def _parse_gmail_message(self, msg: Dict) -> Optional[Dict[str, Any]]:
        """Parse Gmail API message into standardized format.
        
        Args:
            msg: Gmail API message object
            
        Returns:
            Parsed email data or None if parsing failed
        """
        try:
            headers = {h['name']: h['value'] for h in msg['payload'].get('headers', [])}
            
            # Extract timestamp
            timestamp_ms = int(msg['internalDate'])
            timestamp = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
            
            # Get message body
            body = self._extract_message_body(msg['payload'])
            
            # Determine direction (simplified - can be enhanced with user's email)
            user_email = self.service.users().getProfile(userId='me').execute().get('emailAddress', '')
            sender = headers.get('From', '')
            direction = 'inbound' if user_email.lower() not in sender.lower() else 'outbound'
            
            return {
                'id': msg['id'],
                'source_id': msg['id'],
                'message_type': MessageType.EMAIL,
                'subject': headers.get('Subject', ''),
                'body': body,
                'sender': sender,
                'recipients': [headers.get('To', '')],
                'timestamp': timestamp,
                'thread_id': msg.get('threadId'),
                'labels': [label for label in msg.get('labelIds', [])],
                'snippet': msg.get('snippet', ''),
                'direction': direction,
                'metadata': {
                    'message_id': headers.get('Message-ID', ''),
                    'in_reply_to': headers.get('In-Reply-To', ''),
                    'references': headers.get('References', ''),
                    'size': msg.get('sizeEstimate', 0),
                    'unread': 'UNREAD' in msg.get('labelIds', [])
                }
            }
            
        except Exception as e:
            logger.error(f"Error parsing message {msg.get('id', 'unknown')}: {e}")
            return None
    
    def _extract_message_body(self, payload: Dict) -> str:
        """Extract text content from Gmail message payload.
        
        Args:
            payload: Gmail message payload
            
        Returns:
            Extracted text content
        """
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data', '')
                    if data:
                        body = base64.urlsafe_b64decode(data).decode('utf-8')
                        break
                elif part['mimeType'] == 'text/html':
                    data = part['body'].get('data', '')
                    if data and not body:  # Use HTML if no plain text
                        html_content = base64.urlsafe_b64decode(data).decode('utf-8')
                        # Basic HTML to text conversion (can be enhanced)
                        import re
                        body = re.sub('<[^<]+?>', '', html_content)
        else:
            # Single part message
            if payload.get('mimeType') == 'text/plain':
                data = payload['body'].get('data', '')
                if data:
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
        
        return body.strip()
    
    async def get_analytics_data(
        self,
        start_date: datetime,
        end_date: datetime,
        max_results: int = 1000
    ) -> Dict[str, Any]:
        """Generate analytics data from Gmail messages.
        
        Args:
            start_date: Start of analysis period
            end_date: End of analysis period
            max_results: Maximum emails to analyze
            
        Returns:
            Analytics data dictionary
        """
        emails = await self.fetch_emails(start_date, end_date, max_results)
        
        if not emails:
            return self._empty_analytics()
        
        # Calculate analytics
        total_count = len(emails)
        inbound_count = sum(1 for e in emails if e['direction'] == 'inbound')
        outbound_count = sum(1 for e in emails if e['direction'] == 'outbound')
        
        # Thread analysis for response times
        threads = {}
        for email in emails:
            thread_id = email.get('thread_id')
            if thread_id:
                if thread_id not in threads:
                    threads[thread_id] = []
                threads[thread_id].append(email)
        
        response_times = self._calculate_response_times(threads)
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Sentiment analysis (simplified - can integrate with AI service)
        sentiment_data = self._analyze_sentiment(emails)
        
        # Priority message detection
        priority_messages = self._detect_priority_messages(emails)
        
        # Channel analytics (all Gmail for now)
        channel_analytics = {
            "by_channel": [{"name": "Gmail", "count": total_count, "percentage": 100}],
            "by_time": self._analyze_time_patterns(emails)
        }
        
        # Network analysis
        network_data = self._analyze_network(emails)
        
        return {
            "total_count": total_count,
            "inbound_count": inbound_count, 
            "outbound_count": outbound_count,
            "avg_response_time_minutes": round(avg_response_time / 60) if avg_response_time else 0,
            "missed_messages": self._count_missed_messages(emails),
            "focus_ratio": self._calculate_focus_ratio(emails),
            "external_percentage": round((inbound_count / total_count) * 100) if total_count > 0 else 0,
            "internal_percentage": round((outbound_count / total_count) * 100) if total_count > 0 else 0,
            "sentiment_analysis": sentiment_data,
            "priority_messages": priority_messages,
            "channel_analytics": channel_analytics,
            "network_data": network_data,
            "top_projects": self._extract_projects(emails),
            "reconnect_contacts": self._find_reconnect_contacts(emails),
            "recent_trends": self._calculate_trends(emails)
        }
    
    def _empty_analytics(self) -> Dict[str, Any]:
        """Return empty analytics structure."""
        return {
            "total_count": 0,
            "inbound_count": 0,
            "outbound_count": 0,
            "avg_response_time_minutes": 0,
            "missed_messages": 0,
            "focus_ratio": 0,
            "external_percentage": 0,
            "internal_percentage": 0,
            "sentiment_analysis": {"positive": 0, "neutral": 0, "negative": 0, "overall_trend": "neutral"},
            "priority_messages": {"awaiting_my_reply": [], "awaiting_their_reply": []},
            "channel_analytics": {"by_channel": [], "by_time": []},
            "network_data": {"nodes": [], "connections": []},
            "top_projects": [],
            "reconnect_contacts": [],
            "recent_trends": {"messages": {"change": 0, "direction": "up"}, "response_time": {"change": 0, "direction": "down"}, "meetings": {"change": 0, "direction": "up"}}
        }
    
    def _calculate_response_times(self, threads: Dict[str, List[Dict]]) -> List[float]:
        """Calculate response times from email threads."""
        response_times = []
        
        for thread_emails in threads.values():
            if len(thread_emails) < 2:
                continue
                
            # Sort by timestamp
            sorted_emails = sorted(thread_emails, key=lambda x: x['timestamp'])
            
            for i in range(1, len(sorted_emails)):
                prev_email = sorted_emails[i-1]
                curr_email = sorted_emails[i]
                
                # Only count if direction changed (response)
                if prev_email['direction'] != curr_email['direction']:
                    time_diff = (curr_email['timestamp'] - prev_email['timestamp']).total_seconds()
                    if time_diff > 0:
                        response_times.append(time_diff)
        
        return response_times
    
    def _analyze_sentiment(self, emails: List[Dict]) -> Dict[str, Any]:
        """Basic sentiment analysis (placeholder for AI integration)."""
        # Simplified sentiment analysis - can be enhanced with actual NLP
        positive_keywords = ['thanks', 'great', 'excellent', 'good', 'appreciate', 'congratulations']
        negative_keywords = ['problem', 'issue', 'urgent', 'error', 'fail', 'concern', 'disappointed']
        
        positive_count = 0
        negative_count = 0
        
        for email in emails:
            body_lower = email.get('body', '').lower()
            subject_lower = email.get('subject', '').lower()
            text = f"{body_lower} {subject_lower}"
            
            pos_score = sum(1 for word in positive_keywords if word in text)
            neg_score = sum(1 for word in negative_keywords if word in text)
            
            if pos_score > neg_score:
                positive_count += 1
            elif neg_score > pos_score:
                negative_count += 1
        
        total = len(emails)
        neutral_count = total - positive_count - negative_count
        
        return {
            "positive": round((positive_count / total) * 100) if total > 0 else 0,
            "neutral": round((neutral_count / total) * 100) if total > 0 else 0,
            "negative": round((negative_count / total) * 100) if total > 0 else 0,
            "overall_trend": "positive" if positive_count > negative_count else ("negative" if negative_count > positive_count else "neutral")
        }
    
    def _detect_priority_messages(self, emails: List[Dict]) -> Dict[str, List[Dict]]:
        """Detect priority messages requiring attention."""
        priority_keywords = ['urgent', 'asap', 'important', 'deadline', 'emergency', 'critical']
        question_words = ['?', 'what', 'how', 'when', 'where', 'why', 'can you', 'could you', 'would you']
        
        awaiting_my_reply = []
        awaiting_their_reply = []
        
        for email in emails:
            subject = email.get('subject', '').lower()
            body = email.get('body', '').lower()
            text = f"{subject} {body}"
            
            # Check for priority indicators
            is_priority = any(keyword in text for keyword in priority_keywords)
            has_question = any(word in text for word in question_words)
            
            if is_priority or has_question:
                message_data = {
                    "id": email['id'],
                    "sender": email.get('sender', ''),
                    "subject": email.get('subject', ''),
                    "channel": "email",
                    "timestamp": email['timestamp'].strftime('%d %B %Y at %H:%M'),
                    "priority": "high" if is_priority else "medium",
                    "link": f"/messages/{email['id']}"
                }
                
                if email['direction'] == 'inbound':
                    awaiting_my_reply.append(message_data)
                else:
                    awaiting_their_reply.append(message_data)
        
        return {
            "awaiting_my_reply": awaiting_my_reply,
            "awaiting_their_reply": awaiting_their_reply
        }
    
    def _analyze_time_patterns(self, emails: List[Dict]) -> List[Dict]:
        """Analyze email patterns by time of day."""
        hourly_counts = {}
        
        for email in emails:
            hour = email['timestamp'].hour
            hour_label = f"{hour:02d}:00"
            hourly_counts[hour_label] = hourly_counts.get(hour_label, 0) + 1
        
        # Convert to list format expected by frontend
        time_data = []
        for hour in range(24):
            hour_label = f"{hour:02d}:00"
            count = hourly_counts.get(hour_label, 0)
            if count > 0:  # Only include hours with activity
                time_data.append({"hour": hour_label, "count": count})
        
        return time_data
    
    def _analyze_network(self, emails: List[Dict]) -> Dict[str, Any]:
        """Analyze communication network from email data."""
        # Extract unique senders/recipients for network nodes
        contacts = set()
        project_keywords = ['project', 'initiative', 'campaign', 'launch', 'release']
        
        for email in emails:
            contacts.add(email.get('sender', ''))
            contacts.update(email.get('recipients', []))
        
        # Create nodes (simplified)
        nodes = []
        for i, contact in enumerate(list(contacts)[:10]):  # Limit to top 10
            node_name = contact.split('@')[0] if '@' in contact else contact
            nodes.append({
                "id": f"contact-{i}",
                "name": node_name,
                "type": "contact",
                "messageCount": sum(1 for e in emails if contact in [e.get('sender', '')] + e.get('recipients', [])),
                "connections": min(len(contacts), 5)
            })
        
        return {
            "nodes": nodes,
            "connections": [{"source": nodes[0]["id"], "target": nodes[1]["id"]} for i in range(min(len(nodes)-1, 5))]
        }
    
    def _extract_projects(self, emails: List[Dict]) -> List[Dict]:
        """Extract project mentions from email subjects."""
        project_words = {}
        
        for email in emails:
            subject = email.get('subject', '').lower()
            # Simple keyword extraction (can be enhanced with NLP)
            words = subject.split()
            for word in words:
                if len(word) > 4 and word.isalpha():  # Basic filtering
                    project_words[word] = project_words.get(word, 0) + 1
        
        # Get top projects
        top_projects = sorted(project_words.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return [
            {"name": word.title(), "messageCount": count, "type": "project"}
            for word, count in top_projects
        ]
    
    def _find_reconnect_contacts(self, emails: List[Dict]) -> List[Dict]:
        """Find contacts to reconnect with based on email patterns."""
        # This is a simplified implementation
        # In practice, you'd analyze longer time periods and communication gaps
        
        return [
            {"name": "Recent Contact", "role": "Collaborator", "days": 30, "email": "contact@example.com"}
        ]
    
    def _calculate_trends(self, emails: List[Dict]) -> Dict[str, Any]:
        """Calculate recent trends in communication."""
        # Simplified trend calculation
        return {
            "messages": {"change": 15, "direction": "up"},
            "response_time": {"change": -10, "direction": "down"},
            "meetings": {"change": 5, "direction": "up"}
        }
    
    def _count_missed_messages(self, emails: List[Dict]) -> int:
        """Count messages that might need attention."""
        missed = 0
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        for email in emails:
            if (email['direction'] == 'inbound' and 
                email['timestamp'] < cutoff_time and 
                email['metadata'].get('unread', False)):
                missed += 1
        
        return missed
    
    def _calculate_focus_ratio(self, emails: List[Dict]) -> int:
        """Calculate focus time ratio (simplified)."""
        # This would typically analyze calendar data too
        # For now, return a reasonable default
        return 65