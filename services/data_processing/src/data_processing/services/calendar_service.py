"""Service for processing calendar events."""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from ..models import CalendarEvent

class CalendarService:
    """Service for processing calendar events."""
    
    def __init__(self, google_calendar_service=None):
        """Initialize with optional Google Calendar service."""
        self.calendar_service = google_calendar_service

    async def fetch_events(
        self, 
        time_min: datetime = None, 
        time_max: datetime = None,
        max_results: int = 10
    ) -> List[Dict]:
        """
        Fetch calendar events within the specified time range.
        
        Args:
            time_min: Start of time range (default: now)
            time_max: End of time range (default: 7 days from now)
            max_results: Maximum number of events to return
            
        Returns:
            List of calendar events
        """
        if not self.calendar_service:
            raise ValueError("Google Calendar service not initialized")
            
        time_min = time_min or datetime.utcnow()
        time_max = time_max or (time_min + timedelta(days=7))
        
        try:
            events_result = (
                self.calendar_service.events()
                .list(
                    calendarId='primary',
                    timeMin=time_min.isoformat() + 'Z',
                    timeMax=time_max.isoformat() + 'Z',
                    maxResults=max_results,
                    singleEvents=True,
                    orderBy='startTime'
                )
                .execute()
            )
            return events_result.get('items', [])
        except Exception as e:
            # Log error and return empty list
            print(f"Error fetching calendar events: {e}")
            return []

    def process_events(self, events: List[Dict]) -> List[CalendarEvent]:
        """
        Process raw calendar events into our data model.
        
        Args:
            events: List of raw event dictionaries from Google Calendar API
            
        Returns:
            List of processed CalendarEvent objects
        """
        processed_events = []
        for event in events:
            try:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                processed_events.append(CalendarEvent(
                    source_id=event.get('id'),
                    title=event.get('summary', 'No Title'),
                    description=event.get('description', ''),
                    start_time=start,
                    end_time=end,
                    location=event.get('location', ''),
                    organizer=event.get('organizer', {}).get('email', ''),
                    attendees=[a.get('email') for a in event.get('attendees', [])],
                    status=event.get('status', 'confirmed'),
                    metadata={
                        'htmlLink': event.get('htmlLink'),
                        'hangoutLink': event.get('hangoutLink', '')
                    }
                ))
            except Exception as e:
                print(f"Error processing event {event.get('id')}: {e}")
                continue
                
        return processed_events
