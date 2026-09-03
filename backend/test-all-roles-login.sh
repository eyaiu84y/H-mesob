#!/bin/bash
echo "=== TESTING ALL 6 ROLE LOGINS ==="
echo ""

echo "1. Testing SUPER_ADMIN..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}' -s | jq -r '.success, .user.role, .token' | head -3
echo ""

echo "2. Testing MESOB_MANAGER..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@mesobcenter.et","password":"MesobManager@2026"}' -s | jq -r '.success, .user.role' | head -2
echo ""

echo "3. Testing INSTITUTION_MANAGER..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"inst.manager@mesobcenter.et","password":"InstManager@2026"}' -s | jq -r '.success, .user.role' | head -2
echo ""

echo "4. Testing EMPLOYEE..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@mesobcenter.et","password":"Employee@2026"}' -s | jq -r '.success, .user.role' | head -2
echo ""

echo "5. Testing ICT_STAFF..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ict.staff@mesobcenter.et","password":"IctStaff@2026"}' -s | jq -r '.success, .user.role' | head -2
echo ""

echo "6. Testing CITIZEN..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}' -s | jq -r '.success, .user.role' | head -2
echo ""

echo "=== ALL TESTS COMPLETE ==="
