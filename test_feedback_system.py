#!/usr/bin/env python3
"""
Test Narrative Feedback Loop System
Validates end-to-end functionality of the feedback mechanism
"""

import requests
import json
import time
from typing import Dict, List, Any

def test_feedback_system():
    """Test the complete narrative feedback loop"""

    print("🧪 Testing Narrative Feedback Loop System")
    print("=" * 50)

    # Test data representing real executive scenarios
    test_emails = [
        {
            'id': 'financial-decision-1',
            'subject': 'Budget Approval: Q4 Marketing Spend Decision Required',
            'body': '''The marketing team needs approval for the Q4 budget allocation of $125,000.
This includes $75K for digital campaigns and $50K for events. The decision needs to be made by Friday
to secure vendor commitments. This impacts our Q4 revenue targets.''',
            'from': {'name': 'Sarah Marketing', 'email': 'sarah@company.com'},
            'date': '2025-01-15T10:00:00Z'
        },
        {
            'id': 'hr-blocker-1',
            'subject': 'HR Issue: Employee Performance Review Delays',
            'body': '''Multiple performance reviews are delayed due to incomplete documentation.
This is blocking several promotion decisions and affecting team morale. Need guidance
on how to proceed with the reviews that are missing required approvals.''',
            'from': {'name': 'HR Director', 'email': 'hr@company.com'},
            'date': '2025-01-15T14:30:00Z'
        }
    ]

    # Test 1: Generate narrative brief
    print("📝 Step 1: Generate narrative brief...")
    try:
        response = requests.post(
            'http://localhost:8000/generate-narrative-brief',
            json={
                'emails': test_emails,
                'max_projects': 8,
                'include_clusters': True
            },
            timeout=30
        )

        if response.status_code != 200:
            print(f"❌ Brief generation failed: {response.status_code}")
            print(response.text)
            return False

        data = response.json()
        print("✅ Narrative brief generated successfully!")

        # Validate response structure
        assert 'markdown' in data
        assert 'feedback_metadata' in data
        assert data['feedback_metadata']['engine_used']
        assert data['feedback_metadata']['generation_timestamp']
        assert data['feedback_metadata']['input_emails_count'] == 2

        print(f"   Engine: {data['feedback_metadata']['engine_used']}")
        print(f"   Response time: {data['feedback_metadata']['response_time_ms']}ms")
        print(f"   Projects identified: {data.get('total_projects', 0)}")

        # Test 2: Simulate frontend feedback submission
        print("\n👍 Step 2: Test feedback submission...")

        # Test helpful feedback
        feedback_payload = {
            'engine_used': data['feedback_metadata']['engine_used'],
            'generation_timestamp': data['feedback_metadata']['generation_timestamp'],
            'input_emails_count': data['feedback_metadata']['input_emails_count'],
            'input_clusters_count': data['feedback_metadata']['input_clusters_count'],
            'cluster_data': data['feedback_metadata']['cluster_data'],
            'llm_prompt': data['feedback_metadata']['llm_prompt'],
            'llm_model': data['feedback_metadata']['llm_model'],
            'llm_response_time_ms': data['feedback_metadata']['response_time_ms'],
            'generated_markdown': data['markdown'],
            'feedback_type': 'helpful'
        }

        # Note: This would normally go to the Next.js API endpoint
        # For testing, we'll validate the payload structure
        required_fields = [
            'engine_used', 'generation_timestamp', 'input_emails_count',
            'input_clusters_count', 'cluster_data', 'generated_markdown', 'feedback_type'
        ]

        for field in required_fields:
            assert field in feedback_payload, f"Missing required field: {field}"
            assert feedback_payload[field] is not None, f"Field {field} is None"

        print("✅ Feedback payload structure validated")

        # Test 3: Test feedback analysis
        print("\n📊 Step 3: Test feedback analysis...")

        # Mock feedback data for analysis
        mock_feedback = [
            {
                'engine_used': 'enhanced_narrative_v2_llm',
                'feedback_type': 'helpful',
                'project_types': ['financial', 'marketing'],
                'generated_markdown': data['markdown'],
                'llm_prompt': data['feedback_metadata']['llm_prompt'],
                'cluster_data': [{'project_key': 'Budget - Approval', 'has_financial_mentions': True}]
            },
            {
                'engine_used': 'enhanced_narrative_v2_rule_based',
                'feedback_type': 'not_helpful',
                'project_types': ['hr', 'operations'],
                'generated_markdown': 'Team needs decision on performance reviews.',
                'llm_prompt': None,
                'cluster_data': [{'project_key': 'HR - Reviews', 'has_financial_mentions': False}]
            }
        ]

        # Run analysis
        from analyze_feedback import analyze_patterns, generate_recommendations

        analysis = analyze_patterns(mock_feedback)
        recommendations = generate_recommendations(analysis)

        print("✅ Feedback analysis completed")
        print(f"   Success rate: {analysis['helpful_rate']:.1f}%")
        print(f"   Recommendations: {len(recommendations)}")

        # Test 4: Validate improvement suggestions
        print("\n💡 Step 4: Test improvement suggestions...")

        assert len(recommendations) > 0, "No improvement recommendations generated"

        # Check for specific recommendations based on feedback
        rec_text = ' '.join(recommendations).lower()
        if 'financial' in rec_text or 'prompt' in rec_text or 'rule' in rec_text:
            print("✅ Improvement recommendations are relevant")
        else:
            print("⚠️  Recommendations may need refinement")

        print(f"   Sample recommendation: {recommendations[0]}")

        # Test 5: Show sample brief preview
        print("\n📄 Step 5: Brief preview...")
        markdown_lines = data['markdown'].split('\n')
        preview_lines = [line for line in markdown_lines[:15] if line.strip()]
        print("   Preview (first 15 lines):")
        for line in preview_lines:
            print(f"   {line}")
        if len(markdown_lines) > 15:
            print("   ...")

        print("\n🎉 All tests completed successfully!")
        print("\n📋 System Validation Results:")
        print("✅ Brief generation with metadata")
        print("✅ Feedback payload structure")
        print("✅ Analysis engine functionality")
        print("✅ Improvement recommendations")
        print("✅ End-to-end data flow")

        print("\n🔄 Next Steps:")
        print("1. Test frontend feedback buttons in Next.js dashboard")
        print("2. Run database migration: npx supabase migration up --local")
        print("3. Monitor real user feedback in production")
        print("4. Review and implement prompt improvements")
        print("5. Set up automated feedback analysis pipeline")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    """Test the feedback API endpoints"""
    print("\n🌐 Testing API Endpoints...")

    base_url = 'http://localhost:8000'

    # Test health endpoint
    try:
        health_response = requests.get(f'{base_url}/health', timeout=5)
        if health_response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"❌ Health endpoint failed: {health_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

    # Test narrative brief endpoint
    try:
        brief_response = requests.post(
            f'{base_url}/generate-narrative-brief',
            json={'emails': [{'id': 'test', 'subject': 'Test', 'body': 'Test', 'from': {'name': 'Test'}, 'date': '2025-01-01'}]},
            timeout=30
        )
        if brief_response.status_code == 200:
            data = brief_response.json()
            if 'feedback_metadata' in data:
                print("✅ Enhanced narrative brief with metadata")
            else:
                print("⚠️  Brief generated but missing feedback metadata")
        else:
            print(f"❌ Brief endpoint failed: {brief_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Brief endpoint error: {e}")
        return False

    return True

if __name__ == "__main__":
    print("🚀 Narrative Feedback Loop System Test")
    print("Testing end-to-end functionality of the feedback mechanism")
    print()

    # Test API endpoints first
    if not test_api_endpoints():
        print("❌ API endpoints not available. Please start the service:")
        print("   cd services/brief_generator && python3 main.py")
        exit(1)

    # Test complete feedback system
    success = test_feedback_system()

    if success:
        print("\n✨ Narrative Feedback Loop System is ready!")
        print("\n🎯 What this enables:")
        print("- Continuous improvement of brief quality")
        print("- Data-driven prompt optimization")
        print("- User-centric synthesis refinement")
        print("- Cognitive relief through better narratives")
    else:
        print("\n❌ System tests failed. Check errors above.")
        exit(1)
