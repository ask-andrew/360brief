#!/usr/bin/env python3
"""
Test script for enhanced email processing
"""
import sys
import os
import asyncio

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from data_processing.enhanced_email_processor import IntegratedEmailProcessor, ProcessingMode


async def test_enhanced_processing():
    """Test the enhanced email processing functionality."""

    print("🧪 Testing Enhanced Email Processing")
    print("=" * 50)

    # Sample email for testing
    sample_email = {
        'Subject': 'Q4 Budget Review - Board Approval Needed',
        'From': 'cfo@company.com',
        'Body': '''Hi team,

We need to finalize the Q4 budget allocation for the marketing department.
The marketing team is requesting an additional $150K for the new campaign launch.

Please review the attached proposal and provide your approval by Friday EOD.
This decision is critical for meeting our Q4 revenue targets of $2.5M.

Let me know if you have any questions or need additional information.

Best regards,
Sarah Chen
CFO'''
    }

    print(f"📧 Test Email:")
    print(f"   Subject: {sample_email['Subject']}")
    print(f"   From: {sample_email['From']}")
    print(f"   Body: {len(sample_email['Body'])} characters")
    print()

    # Test FREE Mode
    print("🆓 Testing FREE Mode Processing")
    print("-" * 30)

    free_processor = IntegratedEmailProcessor(ProcessingMode.FREE)
    free_result = await free_processor.process_email_enhanced(
        sample_email['Subject'],
        sample_email['Body'],
        sample_email['From']
    )

    if free_result:
        print(f"✅ Summary: {free_result.summary}")
        print(f"✅ Key Points ({len(free_result.key_points)}):")
        for i, point in enumerate(free_result.key_points, 1):
            print(f"   {i}. {point}")
        print(f"✅ Action Items ({len(free_result.action_items)}):")
        for i, action in enumerate(free_result.action_items, 1):
            print(f"   {i}. {action}")
        print(f"✅ Priority Score: {free_result.priority_score:.2f}")
        print(f"✅ Processing Mode: {free_result.processing_mode.value}")
    else:
        print("❌ Email was filtered out")

    print()

    # Test AI Mode (will fallback to FREE if service unavailable)
    print("🤖 Testing AI Mode Processing")
    print("-" * 30)

    ai_processor = IntegratedEmailProcessor(ProcessingMode.AI)
    ai_result = await ai_processor.process_email_enhanced(
        sample_email['Subject'],
        sample_email['Body'],
        sample_email['From']
    )

    if ai_result:
        print(f"✅ Summary: {ai_result.summary}")
        print(f"✅ Key Points ({len(ai_result.key_points)}):")
        for i, point in enumerate(ai_result.key_points, 1):
            print(f"   {i}. {point}")
        print(f"✅ Action Items ({len(ai_result.action_items)}):")
        for i, action in enumerate(ai_result.action_items, 1):
            print(f"   {i}. {action}")
        print(f"✅ Priority Score: {ai_result.priority_score:.2f}")
        print(f"✅ Processing Mode: {ai_result.processing_mode.value}")
    else:
        print("❌ Email was filtered out")

    print()

    # Test marketing email filtering
    print("🚫 Testing Marketing Email Filtering")
    print("-" * 35)

    marketing_email = {
        'Subject': 'Special Offer: 50% Off All Products - Limited Time!',
        'From': 'noreply@marketing.com',
        'Body': '''Don't miss out on this amazing deal!

Click here to save 50% on all products. This offer expires soon!

Unsubscribe from future emails by clicking here.'''
    }

    marketing_result = await free_processor.process_email_enhanced(
        marketing_email['Subject'],
        marketing_email['Body'],
        marketing_email['From']
    )

    if marketing_result is None:
        print("✅ Marketing email correctly filtered out")
    else:
        print("❌ Marketing email was not filtered")

    print()
    print("🎉 Enhanced Email Processing Test Complete!")


if __name__ == "__main__":
    asyncio.run(test_enhanced_processing())