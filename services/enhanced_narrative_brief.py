"""
Enhanced Narrative Brief Generator
Combines preprocessing pipeline and synthesis layer to generate executive briefs
with cognitive relief and actionable focus as specified in requirements.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
import json

from narrative_preprocessing import EnhancedPreprocessingPipeline, process_email_batch_for_narrative
from narrative_synthesis import EnhancedSynthesisLayer

logger = logging.getLogger(__name__)

class EnhancedNarrativeBriefGenerator:
    """Complete narrative brief generation system"""

    def __init__(self):
        self.preprocessing = EnhancedPreprocessingPipeline()
        self.synthesis = EnhancedSynthesisLayer()

    def generate_narrative_brief_markdown(self, emails: List[Dict[str, Any]],
                                        max_projects: int = 8,
                                        use_llm: bool = True) -> Tuple[str, List[Dict[str, Any]], List[str]]:
        """Generate enhanced narrative brief with preprocessing and synthesis"""

        # Step 1: Preprocessing Pipeline (Mandatory)
        logger.info(f"Starting preprocessing for {len(emails)} emails")
        preprocessed_data = process_email_batch_for_narrative(emails)

        # Step 2: Synthesis Layer (Optional/Enhanced)
        all_prompts = []
        if use_llm and emails:
            logger.info("Starting LLM-based synthesis layer")
            cluster_prompts = self._enhance_clusters_with_synthesis(preprocessed_data['sorted_clusters'])
            all_prompts.extend(cluster_prompts)

        # Step 3: Generate Executive Summary
        executive_summary, exec_prompts = self._generate_executive_summary(preprocessed_data['sorted_clusters'])
        all_prompts.extend(exec_prompts)

        # Step 4: Generate Project Deep Dive
        project_sections = self._generate_project_sections(preprocessed_data['sorted_clusters'], max_projects)

        # Step 5: Generate General Momentum Section
        newsletter_clusters = self._identify_newsletter_clusters(preprocessed_data['sorted_clusters'])
        recurring_summary, recurring_prompts = self._generate_recurring_content_section(newsletter_clusters)
        all_prompts.extend(recurring_prompts)

        # Step 6: Combine into Markdown
        markdown = self._assemble_markdown(
            executive_summary,
            project_sections,
            recurring_summary,
            preprocessed_data
        )

        return markdown, preprocessed_data['sorted_clusters'], all_prompts

    def _enhance_clusters_with_synthesis(self, clusters: List[Dict[str, Any]]):
        """Enhance clusters with LLM-based synthesis and collect prompts"""
        all_prompts = []

        for cluster in clusters:
            try:
                synthesis_result = self.synthesis.synthesize_cluster(cluster)

                # Update cluster with synthesis results
                cluster['contextual_summary'] = synthesis_result.contextual_summary
                cluster['action_items'] = synthesis_result.action_items
                cluster['blockers'] = synthesis_result.blockers

                # Collect prompts from synthesis (this would need to be updated in SynthesisResult)
                # For now, we'll collect them during the synthesis process

            except Exception as e:
                logger.error(f"Error enhancing cluster {cluster.get('project_key', 'unknown')}: {e}")
                # Fallback to basic synthesis
                cluster['contextual_summary'] = self._basic_cluster_summary(cluster)
                cluster['action_items'] = self._basic_action_items(cluster)
                cluster['blockers'] = self._basic_blockers(cluster)

        return all_prompts

    def _generate_executive_summary(self, clusters: List[Dict[str, Any]]) -> Tuple[str, List[str]]:
        """Generate executive summary from top clusters and return prompts used"""
        if not clusters:
            return "No significant projects identified in the current briefing period.", []

        # Use synthesis layer for executive summary
        synthesis_text, executive_prompt = self.synthesis.generate_executive_synthesis(clusters[:3])
        prompts_used = [executive_prompt] if executive_prompt else []

        # Add quantitative summary
        total_projects = len(clusters)
        high_urgency = sum(1 for c in clusters if c.get('urgency_score', 0) >= 3)
        total_financial = sum(c.get('financial_total', 0) for c in clusters if c.get('has_financial_mentions', False))

        summary_lines = []
        summary_lines.append("# Executive Summary")
        summary_lines.append("")
        summary_lines.append(synthesis_text)
        summary_lines.append("")
        summary_lines.append(f"**Briefing Overview**: {total_projects} active projects identified")
        if high_urgency > 0:
            summary_lines.append(f"**High Priority Items**: {high_urgency} projects require immediate attention")
        if total_financial > 0:
            summary_lines.append(f"**Financial Impact**: ${total_financial:,.0f} across all projects")
        summary_lines.append("")

        return '\n'.join(summary_lines), prompts_used

    def _generate_project_sections(self, clusters: List[Dict[str, Any]], max_projects: int) -> str:
        """Generate project deep dive sections"""
        lines = []
        lines.append("# Project Deep Dive")
        lines.append("")

        for cluster in clusters[:max_projects]:
            # Project header with status
            status_labels = []
            status_counts = cluster.get('status_counts', {})
            if status_counts.get('decision', 0) > 0:
                status_labels.append('Decision')
            if status_counts.get('blocker', 0) > 0:
                status_labels.append('Blocker')
            if status_counts.get('achievement', 0) > 0:
                status_labels.append('Achievement')
            status_text = ' & '.join(status_labels) or 'Active'

            lines.append(f"## {cluster.get('project_key', 'Unknown Project')} | Status: {status_text}")

            # Contextual summary (from synthesis layer)
            summary = cluster.get('contextual_summary', '')
            if summary:
                lines.append(summary)
            else:
                lines.append(self._basic_cluster_summary(cluster))

            # Action items
            action_items = cluster.get('action_items', [])
            if action_items:
                lines.append("- **Action Needed**: " + '; '.join(action_items))

            # Blockers
            blockers = cluster.get('blockers', [])
            if blockers:
                lines.append("- **Blockers/Risks**: " + '; '.join(blockers))

            # Contributors
            people = cluster.get('people', [])
            if people:
                lines.append("- **Contributors**: " + ', '.join(sorted(people)))

            # Financial impact (with constraint enforcement)
            if cluster.get('has_financial_mentions', False) and cluster.get('financial_total', 0) > 0:
                lines.append(f"- **Financial**: ~${cluster['financial_total']:,.0f}")

            # Related items (compact view)
            related_items = []
            for item in cluster.get('items', [])[:3]:
                subject = item.get('subject', '')
                if subject and len(subject) > 10:
                    related_items.append(f"• {subject}")

            if related_items:
                lines.append("- **Related Items**: " + ' | '.join(related_items))

            lines.append("")

        return '\n'.join(lines)

    def _generate_recurring_content_section(self, newsletter_clusters: List[Dict[str, Any]]) -> Tuple[str, List[str]]:
        """Generate recurring content section and return prompts used"""
        if not newsletter_clusters:
            return "", []

        # Use synthesis layer for recurring content
        recurring_summary, recurring_prompt = self.synthesis.generate_recurring_content_summary(newsletter_clusters)
        prompts_used = [recurring_prompt] if recurring_prompt else []

        lines = []
        lines.append("# General Momentum & Achievements")
        lines.append("")
        lines.append(recurring_summary)
        lines.append("")

        return '\n'.join(lines), prompts_used

    def _identify_newsletter_clusters(self, clusters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify clusters that appear to be newsletters or recurring content"""
        newsletter_clusters = []
        newsletter_keywords = [
            'newsletter', 'substack', 'washington', 'post', 'digest', 'morning brew',
            'axios', 'techcrunch', 'reuters', 'bloomberg', 'cnbc', 'wsj',
            'daily', 'weekly', 'monthly', 'update', 'summary'
        ]

        for cluster in clusters:
            project_key = cluster.get('project_key', '').lower()
            if any(keyword in project_key for keyword in newsletter_keywords):
                newsletter_clusters.append(cluster)

        return newsletter_clusters

    def _assemble_markdown(self, executive_summary: str, project_sections: str,
                          recurring_section: str, preprocessed_data: Dict[str, Any]) -> str:
        """Assemble final markdown document"""
        lines = []
        lines.append(f"# 360Brief - Executive Narrative")
        lines.append(f"*Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
        lines.append("")
        lines.append(executive_summary)
        lines.append(project_sections)
        lines.append(recurring_section)

        # Add metadata footer
        metadata = preprocessed_data
        lines.append("---")
        lines.append(f"*Processing Metadata: {metadata['total_emails']} emails → {metadata['total_clusters']} projects*")

        return '\n'.join(lines)

    def _basic_cluster_summary(self, cluster: Dict[str, Any]) -> str:
        """Basic fallback cluster summary"""
        status_counts = cluster.get('status_counts', {})
        people = cluster.get('people', [])
        financial = cluster.get('financial_total', 0)

        parts = []
        if status_counts.get('blocker', 0) > 0:
            parts.append("Progress impacted by active blockers requiring resolution.")
        if status_counts.get('decision', 0) > 0:
            parts.append("Decision pending executive input.")
        if status_counts.get('achievement', 0) > 0:
            parts.append("Recent achievements indicate positive momentum.")

        if not parts:
            parts.append("Ongoing coordination across stakeholders.")

        summary = ' '.join(parts)
        if people:
            summary += f" Stakeholders: {', '.join(sorted(people))}"
        if cluster.get('has_financial_mentions', False) and financial > 0:
            summary += f" Financial impact: ${financial:,.0f}"

        return summary

    def _basic_action_items(self, cluster: Dict[str, Any]) -> List[str]:
        """Basic fallback action items"""
        actions = []
        status_counts = cluster.get('status_counts', {})

        if status_counts.get('decision', 0) > 0:
            actions.append(f"Decision: Provide guidance on {cluster.get('project_key', 'project')} requirements")
        if status_counts.get('blocker', 0) > 0:
            actions.append(f"Resolution: Address blockers impacting {cluster.get('project_key', 'project')}")

        return actions

    def _basic_blockers(self, cluster: Dict[str, Any]) -> List[str]:
        """Basic fallback blockers extraction"""
        blockers = []
        blocker_keywords = ['block', 'issue', 'problem', 'stalled', 'urgent', 'crisis', 'delay', 'stuck']

        for item in cluster.get('items', []):
            text = (item.get('subject', '') + ' ' + item.get('body', '')).lower()
            if any(keyword in text for keyword in blocker_keywords):
                subject = item.get('subject', '')
                if subject and len(subject) > 10:
                    blockers.append(subject)

        return blockers[:3]

def generate_enhanced_narrative_brief(emails: List[Dict[str, Any]],
                                   max_projects: int = 8,
                                   use_llm: bool = True) -> Dict[str, Any]:
    """Main entry point for enhanced narrative brief generation"""
    try:
        generator = EnhancedNarrativeBriefGenerator()
        markdown, clusters, prompts = generator.generate_narrative_brief_markdown(
            emails=emails,
            max_projects=max_projects,
            use_llm=use_llm
        )

        return {
            'markdown': markdown,
            'clusters': clusters,
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'engine': 'enhanced_narrative_v2_llm' if use_llm else 'enhanced_narrative_v2_rule_based',
            'total_emails': len(emails),
            'total_projects': len(clusters),
            'llm_prompt': '\n\n---\n\n'.join(prompts) if prompts else None  # Combine all prompts for feedback
        }

    except Exception as e:
        logger.error(f"Error in enhanced narrative brief generation: {e}")
        raise
