# 🎯 DATABASE SETUP - FINAL INSTRUCTIONS

## ✅ USE THIS FILE (CORRECT VERSION):

**`backend/SUPABASE_COMPLETE_SETUP.sql`**

This file contains the EXACT schema from your migrations with correct column names.

---

## 📋 STEPS TO FIX TESTS:

### Step 1: Open Supabase SQL Editor
**Link:** https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql/new

### Step 2: Copy the Correct SQL File
1. Open: `backend/SUPABASE_COMPLETE_SETUP.sql`
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)

### Step 3: Paste and Run
1. Paste into Supabase SQL Editor (Ctrl+V)
2. Click **"RUN"** button (bottom right)
3. Wait 10-15 seconds for completion

### Step 4: Verify Success
You should see at the end:
```
status: "Database setup complete!"
institutions_count: 12
users_count: 12
```

### Step 5: Run Tests
```bash
cd backend
bash test-complete-api.sh
```

**Expected:** All 34 tests should pass! ✅

---

## 🔑 TEST CREDENTIALS

After setup, you can login with:

| Email | Password | Role |
|-------|----------|------|
| superadmin@mesobcenter.et | SuperAdmin@2026 | SUPER_ADMIN |
| manager@mesobcenter.et | MesobManager@2026 | MESOB_MANAGER |
| inst.manager@mesobcenter.et | InstManager@2026 | INSTITUTION_MANAGER |
| employee@mesobcenter.et | Employee@2026 | EMPLOYEE |
| ict.staff@mesobcenter.et | IctStaff@2026 | ICT_STAFF |
| citizen@mesobcenter.et | Citizen@2026 | CITIZEN |

---

## 🐛 IF YOU GET ERRORS:

### Error: "relation already exists"
**Solution:** Tables already exist. This is OK - the script will skip creating them.

### Error: "duplicate key value"
**Solution:** Data already exists. This is OK - the script will skip inserting duplicates.

### Error: Still getting column errors
**Solution:** 
1. Clear ALL tables first (if needed)
2. Go to Supabase Dashboard → Database → Tables
3. Delete all tables starting with your custom ones (not the `auth` or `storage` tables)
4. Run the SQL script again

---

## ✅ QUICK TEST

After running the SQL, test the login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}'
```

Should return success with a JWT token!

---

## 📞 STILL HAVING ISSUES?

Check:
1. Backend server is running: `curl http://localhost:5000/api/health`
2. Correct Supabase project (URL should be: afsaruutbrnnmonciiga)
3. Using service_role key in .env (not anon key)

---

**👉 GO TO STEP 1 NOW!**
