"""
Data Models

This module contains all data models used in the analytics service.
"""

from .communication import (
    CommunicationType,
    Direction,
    Participant,
    BaseCommunication,
    EmailCommunication,
    SlackMessageType,
    SlackCommunication,
    MeetingStatus,
    MeetingCommunication,
    CommunicationStats,
    CommunicationAnalytics,
)

__all__ = [
    "CommunicationType",
    "Direction",
    "Participant",
    "BaseCommunication",
    "EmailCommunication",
    "SlackMessageType",
    "SlackCommunication",
    "MeetingStatus",
    "MeetingCommunication",
    "CommunicationStats",
    "CommunicationAnalytics",
]
