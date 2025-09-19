"""
Email processing service for fetching and processing emails from various providers.
"""

import asyncio
import email
import logging
import os
import re
from datetime import datetime, timezone
from email.header import decode_header
from email.utils import parsedate_to_datetime
from typing import Dict, List, Optional, Tuple, Any

import aioimaplib
from bs4 import BeautifulSoup
import pytz

from ..models import ProcessedMessage, MessageType

logger = logging.getLogger(__name__)

class EmailProcessor:
    """Service for processing email messages from various providers."""
    
    def __init__(
        self, 
        imap_server: str = "imap.gmail.com",
        imap_port: int = 993,
        use_ssl: bool = True,
        username: Optional[str] = None,
        password: Optional[str] = None,
        max_retries: int = 3,
        batch_size: int = 50
    ):
        self.imap_server = imap_server
        self.imap_port = imap_port
        self.use_ssl = use_ssl
        self.username = username or os.getenv("EMAIL_USERNAME")
        self.password = password or os.getenv("EMAIL_PASSWORD")
        self.max_retries = max_retries
        self.batch_size = batch_size
        self.client = None
    
    async def connect(self) -> bool:
        """Establish connection to the IMAP server."""
        if self.client and self.client.has_pending_idle():
            return True
            
        try:
            self.client = aioimaplib.IMAP4_SSL(self.imap_server) if self.use_ssl \
                else aioimaplib.IMAP4(self.imap_server)
            await self.client.wait_hello_from_server()
            
            if self.username and self.password:
                await self.client.login(self.username, self.password)
                return True
                
        except Exception as e:
            logger.error(f"Failed to connect to email server: {e}")
            self.client = None
            
        return False
        
    async def disconnect(self) -> None:
        """Close the connection to the IMAP server."""
        try:
            if self.client:
                await self.client.logout()
        except Exception as e:
            logger.warning(f"Error disconnecting from email server: {e}")
        finally:
            self.client = None
            
    async def fetch_emails(
        self,
        user_email: str,
        start_date: datetime,
        end_date: datetime,
        folder: str = "INBOX",
        mark_as_read: bool = False
    ) -> List[ProcessedMessage]:
        """Fetch and process emails within a date range.
        
        Args:
            user_email: Email address of the user
            start_date: Start of date range (inclusive)
            end_date: End of date range (inclusive)
            folder: Email folder to search in (default: INBOX)
            mark_as_read: Whether to mark messages as read (default: False)
            
        Returns:
            List of processed email messages
            
        Raises:
            ConnectionError: If unable to connect to the email server
        """
        if not await self.connect():
            raise ConnectionError("Failed to connect to email server")
            
        try:
            # Select the folder
            await self.client.select(folder)
            
            # Format dates for IMAP search
            date_format = "%d-%b-%Y"
            start_date_str = start_date.strftime(date_format)
            end_date_str = end_date.strftime(date_format)
            
            # Search for messages in date range
            search_criteria = f'(SINCE "{start_date_str}" BEFORE "{end_date_str}")'
            status, response = await self.client.search(search_criteria)
            
            if status != 'OK':
                logger.error(f"Email search failed: {response}")
                return []
                
            message_ids = response[0].split()
            if not message_ids:
                logger.info("No messages found in the specified date range")
                return []
                
            # Process messages in batches
            processed_messages = []
            for i in range(0, len(message_ids), self.batch_size):
                batch = message_ids[i:i + self.batch_size]
                messages = await self._process_message_batch(batch, mark_as_read)
                processed_messages.extend(messages)
                
            return processed_messages
            
        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
            raise
            
    async def _process_message_batch(
        self, 
        message_ids: List[bytes],
        mark_as_read: bool
    ) -> List[ProcessedMessage]:
        """Process a batch of email messages.
        
        Args:
            message_ids: List of message IDs to process
            mark_as_read: Whether to mark messages as read
            
        Returns:
            List of processed messages
        """
        processed_messages = []
        
        for msg_id in message_ids:
            try:
                # Fetch the full message
                status, msg_data = await self.client.fetch(msg_id, '(RFC822)')
                if status != 'OK':
                    logger.warning(f"Failed to fetch message {msg_id}")
                    continue
                    
                # Parse the email message
                raw_email = msg_data[0][1]
                email_message = email.message_from_bytes(raw_email)
                
                # Process the message
                processed = self._process_single_email(email_message)
                if processed:
                    processed_messages.append(processed)
                    
                # Mark as read if requested
                if mark_as_read:
                    await self.client.store(msg_id, '+FLAGS', '\\Seen')
                    
            except Exception as e:
                logger.error(f"Error processing message {msg_id}: {e}")
                continue
                
        return processed_messages
    
    def _process_single_email(self, email_message) -> Optional[ProcessedMessage]:
        """Process a single email message using enhanced processing.

        Args:
            email_message: Email message object from the email package

        Returns:
            ProcessedMessage if successful, None if message should be skipped
        """
        try:
            # Extract headers
            subject = self._decode_header(email_message.get('Subject', '(No Subject)'))
            from_ = email_message.get('From', '')
            to = email_message.get('To', '')
            date_str = email_message.get('Date')
            message_id = email_message.get('Message-ID', '')

            # Parse date
            date = self._parse_email_date(date_str)

            # Extract email content
            body_text, body_html = self._extract_email_content(email_message)
            body = body_text if body_text else self._strip_html(body_html) if body_html else ""

            # NEW: Use enhanced processing instead of basic approach
            from ..enhanced_email_processor import IntegratedEmailProcessor, ProcessingMode
            import os

            # Determine processing mode
            use_ai_mode = os.getenv('EMAIL_PROCESSING_MODE', 'free').lower() == 'ai'
            processing_mode = ProcessingMode.AI if use_ai_mode else ProcessingMode.FREE
            enhanced_processor = IntegratedEmailProcessor(processing_mode)

            import asyncio
            enhanced_summary = asyncio.run(
                enhanced_processor.process_email_enhanced(subject, body, from_)
            )

            if enhanced_summary is None:  # Filtered as marketing/noise
                return None

            # Create ProcessedMessage with REAL data instead of empty fields
            return ProcessedMessage(
                message_id=message_id,
                message_type=MessageType.EMAIL,
                # BEFORE: summary=subject[:200] if subject else "No subject"
                summary=enhanced_summary.summary,  # REAL SUMMARY!

                # BEFORE: key_points=[]
                key_points=enhanced_summary.key_points,  # REAL KEY POINTS!

                # BEFORE: entities={}
                entities={},  # Could enhance this too with your service

                # BEFORE: action_items=[]
                action_items=enhanced_summary.action_items,  # REAL ACTION ITEMS!

                # BEFORE: sentiment=0.0
                sentiment=0.0,  # Could enhance with sentiment analysis

                # BEFORE: priority=0
                priority=int(enhanced_summary.priority_score * 10),  # REAL PRIORITY!

                related_messages=[],
                processed_at=datetime.utcnow()
            )

        except Exception as e:
            logger.error(f"Error processing email: {e}")
            return None
            
    def _extract_email_content(
        self, 
        email_message
    ) -> Tuple[Optional[str], Optional[str]]:
        """Extract text and HTML content from an email message.
        
        Args:
            email_message: Email message object
            
        Returns:
            Tuple of (plain_text, html_content) - either may be None
        """
        body_text = None
        body_html = None
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                # Skip any attachments
                if "attachment" in content_disposition:
                    continue
                    
                # Get text/plain content
                if content_type == "text/plain" and not body_text:
                    try:
                        body_text = part.get_payload(decode=True).decode()
                    except (UnicodeDecodeError, AttributeError):
                        pass
                        
                # Get text/html content
                elif content_type == "text/html" and not body_html:
                    try:
                        body_html = part.get_payload(decode=True).decode()
                    except (UnicodeDecodeError, AttributeError):
                        pass
        else:
            # Handle non-multipart messages
            content_type = email_message.get_content_type()
            try:
                payload = email_message.get_payload(decode=True)
                if payload:
                    if content_type == "text/plain":
                        body_text = payload.decode()
                    elif content_type == "text/html":
                        body_html = payload.decode()
            except (UnicodeDecodeError, AttributeError):
                pass
        
        return body_text, body_html
    
    def _decode_header(self, header: str) -> str:
        """Decode email header values that may be encoded.
        
        Args:
            header: The header value to decode
            
        Returns:
            Decoded header string
        """
        if not header:
            return ""
            
        try:
            decoded = []
            for part, encoding in decode_header(header):
                if isinstance(part, bytes):
                    try:
                        decoded.append(part.decode(encoding or 'utf-8', errors='replace'))
                    except (LookupError, UnicodeDecodeError):
                        decoded.append(part.decode('utf-8', errors='replace'))
                else:
                    decoded.append(part)
            return ' '.join(decoded)
        except Exception as e:
            logger.warning(f"Error decoding header: {e}")
            return str(header)
    
    def _parse_email_date(self, date_str: str) -> datetime:
        """Parse an email date string into a datetime object.
        
        Args:
            date_str: The date string from the email header
            
        Returns:
            datetime object in UTC, or current time if parsing fails
        """
        if not date_str:
            return datetime.now(timezone.utc)
            
        try:
            # Try to parse using email.utils.parsedate_to_datetime
            dt = parsedate_to_datetime(date_str)
            if dt.tzinfo is None:
                # If no timezone info, assume UTC
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except (ValueError, TypeError) as e:
            logger.warning(f"Error parsing date '{date_str}': {e}")
            return datetime.now(timezone.utc)

    def _strip_html(self, html_content: str) -> str:
        """Strip HTML tags from content.

        Args:
            html_content: HTML content to clean

        Returns:
            Plain text content
        """
        if not html_content:
            return ""
        try:
            # Use BeautifulSoup for better HTML parsing
            soup = BeautifulSoup(html_content, 'html.parser')
            return soup.get_text().strip()
        except Exception:
            # Fallback to regex if BeautifulSoup fails
            return re.sub(r'<[^>]+>', '', html_content).strip()
