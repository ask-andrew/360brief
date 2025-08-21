""
Test script for the 360Brief Analytics service.

This script tests the core functionality of the analytics service,
including data models, processing, and API endpoints.
"""
import unittest
from datetime import datetime, timedelta
import httpx
import asyncio

from src.analytics.models.communication import (
    Participant, EmailCommunication, SlackCommunication, MeetingCommunication,
    Direction, CommunicationType, SlackMessageType, MeetingStatus
)
from src.analytics.services.processor import CommunicationProcessor
from src.analytics.main import create_app

class TestAnalytics(unittest.TestCase):
    """Test cases for the analytics service."""
    
    def setUp(self):
        """Set up test data and processor."""
        self.processor = CommunicationProcessor()
        self.participants = {
            'user1': Participant(id='user1', name='Alex Johnson', email='alex@example.com'),
            'user2': Participant(id='user2', name='Taylor Smith', email='taylor@example.com', is_external=True),
            'user3': Participant(id='user3', name='Jordan Lee', email='jordan@example.com'),
        }
        
        # Create test communications
        self.emails = [
            EmailCommunication(
                direction=Direction.INBOUND,
                timestamp=datetime.utcnow() - timedelta(days=i),
                participants=[self.participants['user2'], self.participants['user1']],
                source_id=f'email-{i}',
                subject=f'Test Email {i}',
                body_preview=f'This is test email {i}',
                thread_id=f'thread-{i//2}',  # Group emails into threads
                is_read=(i % 2 == 0),
                has_attachments=(i % 3 == 0)
            )
            for i in range(5)
        ]
        
        self.slack_messages = [
            SlackCommunication(
                direction=Direction.OUTBOUND if i % 2 == 0 else Direction.INBOUND,
                timestamp=datetime.utcnow() - timedelta(hours=i),
                participants=[self.participants[f'user{j}'] for j in range(1, 4) if (i + j) % 3 != 0],
                source_id=f'slack-{i}',
                message_type=SlackMessageType.DIRECT_MESSAGE if i % 2 == 0 else SlackMessageType.CHANNEL_MESSAGE,
                channel_id=f'C{12345 + i}',
                channel_name='general' if i % 2 else 'random',
                text=f'Test message {i}'
            )
            for i in range(5)
        ]
        
        self.meetings = [
            MeetingCommunication(
                direction=Direction.INBOUND,
                timestamp=datetime.utcnow() - timedelta(days=i, hours=10),
                participants=[self.participants[f'user{j}'] for j in range(1, 4)],
                source_id=f'meeting-{i}',
                subject=f'Test Meeting {i}',
                start_time=datetime.utcnow() - timedelta(days=i, hours=10),
                end_time=datetime.utcnow() - timedelta(days=i, hours=9, minutes=30),
                duration_minutes=30 + (i * 5),
                organizer=self.participants['user2'] if i % 2 else self.participants['user3'],
                is_recurring=(i % 2 == 0)
            )
            for i in range(3)
        ]
        
        # Add all communications to processor
        for comm in self.emails + self.slack_messages + self.meetings:
            self.processor.add_communication(comm)
    
    def test_communication_models(self):
        ""Test that communication models are created correctly."""
        self.assertEqual(len(self.emails), 5)
        self.assertEqual(len(self.slack_messages), 5)
        self.assertEqual(len(self.meetings), 3)
        
        # Test email model
        email = self.emails[0]
        self.assertEqual(email.type, CommunicationType.EMAIL)
        self.assertIn('Test Email', email.subject)
        self.assertEqual(len(email.participants), 2)
        
        # Test Slack message model
        slack_msg = self.slack_messages[0]
        self.assertEqual(slack_msg.type, CommunicationType.SLACK)
        self.assertIn('Test message', slack_msg.text)
        
        # Test meeting model
        meeting = self.meetings[0]
        self.assertEqual(meeting.type, CommunicationType.MEETING)
        self.assertGreater(meeting.duration_minutes, 0)
    
    def test_processor_add_communications(self):
        ""Test adding communications to the processor."""
        self.assertEqual(len(self.processor.communications), 13)  # 5 emails + 5 slack + 3 meetings
        
        # Verify contacts were added correctly
        self.assertGreaterEqual(len(self.processor.contacts), 3)  # At least our 3 test users
        self.assertIn('user1', self.processor.contacts)
        self.assertEqual(self.processor.contacts['user1']['name'], 'Alex Johnson')
    
    def test_network_graph(self):
        ""Test network graph generation."""
        network_data = self.processor._generate_network_data()
        self.assertIn('nodes', network_data)
        self.assertIn('links', network_data)
        
        # Verify we have nodes for all participants
        self.assertGreaterEqual(len(network_data['nodes']), 3)
        
        # Verify we have edges between participants
        self.assertGreater(len(network_data['links']), 0)
    
    def test_analytics_generation(self):
        ""Test analytics generation."""
        analytics = self.processor.generate_analytics()
        
        # Verify basic stats
        self.assertEqual(analytics.email_stats.total_count, 5)
        self.assertEqual(analytics.slack_stats.total_count, 5)
        self.assertEqual(analytics.meeting_stats['total_meetings'], 3)
        
        # Verify top contacts
        self.assertGreaterEqual(len(analytics.top_contacts), 1)
        self.assertLessEqual(len(analytics.top_contacts), 10)
        
        # Verify time series data
        self.assertIn('dates', analytics.time_series_data)
        self.assertIn('email', analytics.time_series_data)
        self.assertIn('slack', analytics.time_series_data)
        self.assertIn('meeting', analytics.time_series_data)


class TestAPI(unittest.IsolatedAsyncioTestCase):
    ""Test cases for the API endpoints."""
    
    async def asyncSetUp(self):
        ""Set up test client and test data."""
        self.app = create_app()
        self.client = httpx.AsyncClient(app=self.app, base_url="http://test")
    
    async def asyncTearDown(self):
        ""Clean up after tests."""
        await self.client.aclose()
    
    async def test_health_check(self):
        ""Test the health check endpoint."""
        response = await self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
    
    async def test_analytics_endpoint(self):
        ""Test the analytics endpoint."""
        response = await self.client.get("/api/analytics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify response structure
        self.assertIn("email_stats", data)
        self.assertIn("slack_stats", data)
        self.assertIn("meeting_stats", data)
        self.assertIn("top_contacts", data)
        self.assertIn("time_series_data", data)
        self.assertIn("network_graph", data)
    
    async def test_recent_communications(self):
        ""Test the recent communications endpoint."""
        response = await self.client.get("/api/communications/recent?limit=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify we got a list of communications
        self.assertIsInstance(data, list)
        self.assertLessEqual(len(data), 5)
        
        if data:  # If we have data, verify the structure
            comm = data[0]
            self.assertIn("type", comm)
            self.assertIn("timestamp", comm)
            self.assertIn("participants", comm)
    
    async def test_network_graph_endpoint(self):
        ""Test the network graph endpoint."""
        response = await self.client.get("/api/network/graph")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify response structure
        self.assertIn("nodes", data)
        self.assertIn("links", data)
        self.assertIsInstance(data["nodes"], list)
        self.assertIsInstance(data["links"], list)


if __name__ == "__main__":
    unittest.main()
