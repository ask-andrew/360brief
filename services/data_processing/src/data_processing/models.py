"""Data models for the data processing service."""
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, HttpUrl


class MessageType(str, Enum):
    """Types of messages that can be processed."""
    EMAIL = "email"
    CALENDAR = "calendar"
    CHAT = "chat"
    TASK = "task"


class MessageStatus(str, Enum):
    """Status of a processed message."""
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    ERROR = "error"


class BaseMessage(BaseModel):
    """Base model for all message types."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    source_id: str  # Original ID from the source system
    message_type: MessageType
    subject: str
    body: str
    sender: str
    recipients: List[str] = []
    timestamp: datetime
    metadata: Dict[str, Union[str, int, float, bool]] = {}
    status: MessageStatus = MessageStatus.PENDING
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class EmailMessage(BaseMessage):
    """Email-specific message model."""
    message_type: MessageType = MessageType.EMAIL
    thread_id: Optional[str] = None
    in_reply_to: Optional[str] = None
    cc_recipients: List[str] = []
    bcc_recipients: List[str] = []
    attachments: List[Dict] = []
    headers: Dict[str, str] = {}


class CalendarEvent(BaseModel):
    """Calendar event model."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    source_id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    organizer: str
    attendees: List[str] = []
    status: str = "confirmed"
    metadata: Dict = {}


class ProcessedMessage(BaseModel):
    """Model for processed message output."""
    message_id: str
    message_type: MessageType
    summary: str
    key_points: List[str]
    entities: Dict[str, List[str]]
    action_items: List[str]
    sentiment: Optional[float] = None
    priority: int = 0  # 0-5, where 5 is highest priority
    related_messages: List[str] = []
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
