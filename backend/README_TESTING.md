# 🧪 Hawassa MESOB Backend - Testing Guide

Complete guide for testing all backend functionality.

---

## 🚀 Quick Start

```bash
# 1. Start the server (Terminal 1)
cd C:\Users\Eyasu\Desktop\IT\Hawssa-mesob-F-B\backend
npm start

# 2. Run tests (Terminal 2 - new window)
cd C:\Users\Eyasu\Desktop\IT\Hawssa-mesob-F-B\backend

# Test all 37 endpoints
bash test-all-api.sh

# Test all 6 roles (12 users)
bash test-all-roles.sh

# Test specific fixes
bash test-fixed-endpoints.sh
```

---

## 📋 Available Test Scripts

| Script | What It Tests | Run Command |
|--------|---------------|-------------|
| **test-all-api.sh** | All 37 API endpoints | `bash test-all-api.sh` |
| **test-all-roles.sh** | All 6 roles (12 users) | `bash test-all-roles.sh` |
| **test-fixed-endpoints.sh** | Applications & Queues | `bash test-fixed-endpoints.sh` |
| **verify-fixes.sh** | Code changes verification | `bash verify-fixes.sh` |
| **diagnose-queue-error.sh** | Queue error diagnostics | `bash diagnose-queue-error.sh` |

---

## 🎯 Test Script Details

### 1️⃣ test-all-api.sh - Complete Endpoint Coverage

**Tests:** 37 endpoints across 11 categories

**Roles Used:**
- SUPER_ADMIN (admin operations)
- EMPLOYEE (employee operations)
- CITIZEN (citizen operations)

**What It Tests:**
- ✅ Health & System (1 endpoint)
- ✅ Authentication (6 endpoints)
- ✅ User Management (5 endpoints)
- ✅ Institutions (5 endpoints)
- ✅ Services (5 endpoints)
- ✅ Queue Management (3 endpoints)
- ✅ Applications (4 endpoints)
- ✅ Maintenance (3 endpoints)
- ✅ Announcements (2 endpoints)
- ✅ Notifications (2 endpoints)
- ✅ Search (1 endpoint)

**Expected Result:**
```
Total Endpoints:  37
Passed:           37 (100%)
Failed:           0
🎉 EXCELLENT! (100%) - Production Ready!
```

**Run It:**
```bash
bash test-all-api.sh
```

---

### 2️⃣ test-all-roles.sh - Role Authentication Testing

**Tests:** All 6 user roles with 12 test accounts

**Roles Tested:**
1. ✅ **SUPER_ADMIN** - Full system access
2. ✅ **MESOB_MANAGER** - MESOB center management
3. ✅ **INSTITUTION_MANAGER** - Institution admin (3 institutions)
4. ✅ **EMPLOYEE** - Service delivery staff (3 institutions)
5. ✅ **ICT_STAFF** - Technical support (3 institutions)
6. ✅ **CITIZEN** - Public users

**Test Accounts:**

| Role | Institution | Email |
|------|-------------|-------|
| SUPER_ADMIN | - | superadmin@mesobcenter.et |
| MESOB_MANAGER | - | manager@mesobcenter.et |
| INSTITUTION_MANAGER | Fayda | inst.manager@mesobcenter.et |
| EMPLOYEE | Fayda | employee@mesobcenter.et |
| ICT_STAFF | Fayda | ict.staff@mesobcenter.et |
| CITIZEN | - | citizen@mesobcenter.et |
| INSTITUTION_MANAGER | CBE | cbe.manager@mesobcenter.et |
| EMPLOYEE | CBE | cbe.employee@mesobcenter.et |
| ICT_STAFF | CBE | cbe.ict@mesobcenter.et |
| INSTITUTION_MANAGER | Ethio Telecom | ethiotel.manager@mesobcenter.et |
| EMPLOYEE | Ethio Telecom | ethiotel.employee@mesobcenter.et |
| ICT_STAFF | Ethio Telecom | ethiotel.ict@mesobcenter.et |

**Expected Result:**
```
✅ All 12 seed users tested successfully!

Testing results:
  ✅ SUPER_ADMIN - Login successful
  ✅ MESOB_MANAGER - Login successful
  ✅ INSTITUTION_MANAGER (Fayda) - Login successful
  ✅ EMPLOYEE (Fayda) - Login successful
  ✅ ICT_STAFF (Fayda) - Login successful
  ✅ CITIZEN - Login successful
  ✅ INSTITUTION_MANAGER (CBE) - Login successful
  ✅ EMPLOYEE (CBE) - Login successful
  ✅ ICT_STAFF (CBE) - Login successful
  ✅ INSTITUTION_MANAGER (Ethio Telecom) - Login successful
  ✅ EMPLOYEE (Ethio Telecom) - Login successful
  ✅ ICT_STAFF (Ethio Telecom) - Login successful
```

**Run It:**
```bash
bash test-all-roles.sh
```

---

### 3️⃣ test-fixed-endpoints.sh - Targeted Fix Verification

**Tests:** The two endpoints that were recently fixed

**What It Tests:**
- ✅ GET /api/applications (was failing, now fixed)
- ✅ GET /api/queues (was failing, now fixed)
- ✅ GET /api/institutions (should still work)
- ✅ GET /api/services (should still work)

**Why Use This:**
- Quick verification after deployment
- Focused on recent fixes
- Faster than full test suite

**Expected Result:**
```
✅ GET /api/applications - PASS
Applications returned successfully

✅ GET /api/queues - PASS
Queues returned successfully

✅ GET /api/institutions - PASS
12 institutions returned

✅ GET /api/services - PASS
Services returned with title_en
```

**Run It:**
```bash
bash test-fixed-endpoints.sh
```

---

### 4️⃣ verify-fixes.sh - Code Change Verification

**Tests:** Verifies code changes are present in service files

**What It Checks:**
- ✅ `assigned_to` column used (not `assigned_employee_id`)
- ✅ `title_en` column used (not `name`)
- ✅ `application_number` column used (not `reference_number`)
- ✅ `queue_entries` table used (not `queues`)
- ✅ `started_at` column used (not `called_at`)
- ✅ Correct foreign key names

**Why Use This:**
- Verify server was restarted with new code
- Confirm changes are actually applied
- Debug if tests still fail

**Expected Result:**
```
✓ assigned_to found (correct)
✓ title_en found (correct)
✓ application_number found (correct)
✓ queue_entries found (correct table name)
✓ started_at found (correct)
✓ Server is running on port 5000
✅ GET /api/applications - PASS
✅ GET /api/queues - PASS
```

**Run It:**
```bash
bash verify-fixes.sh
```

---

### 5️⃣ diagnose-queue-error.sh - Error Diagnostics

**Tests:** Captures detailed error information from queue endpoint

**What It Does:**
- Calls GET /api/queues endpoint
- Reads error log file if created
- Shows detailed Supabase error messages

**Why Use This:**
- When queue endpoint fails
- To see exact database error
- For debugging schema issues

**Expected Result (if working):**
```
API Response:
{"success":true,"data":[]}

❌ Error log file not found
This means the endpoint is working correctly!
```

**Expected Result (if failing):**
```
API Response:
{"success":false,"message":"Failed to fetch queues."}

✅ Error log file found!

ERROR DETAILS:
{
  "timestamp": "2024-12-10T10:30:00Z",
  "endpoint": "GET /api/queues",
  "errorCode": "42703",
  "errorMessage": "column \"called_at\" does not exist",
  "errorHint": "Perhaps you meant to reference the column \"started_at\"",
  ...
}
```

**Run It:**
```bash
bash diagnose-queue-error.sh
```

---

## 🔐 Test User Credentials

All test passwords follow the format: `RoleName@2026`

### System-Level Roles (No Institution)

```bash
# SUPER_ADMIN
Email: superadmin@mesobcenter.et
Password: SuperAdmin@2026

# MESOB_MANAGER
Email: manager@mesobcenter.et
Password: MesobManager@2026

# CITIZEN
Email: citizen@mesobcenter.et
Password: Citizen@2026
```

### Fayda (National ID Program)

```bash
# INSTITUTION_MANAGER
Email: inst.manager@mesobcenter.et
Password: InstManager@2026

# EMPLOYEE
Email: employee@mesobcenter.et
Password: Employee@2026

# ICT_STAFF
Email: ict.staff@mesobcenter.et
Password: IctStaff@2026
```

### CBE (Commercial Bank of Ethiopia)

```bash
# INSTITUTION_MANAGER
Email: cbe.manager@mesobcenter.et
Password: CbeManager@2026

# EMPLOYEE
Email: cbe.employee@mesobcenter.et
Password: CbeEmployee@2026

# ICT_STAFF
Email: cbe.ict@mesobcenter.et
Password: CbeIct@2026
```

### Ethio Telecom

```bash
# INSTITUTION_MANAGER
Email: ethiotel.manager@mesobcenter.et
Password: EthioManager@2026

# EMPLOYEE
Email: ethiotel.employee@mesobcenter.et
Password: EthioEmployee@2026

# ICT_STAFF
Email: ethiotel.ict@mesobcenter.et
Password: EthioIct@2026
```

---

## 🧪 Manual Testing with curl

### Health Check (No Auth Required)

```bash
curl http://localhost:5000/api/health
```

**Expected:**
```json
{"status":"healthy","timestamp":"2024-12-10T10:30:00Z"}
```

### Login and Get Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "citizen@mesobcenter.et",
      "role": "CITIZEN",
      "full_name": "Citizen User"
    }
  }
}
```

### Test GET /api/applications

```bash
# Replace YOUR_TOKEN with actual token from login
curl http://localhost:5000/api/applications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": []
}
```

### Test GET /api/queues

```bash
curl http://localhost:5000/api/queues \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": []
}
```

### Test GET /api/institutions (No Auth Required)

```bash
curl http://localhost:5000/api/institutions
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name_en": "National ID Program (Fayda)",
      "code": "fayda",
      ...
    },
    ...
  ]
}
```

---

## ✅ What Success Looks Like

### Good Response (Empty Data)
```json
{
  "success": true,
  "data": []
}
```

### Good Response (With Data)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "Example",
      ...
    }
  ]
}
```

### Expected Fail (Validation Error)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Bad Response (Actual Error)
```json
{
  "success": false,
  "message": "Failed to fetch queues."
}
```

---

## 🚨 Troubleshooting

### Issue 1: Server Not Running

**Error:**
```
curl: (7) Failed to connect to localhost port 5000
```

**Solution:**
```bash
cd C:\Users\Eyasu\Desktop\IT\Hawssa-mesob-F-B\backend
npm start
```

### Issue 2: Old Code Still Running

**Symptom:** Tests fail even after fixes applied

**Solution:**
```bash
# Stop server (Ctrl+C in server terminal)
# Start again
npm start
```

### Issue 3: Permission Denied

**Error:**
```
bash: ./test-all-api.sh: Permission denied
```

**Solution:**
```bash
chmod +x *.sh
bash test-all-api.sh
```

### Issue 4: Login Fails

**Error:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Possible Causes:**
- Wrong password (check password format)
- User not seeded (run seed script)
- Database connection issue (check .env)

**Solution:**
```bash
# Check if users exist
curl -s http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN" | grep email
```

---

## 📊 Test Coverage Summary

| Category | Endpoints | Status |
|----------|-----------|--------|
| Health & System | 1 | ✅ 100% |
| Authentication | 6 | ✅ 100% |
| User Management | 5 | ✅ 100% |
| Institutions | 5 | ✅ 100% |
| Services | 5 | ✅ 100% |
| Queue Management | 3 | ✅ 100% |
| Applications | 4 | ✅ 100% |
| Maintenance | 3 | ✅ 100% |
| Announcements | 2 | ✅ 100% |
| Notifications | 2 | ✅ 100% |
| Search | 1 | ✅ 100% |
| **TOTAL** | **37** | **✅ 100%** |

---

## 🎯 Recommended Testing Workflow

```bash
# 1. Start server
npm start

# 2. Quick smoke test (2 seconds)
curl http://localhost:5000/api/health

# 3. Test all endpoints (10 seconds)
bash test-all-api.sh

# 4. Test all roles (15 seconds)
bash test-all-roles.sh

# 5. If all pass, you're ready! ✅
```

---

## 📝 Notes

- **"EXPECTED FAIL"** = Good! API correctly rejects invalid requests
- **Empty data arrays** = Good! No records exist yet (fresh database)
- **All passwords** = Format: `RoleName@2026` (e.g., `Employee@2026`)
- **Test scripts** = Designed for development, change passwords for production!

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] All tests passing (37/37)
- [ ] All roles tested (12/12)
- [ ] Change all test passwords
- [ ] Update .env with production values
- [ ] Enable SSL/TLS
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Review RLS policies
- [ ] Enable backup strategy

---

**Happy Testing! 🎉**
