#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🔍 VERIFY BACKEND FIXES - APPLICATIONS & QUEUES    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Verify Code Changes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${BLUE}Checking applicationService.js...${NC}"
if grep -q "assigned_to," src/services/applicationService.js; then
    echo -e "${GREEN}✓ assigned_to found (correct)${NC}"
else
    echo -e "${RED}✗ assigned_to NOT found (should be 'assigned_to' not 'assigned_employee_id')${NC}"
fi

if grep -q "title_en" src/services/applicationService.js; then
    echo -e "${GREEN}✓ title_en found (correct)${NC}"
else
    echo -e "${RED}✗ title_en NOT found (should be 'title_en' not 'name')${NC}"
fi

if grep -q "application_number" src/services/applicationService.js; then
    echo -e "${GREEN}✓ application_number found (correct)${NC}"
else
    echo -e "${RED}✗ application_number NOT found${NC}"
fi

echo ""
echo -e "${BLUE}Checking queueService.js...${NC}"
if grep -q "queue_entries" src/services/queueService.js; then
    echo -e "${GREEN}✓ queue_entries found (correct table name)${NC}"
else
    echo -e "${RED}✗ queue_entries NOT found (should be 'queue_entries' not 'queues')${NC}"
fi

if grep -q "started_at" src/services/queueService.js; then
    echo -e "${GREEN}✓ started_at found (correct)${NC}"
else
    echo -e "${RED}✗ started_at NOT found (should be 'started_at' not 'called_at')${NC}"
fi

if grep -q "queue_entries_citizen_id_fkey" src/services/queueService.js; then
    echo -e "${GREEN}✓ queue_entries_citizen_id_fkey found (correct FK name)${NC}"
else
    echo -e "${RED}✗ queue_entries_citizen_id_fkey NOT found${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Check if Server is Running"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH=$(curl -s --max-time 5 "http://localhost:5000/api/health" 2>&1)
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✓ Server is running on port 5000${NC}"
else
    echo -e "${RED}✗ Server is NOT running!${NC}"
    echo -e "${YELLOW}You must start the server first:${NC}"
    echo "  npm start"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Get Authentication Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Failed to get authentication token${NC}"
    echo "Login response: $LOGIN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ Token obtained: ${TOKEN:0:30}...${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Test GET /api/applications"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

APPS_RESPONSE=$(curl -s "http://localhost:5000/api/applications" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: ${APPS_RESPONSE:0:200}"
echo ""

if echo "$APPS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ GET /api/applications - PASS${NC}"
else
    echo -e "${RED}❌ GET /api/applications - FAIL${NC}"
    echo "Full response:"
    echo "$APPS_RESPONSE"
    echo ""
    echo -e "${YELLOW}Check server logs for detailed error${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Test GET /api/queues"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

QUEUES_RESPONSE=$(curl -s "http://localhost:5000/api/queues" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: ${QUEUES_RESPONSE:0:200}"
echo ""

if echo "$QUEUES_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ GET /api/queues - PASS${NC}"
else
    echo -e "${RED}❌ GET /api/queues - FAIL${NC}"
    echo "Full response:"
    echo "$QUEUES_RESPONSE"
    echo ""
    echo -e "${YELLOW}⚠️  CHECK THE SERVER TERMINAL FOR DETAILED ERROR LOGS${NC}"
    echo -e "${YELLOW}The server should show:${NC}"
    echo "  === GET QUEUES ERROR ==="
    echo "  Supabase Error Code: ..."
    echo "  Supabase Error Message: ..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SUMMARY                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Code Fixes:"
echo "  - applicationService.js: assigned_to, application_number, title_en"
echo "  - queueService.js: queue_entries, started_at, correct FK names"
echo ""
echo "Next Steps:"
echo "  1. If both tests PASS → All fixed! ✅"
echo "  2. If queues FAIL → Check server terminal for error details"
echo "  3. Share the '=== GET QUEUES ERROR ===' section from server logs"
echo ""
