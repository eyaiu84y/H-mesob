#!/bin/bash

# Test endpoints WITH actual data in database

API_URL="http://localhost:5000/api"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     TEST QUEUES & APPLICATIONS WITH ACTUAL DATA             ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Login as citizen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Login as CITIZEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}')

CITIZEN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$CITIZEN_TOKEN" ]; then
  echo "❌ Failed to login as citizen"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Citizen logged in"

# Get institutions
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Get institutions and services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
INSTITUTIONS=$(curl -s "$API_URL/institutions" -H "Authorization: Bearer $CITIZEN_TOKEN")
INSTITUTION_ID=$(echo $INSTITUTIONS | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "✓ Institution ID: $INSTITUTION_ID"

SERVICES=$(curl -s "$API_URL/services?institutionId=$INSTITUTION_ID" -H "Authorization: Bearer $CITIZEN_TOKEN")
SERVICE_ID=$(echo $SERVICES | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "✓ Service ID: $SERVICE_ID"

# Create an application
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Create an application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
APP_RESPONSE=$(curl -s -X POST "$API_URL/applications" \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"serviceId\":\"$SERVICE_ID\",\"institutionId\":\"$INSTITUTION_ID\",\"applicationData\":{\"test\":true}}")

APP_SUCCESS=$(echo $APP_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$APP_SUCCESS" = "true" ]; then
  echo "✅ Application created successfully"
  echo "Response: $APP_RESPONSE"
else
  echo "❌ Application creation failed"
  echo "Response: $APP_RESPONSE"
fi

# Join queue
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Join queue"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
QUEUE_RESPONSE=$(curl -s -X POST "$API_URL/queues/join" \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"serviceId\":\"$SERVICE_ID\",\"priority\":\"NORMAL\"}")

QUEUE_SUCCESS=$(echo $QUEUE_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$QUEUE_SUCCESS" = "true" ]; then
  echo "✅ Joined queue successfully"
  echo "Response: $QUEUE_RESPONSE"
else
  echo "❌ Join queue failed"
  echo "Response: $QUEUE_RESPONSE"
fi

# Now test GET endpoints WITH data
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: GET /api/applications (should return data)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
APPS=$(curl -s "$API_URL/applications" -H "Authorization: Bearer $CITIZEN_TOKEN")
APP_COUNT=$(echo $APPS | grep -o '"id":"[^"]*' | wc -l)

echo "Response: $APPS"
echo ""
if [ "$APP_COUNT" -gt 0 ]; then
  echo "✅ GET /api/applications - PASS ($APP_COUNT applications found)"
else
  echo "⚠️  GET /api/applications - No data (but query succeeded)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: GET /api/queues (should return data)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
QUEUES=$(curl -s "$API_URL/queues" -H "Authorization: Bearer $CITIZEN_TOKEN")
QUEUE_COUNT=$(echo $QUEUES | grep -o '"id":"[^"]*' | wc -l)

echo "Response: $QUEUES"
echo ""
if [ "$QUEUE_COUNT" -gt 0 ]; then
  echo "✅ GET /api/queues - PASS ($QUEUE_COUNT queue entries found)"
else
  echo "⚠️  GET /api/queues - No data (but query succeeded)"
fi

# Login as employee
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 7: Login as EMPLOYEE and check their view"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
EMP_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@mesobcenter.et","password":"Employee@2026"}')

EMP_TOKEN=$(echo $EMP_LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$EMP_TOKEN" ]; then
  echo "❌ Failed to login as employee"
  exit 1
fi

echo "✓ Employee logged in"

# Employee views applications
APPS_EMP=$(curl -s "$API_URL/applications" -H "Authorization: Bearer $EMP_TOKEN")
echo ""
echo "Employee view of applications:"
echo "$APPS_EMP"

# Employee views queues
QUEUES_EMP=$(curl -s "$API_URL/queues" -H "Authorization: Bearer $EMP_TOKEN")
echo ""
echo "Employee view of queues:"
echo "$QUEUES_EMP"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     TEST COMPLETE                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary:"
echo "  - Applications created: $APP_SUCCESS"
echo "  - Queue joined: $QUEUE_SUCCESS"
echo "  - Applications retrieved (citizen): $APP_COUNT"
echo "  - Queues retrieved (citizen): $QUEUE_COUNT"
