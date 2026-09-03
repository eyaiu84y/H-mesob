#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔍 CHECK WHICH USERS EXIST IN DATABASE              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Login as admin to get all users
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}')

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Failed to login as admin${NC}"
    exit 1
fi

echo "Getting all users from database..."
echo ""

USERS=$(curl -s "$API_URL/users" -H "Authorization: Bearer $ADMIN_TOKEN")

# Check each expected user
check_user() {
    local email="$1"
    if echo "$USERS" | grep -q "$email"; then
        echo -e "${GREEN}✅${NC} $email"
    else
        echo -e "${RED}❌${NC} $email"
    fi
}

echo "System Roles:"
check_user "superadmin@mesobcenter.et"
check_user "manager@mesobcenter.et"
check_user "citizen@mesobcenter.et"

echo ""
echo "Fayda Institution:"
check_user "inst.manager@mesobcenter.et"
check_user "employee@mesobcenter.et"
check_user "ict.staff@mesobcenter.et"

echo ""
echo "CBE Institution:"
check_user "cbe.manager@mesobcenter.et"
check_user "cbe.employee@mesobcenter.et"
check_user "cbe.ict@mesobcenter.et"

echo ""
echo "Ethio Telecom:"
check_user "ethiotel.manager@mesobcenter.et"
check_user "ethiotel.employee@mesobcenter.et"
check_user "ethiotel.ict@mesobcenter.et"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total users in database:"
echo "$USERS" | grep -o '"email"' | wc -l
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
