# ⚠️ FIX TESTS - DATABASE NOT SET UP

## Problem
All 34 tests are failing because **database tables don't exist yet** in Supabase.

## Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
Click this link: **https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql/new**

### Step 2: Run the Migration Script

1. Open file: `backend/RUN_ALL_MIGRATIONS.sql`
2. **Copy everything** (Ctrl+A, Ctrl+C)
3. **Paste into Supabase** SQL Editor
4. Click **"RUN"** button (bottom right)

⏱️ Takes 5-10 seconds

### Step 3: Run Tests Again

```bash
cd backend
bash test-complete-api.sh
```

**Expected:** All 34 tests should pass ✅

---

## What the Script Does

✅ Creates 17 database tables  
✅ Enables security (RLS)  
✅ Creates 12 institutions (Health, Education, Justice, etc.)  
✅ Creates 6 test users  
✅ Creates sample services  

---

## Test User Credentials

After running the script, login with:

| Email | Password | Role |
|-------|----------|------|
| superadmin@mesobcenter.et | SuperAdmin@2026 | SUPER_ADMIN |
| manager@mesobcenter.et | MesobManager@2026 | MESOB_MANAGER |
| inst.manager@mesobcenter.et | InstManager@2026 | INSTITUTION_MANAGER |
| employee@mesobcenter.et | Employee@2026 | EMPLOYEE |
| ict.staff@mesobcenter.et | IctStaff@2026 | ICT_STAFF |
| citizen@mesobcenter.et | Citizen@2026 | CITIZEN |

---

## Quick Test

After running SQL:

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}'

# Should return success with token
```

---

## Troubleshooting

**Q: SQL script shows errors?**  
A: Check you're in the correct Supabase project (URL: afsaruutbrnnmonciiga)

**Q: Tests still fail after SQL?**  
A: Restart backend server:
```bash
# Stop with Ctrl+C
cd backend
npm start
```

**Q: "ON CONFLICT" errors in SQL?**  
A: Tables already exist. This is OK, script is idempotent.

---

**👉 START NOW:** Open https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql/new
