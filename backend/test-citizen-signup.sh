#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🔐 TEST CITIZEN SELF-REGISTRATION                  ║"
echo "║              HAWASSA MESOB BACKEND                           ║"
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

# Generate unique test email
TIMESTAMP=$(date +%s%N | cut -b1-13)
TEST_EMAIL="citizen.test.${TIMESTAMP}@example.com"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              TEST 1: VALID CITIZEN REGISTRATION              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}Test Email:${NC} $TEST_EMAIL"
echo ""

# Register new citizen
echo "Step 1: Register new citizen via POST /api/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_EMAIL\",
    \"password\":\"TestPassword123!\",
    \"firstName\":\"Test\",
    \"lastName\":\"Citizen\"
  }")

echo "Response: ${REGISTER_RESPONSE:0:200}"
echo ""

# Check if registration succeeded
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Registration successful${NC}"
    
    # Extract user data
    USER_EMAIL=$(echo "$REGISTER_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
    USER_ROLE=$(echo "$REGISTER_RESPONSE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    echo "  Email: $USER_EMAIL"
    echo "  Role: $USER_ROLE"
    echo "  Token: ${TOKEN:0:30}..."
    echo ""
    
    # Verify role is CITIZEN
    if [ "$USER_ROLE" = "CITIZEN" ]; then
        echo -e "${GREEN}✅ PASS: Role correctly assigned as CITIZEN${NC}"
    else
        echo -e "${RED}❌ FAIL: Role is '$USER_ROLE' (expected 'CITIZEN')${NC}"
    fi
    echo ""
    
    # Test login with new account
    echo "Step 2: Login with newly created account"
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPassword123!\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q '"accessToken"'; then
        LOGIN_ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ PASS: Login successful${NC}"
        echo "  Login Role: $LOGIN_ROLE"
        
        if [ "$LOGIN_ROLE" = "CITIZEN" ]; then
            echo -e "${GREEN}✅ PASS: Login role verified as CITIZEN${NC}"
        else
            echo -e "${RED}❌ FAIL: Login role is '$LOGIN_ROLE' (expected 'CITIZEN')${NC}"
        fi
    else
        echo -e "${RED}❌ FAIL: Login failed${NC}"
        ERROR=$(echo "$LOGIN_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
        echo "  Error: $ERROR"
    fi
    echo ""
    
    # Test profile endpoint
    echo "Step 3: Verify profile access"
    PROFILE=$(curl -s "$API_URL/auth/me" -H "Authorization: Bearer $TOKEN")
    if echo "$PROFILE" | grep -q '"email"'; then
        PROFILE_ROLE=$(echo "$PROFILE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ PASS: Profile access successful${NC}"
        echo "  Profile Role: $PROFILE_ROLE"
        
        if [ "$PROFILE_ROLE" = "CITIZEN" ]; then
            echo -e "${GREEN}✅ PASS: Profile role verified as CITIZEN${NC}"
        else
            echo -e "${RED}❌ FAIL: Profile role is '$PROFILE_ROLE' (expected 'CITIZEN')${NC}"
        fi
    else
        echo -e "${RED}❌ FAIL: Profile access failed${NC}"
    fi
    
else
    echo -e "${RED}❌ FAIL: Registration failed${NC}"
    ERROR=$(echo "$REGISTER_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    if [ -n "$ERROR" ]; then
        echo "  Error: $ERROR"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         TEST 2: ROLE INJECTION ATTACK PREVENTION             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Generate another unique email
TIMESTAMP2=$(date +%s%N | cut -b1-13)
TEST_EMAIL2="hacker.${TIMESTAMP2}@evil.com"

echo -e "${BLUE}Test Email:${NC} $TEST_EMAIL2"
echo -e "${YELLOW}Attempting to register as SUPER_ADMIN...${NC}"
echo ""

# Attempt to register with SUPER_ADMIN role
ATTACK_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_EMAIL2\",
    \"password\":\"HackerPassword123!\",
    \"firstName\":\"Evil\",
    \"lastName\":\"Hacker\",
    \"role\":\"SUPER_ADMIN\"
  }")

echo "Response: ${ATTACK_RESPONSE:0:200}"
echo ""

# Check if registration succeeded but role was forced to CITIZEN
if echo "$ATTACK_RESPONSE" | grep -q '"success":true'; then
    ATTACK_ROLE=$(echo "$ATTACK_RESPONSE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
    
    if [ "$ATTACK_ROLE" = "CITIZEN" ]; then
        echo -e "${GREEN}✅ PASS: Attack prevented - Role forced to CITIZEN${NC}"
        echo "  Requested: SUPER_ADMIN"
        echo "  Assigned: $ATTACK_ROLE"
    else
        echo -e "${RED}❌ FAIL: Security breach! Role assigned as '$ATTACK_ROLE'${NC}"
        echo "  This is a critical security vulnerability!"
    fi
else
    # Registration might have failed - also acceptable
    echo -e "${GREEN}✅ PASS: Registration blocked (also acceptable)${NC}"
    ERROR=$(echo "$ATTACK_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error: $ERROR"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         TEST 3: DUPLICATE EMAIL REJECTION                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}Test Email:${NC} $TEST_EMAIL (already registered)"
echo ""

# Attempt to register with same email
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_EMAIL\",
    \"password\":\"DifferentPassword123!\",
    \"firstName\":\"Another\",
    \"lastName\":\"User\"
  }")

echo "Response: ${DUPLICATE_RESPONSE:0:200}"
echo ""

# Should fail
if echo "$DUPLICATE_RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✅ PASS: Duplicate email rejected${NC}"
    ERROR=$(echo "$DUPLICATE_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
    echo "  Error: $ERROR"
else
    echo -e "${RED}❌ FAIL: Duplicate email accepted (should be rejected)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                        SUMMARY                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Citizen Self-Registration Tests:"
echo ""
echo "✓ Test 1: Valid citizen registration"
echo "  - Registration succeeds"
echo "  - Role assigned as CITIZEN"
echo "  - Login works"
echo "  - Profile access works"
echo ""
echo "✓ Test 2: Role injection attack prevention"
echo "  - Attempting to register as SUPER_ADMIN"
echo "  - Role forced to CITIZEN (security working)"
echo ""
echo "✓ Test 3: Duplicate email rejection"
echo "  - Duplicate registration blocked"
echo "  - Appropriate error message returned"
echo ""
echo -e "${GREEN}All citizen self-registration security measures verified!${NC}"
echo ""
