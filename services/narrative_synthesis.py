"""
Enhanced Narrative Brief Synthesis Layer
Implements the optional LLM-based synthesis layer for generating contextual summaries,
executive synthesis, and action item derivation as specified in requirements.
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

@dataclass
class SynthesisResult:
    """Result from synthesis layer"""
    contextual_summary: str
    action_items: List[str]
    blockers: List[str]
    executive_synthesis: str
    recurring_content_summary: str
    prompts_used: List[str] = field(default_factory=list)  # New field for prompts

class EnhancedSynthesisLayer:
    """LLM-based synthesis layer for narrative generation"""

    def __init__(self):
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not self.gemini_api_key:
            logger.warning("GEMINI_API_KEY not found - synthesis layer will use fallback methods")

    def generate_contextual_summary(self, cluster: Dict[str, Any]) -> Tuple[str, Optional[str]]:
        """Generate contextual summary and return both result and prompt used"""
        if not cluster.get('items'):
            return "No content available for summary.", None

        cluster_text = self._prepare_cluster_text(cluster)

        prompt = f"""
You are an executive assistant. Analyze this project cluster and create a 2-3 sentence contextual summary covering:

1. **Cause**: What led to this situation?
2. **Impact/Risk**: What's the business impact or risk?
3. **Next Step**: What's the most logical next step?

Focus on the most critical and actionable elements. Be concise but comprehensive.

Clustered Messages:
{cluster_text}

Summary (3 sentences, one for each focus area):
"""

        try:
            if self.gemini_api_key:
                genai.configure(api_key=self.gemini_api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                return response.text.strip(), prompt
            else:
                fallback_result = self._fallback_contextual_summary(cluster)
                return fallback_result, None
        except Exception as e:
            logger.error(f"Error generating contextual summary: {e}")
            fallback_result = self._fallback_contextual_summary(cluster)
            return fallback_result, None

    def generate_executive_synthesis(self, top_clusters: List[Dict[str, Any]]) -> Tuple[str, Optional[str]]:
        """Generate executive synthesis highlighting primary blocker, decision, and financial impact"""
        if not top_clusters:
            return "No significant projects identified for executive synthesis.", None

        prompt = f"""
You are an executive assistant. Review the top 3 highest-urgency project clusters and create a 5-sentence narrative highlighting:

1. **Primary Blocker**: The most critical issue requiring resolution
2. **Primary Decision**: The key decision that needs executive input
3. **Net Financial Impact**: Financial implications across all projects
4. **Timeline Criticality**: Which items are most time-sensitive
5. **Executive Priority**: What the CEO should focus on first

Stitch together a cohesive narrative that connects these elements for executive decision-making.

Top Project Clusters:
{self._prepare_top_clusters_text(top_clusters)}

Executive Synthesis (5 sentences):
"""

        try:
            if self.gemini_api_key:
                genai.configure(api_key=self.gemini_api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                return response.text.strip(), prompt
            else:
                fallback_result = self._fallback_executive_synthesis(top_clusters)
                return fallback_result, None
        except Exception as e:
            logger.error(f"Error generating executive synthesis: {e}")
            fallback_result = self._fallback_executive_synthesis(top_clusters)
            return fallback_result, None

    def derive_action_items(self, cluster: Dict[str, Any]) -> Tuple[List[str], Optional[str]]:
        """Derive specific action items from cluster"""
        if not cluster.get('items'):
            return [], None

        cluster_text = self._prepare_cluster_text(cluster)

        prompt = f"""
From the following project cluster, identify explicit actions or delegations that the executive needs to perform.

Format each action as: [Action Type]: [Brief Description]

Examples:
- Decision: Approve $40K crisis response package
- Review: Evaluate vendor contract terms for Allied project
- Follow-up: Schedule meeting with Chris Laguna regarding timeline delays
- Authorization: Sign off on Q4 budget allocation

Focus on specific, actionable items with concrete deliverables, people, or deadlines.

Project Cluster:
{cluster_text}

Action Items (one per line):
"""

        try:
            if self.gemini_api_key:
                genai.configure(api_key=self.gemini_api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                actions_text = response.text.strip()
                actions = [line.strip('- ').strip() for line in actions_text.split('\n') if line.strip()]
                return actions, prompt
            else:
                fallback_actions = self._fallback_action_derivation(cluster)
                return fallback_actions, None
        except Exception as e:
            logger.error(f"Error deriving action items: {e}")
            fallback_actions = self._fallback_action_derivation(cluster)
            return fallback_actions, None

    def generate_recurring_content_summary(self, newsletter_clusters: List[Dict[str, Any]]) -> Tuple[str, Optional[str]]:
        """Generate summary for recurring content like newsletters"""
        if not newsletter_clusters:
            return "", None

        # Extract titles and subjects from newsletter items
        newsletter_items = []
        for cluster in newsletter_clusters:
            for item in cluster.get('items', []):
                newsletter_items.append({
                    'subject': item.get('subject', ''),
                    'snippet': (item.get('body', '')[:200] + '...') if len(item.get('body', '')) > 200 else item.get('body', '')
                })

        items_text = '\n'.join([
            f"- {item['subject']}: {item['snippet']}"
            for item in newsletter_items[:10]  # Limit to top 10
        ])

        prompt = f"""
The following are recurring newsletters and market updates. Identify the 3 most prominent topics across the titles and create a single, non-actionable, concise summary for the 'General Momentum' section.

These should be grouped as general business insights, not requiring executive action.

Newsletter Items:
{items_text}

General Momentum Summary (2-3 sentences, non-actionable):
"""

        try:
            if self.gemini_api_key:
                genai.configure(api_key=self.gemini_api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                return response.text.strip(), prompt
            else:
                fallback_result = self._fallback_recurring_summary(newsletter_clusters)
                return fallback_result, None
        except Exception as e:
            logger.error(f"Error generating recurring content summary: {e}")
            fallback_result = self._fallback_recurring_summary(newsletter_clusters)
            return fallback_result, None

    def synthesize_cluster(self, cluster: Dict[str, Any]) -> SynthesisResult:
        """Complete synthesis for a single cluster"""
        contextual_summary, _ = self.generate_contextual_summary(cluster)
        action_items, _ = self.derive_action_items(cluster)
        blockers = self._extract_blockers_from_cluster(cluster)

        return SynthesisResult(
            contextual_summary=contextual_summary,
            action_items=action_items,
            blockers=blockers,
            executive_synthesis="",  # Set at narrative level
            recurring_content_summary=""  # Set at narrative level
        )

    def _prepare_cluster_text(self, cluster: Dict[str, Any]) -> str:
        """Prepare cluster text for LLM consumption"""
        lines = []
        lines.append(f"Project: {cluster.get('project_key', 'Unknown')}")
        lines.append(f"Status: {dict(cluster.get('status_counts', {}))}")
        lines.append(f"People: {', '.join(sorted(cluster.get('people', [])))}")
        if cluster.get('financial_total', 0) > 0:
            lines.append(f"Financial Impact: ${cluster['financial_total']:,.0f}")
        lines.append("")

        # Add individual items
        for item in cluster.get('items', [])[:5]:  # Limit to top 5 items
            lines.append(f"Subject: {item.get('subject', '')}")
            lines.append(f"From: {item.get('sender', {}).get('name', 'Unknown')}")
            body = item.get('clean_text', '') or item.get('body', '')
            snippet = (body[:300] + '...') if len(body) > 300 else body
            lines.append(f"Content: {snippet}")
            lines.append("---")

        return '\n'.join(lines)

    def _prepare_top_clusters_text(self, clusters: List[Dict[str, Any]]) -> str:
        """Prepare top clusters text for executive synthesis"""
        lines = []
        for i, cluster in enumerate(clusters[:3], 1):
            lines.append(f"Cluster {i}: {cluster.get('project_key', 'Unknown')}")
            lines.append(f"  Urgency Score: {cluster.get('urgency_score', 0)}")
            lines.append(f"  Status: {dict(cluster.get('status_counts', {}))}")
            if cluster.get('financial_total', 0) > 0:
                lines.append(f"  Financial: ${cluster['financial_total']:,.0f}")
            lines.append(f"  People: {', '.join(sorted(cluster.get('people', [])))}")
            lines.append("")

        return '\n'.join(lines)

    def _extract_blockers_from_cluster(self, cluster: Dict[str, Any]) -> List[str]:
        """Extract blockers from cluster using pattern matching"""
        blockers = []
        blocker_keywords = ['block', 'issue', 'problem', 'stalled', 'urgent', 'crisis', 'delay', 'stuck']

        for item in cluster.get('items', []):
            text = (item.get('subject', '') + ' ' + item.get('body', '')).lower()
            if any(keyword in text for keyword in blocker_keywords):
                subject = item.get('subject', '')
                if len(subject) > 10:  # Only meaningful subjects
                    blockers.append(subject)

        return blockers[:3]  # Limit to top 3

    def _fallback_contextual_summary(self, cluster: Dict[str, Any]) -> str:
        """Fallback contextual summary using rule-based approach"""
        status_counts = cluster.get('status_counts', {})
        people = cluster.get('people', [])
        financial = cluster.get('financial_total', 0)

        parts = []
        if status_counts.get('blocker', 0) > 0:
            parts.append("Progress is impacted by active blockers requiring resolution.")
        if status_counts.get('decision', 0) > 0:
            parts.append("Key decisions are pending executive input.")
        if status_counts.get('achievement', 0) > 0:
            parts.append("Recent achievements indicate positive momentum.")

        if not parts:
            parts.append("Ongoing coordination across stakeholders.")

        summary = ' '.join(parts)
        if people:
            summary += f" Stakeholders: {', '.join(sorted(people))}"
        if financial > 0:
            summary += f" Financial impact: ${financial:,.0f}"

        return summary

    def _fallback_executive_synthesis(self, top_clusters: List[Dict[str, Any]]) -> str:
        """Fallback executive synthesis using rule-based approach"""
        sentences = []

        for cluster in top_clusters[:3]:
            project = cluster.get('project_key', 'Unknown')
            status_counts = cluster.get('status_counts', {})
            financial = cluster.get('financial_total', 0)

            if status_counts.get('blocker', 0) > 0 and status_counts.get('decision', 0) > 0:
                sentences.append(f"{project} requires immediate executive attention with both a decision pending and active blockers.")
            elif status_counts.get('decision', 0) > 0:
                sentences.append(f"{project} needs an executive decision to maintain momentum.")
            elif status_counts.get('blocker', 0) > 0:
                sentences.append(f"{project} is currently blocked and requires intervention to resolve critical issues.")

        if not sentences:
            sentences.append("Projects show normal business activity with standard coordination requirements.")

        return ' '.join(sentences)

    def _fallback_action_derivation(self, cluster: Dict[str, Any]) -> List[str]:
        """Fallback action derivation using rule-based approach"""
        actions = []
        status_counts = cluster.get('status_counts', {})

        if status_counts.get('decision', 0) > 0:
            actions.append(f"Decision: Provide guidance on {cluster.get('project_key', 'project')} requirements")
        if status_counts.get('blocker', 0) > 0:
            actions.append(f"Resolution: Address blockers impacting {cluster.get('project_key', 'project')}")

        return actions

    def _fallback_recurring_summary(self, newsletter_clusters: List[Dict[str, Any]]) -> str:
        """Fallback recurring content summary"""
        total_items = sum(len(cluster.get('items', [])) for cluster in newsletter_clusters)
        return f"Recurring newsletters and market updates ({total_items} items) provided general business insights. No immediate action required."
