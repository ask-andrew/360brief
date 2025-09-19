"""Email message processing with enhanced FREE/AI mode support."""
from typing import Dict, List, Optional
import spacy
import asyncio
import os
import logging
from ..models import EmailMessage, ProcessedMessage, MessageType
from ..enhanced_email_processor import IntegratedEmailProcessor, ProcessingMode
from datetime import datetime

logger = logging.getLogger(__name__)

# Load spacy model (keeping for entity extraction)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("spaCy model 'en_core_web_sm' not found. Entity extraction will be limited.")
    nlp = None

class EmailProcessor:
    """Enhanced email processor with FREE/AI mode support."""

    def __init__(self, use_ai_mode: bool = None):
        # Determine processing mode from environment or parameter
        if use_ai_mode is None:
            use_ai_mode = os.getenv('EMAIL_PROCESSING_MODE', 'free').lower() == 'ai'

        self.processing_mode = ProcessingMode.AI if use_ai_mode else ProcessingMode.FREE
        self.enhanced_processor = IntegratedEmailProcessor(self.processing_mode)

        # Keep original marketing detection for compatibility
        self.marketing_indicators = {'unsubscribe', 'click here', 'special offer'}
        self.marketing_domains = {'mailchimp.com', 'constantcontact.com'}

        logger.info(f"EmailProcessor initialized with mode: {self.processing_mode.value}")

    def is_marketing(self, email: EmailMessage) -> bool:
        """Check if email is marketing (legacy method for compatibility)."""
        if 'List-Unsubscribe' in email.headers:
            return True
        sender_domain = email.sender.split('@')[-1].lower()
        return any(d in sender_domain for d in self.marketing_domains)

    def process(self, email: EmailMessage) -> Optional[ProcessedMessage]:
        """Process single email with enhanced processing."""
        try:
            # Use enhanced processor for better results
            enhanced_result = asyncio.run(
                self.enhanced_processor.process_email_enhanced(
                    email.subject or "",
                    email.body or "",
                    email.sender or ""
                )
            )

            if enhanced_result is None:  # Filtered as marketing/noise
                return None

            # Extract entities using spaCy if available
            entities = {}
            if nlp:
                try:
                    full_text = f"{email.subject}\n\n{email.body}"
                    doc = nlp(full_text)

                    for ent in doc.ents:
                        if ent.label_ not in entities:
                            entities[ent.label_] = []
                        if ent.text not in entities[ent.label_]:
                            entities[ent.label_].append(ent.text)
                except Exception as e:
                    logger.warning(f"Entity extraction failed: {e}")

            # Create enhanced ProcessedMessage with real data
            return ProcessedMessage(
                message_id=email.id,
                message_type=MessageType.EMAIL,
                summary=enhanced_result.summary,  # ENHANCED: Real summary instead of first sentence
                key_points=enhanced_result.key_points,  # ENHANCED: Real key points
                entities=entities,  # Keep spaCy entity extraction
                action_items=enhanced_result.action_items,  # ENHANCED: Real action items
                sentiment=0.0,  # Could enhance with sentiment analysis later
                priority=int(enhanced_result.priority_score * 10),  # ENHANCED: Real priority scoring
                related_messages=[],
                processed_at=datetime.utcnow()
            )

        except Exception as e:
            logger.error(f"Enhanced email processing failed: {e}")

            # Fallback to basic processing if enhanced processing fails
            return self._fallback_basic_processing(email)

    def _fallback_basic_processing(self, email: EmailMessage) -> ProcessedMessage:
        """Fallback to basic processing if enhanced processing fails."""
        logger.warning("Using fallback basic processing")

        # Check if it's marketing using original logic
        if self.is_marketing(email):
            return None

        # Basic processing logic
        full_text = f"{email.subject}\n\n{email.body}"

        # Simple summary (first sentence or subject)
        summary = email.subject[:200] if email.subject else "No subject"

        # Basic entity extraction if spaCy is available
        entities = {}
        if nlp:
            try:
                doc = nlp(full_text)
                for ent in doc.ents:
                    if ent.label_ not in entities:
                        entities[ent.label_] = []
                    if ent.text not in entities[ent.label_]:
                        entities[ent.label_].append(ent.text)
            except Exception as e:
                logger.warning(f"Fallback entity extraction failed: {e}")

        return ProcessedMessage(
            message_id=email.id,
            message_type=MessageType.EMAIL,
            summary=summary,
            key_points=[],
            entities=entities,
            action_items=[],
            priority=0,
            related_messages=[],
            processed_at=datetime.utcnow()
        )