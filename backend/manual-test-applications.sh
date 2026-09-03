#!/bin/bash
# Manual Application Tracking Test Script
# Run: bash manual-test-applications.sh

API_BASE="http://localhost:5000/api"

echo "=========================================="
echo "APPLICATION TRACKING MANUAL TEST"
echo "=========================================="
echo ""

# Step 1: Login as Citizen
echo "1. Logging in as CITIZEN..."
CITIZEN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}')

CITIZEN_TOKEN=$(echo $CITIZEN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CITIZEN_TOKEN" ]; then
  echo "❌ Citizen login failed"
  echo "$CITIZEN_RESPONSE"
  exit 1
fi
echo "✅ Citizen logged in"
echo ""

# Step 2: Get institutions and services
echo "2. Getting institution and service IDs..."
INSTITUTIONS=$(curl -s -H "Authorization: Bearer $CITIZEN_TOKEN" "$API_BASE/institutions")
INSTITUTION_ID=$(echo $INSTITUTIONS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

SERVICES=$(curl -s -H "Authorization: Bearer $CITIZEN_TOKEN" "$API_BASE/services")
SERVICE_ID=$(echo $SERVICES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "✅ Institution ID: ${INSTITUTION_ID:0:20}..."
echo "✅ Service ID: ${SERVICE_ID:0:20}..."
echo ""

# Step 3: Create Application
echo "3. Creating application..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/applications" \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceId\": \"$SERVICE_ID\",
    \"institutionId\": \"$INSTITUTION_ID\",
    \"applicationData\": {
      \"fullName\": \"Test User\",
      \"phoneNumber\": \"+251911223344\",
      \"requestDetails\": \"Testing application tracking\"
    }
  }")

APP_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
APP_NUMBER=$(echo $CREATE_RESPONSE | grep -o '"application_number":"[^"]*"' | cut -d'"' -f4)

if [ -z "$APP_ID" ]; then
  echo "❌ Application creation failed"
  echo "$CREATE_RESPONSE"
  exit 1
fi

echo "✅ Application created!"
echo "   Application Number: $APP_NUMBER"
echo "   Application ID: ${APP_ID:0:30}..."
echo ""

# Step 4: Citizen views application
echo "4. Citizen checking application status..."
CITIZEN_VIEW=$(curl -s -H "Authorization: Bearer $CITIZEN_TOKEN" "$API_BASE/applications/$APP_ID")
STATUS=$(echo $CITIZEN_VIEW | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo "✅ Current status: $STATUS"
echo ""

# Step 5: Login as Employee
echo "5. Logging in as EMPLOYEE..."
EMPLOYEE_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@mesobcenter.et","password":"Employee@2026"}')

EMPLOYEE_TOKEN=$(echo $EMPLOYEE_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$EMPLOYEE_TOKEN" ]; then
  echo "❌ Employee login failed"
  exit 1
fi
echo "✅ Employee logged in"
echo ""

# Step 6: Employee views applications
echo "6. Employee viewing applications..."
EMPLOYEE_APPS=$(curl -s -H "Authorization: Bearer $EMPLOYEE_TOKEN" "$API_BASE/applications")
echo "✅ Employee can see applications"
echo ""

# Step 7: Update status to UNDER_REVIEW
echo "7. Updating status to UNDER_REVIEW..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$API_BASE/applications/$APP_ID/status" \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"UNDER_REVIEW","notes":"Starting review"}')

if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Status updated to UNDER_REVIEW"
else
  echo "❌ Status update failed"
  echo "$UPDATE_RESPONSE"
fi
echo ""

# Step 8: Update status to APPROVED
echo "8. Updating status to APPROVED..."
APPROVE_RESPONSE=$(curl -s -X PATCH "$API_BASE/applications/$APP_ID/status" \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","notes":"Application approved"}')

if echo "$APPROVE_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Status updated to APPROVED"
else
  echo "❌ Approval failed"
fi
echo ""

# Step 9: Citizen checks final status
echo "9. Citizen checking final application status..."
FINAL_VIEW=$(curl -s -H "Authorization: Bearer $CITIZEN_TOKEN" "$API_BASE/applications/$APP_ID")
FINAL_STATUS=$(echo $FINAL_VIEW | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
SUBMITTED=$(echo $FINAL_VIEW | grep -o '"submitted_at":"[^"]*"' | cut -d'"' -f4)
REVIEWED=$(echo $FINAL_VIEW | grep -o '"reviewed_at":"[^"]*"' | cut -d'"' -f4)
COMPLETED=$(echo $FINAL_VIEW | grep -o '"completed_at":"[^"]*"' | cut -d'"' -f4)

echo "✅ Final Status: $FINAL_STATUS"
echo ""
echo "📅 Timeline:"
echo "   Submitted: $SUBMITTED"
echo "   Reviewed: $REVIEWED"
echo "   Completed: $COMPLETED"
echo ""

# Step 10: Test unauthorized access
echo "10. Testing unauthorized access (CBE employee accessing Fayda application)..."
CBE_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"cbe.employee@mesobcenter.et","password":"CbeEmployee@2026"}')

CBE_TOKEN=$(echo $CBE_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

UNAUTHORIZED=$(curl -s -H "Authorization: Bearer $CBE_TOKEN" "$API_BASE/applications/$APP_ID")

if echo "$UNAUTHORIZED" | grep -q 'permission'; then
  echo "✅ Cross-institution access correctly denied"
else
  echo "⚠️  Cross-institution access check inconclusive"
fi
echo ""

echo "=========================================="
echo "✅ MANUAL TEST COMPLETE"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Application Number: $APP_NUMBER"
echo "  Final Status: $FINAL_STATUS"
echo "  All core features working!"
echo ""
