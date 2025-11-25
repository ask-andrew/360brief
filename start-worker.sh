#!/bin/bash

# Start the Analytics Background Worker
# This script uses npx tsx to run the TypeScript worker directly

echo "🚀 Starting Analytics Background Worker..."
echo ""

npx tsx workers/analytics-worker.ts
