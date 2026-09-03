#!/bin/bash
echo "╔════════════════════════════════════════════════════════╗"
echo "║     Manual Queue Number Generation Test               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Get institutions and services
echo "📝 Step 1: Getting available institutions and services..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

INST1="a6978a53-2fc4-4d15-989e-f236eeb78bbe"
SERV1="53bdfc35-54e5-4eff-8602-63ae3eba2b38"

INST2="0970a95b-9dbd-49c7-bb00-efafafbbe9e5"
SERV2="60366ba3-9e24-4e63-a63c-222b599cb545"

echo "   Institution 1: ${INST1:0:8}..."
echo "   Service 1: ${SERV1:0:8}..."
echo "   Institution 2: ${INST2:0:8}..."
echo "   Service 2: ${SERV2:0:8}..."
echo ""

echo "📝 Step 2: CITIZEN joins queue at Institution 1..."
RESULT1=$(curl -s -X POST "http://localhost:5000/api/queues/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"institutionId\":\"$INST1\",\"serviceId\":\"$SERV1\",\"priority\":\"NORMAL\"}")

QUEUE1=$(echo $RESULT1 | grep -o '"queue_number":"[^"]*' | cut -d'"' -f4)
SUCCESS1=$(echo $RESULT1 | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS1" = "true" ]; then
  echo "   ✅ Success! Queue Number: $QUEUE1"
else
  echo "   ❌ Failed: $(echo $RESULT1 | grep -o '"message":"[^"]*' | cut -d'"' -f4)"
fi
echo ""

echo "📝 Step 3: CITIZEN joins queue at Institution 2..."
RESULT2=$(curl -s -X POST "http://localhost:5000/api/queues/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"institutionId\":\"$INST2\",\"serviceId\":\"$SERV2\",\"priority\":\"NORMAL\"}")

QUEUE2=$(echo $RESULT2 | grep -o '"queue_number":"[^"]*' | cut -d'"' -f4)
SUCCESS2=$(echo $RESULT2 | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS2" = "true" ]; then
  echo "   ✅ Success! Queue Number: $QUEUE2"
else
  echo "   ❌ Failed: $(echo $RESULT2 | grep -o '"message":"[^"]*' | cut -d'"' -f4)"
fi
echo ""

echo "📊 Verification:"
echo "   Queue 1: $QUEUE1"
echo "   Queue 2: $QUEUE2"

if [ "$QUEUE1" != "$QUEUE2" ] && [ -n "$QUEUE1" ] && [ -n "$QUEUE2" ]; then
  echo "   ✅ Queue numbers are unique!"
else
  echo "   ❌ Queue numbers are NOT unique or missing!"
fi
echo ""

echo "📝 Step 4: Test duplicate prevention (same citizen, same service)..."
RESULT3=$(curl -s -X POST "http://localhost:5000/api/queues/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"institutionId\":\"$INST1\",\"serviceId\":\"$SERV1\",\"priority\":\"NORMAL\"}")

SUCCESS3=$(echo $RESULT3 | grep -o '"success":[^,]*' | cut -d':' -f2)
MSG3=$(echo $RESULT3 | grep -o '"message":"[^"]*' | cut -d'"' -f4)

if [ "$SUCCESS3" = "false" ] && echo "$MSG3" | grep -q "already in queue"; then
  echo "   ✅ Duplicate prevention working: \"$MSG3\""
else
  echo "   ❌ Duplicate prevention failed!"
fi
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║               ✅ MANUAL TEST COMPLETE                  ║"
echo "╚════════════════════════════════════════════════════════╝"
