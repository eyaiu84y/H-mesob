# Announcement Audience Filtering - Testing Instructions

## Overview
This document provides step-by-step instructions for testing the announcement visibility/audience control feature, specifically verifying that **INTERNAL announcements are NEVER visible to citizens**.

## Prerequisites

### 1. Apply Database Migration
The INTERNAL scope must be added to the database enum:

```bash
cd backend
# Run migrations (the 003a_add_enum_values.sql migration adds INTERNAL scope)
npm run migrate
```

### 2. Ensure Test Data Exists
You need the following test users from `003_seed_initial_users.sql`:

- **Citizen**: `citizen@mesobcenter.et` / `Citizen@2026`
- **Employee**: `employee@mesobcenter.et` / `Employee@2026`
- **Super Admin**: `superadmin@mesobcenter.et` / `SuperAdmin@2026`

### 3. Start Backend Server
```bash
cd backend
npm start
```

The server should be running on `http://localhost:5000`

---

## Automated Test Suite

### Run Full Test Suite
```bash
cd backend
node test-announcement-audience.js
```

This automated test:
1. Logs in as SUPER_ADMIN, CITIZEN, and EMPLOYEE
2. Creates PUBLIC, INTERNAL, and SYSTEM test announcements
3. Verifies CITIZEN receives ONLY PUBLIC announcements
4. Verifies EMPLOYEE receives PUBLIC + INTERNAL announcements
5. Verifies SUPER_ADMIN receives all announcements
6. Cleans up test data

**Expected Output:**
```
✓ CRITICAL: Citizen does NOT receive INTERNAL announcements
✓ Citizen does NOT receive SYSTEM announcements
✓ Citizen receives PUBLIC announcements
✓ Citizen sees ONLY PUBLIC scope announcements
✓ Employee receives PUBLIC announcements
✓ Employee receives INTERNAL announcements
✓ Employee does NOT receive SYSTEM announcements
... (11 total tests)
```

---

## Manual Testing

### Quick Manual Test
```bash
cd backend
node test-announcement-manual.js
```

This simplified test:
1. Checks if backend is running
2. Logs in as CITIZEN
3. Fetches announcements
4. Verifies NO INTERNAL announcements are returned
5. Compares with EMPLOYEE access

**Expected Output:**
```
✅ SUCCESS: Backend filtering is working correctly!
   • Citizens CANNOT access INTERNAL announcements
   • Backend enforces security at the API level
   • Announcement visibility control is properly implemented
```

---

## Manual cURL Testing

If you prefer to test manually with cURL:

### Step 1: Login as Citizen
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@mesobcenter.et",
    "password": "Citizen@2026"
  }'
```

Copy the `token` from the response.

### Step 2: Get Announcements with Citizen Token
```bash
curl -X GET http://localhost:5000/api/announcements \
  -H "Authorization: Bearer YOUR_CITIZEN_TOKEN_HERE"
```

### Step 3: Verify Results
Check the response:
- ✅ **PASS**: Response contains ONLY `"scope": "PUBLIC"` announcements
- ❌ **FAIL**: Response contains any `"scope": "INTERNAL"` announcements

### Step 4: Compare with Employee Access
```bash
# Login as employee
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@mesobcenter.et",
    "password": "Employee@2026"
  }'

# Get announcements (should include INTERNAL)
curl -X GET http://localhost:5000/api/announcements \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN_HERE"
```

---

## Creating Test Announcements

### Create PUBLIC Announcement (via UI or API)
```bash
curl -X POST http://localhost:5000/api/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Public Test Announcement",
    "content": "This is visible to everyone including citizens.",
    "scope": "PUBLIC"
  }'
```

### Create INTERNAL Announcement
```bash
curl -X POST http://localhost:5000/api/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Internal Staff Announcement",
    "content": "This should only be visible to staff, NOT citizens.",
    "scope": "INTERNAL"
  }'
```

### Publish Announcements
```bash
curl -X POST http://localhost:5000/api/announcements/{ANNOUNCEMENT_ID}/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Frontend Testing

### Test via UI

#### 1. Create Announcements (as Super Admin)
1. Login as `superadmin@mesobcenter.et`
2. Go to **Announcements** section
3. Click **+ New Announcement**
4. Create a **PUBLIC** announcement
5. Create an **INTERNAL** announcement
6. Both should show scope badges (green "Public", blue "Internal")

#### 2. View as Citizen
1. Logout
2. Login as `citizen@mesobcenter.et`
3. Go to **Announcements** section
4. **Verify**: You see ONLY the PUBLIC announcement
5. **Verify**: You do NOT see the INTERNAL announcement

#### 3. View as Employee
1. Logout
2. Login as `employee@mesobcenter.et`
3. Go to **Announcements** section
4. **Verify**: You see BOTH PUBLIC and INTERNAL announcements

---

## Expected Behavior Matrix

| User Role            | PUBLIC | INTERNAL | SYSTEM | INSTITUTION | ROLE |
|---------------------|--------|----------|--------|-------------|------|
| **CITIZEN**         | ✅ Yes | ❌ No    | ❌ No  | ❌ No       | ❌ No |
| **EMPLOYEE**        | ✅ Yes | ✅ Yes   | ❌ No  | If authorized | If authorized |
| **ICT_STAFF**       | ✅ Yes | ✅ Yes   | ❌ No  | If authorized | If authorized |
| **INSTITUTION_MGR** | ✅ Yes | ✅ Yes   | ❌ No  | Own institution | If authorized |
| **MESOB_MANAGER**   | ✅ Yes | ✅ Yes   | ❌ No  | If authorized | If authorized |
| **SUPER_ADMIN**     | ✅ Yes | ✅ Yes   | ✅ Yes | ✅ All      | ✅ All |
| **Unauthenticated** | ✅ Yes | ❌ No    | ❌ No  | ❌ No       | ❌ No |

---

## Troubleshooting

### Issue: "Backend server is not running"
**Solution**: Start the backend server:
```bash
cd backend
npm start
```

### Issue: "Invalid token"
**Solution**: Ensure you're using a fresh token from the login endpoint.

### Issue: "Announcement not found"
**Solution**: Ensure announcements are published (not just created as drafts).

### Issue: Test users don't exist
**Solution**: Run seed scripts:
```bash
npm run seed
```

### Issue: INTERNAL scope doesn't exist in database
**Solution**: Run migrations:
```bash
npm run migrate
```

---

## Critical Security Verification

**The MOST IMPORTANT test is:**

```bash
# Get citizen token
CITIZEN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}' \
  | jq -r '.token')

# Get announcements
curl -s http://localhost:5000/api/announcements \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  | jq '.data[] | select(.scope == "INTERNAL")'
```

**Expected Result**: Empty (no output)
**Failure Result**: Any INTERNAL announcement data

If you see ANY INTERNAL announcement data in the citizen's response, **the security filtering is BROKEN** and must be fixed immediately.

---

## Test Status

✅ **Migration**: INTERNAL scope added to database enum
✅ **Backend Service**: Filtering logic implemented in `announcementService.js`
✅ **Frontend UI**: Audience selectors added to all manager dashboards
✅ **Test Scripts**: Automated and manual test scripts created

**Next Step**: Run tests after starting backend server to verify complete implementation.
