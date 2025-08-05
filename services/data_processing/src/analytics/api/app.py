from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import uvicorn
import logging

from ..models.communication import (
    CommunicationAnalytics, EmailCommunication, SlackCommunication, 
    MeetingCommunication, Participant, Direction, CommunicationType
)
from ..services.processor import CommunicationProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="360Brief Analytics API",
    description="API for communication analytics and insights",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processor (in-memory for now, replace with database in production)
processor = CommunicationProcessor()

# Sample data loading (replace with actual data loading in production)
def load_sample_data():
    """Load sample data for demonstration purposes."""
    try:
        # Sample participants
        participants = {
            'user1': Participant(id='user1', name='Alex Johnson', email='alex@example.com'),
            'user2': Participant(id='user2', name='Taylor Smith', email='taylor@example.com', is_external=True),
            'user3': Participant(id='user3', name='Jordan Lee', email='jordan@example.com'),
            'user4': Participant(id='user4', name='Casey Kim', email='casey@example.com', is_external=True),
            'user5': Participant(id='user5', name='Morgan Taylor', email='morgan@example.com'),
        }
        
        # Sample emails
        sample_emails = [
            EmailCommunication(
                direction=Direction.INBOUND,
                timestamp=datetime.utcnow() - timedelta(days=i, hours=j),
                participants=[participants['user2'], participants['user1']],
                source_id=f'email-{i}-{j}',
                subject=f'Project Update {i}-{j}',
                body_preview='Here are the latest updates on our project...',
                thread_id=f'thread-{i}',
                is_read=True,
                has_attachments=(i + j) % 3 == 0
            )
            for i in range(5) for j in range(3)
        ]
        
        # Sample Slack messages
        sample_slack = [
            SlackCommunication(
                direction=Direction.OUTBOUND if i % 2 == 0 else Direction.INBOUND,
                timestamp=datetime.utcnow() - timedelta(hours=i),
                participants=[participants[f'user{j}'] for j in range(1, 4) if (i + j) % 3 != 0],
                source_id=f'slack-{i}',
                message_type='direct_message' if i % 2 == 0 else 'channel_message',
                channel_id=f'C{12345 + i}',
                channel_name='general' if i % 2 else 'random',
                text=f'This is a sample message {i}'
            )
            for i in range(10)
        ]
        
        # Sample meetings
        sample_meetings = [
            MeetingCommunication(
                direction=Direction.INBOUND,
                timestamp=datetime.utcnow() - timedelta(days=i, hours=10),
                participants=[participants[f'user{j}'] for j in range(1, 4)],
                source_id=f'meeting-{i}',
                subject=f'Weekly Sync {i}',
                start_time=datetime.utcnow() - timedelta(days=i, hours=10),
                end_time=datetime.utcnow() - timedelta(days=i, hours=9, minutes=30),
                duration_minutes=30 + (i * 5),
                organizer=participants['user2'] if i % 2 else participants['user3'],
                is_recurring=(i % 3 == 0)
            )
            for i in range(5)
        ]
        
        # Add all communications to processor
        for comm in sample_emails + sample_slack + sample_meetings:
            processor.add_communication(comm)
            
        logger.info(f"Loaded {len(sample_emails)} emails, {len(sample_slack)} Slack messages, and {len(sample_meetings)} meetings")
        
    except Exception as e:
        logger.error(f"Error loading sample data: {str(e)}")
        raise

# Load sample data on startup
load_sample_data()

# API Endpoints
@app.get("/api/analytics", response_model=CommunicationAnalytics)
async def get_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
):
    """
    Get communication analytics for the specified date range.
    """
    try:
        analytics = processor.generate_analytics(start_date, end_date)
        return analytics.dict()
    except Exception as e:
        logger.error(f"Error generating analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/communications/recent")
async def get_recent_communications(
    limit: int = Query(10, ge=1, le=100, description="Number of recent communications to return")
):
    """
    Get the most recent communications across all channels.
    """
    try:
        # Sort all communications by timestamp and get the most recent ones
        recent = sorted(
            processor.communications,
            key=lambda x: x.timestamp,
            reverse=True
        )[:limit]
        
        # Convert to dict and handle serialization
        return [
            {**comm.dict(), 'timestamp': comm.timestamp.isoformat()}
            for comm in recent
        ]
    except Exception as e:
        logger.error(f"Error getting recent communications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/network/graph")
async def get_network_graph(
    min_weight: int = Query(1, ge=1, description="Minimum edge weight to include")
):
    """
    Get the communication network graph data.
    """
    try:
        network_data = processor._generate_network_data()
        
        # Filter edges by minimum weight
        if min_weight > 1:
            network_data['links'] = [
                link for link in network_data['links'] 
                if link['weight'] >= min_weight
            ]
            
        return network_data
    except Exception as e:
        logger.error(f"Error generating network graph: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "communications_processed": len(processor.communications),
        "unique_contacts": len(processor.contacts)
    }

# Run with: uvicorn app:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
