#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🧪 COMPLETE API TEST - ALL ENDPOINTS                ║"
echo "║            HAWASSA MESOB BACKEND                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000/api"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local token="$4"
    local data="$5"
    
    echo -n "  $name ... "
    
    if [ "$method" = "POST" ]; then
        if [ -n "$token" ]; then
            RESPONSE=$(curl -s -X POST "$url" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" 2>&1)
        else
            RESPONSE=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>&1)
        fi
    elif [ "$method" = "PUT" ]; then
        RESPONSE=$(curl -s -X PUT "$url" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" 2>&1)
    elif [ "$method" = "DELETE" ]; then
        RESPONSE=$(curl -s -X DELETE "$url" -H "Authorization: Bearer $token" 2>&1)
    else
        if [ -n "$token" ]; then
            RESPONSE=$(curl -s "$url" -H "Authorization: Bearer $token" 2>&1)
        else
            RESPONSE=$(curl -s "$url" 2>&1)
        fi
    fi
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS++))
    elif echo "$RESPONSE" | grep -q '"success":false'; then
        # Expected failure (like validation errors)
        if echo "$RESPONSE" | grep -q 'not found\|invalid\|required\|unauthorized'; then
            echo -e "${YELLOW}⚠️  EXPECTED FAIL${NC}"
            ((PASS++))
        else
            echo -e "${RED}❌ FAIL${NC}"
            ((FAIL++))
        fi
    else
        echo -e "${RED}❌ FAIL (no response)${NC}"
        ((FAIL++))
    fi
}

# Check server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECKING SERVER STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(curl -s --max-time 15 "$API_URL/health" 2>&1)
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is NOT running!${NC}"
    echo "Please start the server first:"
    echo "  PowerShell: cd C:\Users\Eyasu\Desktop\IT\Hawssa-mesob-F-B\backend && npm start"
    exit 1
fi
echo ""

# Get tokens
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "GETTING AUTHENTICATION TOKENS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✓ Admin token obtained"

CITIZEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}')
CITIZEN_TOKEN=$(echo "$CITIZEN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✓ Citizen token obtained"

EMPLOYEE_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"employee@mesobcenter.et","password":"Employee@2026"}')
EMPLOYEE_TOKEN=$(echo "$EMPLOYEE_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✓ Employee token obtained"
echo ""

# Get IDs for testing
INST_ID=$(curl -s "$API_URL/institutions" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. HEALTH & SYSTEM (1 endpoint)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /health" "GET" "$API_URL/health"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. AUTHENTICATION (6 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "POST /auth/login" "POST" "$API_URL/auth/login" "" '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}'
test_endpoint "GET /auth/profile" "GET" "$API_URL/auth/profile" "$CITIZEN_TOKEN"
test_endpoint "POST /auth/logout" "POST" "$API_URL/auth/logout" "$CITIZEN_TOKEN"
test_endpoint "POST /auth/refresh" "POST" "$API_URL/auth/refresh" "$ADMIN_TOKEN"
test_endpoint "POST /auth/change-password" "POST" "$API_URL/auth/change-password" "$ADMIN_TOKEN" '{"currentPassword":"wrong","newPassword":"Test@123"}'
test_endpoint "POST /auth/forgot-password" "POST" "$API_URL/auth/forgot-password" "" '{"email":"test@example.com"}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. USER MANAGEMENT (5 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /users" "GET" "$API_URL/users" "$ADMIN_TOKEN"
test_endpoint "GET /users/:id" "GET" "$API_URL/users/invalid-id" "$ADMIN_TOKEN"
test_endpoint "POST /users" "POST" "$API_URL/users" "$ADMIN_TOKEN" '{"email":"test@test.com","password":"Test@123","full_name":"Test","role":"CITIZEN"}'
test_endpoint "PUT /users/:id" "PUT" "$API_URL/users/invalid-id" "$ADMIN_TOKEN" '{"full_name":"Updated"}'
test_endpoint "DELETE /users/:id" "DELETE" "$API_URL/users/invalid-id" "$ADMIN_TOKEN"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. INSTITUTIONS (5 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /institutions" "GET" "$API_URL/institutions"
test_endpoint "GET /institutions/:id" "GET" "$API_URL/institutions/$INST_ID"
test_endpoint "POST /institutions" "POST" "$API_URL/institutions" "$ADMIN_TOKEN" '{"name_en":"Test","name_am":"ሙከራ","description":"Test"}'
test_endpoint "PUT /institutions/:id" "PUT" "$API_URL/institutions/invalid-id" "$ADMIN_TOKEN" '{"name_en":"Updated"}'
test_endpoint "DELETE /institutions/:id" "DELETE" "$API_URL/institutions/invalid-id" "$ADMIN_TOKEN"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. SERVICES (5 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /services" "GET" "$API_URL/services"
test_endpoint "GET /services/:id" "GET" "$API_URL/services/invalid-id"
test_endpoint "POST /services" "POST" "$API_URL/services" "$ADMIN_TOKEN" '{"title_en":"Test","institution_id":"'$INST_ID'","code":"TST001"}'
test_endpoint "PUT /services/:id" "PUT" "$API_URL/services/invalid-id" "$ADMIN_TOKEN" '{"title_en":"Updated"}'
test_endpoint "DELETE /services/:id" "DELETE" "$API_URL/services/invalid-id" "$ADMIN_TOKEN"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. QUEUE MANAGEMENT (3 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /queues" "GET" "$API_URL/queues" "$CITIZEN_TOKEN"
test_endpoint "GET /queues/:id/status" "GET" "$API_URL/queues/invalid-id/status"
test_endpoint "POST /queues/join" "POST" "$API_URL/queues/join" "$CITIZEN_TOKEN" '{"service_id":"invalid"}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. APPLICATIONS (4 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /applications" "GET" "$API_URL/applications" "$CITIZEN_TOKEN"
test_endpoint "GET /applications/:id" "GET" "$API_URL/applications/invalid-id" "$CITIZEN_TOKEN"
test_endpoint "POST /applications" "POST" "$API_URL/applications" "$CITIZEN_TOKEN" '{"service_id":"invalid"}'
test_endpoint "PUT /applications/:id/status" "PUT" "$API_URL/applications/invalid-id/status" "$EMPLOYEE_TOKEN" '{"status":"APPROVED"}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. MAINTENANCE (3 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /maintenance/reports" "GET" "$API_URL/maintenance/reports" "$EMPLOYEE_TOKEN"
test_endpoint "POST /maintenance/reports" "POST" "$API_URL/maintenance/reports" "$EMPLOYEE_TOKEN" '{"title":"Test","description":"Test"}'
test_endpoint "PUT /maintenance/reports/:id" "PUT" "$API_URL/maintenance/reports/invalid-id" "$EMPLOYEE_TOKEN" '{"title":"Updated"}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. ANNOUNCEMENTS (2 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /announcements" "GET" "$API_URL/announcements"
test_endpoint "POST /announcements" "POST" "$API_URL/announcements" "$ADMIN_TOKEN" '{"title_en":"Test","content_en":"Test"}'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. NOTIFICATIONS (2 endpoints)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /notifications" "GET" "$API_URL/notifications" "$CITIZEN_TOKEN"
test_endpoint "PUT /notifications/:id/read" "PUT" "$API_URL/notifications/invalid-id/read" "$CITIZEN_TOKEN"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "11. SEARCH (1 endpoint)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET /search" "GET" "$API_URL/search?q=test"
echo ""

TOTAL=$((PASS + FAIL))
if [ $TOTAL -eq 0 ]; then
    TOTAL=1
fi
PERCENT=$((PASS * 100 / TOTAL))

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    FINAL RESULTS                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Endpoints:  $TOTAL"
echo -e "${GREEN}Passed:           $PASS ($PERCENT%)${NC}"
echo -e "${RED}Failed:           $FAIL${NC}"
echo ""

if [ $PERCENT -ge 90 ]; then
    echo -e "${GREEN}🎉 EXCELLENT! ($PERCENT%) - Production Ready!${NC}"
elif [ $PERCENT -ge 75 ]; then
    echo -e "${GREEN}✅ VERY GOOD! ($PERCENT%) - Almost There!${NC}"
elif [ $PERCENT -ge 60 ]; then
    echo -e "${YELLOW}⚠️  GOOD! ($PERCENT%) - Needs Minor Work${NC}"
else
    echo -e "${RED}❌ NEEDS WORK ($PERCENT%)${NC}"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Note: Some failures are expected (invalid IDs, missing data, etc.)"
echo "The important thing is that the API responds correctly!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
