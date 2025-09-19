"""
Enhanced Email Processor that integrates with existing services/summarize.py
This creates the FREE vs AI mode architecture using the existing robust service.
"""

import asyncio
import json
import subprocess
import logging
import os
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)

class ProcessingMode(Enum):
    FREE = "free"  # Rule-based, fast, no external service calls
    AI = "ai"      # Uses existing services/summarize.py

@dataclass
class EnhancedSummary:
    summary: str
    key_points: List[str]
    action_items: List[str]
    priority_score: float
    processing_mode: ProcessingMode

class IntegratedEmailProcessor:
    """
    Enhanced email processor that uses existing services/summarize.py
    for AI mode and implements fast rule-based processing for FREE mode.
    """

    def __init__(self, processing_mode: ProcessingMode = ProcessingMode.FREE):
        self.processing_mode = processing_mode
        self.summarize_service_path = os.path.join(
            os.path.dirname(__file__), "../../../summarize.py"
        )

        # Executive-focused patterns for FREE mode
        self.action_keywords = [
            'need', 'must', 'should', 'require', 'action', 'follow up',
            'review', 'approve', 'decide', 'deadline', 'urgent', 'asap'
        ]

        # Marketing/noise detection
        self.noise_indicators = {
            'unsubscribe', 'newsletter', 'promotion', 'offer', 'sale',
            'webinar', 'free trial', 'discount', 'click here', 'limited time'
        }

    def is_marketing_email(self, subject: str, body: str, sender: str) -> bool:
        """Filter marketing emails (Signals over Noise)"""
        content = f"{subject.lower()} {body.lower()}"
        return any(indicator in content for indicator in self.noise_indicators)

    def calculate_executive_priority(self, subject: str, body: str, sender: str) -> float:
        """Calculate priority score for executive attention (0.0 to 1.0)"""
        score = 0.3  # Base score
        content = f"{subject} {body}".lower()

        # Executive keywords
        exec_keywords = {
            'ceo': 0.3, 'board': 0.3, 'budget': 0.2, 'revenue': 0.2,
            'strategy': 0.15, 'crisis': 0.4, 'urgent': 0.25, 'decision': 0.15,
            'approval': 0.2, 'investor': 0.25, 'milestone': 0.15
        }

        for keyword, boost in exec_keywords.items():
            if keyword in content:
                score += boost

        # Internal sender boost
        if sender and '@' in sender:
            domain = sender.split('@')[1].lower()
            if not any(ext in domain for ext in ['gmail.com', 'yahoo.com', 'outlook.com']):
                score += 0.1  # Likely internal/business email

        return min(1.0, score)

    def extract_actions_free_mode(self, text: str) -> List[str]:
        """Fast action extraction for FREE mode"""
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]
        actions = []

        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in self.action_keywords):
                clean_action = sentence[:150].strip()
                if clean_action and clean_action not in actions:
                    actions.append(clean_action)

        return actions[:3]  # Top 3 actions

    def create_free_mode_summary(self, subject: str, body: str, sender: str) -> EnhancedSummary:
        """Fast, rule-based summary (FREE mode - no external service calls)"""

        # Create executive summary
        full_text = f"{subject}. {body}"

        if len(full_text) <= 200:
            summary = full_text
        else:
            # Smart truncation focusing on first sentence + key info
            sentences = full_text.split('.')
            summary = sentences[0]

            # Add critical sentences if they contain executive keywords
            for sentence in sentences[1:3]:
                if any(keyword in sentence.lower()
                      for keyword in ['decision', 'urgent', 'budget', 'approve']):
                    if len(summary + sentence) < 200:
                        summary += ". " + sentence.strip()
                    break

        # Extract key points (top 3 sentences)
        sentences = [s.strip() for s in full_text.split('.') if len(s.strip()) > 20]
        key_points = sentences[:3]

        # Extract action items
        action_items = self.extract_actions_free_mode(full_text)

        # Calculate priority
        priority_score = self.calculate_executive_priority(subject, body, sender)

        return EnhancedSummary(
            summary=summary[:250],
            key_points=key_points,
            action_items=action_items,
            priority_score=priority_score,
            processing_mode=ProcessingMode.FREE
        )

    async def create_ai_mode_summary(self, subject: str, body: str, sender: str) -> EnhancedSummary:
        """
        AI-powered summary using existing services/summarize.py
        """
        try:
            # Prepare email content for summarization service
            email_content = f"Subject: {subject}\nFrom: {sender}\n\n{body}"

            # Prepare request for existing summarization service
            emails_data = [{
                "id": f"email_{hash(email_content) % 10000}",
                "content": email_content
            }]

            # Call existing summarization service via HTTP API
            import aiohttp

            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        'http://localhost:8000/summarize',
                        json={"emails": emails_data},
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            summaries = result.get('summaries', [])

                            if summaries and len(summaries) > 0:
                                summary_data = summaries[0]

                                summary = summary_data.get('summary', '')
                                key_points = summary_data.get('key_points', [])
                                actions = summary_data.get('actions', [])

                                # Calculate priority (can enhance this with AI too)
                                priority_score = self.calculate_executive_priority(subject, body, sender)

                                return EnhancedSummary(
                                    summary=summary,
                                    key_points=key_points,
                                    action_items=actions,
                                    priority_score=priority_score,
                                    processing_mode=ProcessingMode.AI
                                )
            except Exception as api_error:
                logger.warning(f"AI summarization API failed: {api_error}")

            # Fallback to subprocess call if API is not available
            cmd = [
                "python3", self.summarize_service_path,
                "--emails", json.dumps(emails_data)
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30,
                cwd=os.path.dirname(self.summarize_service_path)
            )

            if result.returncode == 0:
                ai_result = json.loads(result.stdout)

                if ai_result.get('summaries') and len(ai_result['summaries']) > 0:
                    summary_data = ai_result['summaries'][0]

                    summary = summary_data.get('summary', '')
                    key_points = summary_data.get('key_points', [])
                    actions = summary_data.get('actions', [])

                    # Calculate priority
                    priority_score = self.calculate_executive_priority(subject, body, sender)

                    return EnhancedSummary(
                        summary=summary,
                        key_points=key_points,
                        action_items=actions,
                        priority_score=priority_score,
                        processing_mode=ProcessingMode.AI
                    )

            # Fallback to FREE mode if AI service fails
            logger.warning("AI summarization failed, falling back to FREE mode")
            return self.create_free_mode_summary(subject, body, sender)

        except Exception as e:
            logger.error(f"Error in AI mode summarization: {e}")
            # Graceful fallback to FREE mode
            return self.create_free_mode_summary(subject, body, sender)

    async def process_email_enhanced(self, subject: str, body: str, sender: str) -> Optional[EnhancedSummary]:
        """
        Main processing method that replaces the current basic approach
        """
        # Filter marketing emails first
        if self.is_marketing_email(subject, body, sender):
            logger.debug(f"Filtered marketing email: {subject[:50]}")
            return None

        # Process based on mode
        if self.processing_mode == ProcessingMode.FREE:
            return self.create_free_mode_summary(subject, body, sender)
        else:
            return await self.create_ai_mode_summary(subject, body, sender)


def get_email_processor(use_ai_mode: bool = False) -> IntegratedEmailProcessor:
    """
    Factory function to create email processor with desired mode
    """
    mode = ProcessingMode.AI if use_ai_mode else ProcessingMode.FREE
    return IntegratedEmailProcessor(mode)


# Example usage showing the transformation
async def demo_transformation():
    """Shows before/after of email processing"""

    # Sample email
    sample_email = {
        'Subject': 'Q4 Budget Review - Board Approval Needed',
        'From': 'cfo@company.com',
        'Body': 'We need to finalize the Q4 budget allocation. Marketing team is requesting an additional $150K for the new campaign launch. Please review the attached proposal and provide your approval by Friday. This decision is critical for meeting our Q4 revenue targets of $2.5M.'
    }

    # FREE Mode (fast, no AI service calls)
    free_processor = IntegratedEmailProcessor(ProcessingMode.FREE)
    free_result = await free_processor.process_email_enhanced(
        sample_email['Subject'],
        sample_email['Body'],
        sample_email['From']
    )

    print("=== FREE MODE RESULTS ===")
    print(f"Summary: {free_result.summary}")
    print(f"Key Points: {free_result.key_points}")
    print(f"Actions: {free_result.action_items}")
    print(f"Priority: {free_result.priority_score}")

    # AI Mode (uses existing services/summarize.py)
    ai_processor = IntegratedEmailProcessor(ProcessingMode.AI)
    ai_result = await ai_processor.process_email_enhanced(
        sample_email['Subject'],
        sample_email['Body'],
        sample_email['From']
    )

    print("\n=== AI MODE RESULTS ===")
    print(f"Summary: {ai_result.summary}")
    print(f"Key Points: {ai_result.key_points}")
    print(f"Actions: {ai_result.action_items}")
    print(f"Priority: {ai_result.priority_score}")

if __name__ == "__main__":
    asyncio.run(demo_transformation())