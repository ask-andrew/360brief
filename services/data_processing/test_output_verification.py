"""Test script to verify the JSON output from data processing services."""
import asyncio
import json
from datetime import datetime, timedelta
from pydantic import ValidationError

# Import the orchestrator and models
from src.data_processing.orchestrator import ProcessingOrchestrator
from src.data_processing.models import ProcessedMessage, MessageType

# Configuration for testing
TEST_CONFIG = {
    "email": {
        "user_email": "test@example.com",
        "days_to_fetch": 7,
        "folder": "INBOX"
    },
    "slack": {
        "days_to_fetch": 7
    }
}

# Expected fields for validation
REQUIRED_FIELDS = {
    "message_id": str,
    "message_type": MessageType,
    "summary": str,
    "key_points": list,
    "entities": dict,
    "action_items": list,
    "sentiment": (float, type(None)),
    "priority": int,
    "related_messages": list,
    "processed_at": str
}

class OutputValidator:
    """Class to validate the output of the data processing pipeline."""
    
    @staticmethod
    def validate_message(message: dict) -> bool:
        """Validate a single message against the expected schema."""
        try:
            # Check for required fields
            for field, field_type in REQUIRED_FIELDS.items():
                if field not in message:
                    print(f"❌ Missing required field: {field}")
                    return False
                
                # Check field type
                if not isinstance(message[field], field_type) and \
                   not (isinstance(field_type, tuple) and any(isinstance(message[field], t) for t in field_type)):
                    print(f"❌ Invalid type for field '{field}': "
                          f"expected {field_type}, got {type(message[field])}")
                    return False
            
            # Validate message type enum
            if message["message_type"] not in [t.value for t in MessageType]:
                print(f"❌ Invalid message_type: {message['message_type']}")
                return False
                
            return True
            
        except Exception as e:
            print(f"❌ Validation error: {str(e)}")
            return False

    @classmethod
    def validate_output(cls, output: list) -> bool:
        """Validate the entire output list."""
        if not isinstance(output, list):
            print("❌ Output is not a list")
            return False
            
        if not output:
            print("⚠️  No messages to validate")
            return True
            
        results = [cls.validate_message(msg) for msg in output]
        valid_count = sum(1 for r in results if r)
        total = len(results)
        
        print(f"\nValidation Results:")
        print(f"✅ {valid_count}/{total} messages are valid")
        if valid_count < total:
            print(f"❌ {total - valid_count} messages failed validation")
        
        return all(results)

async def test_data_processing():
    """Test the data processing pipeline and validate output."""
    print("🚀 Starting data processing test...\n")
    
    # Initialize the orchestrator
    orchestrator = ProcessingOrchestrator(TEST_CONFIG)
    
    try:
        # Calculate date range (last 7 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        print(f"📅 Processing data from {start_date.date()} to {end_date.date()}")
        
        # Process emails
        print("\n📧 Processing emails...")
        email_results = await orchestrator.fetch_and_process_emails(
            user_email=TEST_CONFIG["email"]["user_email"],
            start_date=start_date,
            end_date=end_date,
            folder=TEST_CONFIG["email"]["folder"]
        )
        
        # Convert to dict for JSON serialization
        output = [msg.dict() for msg in email_results]
        
        # Print pretty JSON output
        print("\n📄 Processed Output:")
        print(json.dumps(output, indent=2, default=str))
        
        # Validate the output
        print("\n🔍 Validating output...")
        is_valid = OutputValidator.validate_output(output)
        
        if is_valid:
            print("\n🎉 All messages are valid!")
        else:
            print("\n❌ Some messages failed validation")
        
        return output
        
    except Exception as e:
        print(f"\n❌ Error during processing: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(test_data_processing())
