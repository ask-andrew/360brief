"""Data processors for different message types."""
from typing import Dict, List, Optional, Protocol, TypeVar, runtime_checkable

from ..models import BaseMessage, ProcessedMessage


@runtime_checkable
class MessageProcessor(Protocol):
    """Protocol for message processors."""
    
    def process(self, message: BaseMessage) -> ProcessedMessage:
        """Process a single message."""
        ...
    
    def batch_process(self, messages: List[BaseMessage]) -> List[ProcessedMessage]:
        """Process multiple messages."""
        ...


# Type variable for message processors
T = TypeVar('T', bound=BaseMessage)
