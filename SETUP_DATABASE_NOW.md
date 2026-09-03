# 🚀 SETUP DATABASE NOW - FOLLOW THESE STEPS

## ⚠️ ISSUE IDENTIFIED

Your backend server is running **BUT** the database tables don't exist yet in Supabase.

**Error:** Tests are failing because database tables need to be created first.

---

## ✅ SOLUTION - 3 SIMPLE STEPS

### Step 1: Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql/new**
2. Login if needed

### Step 2: Copy and Run the SQL Script

1. Open the file: `backend/RUN_ALL_MIGRATIONS.sql` (I just created it)
2. **Copy ALL the contents** of that file
3. **Paste into Supabase SQL Editor**
4. Click **"Run"** button

This will:
- ✅ Create all 17 database tables
- ✅ Enable Row Level Security (RLS)
- ✅ Create 12 institutions (Health Bureau, Education Bureau, etc.)
- ✅ Create 6 test user accounts
- ✅ Create sample services

**Time:** Takes about 5-10 seconds to run

### Step 3: Verify and Test

After running the SQL:

```bash
# Test the health endpoint again
curl http://localhost:5000/api/health

# You should see "tablesPresent": true

# Now run the test suite
cd backend
bash test-complete-api.sh
```

---

## 🎯 EXPECTED RESULT

After running the SQL script, the tests should start passing:

```
╔════════════════════════════════════════════════════════════╗
║              📊 TEST SUITE RESULTS                         ║
╚════════════════════════════════════════════════════════════╝

Total Tests:  34
Passed:       34  ✅
Failed:       0

✅ ALL TESTS PASSED
```

---

## 🔑 TEST USER ACCOUNTS

After database setup, you can login with these accounts:

| Email | Password | Role |
|-------|----------|------|
| superadmin@mesobcenter.et | SuperAdmin@2026 | SUPER_ADMIN |
| manager@mesobcenter.et | MesobManager@2026 | MESOB_MANAGER |
| inst.manager@mesobcenter.et | InstManager@2026 | INSTITUTION_MANAGER |
| employee@mesobcenter.et | Employee@2026 | EMPLOYEE |
| ict.staff@mesobcenter.et | IctStaff@2026 | ICT_STAFF |
| citizen@mesobcenter.et | Citizen@2026 | CITIZEN |

---

## 🐛 TROUBLESHOOTING

### If SQL script fails:

**Check 1:** Are you using the correct Supabase project?
- URL should be: https://afsaruutbrnnmonciiga.supabase.co

**Check 2:** Do you have the correct permissions?
- You should be the project owner/admin

**Check 3:** Try running in smaller chunks
- Run Migration 1 (CREATE SCHEMA) first
- Then Migration 2 (RLS)
- Then Migrations 3-5 (SEED DATA)

### If tests still fail after SQL:

```bash
# Restart the backend server
# Stop it with Ctrl+C, then:
cd backend
npm start

# In another terminal, run tests:
bash test-complete-api.sh
```

---

## 📋 QUICK CHECKLIST

- [ ] Opened Supabase SQL Editor
- [ ] Copied `RUN_ALL_MIGRATIONS.sql` contents
- [ ] Pasted and ran in Supabase
- [ ] Saw success messages
- [ ] Verified health endpoint shows tables exist
- [ ] Ran test suite: `bash test-complete-api.sh`
- [ ] All 34 tests passing

---

## 🎉 ONCE COMPLETE

You'll have:
- ✅ 17 database tables created
- ✅ 12 institutions loaded
- ✅ 6 test users created
- ✅ Sample services available
- ✅ All API endpoints working
- ✅ Ready for frontend integration

---

**👉 GO TO STEP 1 NOW: Open Supabase SQL Editor**

https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql/new

---

**Need Help?**
- Check the Supabase dashboard for errors
- Look at backend server logs
- Review `COMPLETE_REST_API_DOCUMENTATION.md` for API details
