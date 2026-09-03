# 🐛 Issues Found During Role Testing

**Date:** December 2024  
**Status:** 2 Issues Identified

---

## Issue Summary

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Profile endpoint 404 | ⚠️ Low | ✅ FIXED |
| 2 | CBE & Ethio Telecom users missing | ❌ High | 🔍 INVESTIGATING |

---

## ✅ Issue 1: Profile Endpoint Returns 404

### Problem
Test script calls `GET /api/auth/profile` but gets 404 error.

### Root Cause
**Route mismatch:**
- Test script calls: `/api/auth/profile`
- Actual route is: `/api/auth/me`

### Evidence
From `src/routes/authRoutes.js`:
```javascript
router.get('/me', authenticate, getMe);  // ← Route is /me
```

Test script was calling wrong endpoint:
```bash
PROFILE=$(curl -s "$API_URL/auth/profile" -H "Authorization: Bearer $TOKEN")
# Should be: /auth/me
```

### Fix Applied
Updated `test-all-roles.sh` line 57:
```bash
# ❌ BEFORE
PROFILE=$(curl -s "$API_URL/auth/profile" -H "Authorization: Bearer $TOKEN")

# ✅ AFTER
PROFILE=$(curl -s "$API_URL/auth/me" -H "Authorization: Bearer $TOKEN")
```

### Test After Fix
```bash
bash test-all-roles.sh
```

**Expected result:**
```
✅ Login successful
✅ Profile access successful  ← Should now show this
```

---

## ❌ Issue 2: CBE & Ethio Telecom Users Cannot Login

### Problem
6 out of 12 test users fail to login:
- ❌ cbe.manager@mesobcenter.et
- ❌ cbe.employee@mesobcenter.et
- ❌ cbe.ict@mesobcenter.et
- ❌ ethiotel.manager@mesobcenter.et
- ❌ ethiotel.employee@mesobcenter.et
- ❌ ethiotel.ict@mesobcenter.et

### Error Message
```
❌ Login failed
Error: Invalid email or password.
```

### Working Users
These 6 users login successfully:
- ✅ superadmin@mesobcenter.et
- ✅ manager@mesobcenter.et
- ✅ inst.manager@mesobcenter.et (Fayda)
- ✅ employee@mesobcenter.et (Fayda)
- ✅ ict.staff@mesobcenter.et (Fayda)
- ✅ citizen@mesobcenter.et

### Root Cause Analysis

**Hypothesis 1: Users not seeded**
- The seed file `003_seed_initial_users.sql` contains all 12 users
- But CBE and Ethio users may not have been inserted into Supabase

**Hypothesis 2: Wrong passwords**
- Seed file shows passwords like `CbeManager@2026`
- Test script uses same passwords
- But login still fails → users don't exist

**Hypothesis 3: Institution IDs missing**
The seed script tries to get institution IDs:
```sql
SELECT id INTO inst_cbe_id FROM institutions WHERE code = 'cbe';
SELECT id INTO inst_ethiotel_id FROM institutions WHERE code = 'ethiotel';
```

If these institutions don't exist, the INSERT would fail!

### Diagnostic Steps

#### Step 1: Check which users actually exist
```bash
bash check-users.sh
```

This will show ✅/❌ for each of the 12 expected users.

#### Step 2: Check which institutions exist
```bash
curl -s http://localhost:5000/api/institutions | grep -o '"code":"[^"]*' | cut -d'"' -f4
```

Expected codes:
- fayda
- cbe
- ethiotel
- (and 9 more)

#### Step 3: Verify seed script was run
Check Supabase logs or verify total user count:
```bash
# Should return 12 if all users seeded
# Will return 6 if only Fayda users exist
```

### Possible Solutions

#### Solution A: Re-run seed script
If users were never seeded:
1. Connect to Supabase
2. Run `003_seed_initial_users.sql`
3. Verify all 12 users created

#### Solution B: Manual user creation
If seed script can't be re-run, create users via API:
```bash
# Example for CBE Manager
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cbe.manager@mesobcenter.et",
    "password": "CbeManager@2026",
    "full_name": "Yonas Tadesse",
    "phone": "+251911000007",
    "role": "INSTITUTION_MANAGER",
    "institution_id": "CBE_INSTITUTION_ID",
    "employee_id": "EMP-007"
  }'
```

#### Solution C: Check institution seeds
If institutions don't exist, seed them first:
1. Run `004_seed_institutions.sql`
2. Then run `003_seed_initial_users.sql`

### Expected Seed File Contents

The seed file should create these users:

| # | Email | Password | Role | Institution |
|---|-------|----------|------|-------------|
| 1 | superadmin@mesobcenter.et | SuperAdmin@2026 | SUPER_ADMIN | - |
| 2 | manager@mesobcenter.et | MesobManager@2026 | MESOB_MANAGER | - |
| 3 | inst.manager@mesobcenter.et | InstManager@2026 | INSTITUTION_MANAGER | Fayda |
| 4 | employee@mesobcenter.et | Employee@2026 | EMPLOYEE | Fayda |
| 5 | ict.staff@mesobcenter.et | IctStaff@2026 | ICT_STAFF | Fayda |
| 6 | citizen@mesobcenter.et | Citizen@2026 | CITIZEN | - |
| 7 | cbe.manager@mesobcenter.et | CbeManager@2026 | INSTITUTION_MANAGER | CBE |
| 8 | cbe.employee@mesobcenter.et | CbeEmployee@2026 | EMPLOYEE | CBE |
| 9 | cbe.ict@mesobcenter.et | CbeIct@2026 | ICT_STAFF | CBE |
| 10 | ethiotel.manager@mesobcenter.et | EthioManager@2026 | INSTITUTION_MANAGER | Ethio Telecom |
| 11 | ethiotel.employee@mesobcenter.et | EthioEmployee@2026 | EMPLOYEE | Ethio Telecom |
| 12 | ethiotel.ict@mesobcenter.et | EthioIct@2026 | ICT_STAFF | Ethio Telecom |

### Investigation Script Created

**File:** `check-users.sh`

**What it does:**
- Logs in as admin
- Fetches all users from database
- Checks which of the 12 expected users exist
- Shows ✅/❌ for each user

**Run it:**
```bash
bash check-users.sh
```

**Expected output (if all users exist):**
```
System Roles:
✅ superadmin@mesobcenter.et
✅ manager@mesobcenter.et
✅ citizen@mesobcenter.et

Fayda Institution:
✅ inst.manager@mesobcenter.et
✅ employee@mesobcenter.et
✅ ict.staff@mesobcenter.et

CBE Institution:
✅ cbe.manager@mesobcenter.et
✅ cbe.employee@mesobcenter.et
✅ cbe.ict@mesobcenter.et

Ethio Telecom:
✅ ethiotel.manager@mesobcenter.et
✅ ethiotel.employee@mesobcenter.et
✅ ethiotel.ict@mesobcenter.et

Total users in database: 12
```

**Expected output (if CBE/Ethio users missing):**
```
System Roles:
✅ superadmin@mesobcenter.et
✅ manager@mesobcenter.et
✅ citizen@mesobcenter.et

Fayda Institution:
✅ inst.manager@mesobcenter.et
✅ employee@mesobcenter.et
✅ ict.staff@mesobcenter.et

CBE Institution:
❌ cbe.manager@mesobcenter.et
❌ cbe.employee@mesobcenter.et
❌ cbe.ict@mesobcenter.et

Ethio Telecom:
❌ ethiotel.manager@mesobcenter.et
❌ ethiotel.employee@mesobcenter.et
❌ ethiotel.ict@mesobcenter.et

Total users in database: 6
```

---

## 🎯 Next Steps

### Immediate Actions:

1. **Run diagnostic:**
   ```bash
   bash check-users.sh
   ```
   This will confirm which users exist.

2. **Check institutions:**
   ```bash
   curl http://localhost:5000/api/institutions
   ```
   Verify CBE and Ethio Telecom institutions exist.

3. **Based on results:**
   - If users missing → Re-run seed script
   - If institutions missing → Seed institutions first
   - If both exist but login fails → Check password hashes

### After Diagnostic:

**If 6 users found (missing CBE/Ethio):**
- Likely cause: Institutions don't exist, seed failed
- Solution: Seed institutions, then re-seed users

**If 12 users found (all exist):**
- Likely cause: Password mismatch or corrupted hashes
- Solution: Reset passwords or regenerate hashes

**If 0 users found (none exist):**
- Likely cause: Seed script never ran
- Solution: Run complete database setup from scratch

---

## 📊 Impact Assessment

### Current State:
- ✅ Core endpoints: 37/37 passing (100%)
- ✅ Basic authentication: Working (6 users)
- ⚠️ Multi-institution testing: Limited (only Fayda works)
- ❌ Full role coverage: 6/12 users (50%)

### Impact:
- **Low:** Core functionality works
- **Medium:** Cannot test CBE/Ethio scenarios
- **High for production:** Need all institutions working

### Priority:
- **For development:** Medium (can test with Fayda users)
- **For production:** High (all institutions required)

---

## 📝 Related Files

- Seed script: `database/seeds/003_seed_initial_users.sql`
- Institution seed: `database/seeds/004_seed_institutions.sql`
- Test script: `test-all-roles.sh` (fixed)
- Diagnostic: `check-users.sh` (new)
- Auth routes: `src/routes/authRoutes.js`

---

**Status:** Waiting for diagnostic results from `check-users.sh`
