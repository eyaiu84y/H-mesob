#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🔍 DIAGNOSE QUEUE ERROR                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Test the endpoint
echo "Testing GET /api/queues..."
echo ""

# Login first
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

# Call the queue endpoint
RESPONSE=$(curl -s "http://localhost:5000/api/queues" \
  -H "Authorization: Bearer $TOKEN")

echo "API Response:"
echo "$RESPONSE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for error log file
ERROR_LOG="src/services/queue-error-log.json"

if [ -f "$ERROR_LOG" ]; then
    echo "✅ Error log file found!"
    echo ""
    echo "ERROR DETAILS:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat "$ERROR_LOG"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Error log file not found at: $ERROR_LOG"
    echo ""
    echo "This means either:"
    echo "  1. The server wasn't restarted after code changes"
    echo "  2. The error wasn't triggered"
    echo "  3. File write failed"
    echo ""
    echo "Please restart the server with: npm start"
fi

echo ""
echo "Next: Share the error details above"
