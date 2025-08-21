from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from uuid import UUID, uuid4


class CommunicationType(str, Enum):
    EMAIL = "email"
    SLACK = "slack"
    MEETING = "meeting"


class Direction(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class Participant(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    is_external: bool = False


class BaseCommunication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: CommunicationType
    direction: Direction
    timestamp: datetime
    participants: List[Participant]
    source_id: str  # Original ID from the source system
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class EmailCommunication(BaseCommunication):
    type: CommunicationType = CommunicationType.EMAIL
    subject: str
    body_preview: Optional[str] = None
    thread_id: str
    in_reply_to: Optional[str] = None
    cc_recipients: List[Participant] = []
    bcc_recipients: List[Participant] = []
    labels: List[str] = []
    is_read: bool = False
    is_important: bool = False
    has_attachments: bool = False


class SlackMessageType(str, Enum):
    DIRECT_MESSAGE = "direct_message"
    CHANNEL_MESSAGE = "channel_message"
    THREAD_REPLY = "thread_reply"


class SlackCommunication(BaseCommunication):
    type: CommunicationType = CommunicationType.SLACK
    message_type: SlackMessageType
    channel_id: str
    channel_name: str
    thread_ts: Optional[str] = None  # Timestamp of parent message if this is a thread reply
    text: str
    reactions: List[Dict[str, Any]] = []
    is_private: bool = False


class MeetingStatus(str, Enum):
    SCHEDULED = "scheduled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class MeetingCommunication(BaseCommunication):
    type: CommunicationType = CommunicationType.MEETING
    subject: str
    start_time: datetime
    end_time: datetime
    duration_minutes: float
    status: MeetingStatus = MeetingStatus.SCHEDULED
    organizer: Participant
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_all_day: bool = False

    @validator('duration_minutes')
    def validate_duration(cls, v, values):
        if v < 0:
            raise ValueError("Duration cannot be negative")
        return v


class CommunicationStats(BaseModel):
    total_count: int = 0
    inbound_count: int = 0
    outbound_count: int = 0
    avg_response_time_minutes: Optional[float] = None
    engagement_by_contact: Dict[str, int] = {}
    volume_by_date: Dict[str, int] = {}


class CommunicationAnalytics(BaseModel):
    email_stats: CommunicationStats
    slack_stats: CommunicationStats
    meeting_stats: Dict[str, Any]
    combined_stats: CommunicationStats
    top_contacts: List[Dict[str, Any]]
    time_series_data: Dict[str, Any]
    network_graph: Dict[str, Any]
