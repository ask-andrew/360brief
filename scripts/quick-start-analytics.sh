#!/bin/bash

# 360Brief Analytics System - Quick Start Script
# This script guides you through the recovery process

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     360Brief Analytics System - Quick Start               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check current status
echo "📊 Step 1: Checking system status..."
echo ""
npx tsx scripts/diagnose-analytics.ts
echo ""

# Ask user if they want to continue
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                 Next Steps Required                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "To complete the recovery, you need to:"
echo ""
echo "1️⃣  Connect Gmail Account"
echo "   → Visit: http://localhost:3000/api/auth/gmail/authorize"
echo "   → Sign in and grant permissions"
echo ""
echo "2️⃣  Start the Analytics Worker"
echo "   → Open a NEW terminal window"
echo "   → Run: npm run worker:dev"
echo "   → Keep it running"
echo ""
echo "3️⃣  Visit Analytics Page"
echo "   → Go to: http://localhost:3000/analytics"
echo "   → Watch the magic happen! ✨"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              Ready to start?                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

read -p "Press ENTER to open Gmail authorization in your browser..."

# Open browser to Gmail auth
echo "🌐 Opening Gmail authorization..."
if command -v open &> /dev/null; then
    # macOS
    open "http://localhost:3000/api/auth/gmail/authorize"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:3000/api/auth/gmail/authorize"
else
    echo "Please manually visit: http://localhost:3000/api/auth/gmail/authorize"
fi

echo ""
echo "✅ Browser opened!"
echo ""
echo "After completing Gmail authorization:"
echo "1. Open a NEW terminal"
echo "2. Run: npm run worker:dev"
echo "3. Visit: http://localhost:3000/analytics"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - ANALYTICS_RECOVERY_SUMMARY.md (Quick guide)"
echo "   - ANALYTICS_RECOVERY_PLAN.md (Detailed guide)"
echo ""
