"""Unit tests for the ProcessingOrchestrator class."""

import pytest
import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List, Dict, Any, Optional

from data_processing.orchestrator import ProcessingOrchestrator
from data_processing.models import ProcessedMessage, CalendarEvent
from data_processing.services.email_processor import EmailProcessor

# Test data
TEST_EMAIL = "test@example.com"
START_DATE = datetime(2023, 1, 1, tzinfo=timezone.utc)
END_DATE = datetime(2023, 1, 8, tzinfo=timezone.utc)

# Fixtures
@pytest.fixture
def mock_services():
    """Fixture that mocks all the services used by the orchestrator."""
    with patch('data_processing.orchestrator.EmailProcessor') as mock_email_processor, \
         patch('data_processing.orchestrator.CalendarService') as mock_calendar_service, \
         patch('data_processing.orchestrator.SummarizationService') as mock_summarization_service, \
         patch('data_processing.orchestrator.VisualizationService') as mock_visualization_service, \
         patch('data_processing.orchestrator.EmailService') as mock_email_service:
        
        # Create mock instances
        mock_email_processor.return_value = AsyncMock()
        mock_calendar_service.return_value = AsyncMock()
        mock_summarization_service.return_value = AsyncMock()
        mock_visualization_service.return_value = MagicMock()
        mock_email_service.return_value = AsyncMock()
        
        yield {
            'email_processor': mock_email_processor.return_value,
            'calendar_service': mock_calendar_service.return_value,
            'summarization_service': mock_summarization_service.return_value,
            'visualization_service': mock_visualization_service.return_value,
            'email_service': mock_email_service.return_value,
        }

@pytest.fixture
def test_emails() -> List[ProcessedMessage]:
    """Fixture that provides test email data."""
    return [
        ProcessedMessage(
            message_id="1",
            subject="Test Email 1",
            sender="sender1@example.com",
            recipients=TEST_EMAIL,
            timestamp=datetime(2023, 1, 2, 10, 0, tzinfo=timezone.utc),
            body_text="This is a test email",
            body_html="<p>This is a test email</p>",
            entities={"PERSON": ["John"], "ORG": ["Example Corp"]},
            action_items=["Follow up with John"],
            importance=0.8,
            category="work"
        ),
        ProcessedMessage(
            message_id="2",
            subject="Test Email 2",
            sender="sender2@example.com",
            recipients=TEST_EMAIL,
            timestamp=datetime(2023, 1, 3, 14, 30, tzinfo=timezone.utc),
            body_text="Another test email",
            body_html="<p>Another test email</p>",
            entities={"PERSON": ["Jane"], "ORG": ["Test Inc"]},
            action_items=["Review proposal from Jane"],
            importance=0.6,
            category="work"
        )
    ]

@pytest.fixture
def test_events() -> List[CalendarEvent]:
    """Fixture that provides test calendar event data."""
    return [
        CalendarEvent(
            id="event1",
            summary="Team Meeting",
            start=datetime(2023, 1, 2, 10, 0, tzinfo=timezone.utc),
            end=datetime(2023, 1, 2, 11, 0, tzinfo=timezone.utc),
            attendees=["attendee1@example.com", TEST_EMAIL],
            location="Zoom",
            description="Weekly team sync"
        )
    ]

# Tests
@pytest.mark.asyncio
async def test_init(mock_services):
    """Test that the orchestrator initializes with all required services."""
    orchestrator = ProcessingOrchestrator()
    
    # Verify services are initialized
    assert hasattr(orchestrator, 'email_processor')
    assert hasattr(orchestrator, 'calendar_service')
    assert hasattr(orchestrator, 'summarization_service')
    assert hasattr(orchestrator, 'visualization_service')
    assert hasattr(orchestrator, 'email_service')
    assert isinstance(orchestrator._cache, dict)

@pytest.mark.asyncio
async def test_fetch_and_process_emails(mock_services, test_emails):
    """Test the fetch_and_process_emails method."""
    # Setup
    orchestrator = ProcessingOrchestrator()
    mock_services['email_processor'].fetch_emails.return_value = test_emails
    
    # Call the method
    result = await orchestrator.fetch_and_process_emails(
        user_email=TEST_EMAIL,
        start_date=START_DATE,
        end_date=END_DATE
    )
    
    # Verify the result
    assert len(result) == 2
    assert result[0].subject == "Test Email 1"
    assert result[1].subject == "Test Email 2"
    
    # Verify the email processor was called with correct parameters
    mock_services['email_processor'].fetch_emails.assert_called_once_with(
        user_email=TEST_EMAIL,
        start_date=START_DATE,
        end_date=END_DATE,
        folder="INBOX",
        mark_as_read=False
    )

@pytest.mark.asyncio
async def test_generate_digest(mock_services, test_emails, test_events):
    """Test the generate_digest method."""
    # Setup
    orchestrator = ProcessingOrchestrator()
    
    # Mock the internal methods
    orchestrator._fetch_and_process_emails = AsyncMock(return_value=test_emails)
    orchestrator._fetch_and_process_events = AsyncMock(return_value=test_events)
    
    # Mock the generate_insights method
    mock_insights = {
        'summary': 'Test summary',
        'metrics': {'email_count': 2, 'event_count': 1},
        'visualizations': {},
        'key_insights': ['Key insight 1', 'Key insight 2']
    }
    orchestrator.generate_insights = AsyncMock(return_value=mock_insights)
    
    # Call the method
    result = await orchestrator.generate_digest(
        user_email=TEST_EMAIL,
        start_date=START_DATE,
        end_date=END_DATE
    )
    
    # Verify the result structure
    assert 'date' in result
    assert 'time_period' in result
    assert 'summary' in result
    assert 'metrics' in result
    assert 'visualizations' in result
    assert 'key_insights' in result
    assert 'action_items' in result
    
    # Verify the time period
    assert result['time_period']['start'] == START_DATE.isoformat()
    assert result['time_period']['end'] == END_DATE.isoformat()
    
    # Verify the internal methods were called
    orchestrator._fetch_and_process_emails.assert_called_once_with(
        TEST_EMAIL, START_DATE, END_DATE
    )
    orchestrator._fetch_and_process_events.assert_called_once_with(
        TEST_EMAIL, START_DATE, END_DATE
    )
    orchestrator.generate_insights.assert_awaited_once_with(
        test_emails, test_events
    )

@pytest.mark.asyncio
async def test_fetch_and_process_events(mock_services, test_events):
    """Test the _fetch_and_process_events method."""
    # Setup
    orchestrator = ProcessingOrchestrator()
    mock_services['calendar_service'].fetch_events.return_value = test_events
    
    # Call the method
    result = await orchestrator._fetch_and_process_events(
        user_email=TEST_EMAIL,
        start_date=START_DATE,
        end_date=END_DATE
    )
    
    # Verify the result
    assert len(result) == 1
    assert result[0].summary == "Team Meeting"
    
    # Verify the calendar service was called with correct parameters
    mock_services['calendar_service'].fetch_events.assert_called_once_with(
        user_email=TEST_EMAIL,
        time_min=START_DATE,
        time_max=END_DATE
    )

@pytest.mark.asyncio
async def test_generate_insights(mock_services, test_emails, test_events):
    """Test the generate_insights method."""
    # Setup
    orchestrator = ProcessingOrchestrator()
    
    # Mock the summarization service
    mock_insight_data = {
        'summary': 'Test summary',
        'metrics': {'test_metric': 42},
        'key_insights': ['Test insight 1', 'Test insight 2']
    }
    mock_services['summarization_service'].generate_summary.return_value = mock_insight_data
    
    # Mock the visualization service
    mock_services['visualization_service'].generate_sender_chart.return_value = 'mock_chart_data'
    mock_services['visualization_service'].generate_timeline.return_value = 'mock_timeline_data'
    
    # Call the method
    result = await orchestrator.generate_insights(test_emails, test_events)
    
    # Verify the result structure
    assert 'summary' in result
    assert 'metrics' in result
    assert 'visualizations' in result
    assert 'key_insights' in result
    
    # Verify the visualizations were generated
    assert 'sender_chart' in result['visualizations']
    assert 'timeline_chart' in result['visualizations']
    
    # Verify the summarization service was called
    mock_services['summarization_service'].generate_summary.assert_awaited_once()
    
    # Verify the visualization service was called
    mock_services['visualization_service'].generate_sender_chart.assert_called_once()
    mock_services['visualization_service'].generate_timeline.assert_called_once()
