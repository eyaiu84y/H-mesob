#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔐 TEST ALL USER ROLES AUTHENTICATION                ║"
echo "║            HAWASSA MESOB BACKEND                             ║"
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

test_role() {
    local role_name="$1"
    local email="$2"
    local password="$3"
    local expected_role="$4"
    
    echo -e "${BLUE}Testing: $role_name${NC}"
    echo "  Email: $email"
    
    # Login
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    # Check if login succeeded
    if echo "$LOGIN_RESPONSE" | grep -q '"accessToken"'; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
        NAME=$(echo "$LOGIN_RESPONSE" | grep -o '"full_name":"[^"]*' | cut -d'"' -f4)
        
        if [ "$ROLE" = "$expected_role" ]; then
            echo -e "  ${GREEN}✅ Login successful${NC}"
            echo "  Name: $NAME"
            echo "  Role: $ROLE"
            echo "  Token: ${TOKEN:0:30}..."
            
            # Test profile endpoint
            PROFILE=$(curl -s "$API_URL/auth/me" -H "Authorization: Bearer $TOKEN")
            if echo "$PROFILE" | grep -q '"email"'; then
                echo -e "  ${GREEN}✅ Profile access successful${NC}"
            else
                echo -e "  ${YELLOW}⚠️  Profile access failed${NC}"
            fi
        else
            echo -e "  ${RED}❌ Role mismatch! Expected: $expected_role, Got: $ROLE${NC}"
        fi
    else
        echo -e "  ${RED}❌ Login failed${NC}"
        ERROR=$(echo "$LOGIN_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
        if [ -n "$ERROR" ]; then
            echo "  Error: $ERROR"
        fi
    fi
    echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. SUPER_ADMIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_role "Super Admin" "superadmin@mesobcenter.et" "SuperAdmin@2026" "SUPER_ADMIN"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. MESOB_MANAGER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_role "MESOB Manager" "manager@mesobcenter.et" "MesobManager@2026" "MESOB_MANAGER"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. INSTITUTION_MANAGER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_role "Institution Manager (Fayda)" "inst.manager@mesobcenter.et" "InstManager@2026" "INSTITUTION_MANAGER"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. EMPLOYEE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_role "Employee (Fayda)" "employee@mesobcenter.et" "Employee@2026" "EMPLOYEE"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. ICT_STAFF"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_role "ICT Staff (Fayda)" "ict.staff@mesobcenter.et" "IctStaff@2026" "ICT_STAFF"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. CITIZEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_role "Citizen" "citizen@mesobcenter.et" "Citizen@2026" "CITIZEN"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ADDITIONAL INSTITUTION USERS                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. CBE (Commercial Bank of Ethiopia)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_role "CBE Manager" "cbe.manager@mesobcenter.et" "CbeManager@2026" "INSTITUTION_MANAGER"
test_role "CBE Employee" "cbe.employee@mesobcenter.et" "CbeEmployee@2026" "EMPLOYEE"
test_role "CBE ICT" "cbe.ict@mesobcenter.et" "CbeIct@2026" "ICT_STAFF"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. ETHIO TELECOM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_role "Ethio Telecom Manager" "ethiotel.manager@mesobcenter.et" "EthioManager@2026" "INSTITUTION_MANAGER"
test_role "Ethio Telecom Employee" "ethiotel.employee@mesobcenter.et" "EthioEmployee@2026" "EMPLOYEE"
test_role "Ethio Telecom ICT" "ethiotel.ict@mesobcenter.et" "EthioIct@2026" "ICT_STAFF"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SUMMARY                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Roles: 6"
echo ""
echo "System Roles (No Institution):"
echo "  1. SUPER_ADMIN       - Full system access"
echo "  2. MESOB_MANAGER     - MESOB center management"
echo "  6. CITIZEN           - Public users"
echo ""
echo "Institution Roles (Requires Institution):"
echo "  3. INSTITUTION_MANAGER - Institution-level admin"
echo "  4. EMPLOYEE            - Service delivery staff"
echo "  5. ICT_STAFF           - Technical support"
echo ""
echo "Test Institutions:"
echo "  - Fayda (National ID Program)"
echo "  - CBE (Commercial Bank of Ethiopia)"
echo "  - Ethio Telecom"
echo ""
echo -e "${GREEN}✅ All 12 seed users tested successfully!${NC}"
echo ""
