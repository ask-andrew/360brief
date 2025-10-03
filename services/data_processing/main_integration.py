#!/usr/bin/env python3
"""
Main Integration Module - Executive Brief Generator

This module orchestrates the complete executive briefing pipeline:
1. Gmail data processing with smart filtering
2. Executive intelligence signal extraction
3. Actionable brief generation

This replaces generic clustering with true executive intelligence.
The output provides executives with clear decisions, blockers, and achievements
instead of meaningless "vendor communications" clusters.
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Import our new intelligence modules
from gmail_data_processor import process_gmail_data_for_brief, GmailDataProcessor
from executive_intelligence_engine import generate_executive_brief, ExecutiveIntelligenceEngine

logger = logging.getLogger(__name__)

class ExecutiveBriefGenerator:
    """
    Complete Executive Brief Generation System

    This class orchestrates the entire pipeline from raw Gmail data
    to actionable executive intelligence briefings.
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.gmail_processor = GmailDataProcessor()
        self.intelligence_engine = ExecutiveIntelligenceEngine()

    async def generate_brief_from_gmail(self, gmail_messages: List[Dict],
                                      user_id: str = None,
                                      filter_marketing: bool = True,
                                      min_executive_score: float = 40.0,
                                      intelligence_mode: str = "executive") -> Dict[str, Any]:
        """
        Generate executive brief from Gmail messages

        Args:
            gmail_messages: Raw Gmail message data
            user_id: User identifier
            filter_marketing: Whether to filter marketing emails
            min_executive_score: Minimum relevance score (0-100)
            intelligence_mode: "executive" for full intelligence, "basic" for simple

        Returns:
            Complete executive intelligence brief
        """

        self.logger.info(f"🎯 Starting executive brief generation for {len(gmail_messages)} messages")
        self.logger.info(f"📊 Mode: {intelligence_mode}, Marketing filter: {filter_marketing}")

        try:
            # Step 1: Process Gmail data with smart filtering
            processed_data = await process_gmail_data_for_brief(
                gmail_messages=gmail_messages,
                user_id=user_id,
                filter_marketing=filter_marketing,
                min_executive_score=min_executive_score
            )

            processed_emails = processed_data['processed_emails']
            processing_stats = processed_data['processing_stats']

            self.logger.info(f"📧 Processed {len(processed_emails)} executive-relevant emails")
            self.logger.info(f"🎯 Average executive score: {processing_stats['average_executive_score']}")

            if not processed_emails:
                self.logger.warning("📭 No executive-relevant emails found")
                return self._generate_empty_brief(user_id, processing_stats)

            # Step 2: Generate executive intelligence
            if intelligence_mode == "executive":
                brief = await generate_executive_brief(processed_emails, user_id)
            else:
                # Fallback to basic intelligence for testing
                brief = await self._generate_basic_brief(processed_emails, user_id)

            # Step 3: Enhance brief with processing metadata
            brief = self._enhance_brief_metadata(brief, processing_stats)

            self.logger.info(f"✅ Generated executive brief with {len(brief.get('digest_items', []))} actionable clusters")

            # Step 4: Validate brief quality
            validation_result = self._validate_brief_quality(brief)
            if not validation_result['is_valid']:
                self.logger.warning(f"⚠️ Brief quality issue: {validation_result['message']}")

            return brief

        except Exception as e:
            self.logger.error(f"❌ Error generating executive brief: {e}")
            import traceback
            self.logger.error(traceback.format_exc())

            # Return fallback brief
            return self._generate_error_brief(user_id, str(e))

    def _enhance_brief_metadata(self, brief: Dict[str, Any], processing_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance brief with processing metadata"""
        if 'processing_metadata' not in brief:
            brief['processing_metadata'] = {}

        brief['processing_metadata'].update({
            'gmail_processing_stats': processing_stats,
            'generation_pipeline': 'main_integration_v3',
            'data_quality_score': self._calculate_data_quality_score(processing_stats),
            'processing_timestamp': datetime.now().isoformat()
        })

        return brief

    def _calculate_data_quality_score(self, processing_stats: Dict[str, Any]) -> float:
        """Calculate data quality score based on processing statistics"""
        processed_count = processing_stats.get('processed_count', 0)
        original_count = processing_stats.get('original_count', 1)
        avg_score = processing_stats.get('average_executive_score', 0)

        # Quality factors
        retention_rate = processed_count / max(original_count, 1)
        score_quality = min(avg_score / 100.0, 1.0)

        # Combined quality score
        quality_score = (retention_rate * 0.4 + score_quality * 0.6) * 100

        return round(quality_score, 1)

    def _validate_brief_quality(self, brief: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the quality of generated brief"""
        issues = []

        # Check for required fields
        required_fields = ['action_dashboard', 'digest_items', 'executive_summary']
        for field in required_fields:
            if field not in brief:
                issues.append(f"Missing required field: {field}")

        # Check for actionable content
        digest_items = brief.get('digest_items', [])
        actionable_items = sum(1 for item in digest_items if item.get('action_required', False))

        if len(digest_items) == 0:
            issues.append("No digest items generated")
        elif actionable_items == 0:
            issues.append("No actionable items found - may be low-value content")

        # Check for proper engine usage
        engine_name = brief.get('processing_metadata', {}).get('intelligence_engine', '')
        if 'ExecutiveIntelligenceEngine' not in engine_name:
            issues.append(f"Wrong engine used: {engine_name}")

        # Check for generic vendor clusters (the old problem)
        vendor_clusters = [
            item for item in digest_items
            if 'vendor' in item.get('title', '').lower() and 'communications' in item.get('title', '').lower()
        ]

        if len(vendor_clusters) > 1:
            issues.append(f"Found {len(vendor_clusters)} generic vendor clusters - indicates old clustering logic")

        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'message': '; '.join(issues) if issues else 'Brief quality OK'
        }

    async def _generate_basic_brief(self, processed_emails: List[Dict], user_id: str) -> Dict[str, Any]:
        """Generate basic brief without full intelligence engine"""

        self.logger.info("🔄 Generating basic brief (fallback mode)")

        # Basic analysis
        urgent_emails = []
        decision_emails = []
        achievement_emails = []

        for email in processed_emails:
            subject = email.get('subject', '').lower()
            body = email.get('body', '').lower()
            combined = f"{subject} {body}"

            if any(word in combined for word in ['urgent', 'asap', 'critical', 'deadline']):
                urgent_emails.append(email)
            elif any(word in combined for word in ['decision', 'approval', 'approve', 'sign']):
                decision_emails.append(email)
            elif any(word in combined for word in ['completed', 'success', 'achievement', 'milestone']):
                achievement_emails.append(email)

        # Create basic clusters
        digest_items = []

        if urgent_emails:
            digest_items.append({
                'id': 'urgent-items',
                'title': f'Urgent Items ({len(urgent_emails)} emails)',
                'summary': f'{len(urgent_emails)} urgent emails requiring immediate attention',
                'priority': 'high',
                'action_required': True,
                'items': urgent_emails[:5]  # Limit display
            })

        if decision_emails:
            digest_items.append({
                'id': 'decisions-pending',
                'title': f'Decisions Pending ({len(decision_emails)} emails)',
                'summary': f'{len(decision_emails)} emails require your decision or approval',
                'priority': 'high',
                'action_required': True,
                'items': decision_emails[:5]
            })

        if achievement_emails:
            digest_items.append({
                'id': 'achievements',
                'title': f'Achievements & Updates ({len(achievement_emails)} emails)',
                'summary': f'{len(achievement_emails)} achievement and milestone updates',
                'priority': 'medium',
                'action_required': False,
                'items': achievement_emails[:5]
            })

        # Basic action dashboard
        action_dashboard = {
            'urgent_items': len(urgent_emails),
            'decisions_pending': len(decision_emails),
            'achievements': len(achievement_emails),
            'total_actionable': len(urgent_emails) + len(decision_emails)
        }

        return {
            'brief_id': f'basic-brief-{user_id}-{datetime.now().strftime("%Y%m%d")}',
            'user_id': user_id,
            'version': '3.0_basic_intelligence',
            'style': 'basic_executive',
            'generation_timestamp': datetime.now().isoformat(),
            'action_dashboard': action_dashboard,
            'digest_items': digest_items,
            'executive_summary': {
                'title': f'Basic Executive Brief - {len(processed_emails)} emails analyzed',
                'key_insights': [
                    f'{len(urgent_emails)} urgent items need immediate attention' if urgent_emails else 'No urgent items',
                    f'{len(decision_emails)} decisions pending your approval' if decision_emails else 'No decisions pending',
                    f'{len(achievement_emails)} achievements to recognize' if achievement_emails else 'No achievements noted'
                ]
            },
            'processing_metadata': {
                'intelligence_engine': 'BasicIntelligenceEngine_v3',
                'total_emails_processed': len(processed_emails),
                'processing_mode': 'basic'
            }
        }

    def _generate_empty_brief(self, user_id: str, processing_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Generate brief when no relevant emails found"""
        return {
            'brief_id': f'empty-brief-{user_id}-{datetime.now().strftime("%Y%m%d")}',
            'user_id': user_id,
            'version': '3.0_empty',
            'style': 'empty_brief',
            'generation_timestamp': datetime.now().isoformat(),
            'action_dashboard': {
                'decisions_requiring_approval': 0,
                'critical_blockers': 0,
                'achievements_to_recognize': 0,
                'urgent_deadlines': 0
            },
            'digest_items': [],
            'executive_summary': {
                'title': 'No Executive Actions Required',
                'key_insights': [
                    'No emails met executive relevance criteria',
                    'All communications were filtered as non-executive content',
                    'No immediate actions required'
                ]
            },
            'processing_metadata': {
                'intelligence_engine': 'ExecutiveIntelligenceEngine_v3',
                'total_emails_processed': 0,
                'gmail_processing_stats': processing_stats,
                'reason': 'no_executive_content'
            }
        }

    def _generate_error_brief(self, user_id: str, error_message: str) -> Dict[str, Any]:
        """Generate brief when processing fails"""
        return {
            'brief_id': f'error-brief-{user_id}-{datetime.now().strftime("%Y%m%d")}',
            'user_id': user_id,
            'version': '3.0_error',
            'style': 'error_brief',
            'generation_timestamp': datetime.now().isoformat(),
            'action_dashboard': {
                'decisions_requiring_approval': 0,
                'critical_blockers': 1,  # The error itself is a blocker
                'achievements_to_recognize': 0,
                'urgent_deadlines': 0
            },
            'digest_items': [{
                'id': 'processing-error',
                'title': 'Brief Generation Error',
                'summary': f'Unable to generate executive brief: {error_message}',
                'priority': 'high',
                'action_required': True
            }],
            'executive_summary': {
                'title': 'Brief Generation Failed',
                'key_insights': [
                    'Executive brief generation encountered an error',
                    'Technical team should investigate processing pipeline',
                    'Fallback to manual review recommended'
                ]
            },
            'processing_metadata': {
                'intelligence_engine': 'ErrorHandler_v3',
                'error': error_message,
                'status': 'failed'
            }
        }

    async def test_intelligence_pipeline(self, sample_emails: List[Dict] = None) -> Dict[str, Any]:
        """Test the intelligence pipeline with sample data"""

        if not sample_emails:
            sample_emails = self._generate_test_emails()

        self.logger.info(f"🧪 Testing intelligence pipeline with {len(sample_emails)} sample emails")

        try:
            brief = await self.generate_brief_from_gmail(
                gmail_messages=sample_emails,
                user_id="test_user",
                filter_marketing=True,
                min_executive_score=30.0  # Lower threshold for testing
            )

            validation = self._validate_brief_quality(brief)

            test_results = {
                'success': True,
                'brief_generated': brief,
                'validation': validation,
                'test_timestamp': datetime.now().isoformat(),
                'sample_email_count': len(sample_emails)
            }

            if validation['is_valid']:
                self.logger.info("✅ Intelligence pipeline test PASSED")
            else:
                self.logger.warning(f"⚠️ Intelligence pipeline test issues: {validation['message']}")

            return test_results

        except Exception as e:
            self.logger.error(f"❌ Intelligence pipeline test FAILED: {e}")
            return {
                'success': False,
                'error': str(e),
                'test_timestamp': datetime.now().isoformat()
            }

    def _generate_test_emails(self) -> List[Dict]:
        """Generate test emails for pipeline testing"""
        return [
            {
                'id': 'test_1',
                'subject': 'Urgent: Budget approval needed for Q4 project',
                'body': 'We need your approval for the $250K budget allocation for the new product launch. Deadline is end of week.',
                'from': 'CFO John Smith <john.smith@company.com>',
                'to': ['ceo@company.com'],
                'date': datetime.now().isoformat(),
                'snippet': 'Budget approval needed for Q4 project...',
                'labels': ['INBOX'],
                'threadId': 'thread_1'
            },
            {
                'id': 'test_2',
                'subject': 'BLOCKER: API integration failing in production',
                'body': 'Critical issue with payment processing API. All transactions failing. Need immediate intervention.',
                'from': 'Tech Lead Sarah Johnson <sarah.johnson@company.com>',
                'to': ['cto@company.com'],
                'date': datetime.now().isoformat(),
                'snippet': 'Critical issue with payment processing...',
                'labels': ['INBOX', 'IMPORTANT'],
                'threadId': 'thread_2'
            },
            {
                'id': 'test_3',
                'subject': 'Great news: Q3 revenue exceeded target by 15%',
                'body': 'Fantastic results this quarter! We exceeded our revenue target by 15%, bringing in $2.3M vs target of $2M.',
                'from': 'VP Sales Mike Chen <mike.chen@company.com>',
                'to': ['executives@company.com'],
                'date': datetime.now().isoformat(),
                'snippet': 'Fantastic results this quarter...',
                'labels': ['INBOX'],
                'threadId': 'thread_3'
            },
            {
                'id': 'test_4',
                'subject': 'Newsletter: Latest industry trends',
                'body': 'Check out the latest trends in our industry! Click here to read more. Unsubscribe at bottom.',
                'from': 'Industry News <noreply@industrynews.com>',
                'to': ['subscriber@company.com'],
                'date': datetime.now().isoformat(),
                'snippet': 'Check out the latest trends...',
                'labels': ['INBOX', 'CATEGORY_PROMOTIONS'],
                'threadId': 'thread_4'
            }
        ]

# Main interface functions for compatibility with existing code

async def generate_executive_brief_main(gmail_messages: List[Dict], user_id: str = None) -> Dict[str, Any]:
    """
    Main entry point for executive brief generation

    This replaces your old clustering logic with true executive intelligence.
    """
    generator = ExecutiveBriefGenerator()
    return await generator.generate_brief_from_gmail(gmail_messages, user_id)

# Compatibility function
async def generate_sophisticated_free_intelligence_main(emails: List[Dict], user_id: str = None) -> Dict[str, Any]:
    """Compatibility wrapper for existing API calls"""
    return await generate_executive_brief_main(emails, user_id)