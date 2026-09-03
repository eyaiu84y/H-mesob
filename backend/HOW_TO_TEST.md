# 🧪 How to Test the Backend - Step by Step Guide

This guide shows you how to test all backend functionality yourself.

---

## 📋 Prerequisites

Make sure:
- ✅ Backend server is running on `http://localhost:5000`
- ✅ Database is connected and seeded with test users

---

## 🚀 Quick Start - Run All Tests

### Option 1: Run Official Test Suite (Recommended)
```bash
cd backend
node test-auth-rbac-complete.js
```

**Expected Output:**
```
✅ Passed: 55
❌ Failed: 0
📊 Total: 55
📈 Success Rate: 100%
🎉 ALL TESTS PASSED!
```

### Option 2: Run Comprehensive Test Suite
```bash
cd backend
node comprehensive-final-test.js
```

**Expected Output:**
```
✅ Passed: 28
❌ Failed: 0
📊 Total: 28
📈 Success Rate: 100%
🎉 ALL TESTS PASSED!
```

---

## 🔍 Manual Testing - Step by Step

### Test 1: Check Backend is Running

**Command:**
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

✅ If you see this, the backend is running correctly!

---

### Test 2: Test CITIZEN Login

**Command:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"citizen@mesobcenter.et\",\"password\":\"Citizen@2026\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "user": {
      "id": "...",
      "email": "citizen@mesobcenter.et",
      "role": "CITIZEN",
      "full_name": "Test Citizen"
    }
  }
}
```

✅ Save the `accessToken` - you'll need it for the next tests!

---

### Test 3: Test CITIZEN Can Join Queue (Main Fix!)

**Step 1: Get your token from Test 2 above**

**Step 2: Join the queue**
```bash
# Replace YOUR_TOKEN with the actual token from Test 2
curl -X POST http://localhost:5000/api/queues/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"institutionId\":\"a6978a53-2fc4-4d15-989e-f236eeb78bbe\",\"serviceId\":\"53bdfc35-54e5-4eff-8602-63ae3eba2b38\",\"priority\":\"NORMAL\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully joined queue",
  "data": {
    "id": "...",
    "queue_number": "Q-2026-0001",
    "status": "PENDING",
    "priority": "NORMAL",
    "services": {
      "title_en": "National ID Renewal"
    },
    "institutions": {
      "name_en": "National ID Program / Fayda"
    }
  }
}
```

✅ **SUCCESS!** If you see `"success": true` and a queue number, CITIZEN can join queue!

---

### Test 4: Test Duplicate Prevention

**Try to join the same queue again:**
```bash
# Use the same command from Test 3
curl -X POST http://localhost:5000/api/queues/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"institutionId\":\"a6978a53-2fc4-4d15-989e-f236eeb78bbe\",\"serviceId\":\"53bdfc35-54e5-4eff-8602-63ae3eba2b38\",\"priority\":\"NORMAL\"}"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "You are already in queue with token number Q-2026-0001"
}
```

✅ **CORRECT!** Duplicate prevention is working!

---

### Test 5: View Your Queue

**Command:**
```bash
curl http://localhost:5000/api/queues \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "queue_number": "Q-2026-0001",
      "status": "PENDING",
      "priority": "NORMAL",
      "services": {
        "title_en": "National ID Renewal"
      },
      "institutions": {
        "name_en": "National ID Program / Fayda"
      }
    }
  ]
}
```

✅ **SUCCESS!** You can see your queue entry!

---

### Test 6: Test Other Roles Cannot Join Queue

**Test EMPLOYEE cannot join queue:**
```bash
# Login as EMPLOYEE
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"employee@mesobcenter.et\",\"password\":\"Employee@2026\"}" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Try to join queue
curl -X POST http://localhost:5000/api/queues/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"institutionId\":\"a6978a53-2fc4-4d15-989e-f236eeb78bbe\",\"serviceId\":\"53bdfc35-54e5-4eff-8602-63ae3eba2b38\",\"priority\":\"NORMAL\"}"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Access denied. Required role(s): CITIZEN"
}
```

✅ **CORRECT!** Only CITIZEN can join queue!

---

## 🎯 Easy All-in-One Test Script

Run this single command to test everything:

```bash
cd backend
./demo-citizen-join.sh
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║       LIVE DEMO: CITIZEN Joining Queue                ║
╚════════════════════════════════════════════════════════╝

📝 Step 1: Login as CITIZEN...
   ✅ Logged in as: Test Citizen
   🎫 Token: eyJhbGciOiJIUzI1NiIs...

📝 Step 2: CITIZEN attempting to join queue...
   ✅ SUCCESS! Queue joined successfully
   
   📋 Queue Details:
   ├─ Queue Number: Q-2026-0001
   ├─ Service: National ID Renewal
   ├─ Institution: National ID Program / Fayda
   └─ Status: PENDING

📝 Step 3: Checking CITIZEN's queue status...
   ✅ Found queue entries
   
╔════════════════════════════════════════════════════════╗
║            ✅ CITIZEN CAN JOIN QUEUE!                  ║
╚════════════════════════════════════════════════════════╝
```

---

## 🔄 Clean Up Before Testing

If you want to start fresh, clear all queue entries first:

```bash
cd backend
node clear-queue-entries.js
```

This will delete all existing queue entries so you can test from a clean state.

---

## 📊 Test All Roles

### Test Login for All 6 Roles

```bash
# 1. SUPER_ADMIN
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"superadmin@mesobcenter.et\",\"password\":\"SuperAdmin@2026\"}"

# 2. MESOB_MANAGER (use actual password from seed file)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"manager@mesobcenter.et\",\"password\":\"Manager@2026\"}"

# 3. INSTITUTION_MANAGER (use actual password from seed file)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"inst.manager@mesobcenter.et\",\"password\":\"Manager@2026\"}"

# 4. EMPLOYEE
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"employee@mesobcenter.et\",\"password\":\"Employee@2026\"}"

# 5. ICT_STAFF
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ict.staff@mesobcenter.et\",\"password\":\"IctStaff@2026\"}"

# 6. CITIZEN
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"citizen@mesobcenter.et\",\"password\":\"Citizen@2026\"}"
```

**Expected:** All should return `"success": true`

---

## ✅ Success Checklist

After running the tests, check:

- [ ] Backend server is running (Test 1)
- [ ] CITIZEN can login (Test 2)
- [ ] **CITIZEN can join queue** (Test 3) ← Main fix!
- [ ] Duplicate prevention works (Test 4)
- [ ] CITIZEN can view their queue (Test 5)
- [ ] Other roles cannot join queue (Test 6)
- [ ] All 55 official tests pass
- [ ] All 28 comprehensive tests pass

**If all checked:** ✅ **System is working correctly!**

---

## 🐛 Troubleshooting

### Backend Not Running
```bash
cd backend
npm start
```

### Tests Failing Due to Old Data
```bash
cd backend
node clear-queue-entries.js
# Then run tests again
```

### Can't Login
Check your password:
- CITIZEN password: `Citizen@2026`
- EMPLOYEE password: `Employee@2026`
- SUPER_ADMIN password: `SuperAdmin@2026`

### 404 Errors
Make sure you're in the backend directory and server is running on port 5000.

---

## 📞 Quick Help

**Check if backend is running:**
```bash
curl http://localhost:5000/api/health
```

**Check backend logs:**
Look at the terminal where you ran `npm start`

**Restart everything:**
```bash
# Stop backend (Ctrl+C)
# Clear old data
node clear-queue-entries.js
# Start backend
npm start
# Run tests
node test-auth-rbac-complete.js
```

---

## 🎉 Expected Final Results

When everything works, you should see:

✅ **Official Tests:** 55/55 passing (100%)  
✅ **Comprehensive Tests:** 28/28 passing (100%)  
✅ **CITIZEN can join queue** ← Main achievement!  
✅ **No errors in backend logs**

**Congratulations! Your backend is working correctly!** 🚀
