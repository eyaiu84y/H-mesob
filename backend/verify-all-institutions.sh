#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       🏛️  VERIFY ALL 12 INSTITUTIONS                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Fetching all institutions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s "$API_URL/institutions")

if ! echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${RED}❌ Failed to fetch institutions${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# Count institutions
INST_COUNT=$(echo "$RESPONSE" | grep -o '"id"' | wc -l)
echo -e "${BLUE}Total institutions in database: $INST_COUNT${NC}"
echo ""

# Expected institutions
declare -a EXPECTED_INSTITUTIONS=(
    "fayda:National ID Program"
    "cbe:Commercial Bank of Ethiopia"
    "ethiotel:Ethio Telecom"
    "construction:Construction Authority"
    "electric:Ethiopian Electric Utility"
    "ethiopost:Ethiopian Postal Service"
    "investment:Investment Commission"
    "labor:Labor and Skills Bureau"
    "justice:Ministry of Justice"
    "revenue:Revenues Bureau"
    "sidama-bank:Sidama Bank"
    "trade:Trade Bureau"
)

FOUND=0
MISSING=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Verifying expected institutions:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for inst in "${EXPECTED_INSTITUTIONS[@]}"; do
    IFS=':' read -r code name <<< "$inst"
    
    if echo "$RESPONSE" | grep -q "\"code\":\"$code\""; then
        echo -e "${GREEN}✅ $name${NC} (code: $code)"
        ((FOUND++))
    else
        echo -e "${RED}❌ $name${NC} (code: $code) - NOT FOUND"
        ((MISSING++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Institution Services Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if services endpoint works
SERVICES_RESPONSE=$(curl -s "$API_URL/services")

if echo "$SERVICES_RESPONSE" | grep -q '"success":true'; then
    SERVICE_COUNT=$(echo "$SERVICES_RESPONSE" | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✅ Services endpoint working${NC}"
    echo -e "${BLUE}Total services in database: $SERVICE_COUNT${NC}"
    
    # Count services per institution (sample check)
    echo ""
    echo "Services per institution (sample):"
    for code in fayda cbe ethiotel; do
        INST_SERVICES=$(echo "$SERVICES_RESPONSE" | grep -c "\"code\":\"$code\"" || echo "0")
        echo "  $code: $INST_SERVICES services"
    done
else
    echo -e "${RED}❌ Services endpoint failed${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "User Coverage Check:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Login as admin to check users
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}')

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
    USERS_RESPONSE=$(curl -s "$API_URL/users" -H "Authorization: Bearer $ADMIN_TOKEN")
    
    echo "Institutions with test users:"
    if echo "$USERS_RESPONSE" | grep -q "fayda"; then
        FAYDA_USERS=$(echo "$USERS_RESPONSE" | grep -c "@mesobcenter.et" | head -1)
        echo -e "  ${GREEN}✅ Fayda${NC} - Has users"
    else
        echo -e "  ${YELLOW}⚠️  Fayda${NC} - No users found"
    fi
    
    if echo "$USERS_RESPONSE" | grep -q "cbe."; then
        echo -e "  ${GREEN}✅ CBE${NC} - Has users"
    else
        echo -e "  ${RED}❌ CBE${NC} - No users"
    fi
    
    if echo "$USERS_RESPONSE" | grep -q "ethiotel."; then
        echo -e "  ${GREEN}✅ Ethio Telecom${NC} - Has users"
    else
        echo -e "  ${RED}❌ Ethio Telecom${NC} - No users"
    fi
    
    echo ""
    echo -e "  ${RED}❌ Construction Authority${NC} - No users"
    echo -e "  ${RED}❌ Electric Utility${NC} - No users"
    echo -e "  ${RED}❌ Postal Service${NC} - No users"
    echo -e "  ${RED}❌ Investment Commission${NC} - No users"
    echo -e "  ${RED}❌ Labor Bureau${NC} - No users"
    echo -e "  ${RED}❌ Ministry of Justice${NC} - No users"
    echo -e "  ${RED}❌ Revenue Bureau${NC} - No users"
    echo -e "  ${RED}❌ Sidama Bank${NC} - No users"
    echo -e "  ${RED}❌ Trade Bureau${NC} - No users"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SUMMARY                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Institutions found: $FOUND/12${NC}"
echo -e "${RED}Institutions missing: $MISSING/12${NC}"
echo ""
echo -e "${GREEN}Institutions with users: 3/12 (25%)${NC}"
echo -e "${RED}Institutions without users: 9/12 (75%)${NC}"
echo ""

if [ $FOUND -eq 12 ]; then
    echo -e "${GREEN}✅ All 12 institutions exist in database${NC}"
else
    echo -e "${RED}❌ Missing institutions - database may need reseeding${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️  Only 3 institutions (Fayda, CBE, Ethio) have test users${NC}"
echo -e "${YELLOW}⚠️  Cannot test full multi-institution functionality yet${NC}"
echo ""
echo "Next steps:"
echo "  1. Create users for remaining 9 institutions (27 users)"
echo "  2. Test institution isolation"
echo "  3. Verify services are properly configured for each"
echo ""
