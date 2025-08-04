"""Orchestrates the data processing pipeline for 360Brief."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from .models import EmailMessage, CalendarEvent, ProcessedMessage
from .services import (
    EmailProcessor,
    CalendarService,
    SummarizationService,
    VisualizationService,
    EmailService
)

class ProcessingOrchestrator:
    """Coordinates the data processing pipeline for generating executive digests.
    
    This class manages the flow of data between different processing services,
    including email processing, calendar event handling, summarization, and
    visualization generation.
    """
    
    def __init__(self, config: Optional[Dict] = None) -> None:
        """Initialize the orchestrator with optional configuration.
        
        Args:
            config: Optional configuration dictionary for the orchestrator.
        """
        self.config = config or {}
        
        # Initialize services
        self.email_processor = EmailProcessor()
        self.calendar_service = CalendarService()
        self.summarization_service = SummarizationService()
        self.visualization_service = VisualizationService()
        self.email_service = EmailService()
        
        # Cache for processed data
        self._cache: Dict[str, Any] = {}
    
    async def fetch_and_process_emails(
        self,
        user_email: str,
        start_date: datetime,
        end_date: Optional[datetime] = None,
        folder: str = "INBOX",
        mark_as_read: bool = False
    ) -> List[ProcessedMessage]:
        """Fetch and process emails for a user within a date range.
        
        Args:
            user_email: Email address of the user
            start_date: Start of date range for fetching emails
            end_date: End of date range (defaults to now if not provided)
            folder: Email folder to search in (default: "INBOX")
            mark_as_read: Whether to mark messages as read (default: False)
            
        Returns:
            List of processed email messages
            
        Raises:
            ConnectionError: If unable to connect to the email server
            Exception: For other processing errors
        """
        if end_date is None:
            end_date = datetime.now(timezone.utc)
            
        try:
            # Fetch emails using the email processor
            emails = await self.email_processor.fetch_emails(
                user_email=user_email,
                start_date=start_date,
                end_date=end_date,
                folder=folder,
                mark_as_read=mark_as_read
            )
            
            # Process the emails (extract entities, categorize, etc.)
            processed_emails = []
            for email in emails:
                try:
                    # Apply additional processing if needed
                    processed = await self._enrich_email_data(email)
                    processed_emails.append(processed)
                except Exception as e:
                    logger.error(f"Error processing email {email.message_id}: {e}")
                    continue
                    
            return processed_emails
            
        except Exception as e:
            logger.error(f"Error in fetch_and_process_emails: {e}")
            raise
            
    async def _enrich_email_data(self, email: ProcessedMessage) -> ProcessedMessage:
        """Enhance email data with additional processing.
        
        Args:
            email: The email message to enrich
            
        Returns:
            Enriched email message
        """
        # Here we can add additional processing like:
        # - Entity extraction
        # - Sentiment analysis
        # - Priority calculation
        # - Categorization
        
        # For now, just return the email as-is
        return email
        
    async def process_emails(self, raw_emails: List[Dict[str, Any]]) -> List[ProcessedMessage]:
        """Process a list of raw email messages into structured data.
        
        Args:
            raw_emails: List of raw email dictionaries from the email service.
            
        Returns:
            List of processed email messages with extracted entities and metadata.
            
        Note:
            Silently skips any emails that fail processing and logs the error.
        """
        processed_emails: List[ProcessedMessage] = []
        for email in raw_emails:
            try:
                email_msg = EmailMessage(**email)
                if processed := self.email_processor.process(email_msg):
                    processed_emails.append(processed)
            except Exception as e:
                print(f"Error processing email: {e}")
                continue
        return processed_emails
    
    async def generate_insights(
        self,
        emails: List[ProcessedMessage],
        calendar_events: List[CalendarEvent]
    ) -> Dict[str, Any]:
        """Generate comprehensive insights from processed emails and calendar events.
        
        This method performs the following operations:
        1. Extracts key metrics from emails and events
        2. Generates data visualizations
        3. Creates an executive summary using AI
        4. Identifies key insights and patterns
        
        Args:
            emails: List of processed email messages
            calendar_events: List of calendar events
            
        Returns:
            Dictionary containing:
                - summary: AI-generated executive summary
                - metrics: Key performance indicators
                - visualizations: Generated charts and graphs
                - key_insights: List of important findings
        """
        # Extract key metrics
        sender_counts = self._count_senders(emails)
        date_activity = self._analyze_activity_timeline(emails)
        
        # Generate visualizations
        sender_chart = self.visualization_service.generate_sender_chart(sender_counts)
        timeline_chart = self.visualization_service.generate_timeline(date_activity)
        
        # Generate summary using Gemini
        summary_data = {
            'emails': [e.dict() for e in emails],
            'events': [e.dict() for e in calendar_events],
            'metrics': {
                'total_emails': len(emails),
                'unique_senders': len(sender_counts),
                'meetings_count': len(calendar_events)
            }
        }
        
        summary = await self.summarization_service.generate_summary(summary_data)
        
        return {
            'summary': summary,
            'metrics': summary_data['metrics'],
            'visualizations': {
                'sender_chart': sender_chart,
                'timeline_chart': timeline_chart
            },
            'key_insights': self._extract_key_insights(emails, calendar_events)
        }
    
    async def generate_digest(
        self,
        user_email: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate an executive digest for the specified date range.
        
        The digest provides a comprehensive overview of the user's communications
        and schedule, including summaries, key metrics, visualizations, and
        action items.
        
        Args:
            user_email: Email address of the user to generate digest for.
            start_date: Start of the analysis period. Defaults to 7 days before end_date.
            end_date: End of the analysis period. Defaults to current UTC time.
            
        Returns:
            Dictionary containing the complete digest with the following structure:
            {
                'date': str,  # Date of digest generation
                'time_period': {'start': str, 'end': str},  # ISO format dates
                'summary': str,  # AI-generated executive summary
                'metrics': dict,  # Key performance indicators
                'visualizations': dict,  # Generated charts and graphs
                'key_insights': list[str],  # List of important findings
                'action_items': list[dict]  # Recommended next actions
            }
            
        Raises:
            ValueError: If start_date is after end_date
            APIError: If there's an error fetching data from external services
        """
        if start_date and end_date and start_date > end_date:
            raise ValueError("start_date cannot be after end_date")
            
        end_date = end_date or datetime.utcnow()
        start_date = start_date or (end_date - timedelta(days=7))
        
        try:
            # Fetch and process data in parallel
            emails, events = await asyncio.gather(
                self._fetch_and_process_emails(user_email, start_date, end_date),
                self._fetch_and_process_events(user_email, start_date, end_date)
            )
            
            insights = await self.generate_insights(emails, events)
            
            return {
                'date': datetime.utcnow().strftime('%Y-%m-%d'),
                'time_period': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'summary': insights['summary'],
                'metrics': insights['metrics'],
                'visualizations': insights['visualizations'],
                'key_insights': insights['key_insights'],
                'action_items': self._extract_action_items(emails, events)
            }
            
        except Exception as e:
            print(f"Error generating digest: {e}")
            raise
    
    async def _fetch_and_process_emails(
        self,
        user_email: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[ProcessedMessage]:
        """Fetch and process emails for the specified user and date range.
        
        Args:
            user_email: Email address of the user
            start_date: Start of the date range (inclusive)
            end_date: End of the date range (inclusive)
            
        Returns:
            List of processed email messages with extracted entities and metadata
            
        Note:
            This implementation uses the EmailProcessor to fetch and process emails
            from the user's inbox. It handles authentication, fetching, and basic
            processing of email content.
        """
        try:
            logger.info(f"Fetching emails for {user_email} from {start_date} to {end_date}")
            
            # Use the fetch_and_process_emails method to handle the actual fetching
            emails = await self.fetch_and_process_emails(
                user_email=user_email,
                start_date=start_date,
                end_date=end_date,
                folder='INBOX',
                mark_as_read=False  # Don't mark as read by default to be non-destructive
            )
            
            logger.info(f"Successfully processed {len(emails)} emails")
            return emails
            
        except Exception as e:
            logger.error(f"Error in _fetch_and_process_emails: {e}")
            # Return empty list on error to allow partial functionality
            return []
    
    async def _fetch_and_process_events(
        self,
        user_email: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[CalendarEvent]:
        """Fetch and process calendar events for the specified user and date range.
        
        Args:
            user_email: Email address of the user
            start_date: Start of the date range (inclusive)
            end_date: End of the date range (inclusive)
            
        Returns:
            List of processed calendar events
            
        Raises:
            CalendarServiceError: If there's an error fetching or processing events
        """
        try:
            raw_events = await self.calendar_service.fetch_events(
                user_email=user_email,
                time_min=start_date,
                time_max=end_date
            )
            return self.calendar_service.process_events(raw_events)
            
        except Exception as e:
            print(f"Error fetching calendar events: {e}")
            # Return empty list on error to allow partial functionality
            return []
    
    def _count_senders(self, emails: List[ProcessedMessage]) -> Dict[str, int]:
        """Count occurrences of each email sender.
        
        Args:
            emails: List of processed email messages
            
        Returns:
            Dictionary mapping sender email addresses to their message counts
        """
        sender_counts: Dict[str, int] = {}
        for email in emails:
            sender = email.sender
            sender_counts[sender] = sender_counts.get(sender, 0) + 1
        return sender_counts
    
    def _analyze_activity_timeline(
        self,
        emails: List[ProcessedMessage],
        date_format: str = "%Y-%m-%d"
    ) -> Dict[str, int]:
        """Analyze email activity over time.
        
        Args:
            emails: List of processed email messages
            date_format: Format string for date representation
            
        Returns:
            Dictionary mapping date strings to email counts
        """
        date_counts: Dict[str, int] = {}
        for email in emails:
            date_str = email.timestamp.strftime(date_format)
            date_counts[date_str] = date_counts.get(date_str, 0) + 1
        return date_counts
    
    def _extract_key_insights(
        self,
        emails: List[ProcessedMessage],
        events: List[CalendarEvent]
    ) -> List[str]:
        """Extract key insights from emails and calendar events.
        
        This analyzes entities mentioned in emails to identify the most frequently 
        occurring topics, people, and organizations. The insights are limited to 
        the top 3 most significant findings.
        
        Args:
            emails: List of processed email messages to analyze
            events: List of calendar events (currently unused but kept for future expansion)
            
        Returns:
            List of human-readable insights, each as a string
            
        Note:
            Currently only processes emails but structured to include calendar events
            in future implementations.
        """
        # Track entities across all emails
        all_entities: Dict[str, Dict[str, int]] = {}
        
        # Count entity occurrences across all emails
        for email in emails:
            for entity_type, entities in email.entities.items():
                if entity_type not in all_entities:
                    all_entities[entity_type] = {}
                for entity in entities:
                    all_entities[entity_type][entity] = all_entities[entity_type].get(entity, 0) + 1
        
        # Get top entities across all types
        top_entities: List[tuple[str, str, int]] = []
        for entity_type, entities in all_entities.items():
            # Get top 3 entities per type, sorted by frequency
            sorted_entities = sorted(entities.items(), 
                                   key=lambda x: x[1], 
                                   reverse=True)[:3]
            top_entities.extend([(entity_type, entity, count) 
                              for entity, count in sorted_entities])
        
        # Format as human-readable insights (limit to top 3 overall)
        insights: List[str] = []
        for entity_type, entity, count in sorted(top_entities, 
                                               key=lambda x: x[2], 
                                               reverse=True)[:3]:
            # Convert entity_type to more readable format (e.g., 'PERSON' -> 'person')
            entity_type_readable = entity_type.replace('_', ' ').lower()
            insights.append(
                f"{entity} was mentioned {count} times as a {entity_type_readable}"
            )
            
        return insights
    
    def _extract_action_items(
        self,
        emails: List[ProcessedMessage],
        events: List[CalendarEvent]
    ) -> List[Dict[str, Any]]:
        """Extract and prioritize action items from emails and calendar events.
        
        Action items are identified based on email content and calendar events.
        Each action item includes a type, description, source reference,
        due date (if available), and priority level.
        
        Args:
            emails: List of processed email messages
            events: List of calendar events
            
        Returns:
            List of action item dictionaries with the following structure:
            {
                'type': str,           # 'email' or 'calendar'
                'description': str,    # Action description
                'source': str,         # Reference to source
                'due_date': Optional[datetime],
                'priority': str        # 'low', 'medium', or 'high'
            }
        """
        action_items: List[Dict[str, Any]] = []
        
        # Process email action items
        for email in emails:
            for action in email.action_items:
                action_items.append({
                    'type': 'email',
                    'description': action,
                    'source': f'Email: {email.subject}',
                    'due_date': None,  # Could be extracted from email content
                    'priority': self._determine_priority(action)
                })
        
        # Process calendar event action items
        for event in events:
            # Look for follow-up events or events marked as action items
            if any(keyword in event.title.lower() 
                   for keyword in ['follow up', 'action', 'todo']):
                action_items.append({
                    'type': 'calendar',
                    'description': f"Follow up on: {event.title}",
                    'source': f'Calendar: {event.title}',
                    'due_date': event.start_time,
                    'priority': self._determine_priority(event.title)
                })
        
        return action_items
    
    def _determine_priority(self, text: str) -> str:
        """Determine priority level based on text content.
        
        Args:
            text: Text to analyze for priority indicators
            
        Returns:
            Priority level as 'low', 'medium', or 'high'
        """
        text_lower = text.lower()
        if any(word in text_lower for word in ['urgent', 'asap', 'immediate']):
            return 'high'
        elif any(word in text_lower for word in ['important', 'priority']):
            return 'medium'
        return 'low'
