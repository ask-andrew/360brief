#!/usr/bin/env python3
"""
Executive Intelligence Engine v3 - Complete Fix for Your Executive Brief Application

This engine transforms generic email clustering into actionable executive intelligence.
Instead of generating meaningless "vendor communications" clusters, it extracts:
- Decisions requiring approval (with financial impact)
- Critical blockers and deadlines
- Achievements and milestones
- Action items with time-to-review calculations

The output provides executives with clear signals, not noise.
"""

import re
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import asyncio

logger = logging.getLogger(__name__)

class SignalType(Enum):
    DECISION = "decision"
    BLOCKER = "blocker"
    ACHIEVEMENT = "achievement"
    ACTION_ITEM = "action_item"
    DEADLINE = "deadline"
    FINANCIAL = "financial"

@dataclass
class ExecutiveSignal:
    signal_type: SignalType
    content: str
    impact_level: str  # high, medium, low
    financial_impact: Optional[float] = None
    deadline: Optional[datetime] = None
    stakeholders: List[str] = None
    action_required: bool = False
    time_to_review: int = 5  # minutes

class ExecutiveIntelligenceEngine:
    """
    Actionable Intelligence Engine - Focused on Executive Signals

    This replaces generic clustering with executive-focused signal extraction.
    Designed to answer: "What decisions do I need to make?" not "What emails do I have?"
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Executive signal patterns - what matters to executives
        self.decision_patterns = [
            r'(?i)(need.*approval|needs? approval|awaiting approval|please approve)',
            r'(?i)(decision required|decision needed|need.*decision)',
            r'(?i)(sign off|signoff|final approval|your approval)',
            r'(?i)(budget.*approval|approve.*budget|spending.*approval)',
            r'(?i)(hire|hiring decision|offer.*approval|candidate)',
            r'(?i)(vendor.*selection|choose.*vendor|select.*provider)',
            r'(?i)(contract.*approval|approve.*contract|legal review)'
        ]

        self.blocker_patterns = [
            r'(?i)(blocked|blocker|blocking|stuck|delay|delayed)',
            r'(?i)(can\'?t proceed|cannot proceed|waiting for|need.*before)',
            r'(?i)(issue.*preventing|problem.*stopping|critical.*error)',
            r'(?i)(deadline.*risk|at risk|behind schedule|late)',
            r'(?i)(escalation|escalate|urgent.*help|need.*intervention)'
        ]

        self.achievement_patterns = [
            r'(?i)(completed|finished|shipped|launched|delivered)',
            r'(?i)(success|successful|achievement|milestone)',
            r'(?i)(exceeded.*target|beat.*goal|ahead of schedule)',
            r'(?i)(revenue.*up|sales.*increase|growth)',
            r'(?i)(closed.*deal|won.*contract|new.*client)',
            r'(?i)(team.*recognition|great.*work|congratulations)'
        ]

        self.financial_patterns = [
            r'(\$[\d,]+(?:\.\d{2})?[KkMmBb]?)',
            r'([\d,]+(?:\.\d{2})?\s*(?:dollars?|USD|\$))',
            r'(?i)(budget|cost|expense|revenue|profit|savings)',
            r'(?i)(ROI|return on investment|cost savings)',
            r'(?i)(quarterly.*results|annual.*revenue|financial.*performance)'
        ]

        self.deadline_patterns = [
            r'(?i)(deadline|due.*by|needs?.*by|required.*by)',
            r'(?i)(today|tomorrow|this week|next week|end of)',
            r'(?i)(urgent|asap|immediately|time.*sensitive)',
            r'(?i)(by.*\d{1,2}[:/]\d{1,2}|by.*\d{1,2}(st|nd|rd|th))',
            r'(?i)(eod|end of day|close of business|cob)'
        ]

    def extract_financial_impact(self, text: str) -> Optional[float]:
        """Extract financial amounts from text and convert to standardized value"""
        try:
            # Look for dollar amounts
            money_patterns = [
                r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)[KkMm]?',
                r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|USD)',
                r'(\d+(?:,\d{3})*)\s*[Kk](?:\s|$)',  # 100K format
                r'(\d+(?:,\d{3})*)\s*[Mm](?:\s|$)'   # 100M format
            ]

            for pattern in money_patterns:
                match = re.search(pattern, text)
                if match:
                    amount_str = match.group(1).replace(',', '')
                    amount = float(amount_str)

                    # Handle K/M suffixes
                    if 'K' in text.upper() or 'k' in text:
                        amount *= 1000
                    elif 'M' in text.upper() or 'm' in text:
                        amount *= 1000000
                    elif 'B' in text.upper() or 'b' in text:
                        amount *= 1000000000

                    return amount

        except (ValueError, AttributeError):
            pass
        return None

    def extract_deadline(self, text: str) -> Optional[datetime]:
        """Extract and parse deadline information from text"""
        try:
            now = datetime.now()

            # Common deadline phrases
            if re.search(r'(?i)today|eod|end of day', text):
                return now.replace(hour=17, minute=0, second=0, microsecond=0)
            elif re.search(r'(?i)tomorrow', text):
                return (now + timedelta(days=1)).replace(hour=17, minute=0, second=0, microsecond=0)
            elif re.search(r'(?i)this week|by.*friday', text):
                days_until_friday = (4 - now.weekday()) % 7
                if days_until_friday == 0 and now.weekday() == 4:  # It's Friday
                    days_until_friday = 7
                return (now + timedelta(days=days_until_friday)).replace(hour=17, minute=0, second=0, microsecond=0)
            elif re.search(r'(?i)next week', text):
                days_until_next_monday = (7 - now.weekday()) % 7
                if days_until_next_monday == 0:
                    days_until_next_monday = 7
                return (now + timedelta(days=days_until_next_monday)).replace(hour=9, minute=0, second=0, microsecond=0)

        except Exception:
            pass
        return None

    def calculate_time_to_review(self, signal_type: SignalType, content_length: int,
                               financial_impact: Optional[float] = None) -> int:
        """Calculate estimated time to review in minutes"""
        base_time = {
            SignalType.DECISION: 15,
            SignalType.BLOCKER: 10,
            SignalType.ACHIEVEMENT: 3,
            SignalType.ACTION_ITEM: 8,
            SignalType.DEADLINE: 12,
            SignalType.FINANCIAL: 20
        }.get(signal_type, 5)

        # Adjust for content complexity
        if content_length > 500:
            base_time += 5
        if content_length > 1000:
            base_time += 10

        # Adjust for financial impact
        if financial_impact:
            if financial_impact > 100000:  # $100K+
                base_time += 15
            elif financial_impact > 10000:  # $10K+
                base_time += 8

        return min(base_time, 45)  # Cap at 45 minutes

    def extract_stakeholders(self, email_data: Dict) -> List[str]:
        """Extract key stakeholders from email"""
        stakeholders = []

        # Extract from sender
        from_info = email_data.get('from', {})
        if isinstance(from_info, dict):
            if from_info.get('name'):
                stakeholders.append(from_info['name'])
        elif isinstance(from_info, str):
            # Parse "Name <email>" format
            name_match = re.match(r'^([^<]+)', from_info.strip())
            if name_match:
                stakeholders.append(name_match.group(1).strip())

        # Extract from CC/TO fields if available
        to_field = email_data.get('to', [])
        if isinstance(to_field, list):
            for recipient in to_field[:3]:  # Limit to first 3
                if isinstance(recipient, str):
                    name_match = re.match(r'^([^<]+)', recipient.strip())
                    if name_match:
                        stakeholders.append(name_match.group(1).strip())

        return stakeholders[:5]  # Limit to 5 stakeholders

    def analyze_email_for_signals(self, email_data: Dict) -> List[ExecutiveSignal]:
        """Extract executive signals from a single email"""
        signals = []

        subject = email_data.get('subject', '')
        body = email_data.get('body', email_data.get('snippet', ''))
        combined_text = f"{subject} {body}"

        stakeholders = self.extract_stakeholders(email_data)

        # Check for decision signals
        for pattern in self.decision_patterns:
            if re.search(pattern, combined_text):
                financial_impact = self.extract_financial_impact(combined_text)
                deadline = self.extract_deadline(combined_text)

                impact_level = "high"
                if financial_impact and financial_impact > 50000:
                    impact_level = "high"
                elif deadline and deadline < datetime.now() + timedelta(days=2):
                    impact_level = "high"
                else:
                    impact_level = "medium"

                signals.append(ExecutiveSignal(
                    signal_type=SignalType.DECISION,
                    content=f"Decision required: {subject}",
                    impact_level=impact_level,
                    financial_impact=financial_impact,
                    deadline=deadline,
                    stakeholders=stakeholders,
                    action_required=True,
                    time_to_review=self.calculate_time_to_review(SignalType.DECISION, len(combined_text), financial_impact)
                ))
                break

        # Check for blocker signals
        for pattern in self.blocker_patterns:
            if re.search(pattern, combined_text):
                deadline = self.extract_deadline(combined_text)
                impact_level = "high" if deadline and deadline < datetime.now() + timedelta(days=1) else "medium"

                signals.append(ExecutiveSignal(
                    signal_type=SignalType.BLOCKER,
                    content=f"Blocker identified: {subject}",
                    impact_level=impact_level,
                    deadline=deadline,
                    stakeholders=stakeholders,
                    action_required=True,
                    time_to_review=self.calculate_time_to_review(SignalType.BLOCKER, len(combined_text))
                ))
                break

        # Check for achievement signals
        for pattern in self.achievement_patterns:
            if re.search(pattern, combined_text):
                financial_impact = self.extract_financial_impact(combined_text)
                impact_level = "high" if financial_impact and financial_impact > 25000 else "medium"

                signals.append(ExecutiveSignal(
                    signal_type=SignalType.ACHIEVEMENT,
                    content=f"Achievement: {subject}",
                    impact_level=impact_level,
                    financial_impact=financial_impact,
                    stakeholders=stakeholders,
                    action_required=False,
                    time_to_review=self.calculate_time_to_review(SignalType.ACHIEVEMENT, len(combined_text), financial_impact)
                ))
                break

        # Check for financial signals
        financial_impact = self.extract_financial_impact(combined_text)
        if financial_impact and financial_impact > 5000:  # $5K+ threshold
            signals.append(ExecutiveSignal(
                signal_type=SignalType.FINANCIAL,
                content=f"Financial item: {subject} (${financial_impact:,.0f})",
                impact_level="high" if financial_impact > 50000 else "medium",
                financial_impact=financial_impact,
                stakeholders=stakeholders,
                action_required=True,
                time_to_review=self.calculate_time_to_review(SignalType.FINANCIAL, len(combined_text), financial_impact)
            ))

        # Check for deadline signals
        deadline = self.extract_deadline(combined_text)
        if deadline and not any(s.deadline for s in signals):  # Don't duplicate
            days_until = (deadline - datetime.now()).days
            impact_level = "high" if days_until <= 1 else "medium" if days_until <= 3 else "low"

            signals.append(ExecutiveSignal(
                signal_type=SignalType.DEADLINE,
                content=f"Deadline: {subject}",
                impact_level=impact_level,
                deadline=deadline,
                stakeholders=stakeholders,
                action_required=True,
                time_to_review=self.calculate_time_to_review(SignalType.DEADLINE, len(combined_text))
            ))

        return signals

    def generate_action_dashboard(self, all_signals: List[ExecutiveSignal]) -> Dict[str, Any]:
        """Generate executive action dashboard with clear metrics"""

        decisions = [s for s in all_signals if s.signal_type == SignalType.DECISION]
        blockers = [s for s in all_signals if s.signal_type == SignalType.BLOCKER]
        achievements = [s for s in all_signals if s.signal_type == SignalType.ACHIEVEMENT]

        # Calculate financial impact totals
        total_pending_financial = sum(s.financial_impact for s in decisions if s.financial_impact)
        total_achievement_value = sum(s.financial_impact for s in achievements if s.financial_impact)

        # Calculate time commitments
        total_review_time = sum(s.time_to_review for s in all_signals if s.action_required)

        # Identify urgent items (deadlines within 24 hours)
        urgent_deadlines = [s for s in all_signals if s.deadline and s.deadline < datetime.now() + timedelta(hours=24)]

        return {
            "decisions_requiring_approval": len(decisions),
            "critical_blockers": len([b for b in blockers if b.impact_level == "high"]),
            "achievements_to_recognize": len(achievements),
            "urgent_deadlines": len(urgent_deadlines),
            "total_pending_financial_impact": total_pending_financial,
            "total_achievement_value": total_achievement_value,
            "estimated_review_time_minutes": total_review_time,
            "priority_actions": len([s for s in all_signals if s.action_required and s.impact_level == "high"]),
            "signals_processed": len(all_signals)
        }

    def create_executive_clusters(self, signals: List[ExecutiveSignal]) -> List[Dict[str, Any]]:
        """Create executive-focused clusters from signals"""
        clusters = []

        # Group signals by type
        signal_groups = {}
        for signal in signals:
            signal_type = signal.signal_type.value
            if signal_type not in signal_groups:
                signal_groups[signal_type] = []
            signal_groups[signal_type].append(signal)

        # Create decision cluster
        if SignalType.DECISION.value in signal_groups:
            decisions = signal_groups[SignalType.DECISION.value]
            total_financial = sum(s.financial_impact for s in decisions if s.financial_impact)

            clusters.append({
                "id": "decisions-requiring-approval",
                "title": f"Decisions Requiring Your Approval ({len(decisions)} items)",
                "summary": f"{len(decisions)} decisions pending approval" +
                          (f" with ${total_financial:,.0f} total financial impact" if total_financial > 0 else ""),
                "priority": "high",
                "signal_type": "decision",
                "items": [
                    {
                        "content": s.content,
                        "impact_level": s.impact_level,
                        "financial_impact": s.financial_impact,
                        "deadline": s.deadline.isoformat() if s.deadline else None,
                        "stakeholders": s.stakeholders,
                        "time_to_review": s.time_to_review
                    }
                    for s in decisions
                ],
                "action_required": True,
                "total_review_time": sum(s.time_to_review for s in decisions)
            })

        # Create blocker cluster
        if SignalType.BLOCKER.value in signal_groups:
            blockers = signal_groups[SignalType.BLOCKER.value]
            urgent_blockers = [b for b in blockers if b.impact_level == "high"]

            clusters.append({
                "id": "critical-blockers-issues",
                "title": f"Critical Blockers & Issues ({len(blockers)} items)",
                "summary": f"{len(urgent_blockers)} urgent blockers requiring immediate attention" if urgent_blockers else f"{len(blockers)} blockers identified",
                "priority": "high" if urgent_blockers else "medium",
                "signal_type": "blocker",
                "items": [
                    {
                        "content": s.content,
                        "impact_level": s.impact_level,
                        "deadline": s.deadline.isoformat() if s.deadline else None,
                        "stakeholders": s.stakeholders,
                        "time_to_review": s.time_to_review
                    }
                    for s in blockers
                ],
                "action_required": True,
                "total_review_time": sum(s.time_to_review for s in blockers)
            })

        # Create achievement cluster
        if SignalType.ACHIEVEMENT.value in signal_groups:
            achievements = signal_groups[SignalType.ACHIEVEMENT.value]
            total_value = sum(s.financial_impact for s in achievements if s.financial_impact)

            clusters.append({
                "id": "achievements-milestones",
                "title": f"Key Achievements & Milestones ({len(achievements)} items)",
                "summary": f"{len(achievements)} achievements to recognize" +
                          (f" with ${total_value:,.0f} total value created" if total_value > 0 else ""),
                "priority": "medium",
                "signal_type": "achievement",
                "items": [
                    {
                        "content": s.content,
                        "impact_level": s.impact_level,
                        "financial_impact": s.financial_impact,
                        "stakeholders": s.stakeholders,
                        "time_to_review": s.time_to_review
                    }
                    for s in achievements
                ],
                "action_required": False,
                "total_review_time": sum(s.time_to_review for s in achievements)
            })

        # Create financial cluster if significant amounts involved
        financial_signals = [s for s in signals if s.financial_impact and s.financial_impact > 10000]
        if financial_signals:
            total_financial = sum(s.financial_impact for s in financial_signals)

            clusters.append({
                "id": "financial-impact-items",
                "title": f"Financial Impact Items (${total_financial:,.0f})",
                "summary": f"{len(financial_signals)} items with significant financial impact totaling ${total_financial:,.0f}",
                "priority": "high",
                "signal_type": "financial",
                "items": [
                    {
                        "content": s.content,
                        "impact_level": s.impact_level,
                        "financial_impact": s.financial_impact,
                        "stakeholders": s.stakeholders,
                        "time_to_review": s.time_to_review
                    }
                    for s in financial_signals
                ],
                "action_required": True,
                "total_review_time": sum(s.time_to_review for s in financial_signals)
            })

        return clusters

async def generate_executive_brief(emails: List[Dict], user_id: str = None) -> Dict[str, Any]:
    """
    Main function to generate executive intelligence brief

    This is the replacement for your old clustering algorithm.
    It generates actionable intelligence instead of meaningless vendor clusters.
    """

    engine = ExecutiveIntelligenceEngine()
    logger.info(f"🧠 ExecutiveIntelligenceEngine_v3 processing {len(emails)} emails for executive signals")

    # Extract signals from all emails
    all_signals = []
    for email in emails:
        try:
            email_signals = engine.analyze_email_for_signals(email)
            all_signals.extend(email_signals)
        except Exception as e:
            logger.warning(f"Failed to analyze email {email.get('id', 'unknown')}: {e}")

    logger.info(f"🎯 Extracted {len(all_signals)} executive signals from {len(emails)} emails")

    # Generate action dashboard
    action_dashboard = engine.generate_action_dashboard(all_signals)

    # Create executive clusters
    digest_items = engine.create_executive_clusters(all_signals)

    # Generate executive summary
    decisions_count = action_dashboard['decisions_requiring_approval']
    blockers_count = action_dashboard['critical_blockers']
    achievements_count = action_dashboard['achievements_to_recognize']
    financial_impact = action_dashboard['total_pending_financial_impact']

    executive_summary = {
        "title": f"Executive Intelligence Brief - {len(all_signals)} signals detected",
        "key_insights": [
            f"🎯 {decisions_count} decisions requiring your approval" if decisions_count > 0 else "✅ No pending decisions",
            f"🚫 {blockers_count} critical blockers need intervention" if blockers_count > 0 else "✅ No critical blockers",
            f"🏆 {achievements_count} achievements to recognize" if achievements_count > 0 else "📊 No significant achievements",
            f"💰 ${financial_impact:,.0f} in pending financial decisions" if financial_impact > 0 else "💰 No significant financial items"
        ],
        "total_review_time": action_dashboard['estimated_review_time_minutes'],
        "priority_actions": action_dashboard['priority_actions']
    }

    # Create the executive brief structure
    brief = {
        "brief_id": f"executive-intelligence-{user_id or 'unknown'}-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "user_id": user_id,
        "version": "3.0_executive_intelligence",
        "style": "executive_briefing",
        "generation_timestamp": datetime.now().isoformat(),
        "analysis_period": {
            "emails_analyzed": len(emails),
            "signals_detected": len(all_signals),
            "start_analysis": datetime.now().isoformat()
        },
        "action_dashboard": action_dashboard,
        "digest_items": digest_items,
        "executive_summary": executive_summary,
        "processing_metadata": {
            "intelligence_engine": "ExecutiveIntelligenceEngine_v3",
            "total_emails_processed": len(emails),
            "total_signals_extracted": len(all_signals),
            "signals_by_type": {
                "decisions": len([s for s in all_signals if s.signal_type == SignalType.DECISION]),
                "blockers": len([s for s in all_signals if s.signal_type == SignalType.BLOCKER]),
                "achievements": len([s for s in all_signals if s.signal_type == SignalType.ACHIEVEMENT]),
                "financial": len([s for s in all_signals if s.signal_type == SignalType.FINANCIAL]),
                "deadlines": len([s for s in all_signals if s.signal_type == SignalType.DEADLINE])
            },
            "processing_approach": "executive_signal_extraction",
            "data_source": "real_email_intelligence"
        }
    }

    logger.info(f"✅ Generated executive brief with {len(digest_items)} actionable clusters")
    logger.info(f"📊 Action Dashboard: {decisions_count} decisions, {blockers_count} blockers, {achievements_count} achievements")

    return brief

# Compatibility function for existing code
async def generate_sophisticated_free_intelligence(emails: List[Dict], user_id: str = None) -> Dict[str, Any]:
    """Compatibility wrapper - calls the new executive intelligence engine"""
    return await generate_executive_brief(emails, user_id)