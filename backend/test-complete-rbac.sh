#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔐 COMPLETE RBAC AUTHORIZATION TEST                  ║"
echo "║              HAWASSA MESOB SYSTEM                            ║"
echo "║                                                              ║"
echo "║  Final Authorization Model: ONLY SUPER_ADMIN creates users  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to record test result
record_test() {
    local test_name=$1
    local result=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}❌ FAIL${NC}: $test_name"
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
    echo "Please start the server first: npm start"
    exit 1
fi
echo ""

# Timestamp for unique test users
TIMESTAMP=$(date +%s)

# Test user accounts
SUPER_ADMIN_EMAIL="superadmin@mesobcenter.et"
SUPER_ADMIN_PASS="SuperAdmin@2026"

MESOB_MGR_EMAIL="manager@mesobcenter.et"
MESOB_MGR_PASS="MesobManager@2026"

INST_MGR_EMAIL="inst.manager@mesobcenter.et"
INST_MGR_PASS="InstManager@2026"

EMPLOYEE_EMAIL="employee@mesobcenter.et"
EMPLOYEE_PASS="Employee@2026"

ICT_EMAIL="ict.staff@mesobcenter.et"
ICT_PASS="IctStaff@2026"

CITIZEN_EMAIL="citizen@mesobcenter.et"
CITIZEN_PASS="Citizen@2026"

# Created test user emails
TEST_SUPER_ADMIN="test.superadmin.${TIMESTAMP}@rbactest.et"
TEST_MESOB_MGR="test.mesobmgr.${TIMESTAMP}@rbactest.et"
TEST_INST_MGR="test.instmgr.${TIMESTAMP}@rbactest.et"
TEST_EMPLOYEE="test.employee.${TIMESTAMP}@rbactest.et"
TEST_ICT="test.ict.${TIMESTAMP}@rbactest.et"
TEST_CITIZEN_ADMIN="test.citizen.admin.${TIMESTAMP}@rbactest.et"
TEST_CITIZEN_PUBLIC="test.citizen.public.${TIMESTAMP}@rbactest.et"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               TEST SUITE 1: SUPER ADMIN                      ║"
echo "║  Expected: Can create ALL 6 role types                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Login as Super Admin
echo -e "${CYAN}Logging in as Super Admin...${NC}"
SUPER_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASS\"}")

if echo "$SUPER_LOGIN" | grep -q '"accessToken"'; then
    SUPER_TOKEN=$(echo "$SUPER_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Super Admin logged in${NC}"
    record_test "Super Admin Login" "PASS"
else
    echo -e "${RED}✗ Super Admin login failed${NC}"
    record_test "Super Admin Login" "FAIL"
    exit 1
fi
echo ""

# Test 1.1: Create Super Admin
echo -e "${BLUE}Test 1.1: Super Admin creates SUPER_ADMIN${NC}"
CREATE_SUPER=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{
    \"email\":\"$TEST_SUPER_ADMIN\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test Super Admin\",
    \"role\":\"SUPER_ADMIN\"
  }")

if echo "$CREATE_SUPER" | grep -q '"success":true'; then
    echo -e "${GREEN}  ✓ Created successfully${NC}"
    record_test "Super Admin creates SUPER_ADMIN" "PASS"
else
    echo -e "${RED}  ✗ Creation failed${NC}"
    record_test "Super Admin creates SUPER_ADMIN" "FAIL"
fi
echo ""

# Test 1.2: Create MESOB Manager
echo -e "${BLUE}Test 1.2: Super Admin creates MESOB_MANAGER${NC}"
CREATE_MESOB=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{
    \"email\":\"$TEST_MESOB_MGR\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test MESOB Manager\",
    \"role\":\"MESOB_MANAGER\"
  }")

if echo "$CREATE_MESOB" | grep -q '"success":true'; then
    echo -e "${GREEN}  ✓ Created successfully${NC}"
    record_test "Super Admin creates MESOB_MANAGER" "PASS"
else
    echo -e "${RED}  ✗ Creation failed${NC}"
    record_test "Super Admin creates MESOB_MANAGER" "FAIL"
fi
echo ""

# Test 1.3: Create Institution Manager
echo -e "${BLUE}Test 1.3: Super Admin creates INSTITUTION_MANAGER${NC}"
CREATE_INST=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{
    \"email\":\"$TEST_INST_MGR\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test Institution Manager\",
    \"role\":\"INSTITUTION_MANAGER\",
    \"institutionId\":\"cbe\",
    \"employeeId\":\"IMTEST${TIMESTAMP}\"
  }")

if echo "$CREATE_INST" | grep -q '"success":true'; then
    echo -e "${GREEN}  ✓ Created successfully${NC}"
    record_test "Super Admin creates INSTITUTION_MANAGER" "PASS"
else
    echo -e "${RED}  ✗ Creation failed${NC}"
    record_test "Super Admin creates INSTITUTION_MANAGER" "FAIL"
fi
echo ""

# Test 1.4: Create Employee
echo -e "${BLUE}Test 1.4: Super Admin creates EMPLOYEE${NC}"
CREATE_EMP=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{
    \"email\":\"$TEST_EMPLOYEE\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test Employee\",
    \"role\":\"EMPLOYEE\",
    \"institutionId\":\"cbe\",
    \"employeeId\":\"EMPTEST${TIMESTAMP}\"
  }")

if echo "$CREATE_EMP" | grep -q '"success":true'; then
    echo -e "${GREEN}  ✓ Created successfully${NC}"
    record_test "Super Admin creates EMPLOYEE" "PASS"
else
    echo -e "${RED}  ✗ Creation failed${NC}"
    record_test "Super Admin creates EMPLOYEE" "FAIL"
fi
echo ""

# Test 1.5: Create ICT Staff
echo -e "${BLUE}Test 1.5: Super Admin creates ICT_STAFF${NC}"
CREATE_ICT=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{
    \"email\":\"$TEST_ICT\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test ICT Staff\",
    \"role\":\"ICT_STAFF\",
    \"institutionId\":\"cbe\",
    \"employeeId\":\"ICTTEST${TIMESTAMP}\"
  }")

if echo "$CREATE_ICT" | grep -q '"success":true'; then
    echo -e "${GREEN}  ✓ Created successfully${NC}"
    record_test "Super Admin creates ICT_STAFF" "PASS"
else
    echo -e "${RED}  ✗ Creation failed${NC}"
    record_test "Super Admin creates ICT_STAFF" "FAIL"
fi
echo ""

# Test 1.6: Create Citizen
echo -e "${BLUE}Test 1.6: Super Admin creates CITIZEN${NC}"
CREATE_CIT=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{
    \"email\":\"$TEST_CITIZEN_ADMIN\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Test Citizen Admin\",
    \"role\":\"CITIZEN\"
  }")

if echo "$CREATE_CIT" | grep -q '"success":true'; then
    echo -e "${GREEN}  ✓ Created successfully${NC}"
    record_test "Super Admin creates CITIZEN" "PASS"
else
    echo -e "${RED}  ✗ Creation failed${NC}"
    record_test "Super Admin creates CITIZEN" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║             TEST SUITE 2: MESOB MANAGER                      ║"
echo "║  Expected: CANNOT create users (403 Forbidden)              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}Logging in as MESOB Manager...${NC}"
MESOB_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MESOB_MGR_EMAIL\",\"password\":\"$MESOB_MGR_PASS\"}")

if echo "$MESOB_LOGIN" | grep -q '"accessToken"'; then
    MESOB_TOKEN=$(echo "$MESOB_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ MESOB Manager logged in${NC}"
    record_test "MESOB Manager Login" "PASS"
else
    echo -e "${RED}✗ MESOB Manager login failed${NC}"
    record_test "MESOB Manager Login" "FAIL"
fi
echo ""

echo -e "${BLUE}Test 2.1: MESOB Manager attempts to create user${NC}"
MESOB_CREATE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MESOB_TOKEN" \
  -d "{
    \"email\":\"mesob.attempt.${TIMESTAMP}@rbactest.et\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Unauthorized User\",
    \"role\":\"EMPLOYEE\",
    \"institutionId\":\"cbe\"
  }")

if echo "$MESOB_CREATE" | grep -q '"success":false' || echo "$MESOB_CREATE" | grep -q "permission"; then
    echo -e "${GREEN}  ✓ Correctly rejected (403 Forbidden)${NC}"
    record_test "MESOB Manager CANNOT create user" "PASS"
else
    echo -e "${RED}  ✗ User creation was allowed (SECURITY ISSUE!)${NC}"
    record_test "MESOB Manager CANNOT create user" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           TEST SUITE 3: INSTITUTION MANAGER                  ║"
echo "║  Expected: CANNOT create users (403 Forbidden)              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}Logging in as Institution Manager...${NC}"
INST_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$INST_MGR_EMAIL\",\"password\":\"$INST_MGR_PASS\"}")

if echo "$INST_LOGIN" | grep -q '"accessToken"'; then
    INST_TOKEN=$(echo "$INST_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Institution Manager logged in${NC}"
    record_test "Institution Manager Login" "PASS"
else
    echo -e "${RED}✗ Institution Manager login failed${NC}"
    record_test "Institution Manager Login" "FAIL"
fi
echo ""

echo -e "${BLUE}Test 3.1: Institution Manager attempts to create user${NC}"
INST_CREATE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INST_TOKEN" \
  -d "{
    \"email\":\"inst.attempt.${TIMESTAMP}@rbactest.et\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Unauthorized User\",
    \"role\":\"EMPLOYEE\",
    \"institutionId\":\"fayda\",
    \"employeeId\":\"UNAUTH${TIMESTAMP}\"
  }")

if echo "$INST_CREATE" | grep -q '"success":false' || echo "$INST_CREATE" | grep -q "permission"; then
    echo -e "${GREEN}  ✓ Correctly rejected (403 Forbidden)${NC}"
    record_test "Institution Manager CANNOT create user" "PASS"
else
    echo -e "${RED}  ✗ User creation was allowed (SECURITY ISSUE!)${NC}"
    record_test "Institution Manager CANNOT create user" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                TEST SUITE 4: EMPLOYEE                        ║"
echo "║  Expected: CANNOT create users (403 Forbidden)              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}Logging in as Employee...${NC}"
EMP_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMPLOYEE_EMAIL\",\"password\":\"$EMPLOYEE_PASS\"}")

if echo "$EMP_LOGIN" | grep -q '"accessToken"'; then
    EMP_TOKEN=$(echo "$EMP_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Employee logged in${NC}"
    record_test "Employee Login" "PASS"
else
    echo -e "${RED}✗ Employee login failed${NC}"
    record_test "Employee Login" "FAIL"
fi
echo ""

echo -e "${BLUE}Test 4.1: Employee attempts to create user${NC}"
EMP_CREATE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d "{
    \"email\":\"emp.attempt.${TIMESTAMP}@rbactest.et\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Unauthorized User\",
    \"role\":\"CITIZEN\"
  }")

if echo "$EMP_CREATE" | grep -q '"success":false' || echo "$EMP_CREATE" | grep -q "permission"; then
    echo -e "${GREEN}  ✓ Correctly rejected (403 Forbidden)${NC}"
    record_test "Employee CANNOT create user" "PASS"
else
    echo -e "${RED}  ✗ User creation was allowed (SECURITY ISSUE!)${NC}"
    record_test "Employee CANNOT create user" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               TEST SUITE 5: ICT STAFF                        ║"
echo "║  Expected: CANNOT create users (403 Forbidden)              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}Logging in as ICT Staff...${NC}"
ICT_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ICT_EMAIL\",\"password\":\"$ICT_PASS\"}")

if echo "$ICT_LOGIN" | grep -q '"accessToken"'; then
    ICT_TOKEN=$(echo "$ICT_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ ICT Staff logged in${NC}"
    record_test "ICT Staff Login" "PASS"
else
    echo -e "${RED}✗ ICT Staff login failed${NC}"
    record_test "ICT Staff Login" "FAIL"
fi
echo ""

echo -e "${BLUE}Test 5.1: ICT Staff attempts to create user${NC}"
ICT_CREATE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ICT_TOKEN" \
  -d "{
    \"email\":\"ict.attempt.${TIMESTAMP}@rbactest.et\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Unauthorized User\",
    \"role\":\"CITIZEN\"
  }")

if echo "$ICT_CREATE" | grep -q '"success":false' || echo "$ICT_CREATE" | grep -q "permission"; then
    echo -e "${GREEN}  ✓ Correctly rejected (403 Forbidden)${NC}"
    record_test "ICT Staff CANNOT create user" "PASS"
else
    echo -e "${RED}  ✗ User creation was allowed (SECURITY ISSUE!)${NC}"
    record_test "ICT Staff CANNOT create user" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 TEST SUITE 6: CITIZEN                        ║"
echo "║  Expected: CANNOT create users via admin API                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}Logging in as Citizen...${NC}"
CIT_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CITIZEN_EMAIL\",\"password\":\"$CITIZEN_PASS\"}")

if echo "$CIT_LOGIN" | grep -q '"accessToken"'; then
    CIT_TOKEN=$(echo "$CIT_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Citizen logged in${NC}"
    record_test "Citizen Login" "PASS"
else
    echo -e "${RED}✗ Citizen login failed${NC}"
    record_test "Citizen Login" "FAIL"
fi
echo ""

echo -e "${BLUE}Test 6.1: Citizen attempts administrative user creation${NC}"
CIT_CREATE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CIT_TOKEN" \
  -d "{
    \"email\":\"cit.attempt.${TIMESTAMP}@rbactest.et\",
    \"password\":\"TestPass123!\",
    \"fullName\":\"Unauthorized User\",
    \"role\":\"CITIZEN\"
  }")

if echo "$CIT_CREATE" | grep -q '"success":false' || echo "$CIT_CREATE" | grep -q "permission"; then
    echo -e "${GREEN}  ✓ Correctly rejected (403 Forbidden)${NC}"
    record_test "Citizen CANNOT create user" "PASS"
else
    echo -e "${RED}  ✗ User creation was allowed (SECURITY ISSUE!)${NC}"
    record_test "Citizen CANNOT create user" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          TEST SUITE 7: CITIZEN SELF-REGISTRATION            ║"
echo "║  Expected: CAN register via /signup, role = CITIZEN         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}Test 7.1: Public citizen self-registration${NC}"
PUBLIC_SIGNUP=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_CITIZEN_PUBLIC\",
    \"password\":\"TestPass123!\",
    \"firstName\":\"Test Public\",
    \"lastName\":\"Citizen\"
  }")

if echo "$PUBLIC_SIGNUP" | grep -q '"success":true'; then
    CITIZEN_ROLE=$(echo "$PUBLIC_SIGNUP" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
    if [ "$CITIZEN_ROLE" = "CITIZEN" ]; then
        echo -e "${GREEN}  ✓ Registration successful, role = CITIZEN${NC}"
        record_test "Citizen self-registration works" "PASS"
        record_test "Citizen role automatically assigned" "PASS"
    else
        echo -e "${RED}  ✗ Role is '$CITIZEN_ROLE' (expected CITIZEN)${NC}"
        record_test "Citizen self-registration works" "PASS"
        record_test "Citizen role automatically assigned" "FAIL"
    fi
else
    echo -e "${RED}  ✗ Registration failed${NC}"
    record_test "Citizen self-registration works" "FAIL"
    record_test "Citizen role automatically assigned" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         TEST SUITE 8: DUPLICATE EMAIL REJECTION              ║"
echo "║  Expected: Duplicate email rejected                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}Test 8.1: Attempt to create duplicate email${NC}"
DUPLICATE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{
    \"email\":\"$TEST_EMPLOYEE\",
    \"password\":\"DifferentPass123!\",
    \"fullName\":\"Duplicate User\",
    \"role\":\"EMPLOYEE\",
    \"institutionId\":\"CBE\"
  }")

if echo "$DUPLICATE" | grep -q '"success":false'; then
    echo -e "${GREEN}  ✓ Duplicate email correctly rejected${NC}"
    record_test "Duplicate email rejection" "PASS"
else
    echo -e "${RED}  ✗ Duplicate email was accepted (DATA INTEGRITY ISSUE!)${NC}"
    record_test "Duplicate email rejection" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       TEST SUITE 9: DATABASE PERSISTENCE VERIFICATION        ║"
echo "║  Expected: All created users exist in database              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

verify_in_db() {
    local email=$1
    local expected_role=$2
    local test_name=$3
    
    USER_CHECK=$(curl -s "$API_URL/users" \
      -H "Authorization: Bearer $SUPER_TOKEN" \
      | grep "$email")
    
    if [ -n "$USER_CHECK" ]; then
        echo -e "${GREEN}  ✓ $email found in database${NC}"
        record_test "$test_name - Database persistence" "PASS"
    else
        echo -e "${RED}  ✗ $email NOT found in database${NC}"
        record_test "$test_name - Database persistence" "FAIL"
    fi
}

echo -e "${BLUE}Verifying created users in database...${NC}"
echo ""
verify_in_db "$TEST_SUPER_ADMIN" "SUPER_ADMIN" "Super Admin"
verify_in_db "$TEST_MESOB_MGR" "MESOB_MANAGER" "MESOB Manager"
verify_in_db "$TEST_INST_MGR" "INSTITUTION_MANAGER" "Institution Manager"
verify_in_db "$TEST_EMPLOYEE" "EMPLOYEE" "Employee"
verify_in_db "$TEST_ICT" "ICT_STAFF" "ICT Staff"
verify_in_db "$TEST_CITIZEN_ADMIN" "CITIZEN" "Citizen (Admin)"
verify_in_db "$TEST_CITIZEN_PUBLIC" "CITIZEN" "Citizen (Public)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      TEST SUITE 10: INSTITUTION RELATIONSHIPS                ║"
echo "║  Expected: Institutional roles have institution_id           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}Test 10.1: Institution Manager has institution_id${NC}"
INST_MGR_USER=$(curl -s "$API_URL/users" -H "Authorization: Bearer $SUPER_TOKEN" | grep -o "\"email\":\"$TEST_INST_MGR\"[^}]*}")
if echo "$INST_MGR_USER" | grep -q '"institution_id":"[a-f0-9-]\{36\}"'; then
    echo -e "${GREEN}  ✓ Institution Manager has institution_id (UUID)${NC}"
    record_test "Institution Manager has institution" "PASS"
else
    echo -e "${RED}  ✗ Institution Manager missing institution_id${NC}"
    record_test "Institution Manager has institution" "FAIL"
fi
echo ""

echo -e "${BLUE}Test 10.2: Employee has institution_id${NC}"
EMP_USER=$(curl -s "$API_URL/users" -H "Authorization: Bearer $SUPER_TOKEN" | grep -o "\"email\":\"$TEST_EMPLOYEE\"[^}]*}")
if echo "$EMP_USER" | grep -q '"institution_id":"[a-f0-9-]\{36\}"'; then
    echo -e "${GREEN}  ✓ Employee has institution_id (UUID)${NC}"
    record_test "Employee has institution" "PASS"
else
    echo -e "${RED}  ✗ Employee missing institution_id${NC}"
    record_test "Employee has institution" "FAIL"
fi
echo ""

echo -e "${BLUE}Test 10.3: ICT Staff has institution_id${NC}"
ICT_USER=$(curl -s "$API_URL/users" -H "Authorization: Bearer $SUPER_TOKEN" | grep -o "\"email\":\"$TEST_ICT\"[^}]*}")
if echo "$ICT_USER" | grep -q '"institution_id":"[a-f0-9-]\{36\}"'; then
    echo -e "${GREEN}  ✓ ICT Staff has institution_id (UUID)${NC}"
    record_test "ICT Staff has institution" "PASS"
else
    echo -e "${RED}  ✗ ICT Staff missing institution_id${NC}"
    record_test "ICT Staff has institution" "FAIL"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    FINAL TEST RESULTS                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}Total Tests Run: ${NC}$TOTAL_TESTS"
echo -e "${GREEN}Passed: ${NC}$PASSED_TESTS"
echo -e "${RED}Failed: ${NC}$FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 ✅ ALL TESTS PASSED ✅                        ║${NC}"
    echo -e "${GREEN}║  RBAC Authorization Model Working Correctly                 ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ❌ SOME TESTS FAILED ❌                          ║${NC}"
    echo -e "${RED}║  Review failed tests above for details                      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
fi

echo ""
echo -e "${YELLOW}Test users created with @rbactest.et domain${NC}"
echo -e "${YELLOW}Timestamp: $TIMESTAMP${NC}"
echo ""

exit $EXIT_CODE
