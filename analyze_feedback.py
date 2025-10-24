#!/usr/bin/env python3
"""
Narrative Feedback Analysis System
Analyzes user feedback to improve synthesis prompts and rules
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from collections import Counter, defaultdict
import re

# Add services directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def analyze_feedback_patterns():
    """Analyze feedback patterns to identify improvement opportunities"""

    print("🧠 Narrative Feedback Analysis System")
    print("=" * 50)
    print("Analyzing user feedback to improve synthesis quality...")
    print()

    # This would normally connect to the Supabase database
    # For now, we'll simulate the analysis with mock data
    # In production, this would query the narrative_feedback table

    mock_feedback_data = [
        {
            'engine_used': 'enhanced_narrative_v2_llm',
            'feedback_type': 'not_helpful',
            'project_types': ['financial', 'technical'],
            'generated_markdown': 'Project requires decision on budget approval. Timeline is tight.',
            'feedback_comments': 'Missing specific financial amounts and unclear timeline',
            'llm_prompt': 'Analyze project cluster and create contextual summary...',
            'cluster_data': [{'project_key': 'Budget - Approval', 'has_financial_mentions': True}]
        },
        {
            'engine_used': 'enhanced_narrative_v2_llm',
            'feedback_type': 'helpful',
            'project_types': ['hr', 'operations'],
            'generated_markdown': 'Team requires decision on hiring budget. Need approval by Friday.',
            'feedback_comments': None,
            'llm_prompt': 'Analyze project cluster and create contextual summary...',
            'cluster_data': [{'project_key': 'Team - Hiring', 'has_financial_mentions': True}]
        },
        {
            'engine_used': 'enhanced_narrative_v2_rule_based',
            'feedback_type': 'not_helpful',
            'project_types': ['legal', 'compliance'],
            'generated_markdown': 'Legal team needs decision on contract terms.',
            'feedback_comments': 'Too generic, missing specific contract details and urgency',
            'llm_prompt': None,
            'cluster_data': [{'project_key': 'Contract - Review', 'has_financial_mentions': False}]
        }
    ]

    # Analyze patterns
    analysis = analyze_patterns(mock_feedback_data)

    print("📊 Feedback Analysis Results")
    print("=" * 30)
    print()

    # Overall metrics
    total_feedback = len(mock_feedback_data)
    helpful_count = sum(1 for f in mock_feedback_data if f['feedback_type'] == 'helpful')
    not_helpful_count = total_feedback - helpful_count
    helpful_rate = (helpful_count / total_feedback) * 100 if total_feedback > 0 else 0

    print(f"📈 Overall Metrics:")
    print(f"   Total Feedback: {total_feedback}")
    print(f"   Helpful: {helpful_count} ({helpful_count/total_feedback*100:.1f}%)")
    print(f"   Not Helpful: {not_helpful_count} ({not_helpful_count/total_feedback*100:.1f}%)")
    print(f"   Success Rate: {helpful_rate:.1f}%")
    print()

    # Engine performance
    print(f"🚀 Engine Performance:")
    engine_stats = analyze_engine_performance(mock_feedback_data)
    for engine, stats in engine_stats.items():
        print(f"   {engine}: {stats['helpful']}/{stats['total']} ({stats['rate']:.1f}%)")
    print()

    # Project type analysis
    print(f"🎯 Project Type Analysis:")
    project_patterns = analyze_project_patterns(mock_feedback_data)
    for project_type, stats in project_patterns.items():
        print(f"   {project_type}: {stats['helpful']}/{stats['total']} ({stats['rate']:.1f}%)")
    print()

    # Common issues
    print(f"⚠️ Common Issues in 'Not Helpful' Feedback:")
    issues = extract_common_issues(mock_feedback_data)
    for issue, count in issues.most_common(5):
        print(f"   • {issue} ({count} mentions)")
    print()

    # Recommendations
    print(f"💡 Improvement Recommendations:")
    recommendations = generate_recommendations(analysis)
    for rec in recommendations:
        print(f"   • {rec}")
    print()

    return analysis

def analyze_patterns(feedback_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze patterns in feedback data"""

    # Basic metrics
    total = len(feedback_data)
    helpful = sum(1 for f in feedback_data if f['feedback_type'] == 'helpful')

    # Engine analysis
    engines = defaultdict(lambda: {'total': 0, 'helpful': 0})
    for feedback in feedback_data:
        engine = feedback['engine_used']
        engines[engine]['total'] += 1
        if feedback['feedback_type'] == 'helpful':
            engines[engine]['helpful'] += 1

    # Project type analysis
    project_types = defaultdict(lambda: {'total': 0, 'helpful': 0})
    for feedback in feedback_data:
        for proj_type in feedback.get('project_types', []):
            project_types[proj_type]['total'] += 1
            if feedback['feedback_type'] == 'helpful':
                project_types[proj_type]['helpful'] += 1

    # Content analysis
    financial_success = sum(1 for f in feedback_data
                          if f.get('cluster_data') and any(c.get('has_financial_mentions') for c in f['cluster_data'])
                          and f['feedback_type'] == 'helpful')
    financial_total = sum(1 for f in feedback_data
                         if f.get('cluster_data') and any(c.get('has_financial_mentions') for c in f['cluster_data']))

    return {
        'total_feedback': total,
        'helpful_rate': (helpful / total * 100) if total > 0 else 0,
        'engine_performance': dict(engines),
        'project_performance': dict(project_types),
        'financial_success_rate': (financial_success / financial_total * 100) if financial_total > 0 else 0,
        'avg_markdown_length': sum(len(f['generated_markdown']) for f in feedback_data) / total if total > 0 else 0
    }

def analyze_engine_performance(feedback_data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Analyze performance by engine type"""
    engines = defaultdict(lambda: {'total': 0, 'helpful': 0})

    for feedback in feedback_data:
        engine = feedback['engine_used']
        engines[engine]['total'] += 1
        if feedback['feedback_type'] == 'helpful':
            engines[engine]['helpful'] += 1

    # Calculate rates
    for engine, stats in engines.items():
        stats['rate'] = (stats['helpful'] / stats['total'] * 100) if stats['total'] > 0 else 0

    return dict(engines)

def analyze_project_patterns(feedback_data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Analyze patterns by project type"""
    project_types = defaultdict(lambda: {'total': 0, 'helpful': 0})

    for feedback in feedback_data:
        for proj_type in feedback.get('project_types', []):
            project_types[proj_type]['total'] += 1
            if feedback['feedback_type'] == 'helpful':
                project_types[proj_type]['helpful'] += 1

    # Calculate rates
    for proj_type, stats in project_types.items():
        stats['rate'] = (stats['helpful'] / stats['total'] * 100) if stats['total'] > 0 else 0

    return dict(project_types)

def extract_common_issues(feedback_data: List[Dict[str, Any]]) -> Counter:
    """Extract common issues from feedback comments"""
    issues = Counter()

    not_helpful_feedback = [f for f in feedback_data if f['feedback_type'] == 'not_helpful']

    # Common issue patterns
    issue_patterns = {
        'missing.*information': 'Missing key information',
        'unclear.*action': 'Unclear actions',
        'wrong.*priorit': 'Wrong priorities',
        'generic': 'Too generic/vague',
        'specific.*detail': 'Missing specific details',
        'financial.*amount': 'Missing financial amounts',
        'timeline.*urgency': 'Unclear timeline/urgency',
        'technical.*term': 'Technical jargon unclear',
        'stakeholder': 'Missing stakeholder info'
    }

    for feedback in not_helpful_feedback:
        comments = feedback.get('feedback_comments', '').lower()
        if comments:
            for pattern, issue in issue_patterns.items():
                if re.search(pattern, comments):
                    issues[issue] += 1

    return issues

def generate_recommendations(analysis: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on analysis"""
    recommendations = []

    # Engine-based recommendations
    engine_perf = analysis['engine_performance']
    if 'enhanced_narrative_v2_rule_based' in engine_perf:
        rule_based_rate = engine_perf['enhanced_narrative_v2_rule_based']['rate']
        if rule_based_rate < 70:
            recommendations.append("Improve rule-based fallback synthesis for better baseline quality")

    # Project type recommendations
    project_perf = analysis['project_performance']
    for proj_type, stats in project_perf.items():
        if stats['rate'] < 60 and stats['total'] >= 3:
            recommendations.append(f"Create specialized prompts for {proj_type} projects (current success: {stats['rate']:.1f}%)")

    # Content-based recommendations
    financial_rate = analysis['financial_success_rate']
    if financial_rate < 70:
        recommendations.append("Enhance financial information extraction and presentation in summaries")

    # General recommendations
    if analysis['helpful_rate'] < 75:
        recommendations.append("Review and improve contextual summary prompts - focus on Cause/Impact/Next Step structure")

    if analysis['avg_markdown_length'] < 100:
        recommendations.append("Increase summary detail while maintaining conciseness (current avg length too short)")

    return recommendations

def generate_improved_prompts(analysis: Dict[str, Any]) -> Dict[str, str]:
    """Generate improved prompts based on feedback analysis"""

    improved_prompts = {}

    # Financial project improvements
    project_perf = analysis['project_performance']
    if project_perf.get('financial', {}).get('rate', 100) < 70:
        improved_prompts['financial_contextual'] = """
You are an executive assistant analyzing a financial project cluster. Create a 2-3 sentence contextual summary covering:

1. **Financial Context**: What are the specific financial amounts, budgets, or cost implications?
2. **Business Impact**: How do these financial decisions affect the business?
3. **Decision Required**: What specific financial decision needs to be made?

ALWAYS include specific dollar amounts when mentioned. Be precise about financial implications.

Financial Project Details:
{cluster_text}

Financial Summary (2-3 sentences with specific amounts):
"""

    # Technical project improvements
    if project_perf.get('technical', {}).get('rate', 100) < 70:
        improved_prompts['technical_contextual'] = """
You are an executive assistant analyzing a technical project cluster. Create a 2-3 sentence contextual summary covering:

1. **Technical Context**: What are the specific technical requirements or constraints?
2. **Business Impact**: How do these technical decisions affect business operations?
3. **Timeline**: What are the technical milestones or deadlines?

Avoid jargon unless necessary, and explain technical terms when used.

Technical Project Details:
{cluster_text}

Technical Summary (2-3 sentences, business-focused):
"""

    # General improvements
    if analysis['helpful_rate'] < 75:
        improved_prompts['general_action_derivation'] = """
From the following project cluster, identify explicit actions or delegations that the executive needs to perform.

Format each action as: [Action Type]: [Brief Description] - [Specific Deliverable/Deadline]

Examples:
- Decision: Approve $40K crisis response package - By EOD Friday
- Review: Evaluate vendor contract terms for Allied project - Complete by Tuesday
- Follow-up: Schedule meeting with Chris Laguna regarding timeline delays - This week
- Authorization: Sign off on Q4 budget allocation - Before month-end

Focus on specific, actionable items with concrete deliverables, people, or deadlines.
Include timeframes when possible.

Project Cluster:
{cluster_text}

Action Items (one per line with deadlines):
"""

    return improved_prompts

def main():
    """Main analysis function"""
    try:
        analysis = analyze_feedback_patterns()

        # Generate improved prompts
        improved_prompts = generate_improved_prompts(analysis)

        if improved_prompts:
            print("📝 Suggested Prompt Improvements:")
            print("=" * 35)
            for prompt_type, prompt in improved_prompts.items():
                print(f"\n🔧 {prompt_type.upper()}:")
                print("-" * 20)
                print(prompt.strip())

        print("\n🎯 Next Steps:")
        print("=" * 15)
        print("1. Review the improved prompts above")
        print("2. Test with A/B testing on new briefs")
        print("3. Monitor feedback rates for 1-2 weeks")
        print("4. Implement top-performing prompt variations")
        print("5. Create specialized rule sets for low-performing project types")

        # Save analysis results
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        analysis_file = f'feedback_analysis_{timestamp}.json'

        with open(analysis_file, 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'analysis': analysis,
                'improved_prompts': improved_prompts
            }, f, indent=2, default=str)

        print(f"\n💾 Analysis saved to: {analysis_file}")

        return True

    except Exception as e:
        print(f"❌ Error in feedback analysis: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
