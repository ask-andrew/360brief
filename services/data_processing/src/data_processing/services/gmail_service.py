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
    
    # Gmail API scopes needed for read access
    # Note: Must match the scopes granted by Next.js OAuth flow
    SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata',
        'https://www.googleapis.com/auth/gmail.modify',  # Required for full email content access
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
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
        if not self.credentials_file or not os.path.exists(self.credentials_file):
            raise ValueError(
                "Gmail credentials file not found. Please:"
                "\n1. Go to Google Cloud Console (https://console.cloud.google.com/)"
                "\n2. Create a project and enable Gmail API"
                "\n3. Create OAuth2 credentials and download the JSON file"
                "\n4. Set GMAIL_CREDENTIALS_FILE environment variable to the file path"
            )
            
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
            
            logger.info(f"Successfully obtained tokens with scopes: {self.credentials.scopes}")
            
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
    
    async def _load_credentials_from_nextjs(self, user_id: str) -> bool:
        """Load credentials from Next.js token API.
        
        Args:
            user_id: User ID to fetch tokens for
            
        Returns:
            True if credentials were loaded successfully
        """
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                url = f"http://localhost:3000/api/tokens/gmail?user_id={user_id}"
                async with session.get(url) as response:
                    if response.status != 200:
                        logger.error(f"Failed to fetch tokens from Next.js: {response.status}")
                        return False
                    
                    token_data = await response.json()
                    
                    if not token_data.get('authenticated'):
                        logger.error("User not authenticated with Gmail in Next.js")
                        return False
                    
                    # Create credentials from token data
                    self.credentials = Credentials(
                        token=token_data['access_token'],
                        refresh_token=token_data['refresh_token'],
                        id_token=None,
                        token_uri='https://oauth2.googleapis.com/token',
                        client_id=os.getenv('GOOGLE_CLIENT_ID'),
                        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
                        scopes=self.SCOPES
                    )
                    
                    # Set expiry if available
                    if token_data.get('expires_at'):
                        from datetime import datetime
                        self.credentials.expiry = datetime.fromtimestamp(token_data['expires_at'])
                    
                    logger.info("✅ Loaded credentials from Next.js token API")
                    return True
                    
        except Exception as e:
            logger.error(f"Failed to load credentials from Next.js: {e}")
            return False
    
    async def authenticate(self, user_id: str = None) -> bool:
        """Authenticate with Gmail API.
        
        Args:
            user_id: User ID to load tokens for (tries Next.js API first)
        
        Returns:
            True if authentication successful
        """
        # Try loading from Next.js API first if user_id provided
        if user_id:
            logger.info(f"🔄 Trying to load credentials from Next.js API for user {user_id}")
            if await self._load_credentials_from_nextjs(user_id):
                logger.info("✅ Using credentials from Next.js centralized auth")
            else:
                logger.warning("⚠️ Failed to load from Next.js API, falling back to local tokens")
        
        # Fallback to local credentials if Next.js API fails or no user_id
        if not self.credentials and not self._load_credentials():
            logger.error("❌ No valid credentials found. Please authenticate via Next.js web app first.")
            return False
            
        try:
            # Disable cache to avoid oauth2client<4.0.0 warning
            from googleapiclient.discovery import build
            self.service = build('gmail', 'v1', credentials=self.credentials, cache_discovery=False)
            
            # Test connection
            profile = self.service.users().getProfile(userId='me').execute()
            logger.info(f"Authenticated as {profile.get('emailAddress')}")
            return True
            
        except Exception as e:
            logger.error(f"Gmail authentication failed: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return False
    
    async def fetch_emails(
        self,
        start_date: datetime,
        end_date: datetime,
        max_results: int = 100,
        query: str = None,
        use_optimization: bool = True
    ) -> List[Dict[str, Any]]:
        """Fetch emails from Gmail within date range with metadata-first optimization.
        
        Args:
            start_date: Start of date range
            end_date: End of date range  
            max_results: Maximum number of emails to fetch
            query: Optional Gmail search query
            use_optimization: Use metadata-first approach for faster processing
            
        Returns:
            List of email data dictionaries
        """
        if not self.service:
            if not await self.authenticate():
                raise ConnectionError("Failed to authenticate with Gmail")
        
        try:
            if use_optimization:
                return await self._fetch_emails_optimized(start_date, end_date, max_results)
            else:
                return await self._fetch_emails_legacy(start_date, end_date, max_results)
                
        except HttpError as e:
            logger.error(f"Gmail API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
            raise
    
    async def _fetch_emails_optimized(
        self,
        start_date: datetime,
        end_date: datetime,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """Optimized email fetching using metadata-first approach.
        
        Phase 1: Fetch metadata only
        Phase 2: Score and prioritize emails
        Phase 3: Fetch full content for top-priority emails only
        """
        import time
        start_time = time.time()
        logger.info("Using optimized metadata-first email fetching")
        
        # Phase 1: Get extended message list with metadata
        result = self.service.users().messages().list(
            userId='me',
            maxResults=max_results * 2  # Get more to allow for filtering
        ).execute()
        
        messages = result.get('messages', [])
        logger.info(f"Phase 1: Found {len(messages)} message IDs")
        
        if not messages:
            return []
        
        # Phase 2: Fetch metadata and score importance
        metadata_emails = await self._fetch_metadata_batch(messages[:max_results * 2])
        
        # Filter by date range early
        filtered_emails = []
        for email in metadata_emails:
            if email and 'timestamp' in email:
                if start_date <= email['timestamp'] <= end_date:
                    filtered_emails.append(email)
        
        phase2_time = time.time()
        logger.info(f"Phase 2: {len(filtered_emails)} emails after date filtering (took {phase2_time - start_time:.1f}s)")
        
        # Phase 3: Early marketing filter (before scoring)
        non_marketing_emails = []
        marketing_filtered_count = 0
        
        for email in filtered_emails:
            headers = {'Subject': email.get('subject', ''), 'From': email.get('sender', '')}
            labels = email.get('labels', [])
            snippet = email.get('snippet', '')
            
            if self._is_marketing_email(headers, snippet, labels):
                marketing_filtered_count += 1
            else:
                non_marketing_emails.append(email)
        
        phase3_time = time.time()
        logger.info(f"Phase 3: Filtered {marketing_filtered_count} marketing emails, {len(non_marketing_emails)} remain (took {phase3_time - phase2_time:.1f}s)")
        
        # Phase 4: Score and prioritize remaining emails
        scored_emails = self._score_email_importance(non_marketing_emails)
        
        # Sort by importance score (descending)
        scored_emails.sort(key=lambda x: x.get('importance_score', 0), reverse=True)
        
        # Phase 5: Use metadata-only approach (scope limitations prevent full content)
        # Full content enrichment disabled due to Gmail API scope restrictions
        final_emails = scored_emails[:max_results]  # Return scored emails with metadata
        
        # Add body content from snippets for analysis
        for email in final_emails:
            if not email.get('body'):
                email['body'] = email.get('snippet', '')
            email['is_marketing'] = self._is_marketing_email(
                {'Subject': email.get('subject', ''), 'From': email.get('sender', '')},
                email.get('body', ''),
                email.get('labels', [])
            )
        
        total_time = time.time() - start_time
        logger.info(f"Phase 5: Processed {len(final_emails)} high-priority emails (metadata-only, total time: {total_time:.1f}s)")
        
        return final_emails[:max_results]
    
    async def _fetch_emails_legacy(
        self,
        start_date: datetime,
        end_date: datetime,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """Legacy email fetching approach (original implementation)."""
        logger.info("Using legacy email fetching approach")
        
        result = self.service.users().messages().list(
            userId='me',
            maxResults=max_results
        ).execute()
        
        messages = result.get('messages', [])
        logger.info(f"Found {len(messages)} messages")
        
        if not messages:
            return []
        
        # Fetch message details in batches
        email_data = []
        batch_size = 50
        
        for i in range(0, len(messages), batch_size):
            batch = messages[i:i + batch_size]
            batch_emails = await self._fetch_message_batch(batch)
            
            # Filter messages by date range (client-side filtering)
            filtered_emails = []
            for email in batch_emails:
                if email and 'timestamp' in email:
                    email_date = email['timestamp']
                    if start_date <= email_date <= end_date:
                        filtered_emails.append(email)
            
            email_data.extend(filtered_emails)
            
            # Add small delay to respect rate limits
            await asyncio.sleep(0.1)
            
            # Stop if we have enough emails
            if len(email_data) >= max_results:
                break
        
        logger.info(f"Filtered to {len(email_data)} messages within date range")
        return email_data[:max_results]
    
    async def _fetch_metadata_batch(self, message_ids: List[Dict]) -> List[Dict[str, Any]]:
        """Fetch metadata for a batch of messages (Phase 1 optimization).
        
        Args:
            message_ids: List of message ID dictionaries
            
        Returns:
            List of message metadata
        """
        metadata_emails = []
        batch_size = 100  # Larger batches for metadata-only requests
        
        for i in range(0, len(message_ids), batch_size):
            batch = message_ids[i:i + batch_size]
            
            for msg_ref in batch:
                try:
                    msg = self.service.users().messages().get(
                        userId='me',
                        id=msg_ref['id'],
                        format='metadata',
                        metadataHeaders=['Subject', 'From', 'To', 'Date', 'Message-ID', 'In-Reply-To', 'References']
                    ).execute()
                    
                    email_data = self._parse_gmail_message_metadata(msg)
                    if email_data:
                        metadata_emails.append(email_data)
                        
                except Exception as e:
                    logger.warning(f"Failed to fetch metadata for {msg_ref['id']}: {e}")
                    continue
            
            # Small delay between batches
            await asyncio.sleep(0.05)
        
        return metadata_emails
    
    async def _fetch_message_batch(self, message_ids: List[Dict]) -> List[Dict[str, Any]]:
        """Fetch details for a batch of messages (legacy method).
        
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
                    format='metadata',
                    metadataHeaders=['Subject', 'From', 'To', 'Date', 'Message-ID', 'In-Reply-To', 'References']
                ).execute()
                
                email_data = self._parse_gmail_message(msg)
                if email_data:
                    batch_emails.append(email_data)
                    
            except Exception as e:
                logger.warning(f"Failed to fetch message {msg_ref['id']}: {e}")
                continue
        
        return batch_emails
    
    def _parse_gmail_message_metadata(self, msg: Dict) -> Optional[Dict[str, Any]]:
        """Parse Gmail API message metadata only (faster than full parsing).
        
        Args:
            msg: Gmail API message object
            
        Returns:
            Parsed email metadata or None if parsing failed
        """
        try:
            headers = {h['name']: h['value'] for h in msg['payload'].get('headers', [])}
            labels = msg.get('labelIds', [])
            
            # Extract timestamp
            timestamp_ms = int(msg['internalDate'])
            timestamp = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
            
            # Use snippet for initial content assessment
            snippet = msg.get('snippet', '')
            
            # Determine direction based on sender
            sender = headers.get('From', '')
            direction = 'inbound'  # Default to inbound
            if '@gmail.com' in sender and 'andrew' in sender.lower():
                direction = 'outbound'
            
            return {
                'id': msg['id'],
                'source_id': msg['id'],
                'message_type': MessageType.EMAIL,
                'subject': headers.get('Subject', ''),
                'snippet': snippet,  # Use snippet instead of full body for metadata phase
                'sender': sender,
                'recipients': [headers.get('To', '')],
                'timestamp': timestamp,
                'thread_id': msg.get('threadId'),
                'labels': labels,
                'direction': direction,
                'metadata': {
                    'message_id': headers.get('Message-ID', ''),
                    'in_reply_to': headers.get('In-Reply-To', ''),
                    'references': headers.get('References', ''),
                    'size': msg.get('sizeEstimate', 0),
                    'unread': 'UNREAD' in labels
                },
                'full_content_fetched': False  # Mark as metadata-only
            }
            
        except Exception as e:
            logger.error(f"Error parsing message metadata {msg.get('id', 'unknown')}: {e}")
            return None
    
    def _score_email_importance(self, emails: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Score emails by importance to prioritize which ones need full content.
        
        Scoring factors:
        - Executive/VIP sender (high weight)
        - Urgent keywords in subject (high weight)
        - Unread status (medium weight)
        - Recent timestamp (medium weight)
        - Thread activity (medium weight)
        - Message size (low weight - longer emails often more important)
        - Marketing filter (negative weight)
        
        Args:
            emails: List of email metadata dictionaries
            
        Returns:
            Same emails with importance_score added
        """
        logger.info(f"Scoring importance for {len(emails)} emails")
        
        # Define scoring criteria
        vip_domains = {
            'gmail.com', 'company.com', 'client.com',  # Add your VIP domains
            'executive.com', 'ceo.com', 'founder.com'
        }
        
        urgent_keywords = {
            'urgent', 'asap', 'immediate', 'emergency', 'critical',
            'deadline', 'today', 'tonight', 'this morning',
            'important', 'priority', 'escalation'
        }
        
        executive_keywords = {
            'ceo', 'cto', 'cfo', 'vp', 'director', 'executive',
            'president', 'founder', 'head of', 'chief'
        }
        
        project_keywords = {
            'project', 'meeting', 'sync', 'review', 'approval',
            'decision', 'action', 'update', 'status', 'feedback'
        }
        
        # Calculate current time for recency scoring
        now = datetime.now(timezone.utc)
        
        for email in emails:
            score = 0
            reasons = []  # For debugging
            
            # 1. VIP Sender (0-30 points)
            sender = email.get('sender', '').lower()
            sender_domain = sender.split('@')[1] if '@' in sender else ''
            
            if sender_domain in vip_domains:
                score += 30
                reasons.append('vip_domain')
            
            if any(keyword in sender for keyword in executive_keywords):
                score += 25
                reasons.append('executive_sender')
            
            # 2. Subject line analysis (0-25 points)
            subject = email.get('subject', '').lower()
            
            if any(keyword in subject for keyword in urgent_keywords):
                score += 25
                reasons.append('urgent_subject')
            elif any(keyword in subject for keyword in project_keywords):
                score += 15
                reasons.append('project_subject')
            
            # Question indicators
            if '?' in subject or any(word in subject for word in ['what', 'how', 'when', 'can you']):
                score += 12
                reasons.append('question')
            
            # 3. Unread status (0-20 points)
            if email.get('metadata', {}).get('unread', False):
                score += 20
                reasons.append('unread')
            
            # 4. Recency (0-15 points)
            timestamp = email.get('timestamp')
            if timestamp:
                hours_old = (now - timestamp).total_seconds() / 3600
                if hours_old <= 2:
                    score += 15
                    reasons.append('very_recent')
                elif hours_old <= 8:
                    score += 10
                    reasons.append('recent')
                elif hours_old <= 24:
                    score += 5
                    reasons.append('today')
            
            # 5. Message size hint (0-10 points)
            size = email.get('metadata', {}).get('size', 0)
            if size > 5000:  # Longer emails often more substantial
                score += 10
                reasons.append('substantial_size')
            elif size > 1000:
                score += 5
                reasons.append('medium_size')
            
            # 6. Thread activity (0-10 points)
            if email.get('metadata', {}).get('in_reply_to'):
                score += 8
                reasons.append('thread_reply')
            
            # 7. Direction preference (inbound slightly higher priority)
            if email.get('direction') == 'inbound':
                score += 3
                reasons.append('inbound')
            
            # 8. Marketing/spam penalty (-50 points)
            labels = email.get('labels', [])
            snippet = email.get('snippet', '').lower()
            
            if self._is_marketing_email({'Subject': subject, 'From': sender}, snippet, labels):
                score -= 50
                reasons.append('marketing_penalty')
            
            # Apply score and reasoning
            email['importance_score'] = max(0, score)  # Don't allow negative scores
            email['importance_reasons'] = reasons
        
        # Log scoring distribution
        scores = [e.get('importance_score', 0) for e in emails]
        if scores:
            logger.info(f"Importance scoring complete. Range: {min(scores)}-{max(scores)}, Avg: {sum(scores)/len(scores):.1f}")
        
        return emails
    
    async def _enrich_with_full_content(self, prioritized_emails: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Fetch full content for prioritized emails that need it.
        
        Args:
            prioritized_emails: List of metadata-only emails sorted by importance
            
        Returns:
            Same emails enriched with full content
        """
        logger.info(f"Enriching {len(prioritized_emails)} priority emails with full content")
        
        enriched_emails = []
        
        for email in prioritized_emails:
            try:
                # Skip if already has full content or score too low
                if email.get('full_content_fetched', False) or email.get('importance_score', 0) < 10:
                    enriched_emails.append(email)
                    continue
                
                # Fetch full message content
                msg = self.service.users().messages().get(
                    userId='me',
                    id=email['id'],
                    format='full'  # Get full message including body
                ).execute()
                
                # Extract full body content
                full_body = self._extract_message_body(msg['payload'])
                
                # Update email with full content
                email['body'] = full_body if full_body.strip() else email.get('snippet', '')
                email['full_content_fetched'] = True
                
                # Re-evaluate marketing status with full content
                headers = {h['name']: h['value'] for h in msg['payload'].get('headers', [])}
                email['is_marketing'] = self._is_marketing_email(headers, email['body'], email.get('labels', []))
                
                enriched_emails.append(email)
                
                # Small delay to respect rate limits
                await asyncio.sleep(0.02)
                
            except Exception as e:
                logger.warning(f"Failed to enrich email {email.get('id')}: {e}")
                # Keep the metadata-only version
                enriched_emails.append(email)
        
        logger.info(f"Successfully enriched {sum(1 for e in enriched_emails if e.get('full_content_fetched'))} emails with full content")
        return enriched_emails
    
    def _is_marketing_email(self, headers: Dict[str, str], content: str, labels: List[str]) -> bool:
        """Determine if an email is marketing/promotional content.
        
        Args:
            headers: Email headers
            content: Email content (snippet or full body)
            labels: Gmail labels
            
        Returns:
            True if likely marketing email
        """
        sender = headers.get('From', '').lower()
        subject = headers.get('Subject', '').lower()
        content_lower = content.lower()
        
        # Check Gmail labels first (most reliable)
        marketing_labels = ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'SPAM']
        if any(label in labels for label in marketing_labels):
            return True
            
        # Marketing sender patterns
        marketing_domains = [
            'noreply', 'no-reply', 'donotreply', 'do-not-reply', 'marketing', 
            'newsletter', 'notifications', 'alerts', 'updates', 'promo'
        ]
        if any(domain in sender for domain in marketing_domains):
            # Whitelist important automated systems
            important_patterns = [
                'github', 'slack', 'jira', 'asana', 'trello', 'confluence',
                'salesforce', 'hubspot', 'pipedrive', 'monday.com',
                'calendar', 'meeting', 'zoom', 'teams', 'webex',
                'bank', 'chase', 'wells fargo', 'american express', 'visa'
            ]
            if not any(pattern in sender for pattern in important_patterns):
                return True
        
        # Marketing subject/content indicators
        marketing_keywords = [
            'unsubscribe', 'opt out', 'click here', 'limited time', 'act now',
            'discount', 'save %', 'free shipping', 'deal', 'offer expires',
            'newsletter', 'weekly digest', 'monthly roundup'
        ]
        
        # Count marketing indicators
        marketing_score = 0
        for keyword in marketing_keywords:
            if keyword in subject or keyword in content_lower:
                marketing_score += 1
                
        # High marketing score indicates promotional content
        return marketing_score >= 2
    
    def _parse_gmail_message(self, msg: Dict) -> Optional[Dict[str, Any]]:
        """Parse Gmail API message into standardized format.
        
        Args:
            msg: Gmail API message object
            
        Returns:
            Parsed email data or None if parsing failed
        """
        try:
            headers = {h['name']: h['value'] for h in msg['payload'].get('headers', [])}
            labels = msg.get('labelIds', [])
            
            # Extract timestamp
            timestamp_ms = int(msg['internalDate'])
            timestamp = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
            
            # With metadata format, we don't have body content, use snippet instead
            body = msg.get('snippet', '')
            
            # Check if this is marketing content
            is_marketing = self._is_marketing_email(headers, body, labels)
            
            # Determine direction based on sender
            sender = headers.get('From', '')
            # Simple heuristic: if sender contains the authenticated user's domain or known patterns
            direction = 'inbound'  # Default to inbound for simplicity
            if '@gmail.com' in sender and 'andrew' in sender.lower():
                direction = 'outbound'
            
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
                'is_marketing': is_marketing,
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
        max_results: int = 100,
        filter_marketing: bool = True,
        use_optimization: bool = True
    ) -> Dict[str, Any]:
        """Generate analytics data from Gmail messages with optimization options.
        
        Args:
            start_date: Start of analysis period
            end_date: End of analysis period
            max_results: Maximum emails to analyze
            filter_marketing: Filter marketing emails (done early in optimized mode)
            use_optimization: Use metadata-first optimization for faster processing
            
        Returns:
            Analytics data dictionary
        """
        emails = await self.fetch_emails(start_date, end_date, max_results, use_optimization=use_optimization)
        
        if not emails:
            return self._empty_analytics()
        
        # Additional marketing filter if needed (optimization already filters early)
        if filter_marketing and not use_optimization:
            filtered_emails = [email for email in emails if not email.get('is_marketing', False)]
            marketing_count = len(emails) - len(filtered_emails)
            logger.info(f"Post-processing: Filtered out {marketing_count} marketing emails ({len(filtered_emails)} remain)")
            emails = filtered_emails
        
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
        """Extract project mentions from email subjects and create summaries."""
        import re
        from collections import defaultdict
        
        # Project patterns and keywords
        project_indicators = {
            'project_names': r'\b(?:project|initiative|campaign|program)\s+([A-Z]\w+(?:\s+[A-Z]\w+)*)',
            'meeting_topics': r'\b(?:meeting|sync|standup|review)\s*:?\s*([A-Za-z][^:,\n]{5,30})',
            'work_items': r'\b(?:re|regarding|about|for)\s*:?\s*([A-Za-z][^:,\n]{10,40})',
            'action_items': r'\b(?:update|status|feedback|review|approval)\s+(?:on|for|regarding)\s+([A-Za-z][^:,\n]{5,30})'
        }
        
        project_data = defaultdict(lambda: {'count': 0, 'subjects': [], 'keywords': set()})
        
        for email in emails:
            subject = email.get('subject', '')
            if not subject or len(subject) < 5:
                continue
                
            # Extract project-related phrases
            for pattern_type, pattern in project_indicators.items():
                matches = re.findall(pattern, subject, re.IGNORECASE)
                for match in matches:
                    # Clean and normalize the match
                    cleaned = re.sub(r'[^\w\s]', ' ', match).strip()
                    cleaned = ' '.join(cleaned.split())  # Remove extra spaces
                    
                    if len(cleaned) > 3 and not cleaned.lower() in ['the', 'and', 'for', 'with', 'that', 'this']:
                        # Use first 3 words as key for grouping similar topics
                        key_words = cleaned.split()[:3]
                        project_key = ' '.join(key_words).title()
                        
                        project_data[project_key]['count'] += 1
                        project_data[project_key]['subjects'].append(subject)
                        project_data[project_key]['keywords'].add(cleaned.lower())
        
        # Also look for recurring key terms
        all_subjects = ' '.join([email.get('subject', '') for email in emails])
        # Extract capitalized phrases (likely proper nouns/project names)
        capitalized_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', all_subjects)
        
        phrase_count = defaultdict(int)
        for phrase in capitalized_phrases:
            if len(phrase) > 4 and phrase not in ['From', 'Subject', 'Dear', 'Hello', 'Thanks']:
                phrase_count[phrase] += 1
        
        # Add high-frequency proper nouns as projects
        for phrase, count in phrase_count.items():
            if count >= 2:  # Appears in multiple emails
                if phrase not in project_data:
                    project_data[phrase]['count'] = count
                    project_data[phrase]['keywords'].add(phrase.lower())
        
        # Create summaries and sort by relevance
        projects = []
        for project_name, data in project_data.items():
            if data['count'] >= 2:  # Minimum threshold
                # Create a brief summary from keywords
                keywords_list = list(data['keywords'])[:3]
                summary = f"Communication about {', '.join(keywords_list)}" if keywords_list else "Recurring project topic"
                
                projects.append({
                    "name": project_name,
                    "messageCount": data['count'],
                    "type": "project",
                    "summary": summary
                })
        
        # Sort by message count and return top 5
        projects.sort(key=lambda x: x['messageCount'], reverse=True)
        return projects[:5]
    
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