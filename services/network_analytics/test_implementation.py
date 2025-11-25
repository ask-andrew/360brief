#!/usr/bin/env python3
"""
Test script for Network Analytics implementation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from clustering import analyze_collaboration_network, DynamicProjectClustering
from visualization import generate_visualization_data, NetworkVisualizer
from recommendations import generate_collaboration_recommendation

def test_clustering():
    """Test the clustering algorithm"""
    print("🧪 Testing Dynamic Project Clustering...")

    # Sample data
    email_data = [
        {
            'id': 'email_1',
            'from_email': 'alice@company.com',
            'to_recipients': ['bob@company.com', 'carol@company.com'],
            'subject': 'Q4 Product Launch Planning',
            'body': 'Let\'s discuss the timeline for the Q4 product launch. We need to coordinate with marketing and development teams.',
            'timestamp': None
        },
        {
            'id': 'email_2',
            'from_email': 'bob@company.com',
            'to_recipients': ['alice@company.com', 'david@company.com'],
            'subject': 'Re: Q4 Product Launch Planning',
            'body': 'Good points Alice. David, can you provide the development timeline? We should also involve the design team.',
            'timestamp': None
        },
        {
            'id': 'email_3',
            'from_email': 'carol@company.com',
            'to_recipients': ['eve@external.com'],
            'subject': 'Website Redesign Project',
            'body': 'Starting work on the new website redesign. Eve, your input on UX would be valuable.',
            'timestamp': None
        }
    ]

    calendar_data = [
        {
            'id': 'cal_1',
            'organizer_email': 'alice@company.com',
            'attendees': [
                {'email': 'bob@company.com', 'name': 'Bob'},
                {'email': 'carol@company.com', 'name': 'Carol'},
                {'email': 'david@company.com', 'name': 'David'}
            ],
            'summary': 'Product Launch Kickoff Meeting',
            'description': 'Initial planning meeting for Q4 product launch',
            'start_time': '2024-10-01T10:00:00Z',
            'end_time': '2024-10-01T11:00:00Z'
        }
    ]

    try:
        result = analyze_collaboration_network(email_data, calendar_data, None)
        print(f"✅ Clustering successful: {result['total_projects']} projects identified")
        print(f"   - Active projects: {result['active_projects']}")
        print(f"   - Total participants: {result['network_metrics']['total_unique_participants']}")
        return True
    except Exception as e:
        print(f"❌ Clustering failed: {e}")
        return False

def test_visualization():
    """Test visualization generation"""
    print("\n🖼️ Testing Visualization Generation...")

    # Mock cluster data
    clusters = [
        {
            'id': 1,
            'name': 'Q4 Product Launch',
            'interaction_count': 25,
            'participant_count': 4,
            'start_date': '2024-10-01T00:00:00',
            'end_date': '2024-12-31T23:59:59',
            'is_active': True,
            'top_keywords': ['product', 'launch', 'timeline', 'development'],
            'participants': ['alice@company.com', 'bob@company.com', 'carol@company.com', 'david@company.com']
        },
        {
            'id': 2,
            'name': 'Website Redesign',
            'interaction_count': 15,
            'participant_count': 3,
            'start_date': '2024-11-01T00:00:00',
            'end_date': '2025-01-15T23:59:59',
            'is_active': True,
            'top_keywords': ['design', 'website', 'ux', 'ui'],
            'participants': ['carol@company.com', 'eve@external.com', 'frank@design.com']
        }
    ]

    try:
        visualizations = generate_visualization_data(clusters, 'test@company.com')
        print("✅ Visualization generation successful")
        print(f"   - Chord diagram data generated: {'chord_diagram' in visualizations}")
        print(f"   - Force-directed graph data generated: {'force_directed' in visualizations}")
        return True
    except Exception as e:
        print(f"❌ Visualization generation failed: {e}")
        return False

def test_recommendations():
    """Test recommendation generation"""
    print("\n🤖 Testing LLM Recommendations...")

    # Mock metrics and clusters
    metrics = {
        'total_unique_participants': 8,
        'average_project_participation': 2.5,
        'max_project_participation': 4,
        'project_distribution': {1: 2, 2: 3, 3: 1}
    }

    clusters = [
        {
            'id': 1,
            'name': 'Q4 Product Launch',
            'is_active': True,
            'top_keywords': ['product', 'launch', 'development']
        }
    ]

    try:
        recommendation = generate_collaboration_recommendation(
            metrics, clusters, 'test@company.com', 'Last 90 Days'
        )
        print("✅ Recommendation generation successful"        print(f"   - Recommendation: {recommendation['recommendation'][:100]}...")
        print(f"   - Confidence: {recommendation['confidence']}")
        print(f"   - Model used: {recommendation['model_used']}")
        return True
    except Exception as e:
        print(f"❌ Recommendation generation failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Network Analytics Tests\n")

    tests = [
        test_clustering,
        test_visualization,
        test_recommendations
    ]

    results = []
    for test in tests:
        results.append(test())

    print(f"\n📊 Test Results: {sum(results)}/{len(results)} passed")

    if all(results):
        print("🎉 All tests passed! Network Analytics implementation is ready.")
        return 0
    else:
        print("⚠️ Some tests failed. Check implementation.")
        return 1

if __name__ == "__main__":
    exit(main())
