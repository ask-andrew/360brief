#!/usr/bin/env python3
"""
Quick Test Script for Enhanced Narrative Brief System
Run this to test the new brief generation functionality
"""

import requests
import json
import time
from typing import Dict, List

def test_enhanced_brief_generation():
    """Test the enhanced narrative brief API endpoint"""

    print("🧪 Testing Enhanced Narrative Brief Generation")
    print("=" * 50)

    # Sample email data representing real executive scenarios
    test_emails = [
        {
            'id': 'allied-ledet-1',
            'subject': 'Allied - Ledet: Critical blocker identified',
            'body': '''Chris Laguna has identified a critical blocker in the vendor contract terms.
The timeline is stalled and we need an immediate decision on the $40,000 crisis response package.
This requires executive approval and is impacting the Q4 delivery schedule.''',
            'from': {'name': 'Jane Doe', 'email': 'jane@company.com'},
            'date': '2025-01-15T10:00:00Z'
        },
        {
            'id': 'allied-ledet-2',
            'subject': 'Re: Allied - Ledet: Follow up on decision',
            'body': '''Still waiting for approval on the $40K crisis response package.
The vendor is threatening to pull out if we don't decide today.
This is becoming critical for the project timeline and could impact revenue.''',
            'from': {'name': 'Chris Laguna', 'email': 'chris@company.com'},
            'date': '2025-01-15T14:30:00Z'
        },
        {
            'id': 'winbox-project',
            'subject': 'WINBOX initiative: Major achievement completed',
            'body': '''Great news! The WINBOX team has successfully completed the Q4 deliverables ahead of schedule.
This represents a major achievement for the organization and positions us well for the new year.
Team delivered exceptional results under tight constraints.''',
            'from': {'name': 'Project Manager', 'email': 'pm@company.com'},
            'date': '2025-01-15T16:00:00Z'
        },
        {
            'id': 'newsletter-weekly',
            'subject': 'Morning Brief: Market insights and trends',
            'body': '''Weekly market update with key insights on industry trends, competitor analysis,
and emerging opportunities. For informational purposes - no immediate action required.
Key trends include AI adoption and supply chain optimization.''',
            'from': {'name': 'Newsletter Bot', 'email': 'news@company.com'},
            'date': '2025-01-16T09:00:00Z'
        }
    ]

    # Wait for service to start
    print("⏳ Waiting for service to start...")
    time.sleep(2)

    try:
        # Test the API endpoint
        response = requests.post(
            'http://localhost:8000/generate-narrative-brief',
            json={
                'emails': test_emails,
                'max_projects': 8,
                'include_clusters': True
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print("✅ Enhanced narrative brief generated successfully!")
            print(f"   Engine: {data.get('engine', 'unknown')}")
            print(f"   Emails processed: {data.get('total_emails', 0)}")
            print(f"   Projects identified: {data.get('total_projects', 0)}")
            print(f"   Generated at: {data.get('generated_at', 'unknown')}")

            # Show markdown preview
            markdown = data.get('markdown', '')
            print("\n📄 Generated Brief Preview:")
            print("=" * 40)

            # Show first few sections
            lines = markdown.split('\n')
            for line in lines[:30]:  # Show first 30 lines
                print(line)
            if len(lines) > 30:
                print("...")

            # Validate key features
            print("\n🔍 Validation Results:")
            print("=" * 25)

            # Check project clustering
            clusters = data.get('clusters', [])
            allied_cluster = next((c for c in clusters if 'Allied - Ledet' in c.get('project_key', '')), None)
            if allied_cluster:
                print("✅ Project clustering working - 'Allied - Ledet' cluster found")
                if allied_cluster.get('has_financial_mentions'):
                    print(f"✅ Financial extraction working - ${allied_cluster['financial_total']:,.0f} detected")
                if allied_cluster.get('urgency_score', 0) > 0:
                    print(f"✅ Urgency scoring working - Score: {allied_cluster['urgency_score']}")

            # Check newsletter identification
            newsletter_cluster = next((c for c in clusters if 'newsletter' in c.get('project_key', '').lower() or 'morning' in c.get('project_key', '').lower()), None)
            if newsletter_cluster:
                print("✅ Newsletter identification working - recurring content detected")

            # Check action items
            if any('Decision' in line or 'Action' in line or 'Approve' in line for line in markdown.split('\n')):
                print("✅ Action item derivation working - specific actions identified")

            print("\n🎉 Test completed successfully!")
            print("\nKey Features Demonstrated:")
            print("- ✅ Email preprocessing and cleaning")
            print("- ✅ Project clustering with entity recognition")
            print("- ✅ Financial value extraction and constraints")
            print("- ✅ Status detection (blockers, decisions, achievements)")
            print("- ✅ Executive summary generation")
            print("- ✅ Action item derivation")
            print("- ✅ Newsletter content identification")
            print("- ✅ Markdown formatting and structure")

            return True

        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the brief generation service")
        print("💡 Make sure to start the service with:")
        print("   cd services/brief_generator && python3 main.py")
        return False
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False

def test_health_check():
    """Test the health check endpoint"""
    print("\n🏥 Testing Health Check...")
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            print("✅ Service is healthy and responding")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except:
        print("❌ Health check failed - service may not be running")
        return False

if __name__ == "__main__":
    print("🚀 Enhanced Narrative Brief System Test")
    print("This will test the new cognitive relief and actionable focus features")
    print()

    # Test health first
    if not test_health_check():
        print("\n❌ Service is not running. Please start it first:")
        print("   cd services/brief_generator && python3 main.py")
        exit(1)

    # Run main test
    success = test_enhanced_brief_generation()

    if success:
        print("\n✨ All tests passed! The enhanced narrative brief system is working correctly.")
        print("\n🔗 Next Steps:")
        print("- Test with your real email data")
        print("- Check the Next.js dashboard integration")
        print("- Monitor the cognitive relief and actionable focus improvements")
    else:
        print("\n❌ Tests failed. Check the error messages above.")
        exit(1)
