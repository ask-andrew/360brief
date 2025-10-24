#!/bin/bash
# Quick test script for the enhanced narrative brief system

echo "🧪 Enhanced Narrative Brief System Test"
echo "======================================"

# Test 1: Check if service is running
echo "📡 Testing service health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Service is running"
else
    echo "❌ Service is not running"
    echo "💡 Start it with: cd services/brief_generator && python3 main.py"
    exit 1
fi

# Test 2: Test basic narrative generation
echo ""
echo "🧠 Testing enhanced narrative generation..."

RESPONSE=$(curl -s -X POST http://localhost:8000/generate-narrative-brief \
    -H "Content-Type: application/json" \
    -d '{
      "emails": [
        {
          "id": "allied-ledet-1",
          "subject": "Allied - Ledet: Critical blocker identified",
          "body": "Chris Laguna found a blocker with vendor terms. Timeline stalled. Need decision on $40,000 crisis response package.",
          "from": {"name": "Jane Doe", "email": "jane@company.com"},
          "date": "2025-01-15T10:00:00Z"
        },
        {
          "id": "allied-ledet-2",
          "subject": "Allied - Ledet: Follow up on decision",
          "body": "Still waiting for approval on $40K package. This is urgent.",
          "from": {"name": "Chris Laguna", "email": "chris@company.com"},
          "date": "2025-01-15T14:00:00Z"
        },
        {
          "id": "newsletter-1",
          "subject": "Newsletter: Weekly insights",
          "body": "Market trends and updates. No action required.",
          "from": {"name": "Newsletter Bot"},
          "date": "2025-01-16T09:00:00Z"
        }
      ],
      "max_projects": 8,
      "include_clusters": true
    }')

if echo "$RESPONSE" | grep -q "markdown"; then
    echo "✅ Enhanced narrative brief generated successfully!"
    echo ""
    echo "📄 Brief Preview:"
    echo "=================="
    echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
markdown = data.get('markdown', '')
lines = markdown.split('\n')[:20]
for line in lines:
    print(line)
if len(markdown.split('\n')) > 20:
    print('...')
"
    echo ""
    echo "🔍 Key Features Detected:"
    if echo "$RESPONSE" | grep -q "Allied - Ledet"; then
        echo "✅ Project clustering working"
    fi
    if echo "$RESPONSE" | grep -q "\$40"; then
        echo "✅ Financial extraction working"
    fi
    if echo "$RESPONSE" | grep -q "Decision\|Action\|Approve"; then
        echo "✅ Action derivation working"
    fi
    if echo "$RESPONSE" | grep -q "newsletter\|Newsletter"; then
        echo "✅ Newsletter identification working"
    fi

    ENGINE=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('engine', 'unknown'))")
    PROJECTS=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total_projects', 0))")
    EMAILS=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total_emails', 0))")

    echo ""
    echo "📊 Results:"
    echo "   Engine: $ENGINE"
    echo "   Projects identified: $PROJECTS"
    echo "   Emails processed: $EMAILS"

else
    echo "❌ Brief generation failed:"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "🎉 Test completed successfully!"
echo ""
echo "🔗 Next Steps:"
echo "1. Test with your real email data"
echo "2. Check the Next.js dashboard integration"
echo "3. Monitor the cognitive relief improvements"
echo ""
echo "💡 To test via Next.js frontend:"
echo "   npm run dev  # Start Next.js"
echo "   Visit http://localhost:3000 and test through the UI"
