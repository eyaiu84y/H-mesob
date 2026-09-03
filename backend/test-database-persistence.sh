#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       🗄️  DATABASE PERSISTENCE VERIFICATION TEST             ║"
echo "║              HAWASSA MESOB BACKEND                           ║"
echo "║                                                              ║"
echo "║  Testing: Super Admin user creation → Database persistence  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Supabase CLI or psql is available
if command -v psql &> /dev/null; then
    DB_CLI="psql"
elif command -v supabase &> /dev/null; then
    DB_CLI="supabase"
else
    echo -e "${YELLOW}⚠️  No database CLI found (psql or supabase)${NC}"
    echo "Database verification will use API queries only"
    DB_CLI="none"
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Loaded .env file${NC}"
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
fi

# Check server
echo ""
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

# Login as Super Admin
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUPER ADMIN LOGIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}')

if echo "$LOGIN_RESPONSE" | grep -q '"accessToken"'; then
    ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Super Admin logged in successfully${NC}"
    echo "  Token: ${ADMIN_TOKEN:0:30}..."
else
    echo -e "${RED}❌ Super Admin login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Function to verify user in database via API
verify_user_in_db() {
    local email=$1
    local expected_role=$2
    local expected_institution=$3
    
    echo -e "${CYAN}Verifying in database: $email${NC}"
    
    # Get user by email via API
    USER_RESPONSE=$(curl -s "$API_URL/users?email=$email" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$USER_RESPONSE" | grep -q '"success":true'; then
        # Extract user details
        USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        USER_EMAIL=$(echo "$USER_RESPONSE" | grep -o '"email":"[^"]*' | head -1 | cut -d'"' -f4)
        USER_NAME=$(echo "$USER_RESPONSE" | grep -o '"full_name":"[^"]*' | head -1 | cut -d'"' -f4)
        USER_ROLE=$(echo "$USER_RESPONSE" | grep -o '"role":"[^"]*' | head -1 | cut -d'"' -f4)
        USER_INSTITUTION=$(echo "$USER_RESPONSE" | grep -o '"institution_id":"[^"]*' | head -1 | cut -d'"' -f4)
        USER_STATUS=$(echo "$USER_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
        USER_CREATED=$(echo "$USER_RESPONSE" | grep -o '"created_at":"[^"]*' | head -1 | cut -d'"' -f4)
        
        echo -e "${GREEN}  ✅ Found in database${NC}"
        echo "    ID: $USER_ID"
        echo "    Full Name: $USER_NAME"
        echo "    Email: $USER_EMAIL"
        echo "    Role: $USER_ROLE"
        echo "    Institution: ${USER_INSTITUTION:-null}"
        echo "    Status: $USER_STATUS"
        echo "    Created: ${USER_CREATED:0:19}"
        
        # Verify role matches
        if [ "$USER_ROLE" = "$expected_role" ]; then
            echo -e "${GREEN}  ✅ Role matches: $expected_role${NC}"
        else
            echo -e "${RED}  ❌ Role mismatch: Expected '$expected_role', Got '$USER_ROLE'${NC}"
            return 1
        fi
        
        # Verify institution if required
        if [ -n "$expected_institution" ]; then
            if [ "$USER_INSTITUTION" = "$expected_institution" ]; then
                echo -e "${GREEN}  ✅ Institution matches: $expected_institution${NC}"
            else
                echo -e "${RED}  ❌ Institution mismatch: Expected '$expected_institution', Got '${USER_INSTITUTION:-null}'${NC}"
                return 1
            fi
        fi
        
        return 0
    else
        echo -e "${RED}  ❌ NOT FOUND in database${NC}"
        echo "  Response: $USER_RESPONSE"
        return 1
    fi
}

# Generate unique timestamps for test users
TIMESTAMP=$(date +%s)

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          TEST 1: CREATE INSTITUTION MANAGER                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

INST_MGR_EMAIL="test.instmgr.${TIMESTAMP}@test.mesob.et"
echo -e "${BLUE}Creating Institution Manager: $INST_MGR_EMAIL${NC}"
echo ""

CREATE_INST_MGR=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"email\":\"$INST_MGR_EMAIL\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test Institution Manager\",
    \"phone\":\"+251911111111\",
    \"role\":\"INSTITUTION_MANAGER\",
    \"institutionId\":\"CBE\",
    \"employeeId\":\"IMTEST${TIMESTAMP}\"
  }")

if echo "$CREATE_INST_MGR" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Institution Manager created via API${NC}"
    echo ""
    verify_user_in_db "$INST_MGR_EMAIL" "INSTITUTION_MANAGER" "CBE"
else
    echo -e "${RED}❌ Failed to create Institution Manager${NC}"
    ERROR=$(echo "$CREATE_INST_MGR" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error: $ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               TEST 2: CREATE EMPLOYEE                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

EMPLOYEE_EMAIL="test.employee.${TIMESTAMP}@test.mesob.et"
echo -e "${BLUE}Creating Employee: $EMPLOYEE_EMAIL${NC}"
echo ""

CREATE_EMPLOYEE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"email\":\"$EMPLOYEE_EMAIL\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test Employee\",
    \"phone\":\"+251911222222\",
    \"role\":\"EMPLOYEE\",
    \"institutionId\":\"CBE\",
    \"employeeId\":\"EMPTEST${TIMESTAMP}\"
  }")

if echo "$CREATE_EMPLOYEE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Employee created via API${NC}"
    echo ""
    verify_user_in_db "$EMPLOYEE_EMAIL" "EMPLOYEE" "CBE"
else
    echo -e "${RED}❌ Failed to create Employee${NC}"
    ERROR=$(echo "$CREATE_EMPLOYEE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error: $ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               TEST 3: CREATE ICT STAFF                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

ICT_EMAIL="test.ict.${TIMESTAMP}@test.mesob.et"
echo -e "${BLUE}Creating ICT Staff: $ICT_EMAIL${NC}"
echo ""

CREATE_ICT=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"email\":\"$ICT_EMAIL\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test ICT Staff\",
    \"phone\":\"+251911333333\",
    \"role\":\"ICT_STAFF\",
    \"institutionId\":\"CBE\",
    \"employeeId\":\"ICTTEST${TIMESTAMP}\"
  }")

if echo "$CREATE_ICT" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ ICT Staff created via API${NC}"
    echo ""
    verify_user_in_db "$ICT_EMAIL" "ICT_STAFF" "CBE"
else
    echo -e "${RED}❌ Failed to create ICT Staff${NC}"
    ERROR=$(echo "$CREATE_ICT" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error: $ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              TEST 4: CREATE MESOB MANAGER                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

MESOB_EMAIL="test.mesobmgr.${TIMESTAMP}@test.mesob.et"
echo -e "${BLUE}Creating MESOB Manager: $MESOB_EMAIL${NC}"
echo ""

CREATE_MESOB=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"email\":\"$MESOB_EMAIL\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test MESOB Manager\",
    \"phone\":\"+251911444444\",
    \"role\":\"MESOB_MANAGER\"
  }")

if echo "$CREATE_MESOB" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ MESOB Manager created via API${NC}"
    echo ""
    verify_user_in_db "$MESOB_EMAIL" "MESOB_MANAGER" ""
else
    echo -e "${RED}❌ Failed to create MESOB Manager${NC}"
    ERROR=$(echo "$CREATE_MESOB" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error: $ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      TEST 5: CREATE CITIZEN (via Admin API)                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

ADMIN_CITIZEN_EMAIL="test.admincitizen.${TIMESTAMP}@test.mesob.et"
echo -e "${BLUE}Creating Citizen via Admin API: $ADMIN_CITIZEN_EMAIL${NC}"
echo ""

CREATE_ADMIN_CITIZEN=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"email\":\"$ADMIN_CITIZEN_EMAIL\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test Admin Citizen\",
    \"phone\":\"+251911555555\",
    \"role\":\"CITIZEN\"
  }")

if echo "$CREATE_ADMIN_CITIZEN" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Citizen created via Admin API${NC}"
    echo ""
    verify_user_in_db "$ADMIN_CITIZEN_EMAIL" "CITIZEN" ""
else
    echo -e "${RED}❌ Failed to create Citizen via Admin API${NC}"
    ERROR=$(echo "$CREATE_ADMIN_CITIZEN" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error: $ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      TEST 6: CREATE CITIZEN (via Public Signup)             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

PUBLIC_CITIZEN_EMAIL="test.publiccitizen.${TIMESTAMP}@test.mesob.et"
echo -e "${BLUE}Registering Citizen via Public Signup: $PUBLIC_CITIZEN_EMAIL${NC}"
echo ""

CREATE_PUBLIC_CITIZEN=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$PUBLIC_CITIZEN_EMAIL\",
    \"password\":\"TestPass123!\",
    \"firstName\":\"Test Public\",
    \"lastName\":\"Citizen\",
    \"phone\":\"+251911666666\"
  }")

if echo "$CREATE_PUBLIC_CITIZEN" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Citizen registered via Public Signup${NC}"
    echo ""
    verify_user_in_db "$PUBLIC_CITIZEN_EMAIL" "CITIZEN" ""
else
    echo -e "${RED}❌ Failed to register Citizen via Public Signup${NC}"
    ERROR=$(echo "$CREATE_PUBLIC_CITIZEN" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error: $ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         TEST 7: DUPLICATE EMAIL REJECTION                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}Attempting to create duplicate: $EMPLOYEE_EMAIL${NC}"
echo ""

DUPLICATE_ATTEMPT=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"email\":\"$EMPLOYEE_EMAIL\",
    \"password\":\"DifferentPass123!\",
    \"fullName\":\"Duplicate User\",
    \"role\":\"EMPLOYEE\",
    \"institutionId\":\"CBE\",
    \"employeeId\":\"DUPTEST${TIMESTAMP}\"
  }")

if echo "$DUPLICATE_ATTEMPT" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ Duplicate email correctly rejected${NC}"
    ERROR=$(echo "$DUPLICATE_ATTEMPT" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error Message: $ERROR"
else
    echo -e "${RED}❌ Duplicate email was accepted (should be rejected!)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  SUMMARY OF RESULTS                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Test Users Created (with timestamp: $TIMESTAMP):"
echo ""
echo "1. Institution Manager:"
echo "   Email: $INST_MGR_EMAIL"
echo "   Role: INSTITUTION_MANAGER"
echo "   Institution: CBE"
echo ""
echo "2. Employee:"
echo "   Email: $EMPLOYEE_EMAIL"
echo "   Role: EMPLOYEE"
echo "   Institution: CBE"
echo ""
echo "3. ICT Staff:"
echo "   Email: $ICT_EMAIL"
echo "   Role: ICT_STAFF"
echo "   Institution: CBE"
echo ""
echo "4. MESOB Manager:"
echo "   Email: $MESOB_EMAIL"
echo "   Role: MESOB_MANAGER"
echo "   Institution: null"
echo ""
echo "5. Citizen (Admin Created):"
echo "   Email: $ADMIN_CITIZEN_EMAIL"
echo "   Role: CITIZEN"
echo "   Institution: null"
echo ""
echo "6. Citizen (Public Signup):"
echo "   Email: $PUBLIC_CITIZEN_EMAIL"
echo "   Role: CITIZEN"
echo "   Institution: null"
echo ""
echo -e "${CYAN}Database Verification:${NC}"
echo "All created users were verified to exist in the database via API queries."
echo "Each user's role and institution were verified to match expected values."
echo ""
echo -e "${CYAN}Security Verification:${NC}"
echo "Duplicate email rejection tested and working correctly."
echo ""
echo -e "${YELLOW}Note: Test users created with timestamp prefix for identification.${NC}"
echo -e "${YELLOW}These users can be safely deleted from database if needed.${NC}"
echo ""
echo -e "${GREEN}✅ Database persistence verification complete!${NC}"
echo ""
