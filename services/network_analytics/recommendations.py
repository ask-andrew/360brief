#!/usr/bin/env python3
"""
LLM-Powered Collaboration Recommendations

This module generates personalized insights and recommendations based on
collaboration patterns using Large Language Models.
"""

import logging
import json
from typing import Dict, List, Any
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class CollaborationRecommender:
    """Generates personalized collaboration recommendations using LLMs"""

    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')

    def generate_recommendation(self, metrics: Dict[str, Any], clusters: List[Dict[str, Any]],
                              user_email: str, time_span: str = "Last 90 Days") -> Dict[str, Any]:
        """Generate personalized collaboration recommendation"""

        try:
            # Prepare context data
            context = self._prepare_context(metrics, clusters, time_span)

            # Try OpenAI first, fallback to Anthropic
            recommendation = None

            if self.openai_api_key:
                recommendation = self._call_openai(context)
            elif self.anthropic_api_key:
                recommendation = self._call_anthropic(context)
            else:
                # Fallback to rule-based recommendation
                recommendation = self._generate_rule_based_recommendation(context)

            return {
                'recommendation': recommendation,
                'confidence': 'high' if (self.openai_api_key or self.anthropic_api_key) else 'medium',
                'generated_at': datetime.now().isoformat(),
                'model_used': 'gpt-4' if self.openai_api_key else ('claude' if self.anthropic_api_key else 'rule-based'),
                'context_summary': {
                    'projects': len(clusters),
                    'active_projects': len([c for c in clusters if c.get('is_active')]),
                    'participants': metrics.get('total_unique_participants', 0),
                    'time_span': time_span
                }
            }

        except Exception as e:
            logger.error(f"Error generating LLM recommendation: {e}")
            return {
                'recommendation': self._generate_fallback_recommendation(metrics, clusters),
                'confidence': 'low',
                'error': str(e),
                'generated_at': datetime.now().isoformat()
            }

    def _prepare_context(self, metrics: Dict[str, Any], clusters: List[Dict[str, Any]], time_span: str) -> Dict[str, Any]:
        """Prepare context data for LLM"""

        # Calculate key metrics
        total_projects = len(clusters)
        active_projects = len([c for c in clusters if c.get('is_active', False)])
        total_participants = metrics.get('total_unique_participants', 0)
        avg_project_participation = metrics.get('average_project_participation', 0)

        # Analyze project types
        project_keywords = {}
        for cluster in clusters:
            for keyword in cluster.get('top_keywords', []):
                project_keywords[keyword] = project_keywords.get(keyword, 0) + 1

        # Determine collaboration style
        collaboration_insights = self._analyze_collaboration_patterns(clusters, metrics)

        return {
            'time_span': time_span,
            'metrics': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'total_participants': total_participants,
                'avg_project_participation': round(avg_project_participation, 1),
                'project_completion_rate': round(active_projects / total_projects * 100, 1) if total_projects > 0 else 0
            },
            'project_keywords': dict(list(project_keywords.items())[:10]),
            'collaboration_insights': collaboration_insights,
            'user_profile': self._infer_user_profile(clusters, metrics)
        }

    def _analyze_collaboration_patterns(self, clusters: List[Dict[str, Any]], metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze collaboration patterns for insights"""

        insights = {}

        # Project diversity
        if clusters:
            avg_participants = sum(len(c['participants']) for c in clusters) / len(clusters)
            insights['avg_team_size'] = round(avg_participants, 1)

            # Internal vs external collaboration
            all_participants = set()
            for cluster in clusters:
                all_participants.update(cluster['participants'])

            # Simple heuristic for internal/external
            internal_participants = sum(1 for p in all_participants if 'company.com' in p or 'internal' in p)
            external_participants = len(all_participants) - internal_participants
            insights['internal_external_ratio'] = round(internal_participants / external_participants, 2) if external_participants > 0 else float('inf')

        # Activity patterns
        if clusters:
            durations = []
            for cluster in clusters:
                if cluster.get('start_date') and cluster.get('end_date'):
                    start = datetime.fromisoformat(cluster['start_date'])
                    end = datetime.fromisoformat(cluster['end_date'])
                    durations.append((end - start).days)

            if durations:
                insights['avg_project_duration'] = round(sum(durations) / len(durations), 1)
                insights['project_duration_range'] = f"{min(durations)}-{max(durations)} days"

        return insights

    def _infer_user_profile(self, clusters: List[Dict[str, Any]], metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Infer user collaboration profile"""

        profile = {'type': 'balanced', 'strengths': [], 'opportunities': []}

        if clusters:
            # Analyze participation patterns
            project_counts = [len(c['participants']) for c in clusters]
            avg_team_size = sum(project_counts) / len(project_counts)

            if avg_team_size > 8:
                profile['type'] = 'orchestrator'
                profile['strengths'].append('large_team_coordination')
            elif avg_team_size < 4:
                profile['type'] = 'specialist'
                profile['strengths'].append('focused_collaboration')
            else:
                profile['type'] = 'balanced'

            # Check for cross-functional collaboration
            all_participants = set()
            for cluster in clusters:
                all_participants.update(cluster['participants'])

            if len(all_participants) > len(clusters) * 2:
                profile['strengths'].append('broad_network')
            else:
                profile['opportunities'].append('network_expansion')

        return profile

    def _call_openai(self, context: Dict[str, Any]) -> str:
        """Call OpenAI API for recommendation generation"""

        try:
            import openai

            client = openai.OpenAI(api_key=self.openai_api_key)

            prompt = self._build_prompt(context)

            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert collaboration coach helping professionals optimize their network and teamwork. Provide specific, actionable recommendations based on their collaboration metrics. Be encouraging and focus on strengths while suggesting improvements."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=200,
                temperature=0.7
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise

    def _call_anthropic(self, context: Dict[str, Any]) -> str:
        """Call Anthropic API for recommendation generation"""

        try:
            import anthropic

            client = anthropic.Anthropic(api_key=self.anthropic_api_key)

            prompt = self._build_prompt(context)

            response = client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=200,
                temperature=0.7,
                system="You are an expert collaboration coach helping professionals optimize their network and teamwork. Provide specific, actionable recommendations based on their collaboration metrics. Be encouraging and focus on strengths while suggesting improvements.",
                messages=[
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            )

            return response.content[0].text.strip()

        except Exception as e:
            logger.error(f"Anthropic API call failed: {e}")
            raise

    def _build_prompt(self, context: Dict[str, Any]) -> str:
        """Build prompt for LLM"""

        metrics = context['metrics']
        insights = context['collaboration_insights']
        profile = context['user_profile']

        prompt = f"""
Based on this collaboration data, provide a personalized recommendation:

TIME PERIOD: {context['time_span']}

YOUR METRICS:
- Active Projects: {metrics['active_projects']}
- Total Participants: {metrics['total_participants']}
- Average Team Size: {insights.get('avg_team_size', 'N/A')}
- Project Success Rate: {metrics['project_completion_rate']}%
- Collaboration Style: {profile['type']}

YOUR STRENGTHS: {', '.join(profile['strengths'])}
OPPORTUNITIES: {', '.join(profile['opportunities'])}

TOP PROJECT TOPICS: {', '.join(list(context['project_keywords'].keys())[:5])}

Provide ONE specific, actionable recommendation to improve their collaboration effectiveness. Focus on their strongest area or biggest opportunity. Keep it concise (2-3 sentences) and encouraging.
"""

        return prompt

    def _generate_rule_based_recommendation(self, context: Dict[str, Any]) -> str:
        """Generate recommendation using rule-based logic"""

        metrics = context['metrics']
        insights = context['collaboration_insights']
        profile = context['user_profile']

        # Rule-based recommendation logic
        if profile['type'] == 'orchestrator':
            return "As a project orchestrator, you're excellent at coordinating large teams. Consider identifying one complex project where you could delegate more decision-making to team leads. This will free you up to focus on strategic oversight while developing your team's autonomy."
        elif profile['type'] == 'specialist':
            return "Your focused collaboration style suggests you're great at deep work with small teams. Look for opportunities to share your specialized knowledge more broadly across the organization. Consider leading a knowledge-sharing session or mentoring program in your area of expertise."
        elif len(profile['opportunities']) > 0 and 'network_expansion' in profile['opportunities']:
            return "Your collaboration network shows room for growth. This {context['time_span'].lower()} consider reaching out to one new person outside your usual circle for a project discussion. Fresh perspectives often lead to breakthrough ideas."
        else:
            return f"Over the {context['time_span'].lower()}, you've maintained {metrics['active_projects']} active projects with {metrics['total_participants']} collaborators. Consider reviewing one completed project to identify what made it successful - these patterns can be applied to future initiatives."

    def _generate_fallback_recommendation(self, metrics: Dict[str, Any], clusters: List[Dict[str, Any]]) -> str:
        """Simple fallback recommendation when LLM fails"""

        total_projects = len(clusters)
        active_projects = len([c for c in clusters if c.get('is_active', False)])

        return f"You've been involved in {total_projects} projects with {active_projects} currently active. Review your most successful project from this period and identify 2-3 practices you can apply to your current work."

def generate_collaboration_recommendation(metrics: Dict[str, Any], clusters: List[Dict[str, Any]],
                                        user_email: str, time_span: str = "Last 90 Days") -> Dict[str, Any]:
    """Main function to generate collaboration recommendations"""

    recommender = CollaborationRecommender()
    return recommender.generate_recommendation(metrics, clusters, user_email, time_span)
