#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      🔐 TEST USER CREATION AUTHORIZATION (RBAC)              ║"
echo "║             HAWASSA MESOB BACKEND                            ║"
echo "║                                                              ║"
echo "║  RULE: Only SUPER_ADMIN can create users                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECKING SERVER STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(curl -s --max-time 5 "$API_URL/health" 2>&1)
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is NOT running!${NC}"
    echo "Please start the server first: npm start"
    exit 1
fi
echo ""

# Test user creation with different roles
test_user_creation() {
    local role_name="$1"
    local email="$2"
    local password="$3"
    local expected_result="$4"  # "ALLOWED" or "FORBIDDEN"
    
    echo -e "${BLUE}Testing: $role_name${NC}"
    echo "  Email: $email"
    echo "  Expected: $expected_result"
    
    # Login to get token
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q '"accessToken"'; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        echo "  ✓ Login successful"
        
        # Generate unique test email
        TIMESTAMP=$(date +%s%N | cut -b1-13)
        TEST_EMAIL="test.user.${TIMESTAMP}@test.com"
        
        # Attempt to create a user
        CREATE_RESPONSE=$(curl -s -X POST "$API_URL/users" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "{
            \"email\":\"$TEST_EMAIL\",
            \"password\":\"TestPassword123!\",
            \"fullName\":\"Test User ${TIMESTAMP}\",
            \"phone\":\"+251911223344\",
            \"role\":\"EMPLOYEE\",
            \"institutionId\":\"CBE\",
            \"employeeId\":\"EMP${TIMESTAMP}\"
          }")
        
        # Check result
        if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
            if [ "$expected_result" = "ALLOWED" ]; then
                echo -e "  ${GREEN}✅ PASS - User creation ALLOWED (as expected)${NC}"
                echo "  Created: $TEST_EMAIL"
            else
                echo -e "  ${RED}❌ FAIL - User creation ALLOWED (should be FORBIDDEN)${NC}"
                echo "  Created: $TEST_EMAIL"
            fi
        elif echo "$CREATE_RESPONSE" | grep -q '"success":false'; then
            MESSAGE=$(echo "$CREATE_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
            if [ "$expected_result" = "FORBIDDEN" ]; then
                echo -e "  ${GREEN}✅ PASS - User creation FORBIDDEN (as expected)${NC}"
                echo "  Message: $MESSAGE"
            else
                echo -e "  ${RED}❌ FAIL - User creation FORBIDDEN (should be ALLOWED)${NC}"
                echo "  Message: $MESSAGE"
            fi
        elif echo "$CREATE_RESPONSE" | grep -q "You do not have permission"; then
            if [ "$expected_result" = "FORBIDDEN" ]; then
                echo -e "  ${GREEN}✅ PASS - Permission denied (as expected)${NC}"
                echo "  Authorization middleware rejected request"
            else
                echo -e "  ${RED}❌ FAIL - Permission denied (should be ALLOWED)${NC}"
            fi
        else
            echo -e "  ${YELLOW}⚠️  Unexpected response${NC}"
            echo "  Response: ${CREATE_RESPONSE:0:200}"
        fi
    else
        echo -e "  ${RED}❌ Login failed - Cannot test user creation${NC}"
        ERROR=$(echo "$LOGIN_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
        if [ -n "$ERROR" ]; then
            echo "  Error: $ERROR"
        fi
    fi
    echo ""
}

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              USER CREATION AUTHORIZATION TESTS               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. SUPER_ADMIN (SHOULD BE ALLOWED)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_user_creation "Super Admin" "superadmin@mesobcenter.et" "SuperAdmin@2026" "ALLOWED"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. MESOB_MANAGER (SHOULD BE FORBIDDEN)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_user_creation "MESOB Manager" "manager@mesobcenter.et" "MesobManager@2026" "FORBIDDEN"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. INSTITUTION_MANAGER (SHOULD BE FORBIDDEN)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_user_creation "Institution Manager" "inst.manager@mesobcenter.et" "InstManager@2026" "FORBIDDEN"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. EMPLOYEE (SHOULD BE FORBIDDEN)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_user_creation "Employee" "employee@mesobcenter.et" "Employee@2026" "FORBIDDEN"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. ICT_STAFF (SHOULD BE FORBIDDEN)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_user_creation "ICT Staff" "ict.staff@mesobcenter.et" "IctStaff@2026" "FORBIDDEN"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. CITIZEN (SHOULD BE FORBIDDEN)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_user_creation "Citizen" "citizen@mesobcenter.et" "Citizen@2026" "FORBIDDEN"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SUMMARY                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Authorization Rule:"
echo "  ✅ SUPER_ADMIN      → CAN create users"
echo "  ❌ MESOB_MANAGER    → CANNOT create users"
echo "  ❌ INST_MANAGER     → CANNOT create users"
echo "  ❌ EMPLOYEE         → CANNOT create users"
echo "  ❌ ICT_STAFF        → CANNOT create users"
echo "  ❌ CITIZEN          → CANNOT create users"
echo ""
echo "Public Registration:"
echo "  ✅ Anyone can self-register as CITIZEN via POST /api/auth/register"
echo ""
echo -e "${GREEN}User creation authorization tests complete!${NC}"
echo ""
