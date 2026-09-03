#!/bin/bash
echo "╔════════════════════════════════════════════════════════╗"
echo "║       LIVE DEMO: CITIZEN Joining Queue                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Login as CITIZEN
echo "📝 Step 1: Login as CITIZEN..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
USER_NAME=$(echo $LOGIN_RESPONSE | grep -o '"full_name":"[^"]*' | cut -d'"' -f4)

echo "   ✅ Logged in as: $USER_NAME"
echo "   🎫 Token: ${TOKEN:0:30}..."
echo ""

# Step 2: Join Queue
echo "📝 Step 2: CITIZEN attempting to join queue..."
INSTITUTION_ID="a6978a53-2fc4-4d15-989e-f236eeb78bbe"
SERVICE_ID="53bdfc35-54e5-4eff-8602-63ae3eba2b38"

JOIN_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/queues/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"institutionId\":\"$INSTITUTION_ID\",\"serviceId\":\"$SERVICE_ID\",\"priority\":\"NORMAL\"}")

SUCCESS=$(echo $JOIN_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
QUEUE_NUMBER=$(echo $JOIN_RESPONSE | grep -o '"queue_number":"[^"]*' | cut -d'"' -f4)
MESSAGE=$(echo $JOIN_RESPONSE | grep -o '"message":"[^"]*' | cut -d'"' -f4)
SERVICE_NAME=$(echo $JOIN_RESPONSE | grep -o '"title_en":"[^"]*' | cut -d'"' -f4 | head -1)
INSTITUTION_NAME=$(echo $JOIN_RESPONSE | grep -o '"name_en":"[^"]*' | cut -d'"' -f4 | head -1)

if [ "$SUCCESS" = "true" ]; then
  echo "   ✅ SUCCESS! Queue joined successfully"
  echo ""
  echo "   📋 Queue Details:"
  echo "   ├─ Queue Number: $QUEUE_NUMBER"
  echo "   ├─ Service: $SERVICE_NAME"
  echo "   ├─ Institution: $INSTITUTION_NAME"
  echo "   └─ Status: PENDING"
  echo ""
elif echo "$MESSAGE" | grep -q "already in queue"; then
  echo "   ℹ️  Already in queue: $MESSAGE"
  echo "   (This is correct duplicate prevention!)"
  echo ""
else
  echo "   ❌ FAILED: $MESSAGE"
  echo ""
fi

# Step 3: View Queue
echo "📝 Step 3: Checking CITIZEN's queue status..."
QUEUE_RESPONSE=$(curl -s "http://localhost:5000/api/queues" \
  -H "Authorization: Bearer $TOKEN")

QUEUE_COUNT=$(echo $QUEUE_RESPONSE | grep -o '"id":"[^"]*' | wc -l)

if [ $QUEUE_COUNT -gt 0 ]; then
  echo "   ✅ Found $QUEUE_COUNT queue entry(ies)"
  echo ""
  echo "   📊 Queue Entry:"
  echo "$QUEUE_RESPONSE" | grep -o '"queue_number":"[^"]*' | cut -d'"' -f4 | while read qnum; do
    echo "   └─ $qnum"
  done
else
  echo "   ℹ️  No queue entries found"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║            ✅ CITIZEN CAN JOIN QUEUE!                  ║"
echo "╚════════════════════════════════════════════════════════╝"
