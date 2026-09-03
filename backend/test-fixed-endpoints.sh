#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       🧪 TEST FIXED ENDPOINTS - APPLICATIONS & QUEUES       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Login as CITIZEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CITIZEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}')

CITIZEN_TOKEN=$(echo "$CITIZEN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$CITIZEN_TOKEN" ]; then
  echo -e "${RED}✗ Failed to get citizen token${NC}"
  echo "Response: $CITIZEN_RESPONSE"
  exit 1
else
  echo -e "${GREEN}✓ Citizen token obtained${NC}"
  echo "Token: ${CITIZEN_TOKEN:0:20}..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Test GET /api/applications (PREVIOUSLY FAILED)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

APPS_RESPONSE=$(curl -s "$API_URL/applications" \
  -H "Authorization: Bearer $CITIZEN_TOKEN")

echo "Response:"
echo "$APPS_RESPONSE" | head -c 500
echo ""

if echo "$APPS_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ GET /api/applications - PASS${NC}"
  APP_COUNT=$(echo "$APPS_RESPONSE" | grep -o '"data":\[' | wc -l)
  echo -e "${BLUE}Applications returned successfully${NC}"
elif echo "$APPS_RESPONSE" | grep -q '"success":false'; then
  echo -e "${RED}❌ GET /api/applications - FAIL${NC}"
  echo "Error message:"
  echo "$APPS_RESPONSE" | grep -o '"message":"[^"]*'
else
  echo -e "${YELLOW}⚠️  Unexpected response format${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Test GET /api/queues (PREVIOUSLY FAILED)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

QUEUES_RESPONSE=$(curl -s "$API_URL/queues" \
  -H "Authorization: Bearer $CITIZEN_TOKEN")

echo "Response:"
echo "$QUEUES_RESPONSE" | head -c 500
echo ""

if echo "$QUEUES_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ GET /api/queues - PASS${NC}"
  QUEUE_COUNT=$(echo "$QUEUES_RESPONSE" | grep -o '"data":\[' | wc -l)
  echo -e "${BLUE}Queues returned successfully${NC}"
elif echo "$QUEUES_RESPONSE" | grep -q '"success":false'; then
  echo -e "${RED}❌ GET /api/queues - FAIL${NC}"
  echo "Error message:"
  echo "$QUEUES_RESPONSE" | grep -o '"message":"[^"]*'
else
  echo -e "${YELLOW}⚠️  Unexpected response format${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Test GET /api/institutions (Should still work)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INST_RESPONSE=$(curl -s "$API_URL/institutions")

if echo "$INST_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ GET /api/institutions - PASS${NC}"
  INST_COUNT=$(echo "$INST_RESPONSE" | grep -o '"code":' | wc -l)
  echo -e "${BLUE}$INST_COUNT institutions returned${NC}"
else
  echo -e "${RED}❌ GET /api/institutions - FAIL${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Test GET /api/services (Should still work)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SERVICES_RESPONSE=$(curl -s "$API_URL/services")

if echo "$SERVICES_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ GET /api/services - PASS${NC}"
  SERVICE_COUNT=$(echo "$SERVICES_RESPONSE" | grep -o '"title_en":' | wc -l)
  echo -e "${BLUE}Services returned with title_en (correct schema)${NC}"
elif echo "$SERVICES_RESPONSE" | grep -q '"name":'; then
  echo -e "${RED}❌ Services still using old 'name' column${NC}"
else
  echo -e "${YELLOW}⚠️  Check services response${NC}"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "KEY FIXES TESTED:"
echo "  1. GET /api/applications - services.title_en (was services.name)"
echo "  2. GET /api/applications - application_number (was reference_number)"
echo "  3. GET /api/queues - services.title_en (was services.name)"
echo "  4. GET /api/queues - queue_entries FK names (was queues FK names)"
echo "  5. GET /api/queues - assigned_to column (was employee_id)"
echo ""
echo "Next: Run full test suite with:"
echo "  bash test-all-api.sh"
echo ""
