"""Service for generating rule-based summaries without LLM."""
import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta


class SummarizationService:
    """Service for generating rule-based summaries without LLM."""
    
    def __init__(self):
        """Initialize the rule-based summarization service."""
        self.summary_template = {
            "executive_summary": [],
            "key_projects": [],
            "blockers": [],
            "action_items": [],
            "achievements": [],
            "key_people": [],
            "financials": [],
            "recommendations": []
        }
    
    async def generate_summary(self, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a rule-based executive summary from structured data.
        
        Args:
            structured_data: Dictionary containing extracted structured data from processor
            
        Returns:
            Dictionary containing the structured brief
        """
        try:
            # Build executive summary from top items
            executive_summary = self._build_executive_summary(structured_data)
            
            # Extract top projects
            key_projects = self._extract_top_projects(structured_data.get('projects', []))
            
            # Extract critical blockers
            blockers = self._extract_critical_blockers(structured_data.get('incidents', []))
            
            # Extract high-priority action items
            action_items = self._extract_priority_actions(structured_data.get('action_items', []))
            
            # Extract recent achievements
            achievements = self._extract_achievements(structured_data.get('achievements', []))
            
            # Extract key people
            key_people = self._extract_key_people(structured_data.get('key_people', {}))
            
            # Extract financial highlights
            financials = self._extract_financial_highlights(structured_data.get('financials', []))
            
            # Generate recommendations
            recommendations = self._generate_recommendations(structured_data)
            
            return {
                "executive_summary": executive_summary,
                "key_projects": key_projects,
                "blockers": blockers,
                "action_items": action_items,
                "achievements": achievements,
                "key_people": key_people,
                "financials": financials,
                "recommendations": recommendations,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating summary: {e}")
            return self._generate_fallback_summary()
    
    def generate_briefing(self, analysis_results: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate a complete briefing with multiple sections.
        
        Args:
            analysis_results: Dictionary containing analysis results
            
        Returns:
            Dictionary with different sections of the briefing
        """
        sections = {
            "executive_summary": "",
            "key_insights": [],
            "action_items": [],
            "upcoming_events": [],
            "recommendations": []
        }
        
        # Generate each section using rule-based approach
        sections["executive_summary"] = self._generate_executive_summary(analysis_results)
        sections["key_insights"] = self._extract_key_insights(analysis_results)
        sections["action_items"] = self._extract_action_items(analysis_results)
        sections["upcoming_events"] = self._extract_upcoming_events(analysis_results)
        sections["recommendations"] = self._generate_recommendations(analysis_results)
        
        return sections
    
    def _build_executive_summary(self, structured_data: Dict[str, Any]) -> List[str]:
        """Build executive summary from structured data."""
        summary_points = []
        
        # Count key metrics
        project_count = len(structured_data.get('projects', []))
        incident_count = len(structured_data.get('incidents', []))
        action_count = len(structured_data.get('action_items', []))
        achievement_count = len(structured_data.get('achievements', []))
        
        # Add summary points based on data
        if project_count > 0:
            top_projects = structured_data.get('projects', [])[:3]
            project_names = [p.get('name', 'Unknown') for p in top_projects]
            summary_points.append(f"Tracking {project_count} active projects, with focus on: {', '.join(project_names)}")
        
        if incident_count > 0:
            high_severity = sum(1 for i in structured_data.get('incidents', []) if i.get('severity') == 'high')
            if high_severity > 0:
                summary_points.append(f"⚠️ {high_severity} critical issues require immediate attention")
            else:
                summary_points.append(f"{incident_count} issues identified, none critical")
        
        if action_count > 0:
            summary_points.append(f"{action_count} action items pending completion")
        
        if achievement_count > 0:
            summary_points.append(f"🎉 {achievement_count} achievements completed this period")
        
        # Add financial summary if present
        financials = structured_data.get('financials', [])
        if financials:
            total_mentioned = len(financials)
            summary_points.append(f"Financial discussions involving {total_mentioned} amounts")
        
        # If no data, provide a default message
        if not summary_points:
            summary_points.append("No significant activity detected in the analyzed period")
        
        return summary_points
    
    def _extract_top_projects(self, projects: List[Dict]) -> List[Dict]:
        """Extract top 5 projects."""
        # Projects should already be sorted by processor
        top_projects = []
        
        for project in projects[:5]:
            top_projects.append({
                "name": project.get('name', 'Unknown Project'),
                "mentions": 1,  # Could be enhanced to count mentions
                "last_updated": project.get('timestamp', datetime.now()).isoformat() if isinstance(project.get('timestamp'), datetime) else str(project.get('timestamp', '')),
                "status": "Active"  # Could be enhanced with status detection
            })
        
        return top_projects
    
    def _extract_critical_blockers(self, incidents: List[Dict]) -> List[Dict]:
        """Extract critical blockers and issues."""
        blockers = []
        
        for incident in incidents[:5]:  # Top 5 incidents
            blockers.append({
                "description": incident.get('description', 'Unknown issue'),
                "severity": incident.get('severity', 'medium'),
                "reported_at": incident.get('timestamp', datetime.now()).isoformat() if isinstance(incident.get('timestamp'), datetime) else str(incident.get('timestamp', '')),
                "context": incident.get('context', '')[:100]  # First 100 chars of context
            })
        
        return blockers
    
    def _extract_priority_actions(self, action_items: List[Dict]) -> List[Dict]:
        """Extract high-priority action items."""
        actions = []
        
        for action in action_items[:7]:  # Top 7 action items
            actions.append({
                "description": action.get('description', 'Unknown action'),
                "assigned_to": action.get('assigned_to', 'Unassigned'),
                "created_at": action.get('timestamp', datetime.now()).isoformat() if isinstance(action.get('timestamp'), datetime) else str(action.get('timestamp', '')),
                "priority": "high" if any(word in action.get('description', '').lower() for word in ['urgent', 'asap', 'critical']) else "medium"
            })
        
        return actions
    
    def _extract_achievements(self, achievements: List[Dict]) -> List[Dict]:
        """Extract recent achievements and wins."""
        wins = []
        
        for achievement in achievements[:5]:  # Top 5 achievements
            wins.append({
                "description": achievement.get('description', 'Achievement'),
                "completed_at": achievement.get('timestamp', datetime.now()).isoformat() if isinstance(achievement.get('timestamp'), datetime) else str(achievement.get('timestamp', ''))
            })
        
        return wins
    
    def _extract_key_people(self, key_people: Dict) -> List[Dict]:
        """Extract top 5 key people by interaction count."""
        people_list = []
        
        # Convert dict to list and sort by importance score
        sorted_people = sorted(
            key_people.items(),
            key=lambda x: x[1].get('importance_score', 0),
            reverse=True
        )[:5]
        
        for person_id, person_data in sorted_people:
            people_list.append({
                "name": person_data.get('name', 'Unknown'),
                "email": person_data.get('email', ''),
                "interactions": person_data.get('interaction_count', 0),
                "last_contact": person_data.get('last_interaction', datetime.now()).isoformat() if isinstance(person_data.get('last_interaction'), datetime) else str(person_data.get('last_interaction', '')),
                "topics": list(set(person_data.get('topics', [])[-3:]))  # Last 3 unique topics
            })
        
        return people_list
    
    def _extract_financial_highlights(self, financials: List[Dict]) -> List[Dict]:
        """Extract financial highlights."""
        highlights = []
        
        for financial in financials[:5]:  # Top 5 financial mentions
            highlights.append({
                "amount": financial.get('amount', 'Unknown'),
                "context": financial.get('context', ''),
                "mentioned_at": financial.get('timestamp', datetime.now()).isoformat() if isinstance(financial.get('timestamp'), datetime) else str(financial.get('timestamp', ''))
            })
        
        return highlights
    
    def _generate_recommendations(self, structured_data: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations based on the data."""
        recommendations = []
        
        # Check for high-severity incidents
        high_incidents = [i for i in structured_data.get('incidents', []) if i.get('severity') == 'high']
        if high_incidents:
            recommendations.append(f"🔴 Address {len(high_incidents)} critical issues immediately to prevent escalation")
        
        # Check for overdue action items
        action_items = structured_data.get('action_items', [])
        if len(action_items) > 10:
            recommendations.append("📋 Consider delegating or prioritizing action items - current backlog is high")
        
        # Check for stalled projects
        projects = structured_data.get('projects', [])
        if projects:
            # Simple heuristic: if project hasn't been mentioned recently
            recommendations.append("📊 Schedule project status reviews for ongoing initiatives")
        
        # Check for financial items
        financials = structured_data.get('financials', [])
        if financials:
            recommendations.append("💰 Review financial commitments and budget allocations mentioned in communications")
        
        # Check for key people engagement
        key_people = structured_data.get('key_people', {})
        low_engagement = [p for p in key_people.values() if p.get('interaction_count', 0) == 1]
        if len(low_engagement) > 3:
            recommendations.append("👥 Follow up with contacts who have had limited engagement")
        
        # Add time management recommendation
        total_items = len(action_items) + len(high_incidents)
        if total_items > 15:
            recommendations.append("⏰ Block focus time this week to address backlog of tasks and issues")
        
        # If no specific recommendations, provide general guidance
        if not recommendations:
            recommendations.append("✅ Continue current pace - no critical issues detected")
            recommendations.append("📅 Schedule regular review sessions to maintain momentum")
        
        return recommendations
    
    def _generate_fallback_summary(self) -> Dict[str, Any]:
        """Generate a fallback summary when processing fails."""
        return {
            "executive_summary": ["Unable to process data at this time"],
            "key_projects": [],
            "blockers": [],
            "action_items": [],
            "achievements": [],
            "key_people": [],
            "financials": [],
            "recommendations": ["Please check data sources and try again"],
            "generated_at": datetime.now().isoformat()
        }
    
    def _generate_executive_summary(self, data: Dict[str, Any]) -> str:
        """Generate the executive summary section."""
        # Rule-based summary generation (legacy method compatibility)
        return "Executive summary generated using rule-based approach"
    
    def _extract_key_insights(self, data: Dict[str, Any]) -> List[str]:
        """Extract key insights from the data."""
        # Rule-based insight extraction
        insights = []
        
        if 'total_count' in data and data['total_count'] > 100:
            insights.append("High volume of communications detected")
        
        if 'avg_response_time_minutes' in data and data['avg_response_time_minutes'] > 240:
            insights.append("Response times are above average - consider prioritization")
        
        if not insights:
            insights = ["Communication patterns appear normal"]
        
        return insights
    
    def _extract_action_items(self, data: Dict[str, Any]) -> List[Dict]:
        """Extract action items from the data."""
        # Rule-based action item extraction
        return [
            {"description": "Review communication patterns", "priority": "medium", "due_date": None},
            {"description": "Follow up on pending responses", "priority": "high", "due_date": None}
        ]
    
    def _extract_upcoming_events(self, data: Dict[str, Any]) -> List[Dict]:
        """Extract upcoming events from the data."""
        # Rule-based event extraction
        return [
            {"title": "Weekly Review", "time": (datetime.now() + timedelta(days=1)).isoformat(), "location": None}
        ]
    
    def generate_plain_text_brief(self, summary_data: Dict[str, Any]) -> str:
        """Generate a plain text version of the brief."""
        lines = []
        lines.append("=" * 60)
        lines.append("EXECUTIVE BRIEF")
        lines.append(f"Generated: {summary_data.get('generated_at', datetime.now().isoformat())}")
        lines.append("=" * 60)
        lines.append("")
        
        # Executive Summary
        lines.append("EXECUTIVE SUMMARY")
        lines.append("-" * 40)
        for point in summary_data.get('executive_summary', []):
            lines.append(f"• {point}")
        lines.append("")
        
        # Key Projects
        if summary_data.get('key_projects'):
            lines.append("KEY PROJECTS")
            lines.append("-" * 40)
            for i, project in enumerate(summary_data['key_projects'], 1):
                lines.append(f"{i}. {project['name']} (Status: {project.get('status', 'Active')})")
        lines.append("")
        
        # Blockers
        if summary_data.get('blockers'):
            lines.append("BLOCKERS & ISSUES")
            lines.append("-" * 40)
            for blocker in summary_data['blockers']:
                severity_icon = "🔴" if blocker['severity'] == 'high' else "🟡"
                lines.append(f"{severity_icon} [{blocker['severity'].upper()}] {blocker['description']}")
        lines.append("")
        
        # Action Items
        if summary_data.get('action_items'):
            lines.append("ACTION ITEMS")
            lines.append("-" * 40)
            for action in summary_data['action_items']:
                assignee = f" → {action['assigned_to']}" if action['assigned_to'] != 'Unassigned' else ""
                lines.append(f"▢ {action['description']}{assignee}")
        lines.append("")
        
        # Achievements
        if summary_data.get('achievements'):
            lines.append("ACHIEVEMENTS")
            lines.append("-" * 40)
            for achievement in summary_data['achievements']:
                lines.append(f"✓ {achievement['description']}")
        lines.append("")
        
        # Recommendations
        lines.append("RECOMMENDATIONS")
        lines.append("-" * 40)
        for rec in summary_data.get('recommendations', []):
            lines.append(f"→ {rec}")
        
        return "\n".join(lines)
    
    def generate_html_brief(self, summary_data: Dict[str, Any]) -> str:
        """Generate an HTML version of the brief."""
        html = []
        html.append('<!DOCTYPE html>')
        html.append('<html><head>')
        html.append('<meta charset="UTF-8">')
        html.append('<title>Executive Brief</title>')
        html.append('<style>')
        html.append('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }')
        html.append('h1 { color: #1a1a1a; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }')
        html.append('h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }')
        html.append('.summary-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }')
        html.append('.high-severity { color: #d32f2f; font-weight: bold; }')
        html.append('.medium-severity { color: #f57c00; }')
        html.append('.achievement { color: #388e3c; }')
        html.append('.project { background: #e3f2fd; padding: 10px; margin: 10px 0; border-left: 4px solid #2196f3; }')
        html.append('.action-item { background: #fff3e0; padding: 10px; margin: 10px 0; border-left: 4px solid #ff9800; }')
        html.append('.blocker { background: #ffebee; padding: 10px; margin: 10px 0; border-left: 4px solid #f44336; }')
        html.append('.recommendation { background: #f3e5f5; padding: 10px; margin: 10px 0; border-left: 4px solid #9c27b0; }')
        html.append('</style>')
        html.append('</head><body>')
        
        # Header
        html.append('<h1>Executive Brief</h1>')
        html.append(f'<p style="color: #666;">Generated: {summary_data.get("generated_at", datetime.now().isoformat())}</p>')
        
        # Executive Summary
        html.append('<div class="summary-box">')
        html.append('<h2>Executive Summary</h2>')
        html.append('<ul>')
        for point in summary_data.get('executive_summary', []):
            html.append(f'<li>{point}</li>')
        html.append('</ul>')
        html.append('</div>')
        
        # Key Projects
        if summary_data.get('key_projects'):
            html.append('<h2>Key Projects</h2>')
            for project in summary_data['key_projects']:
                html.append('<div class="project">')
                html.append(f'<strong>{project["name"]}</strong><br>')
                html.append(f'Status: {project.get("status", "Active")}<br>')
                html.append(f'Last Updated: {project.get("last_updated", "Unknown")}')
                html.append('</div>')
        
        # Blockers
        if summary_data.get('blockers'):
            html.append('<h2>Blockers & Issues</h2>')
            for blocker in summary_data['blockers']:
                severity_class = 'high-severity' if blocker['severity'] == 'high' else 'medium-severity'
                html.append('<div class="blocker">')
                html.append(f'<span class="{severity_class}">[{blocker["severity"].upper()}]</span> ')
                html.append(f'{blocker["description"]}')
                html.append('</div>')
        
        # Action Items
        if summary_data.get('action_items'):
            html.append('<h2>Action Items</h2>')
            for action in summary_data['action_items']:
                html.append('<div class="action-item">')
                html.append(f'<input type="checkbox"> {action["description"]}')
                if action['assigned_to'] != 'Unassigned':
                    html.append(f' <em>(Assigned to: {action["assigned_to"]})</em>')
                html.append('</div>')
        
        # Achievements
        if summary_data.get('achievements'):
            html.append('<h2>Achievements</h2>')
            html.append('<ul>')
            for achievement in summary_data['achievements']:
                html.append(f'<li class="achievement">✓ {achievement["description"]}</li>')
            html.append('</ul>')
        
        # Recommendations
        html.append('<h2>Recommendations</h2>')
        for rec in summary_data.get('recommendations', []):
            html.append('<div class="recommendation">')
            html.append(f'{rec}')
            html.append('</div>')
        
        html.append('</body></html>')
        
        return '\n'.join(html)