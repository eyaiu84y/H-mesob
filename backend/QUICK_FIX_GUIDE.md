# ⚡ Quick Fix Guide - User Issues

## 🔍 Step 1: Diagnose the Problem

Run this command:
```bash
bash check-users.sh
```

This will show which users exist in your database.

---

## 📊 Step 2: Based on Results

### Scenario A: Only 6 users exist (Fayda + system roles)

**What happened:** CBE and Ethio Telecom users were never created.

**Why:** Either:
1. The institutions (CBE, Ethio Telecom) don't exist in database
2. The seed script failed partway through
3. The seed script was never run completely

**Fix:**
```bash
# 1. First, check if institutions exist
curl http://localhost:5000/api/institutions | grep -i "cbe\|ethio"

# If you see CBE and Ethio Telecom institutions → good!
# If not → institutions need to be seeded first

# 2. Re-run the user seed script in Supabase
# Go to Supabase SQL Editor and run:
# database/seeds/003_seed_initial_users.sql
```

---

### Scenario B: All 12 users exist but still can't login

**What happened:** Users exist but passwords don't match.

**Why:** Password hashes might be corrupted or test passwords are wrong.

**Fix:**
```bash
# Test with the actual password from seed file
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cbe.manager@mesobcenter.et","password":"CbeManager@2026"}'

# If this fails, password hash is wrong
# Solution: Reset password via admin or re-seed users
```

---

### Scenario C: No users exist at all

**What happened:** Database was never seeded.

**Why:** Setup steps were skipped.

**Fix: Run complete database setup:**

```bash
# In Supabase SQL Editor, run these in order:
1. database/migrations/001_create_schema.sql
2. database/migrations/002_create_rls_policies.sql
3. database/seeds/004_seed_institutions.sql
4. database/seeds/003_seed_initial_users.sql
```

---

## ✅ Step 3: Re-test After Fix

After applying the fix, test again:

```bash
# Test the profile endpoint fix
bash test-all-roles.sh
```

**Expected result:**
```
1. SUPER_ADMIN
  ✅ Login successful
  ✅ Profile access successful  ← Fixed!

2. MESOB_MANAGER
  ✅ Login successful
  ✅ Profile access successful  ← Fixed!

...

7. CBE (Commercial Bank of Ethiopia)
Testing: CBE Manager
  ✅ Login successful  ← Should work now!
  ✅ Profile access successful

Testing: CBE Employee
  ✅ Login successful  ← Should work now!
  ✅ Profile access successful

Testing: CBE ICT
  ✅ Login successful  ← Should work now!
  ✅ Profile access successful

8. ETHIO TELECOM
Testing: Ethio Telecom Manager
  ✅ Login successful  ← Should work now!
  ✅ Profile access successful

Testing: Ethio Telecom Employee
  ✅ Login successful  ← Should work now!
  ✅ Profile access successful

Testing: Ethio Telecom ICT
  ✅ Login successful  ← Should work now!
  ✅ Profile access successful

✅ All 12 seed users tested successfully!
```

---

## 🚀 Quick Commands Reference

```bash
# 1. Check which users exist
bash check-users.sh

# 2. Check which institutions exist
curl http://localhost:5000/api/institutions

# 3. Test a specific login manually
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cbe.manager@mesobcenter.et","password":"CbeManager@2026"}'

# 4. Re-test all roles
bash test-all-roles.sh

# 5. Test all endpoints
bash test-all-api.sh
```

---

## 📝 Summary of Fixes Applied

### ✅ Fixed: Profile Endpoint
- **File:** `test-all-roles.sh`
- **Change:** `/api/auth/profile` → `/api/auth/me`
- **Impact:** Profile access should now work for all roles

### 🔍 Investigating: Missing Users
- **Issue:** CBE and Ethio Telecom users can't login
- **Likely cause:** Users not seeded into database
- **Next step:** Run `bash check-users.sh` to confirm

---

## 🆘 If You Need Help

**Share the output of:**
```bash
bash check-users.sh
```

This will tell me exactly what's in your database and I can provide specific fix instructions.

---

**Quick Action:** Run `bash check-users.sh` now!
