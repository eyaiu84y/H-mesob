# ✅ EXECUTE DATABASE UPDATES - STEP BY STEP CHECKLIST

**Status:** Ready for Execution  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (automatic backup + safe additions only)

---

## 📋 PRE-EXECUTION CHECKLIST

Before starting, ensure you have:

- [ ] Access to your Supabase project
- [ ] Database connection string (from Supabase Dashboard → Settings → Database)
- [ ] Git Bash or WSL terminal on Windows
- [ ] Backend server currently stopped (if running)
- [ ] 5-10 minutes of uninterrupted time

---

## 🚀 EXECUTION STEPS

### Step 1: Navigate to Backend Directory

```bash
cd C:\Users\Eyasu\Desktop\IT\Hawssa-mesob-F-B\backend
```

**Verify you're in the right place:**
```bash
ls database/migrations/003_fix_enums_and_constraints.sql
```
Should show: `database/migrations/003_fix_enums_and_constraints.sql`

---

### Step 2: Set Database Connection String

**Get your connection string:**
1. Open Supabase Dashboard
2. Go to: Settings → Database
3. Scroll to: Connection String → URI
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

**Set the environment variable:**
```bash
export DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres'
```

**Verify it's set:**
```bash
echo $DATABASE_URL
```
Should show your connection string (with password visible)

---

### Step 3: Make Script Executable

```bash
chmod +x run-database-updates.sh
```

**No output means success.**

---

### Step 4: Run the Update Script

```bash
bash run-database-updates.sh
```

**Expected Output:**
```
========================================
HAWASSA MESOB DATABASE UPDATE
========================================

Step 1: Creating backup...
✓ Backup created: backups/backup_20260824_123456.sql

Step 2: Running Migration 003 (Enums & Constraints)...
CREATE EXTENSION
ALTER TYPE
ALTER TYPE
...
✓ Migration 003 completed

Step 3: Seeding 12 Institutions...
NOTICE: ✓ 12 institutions seeded successfully
NOTICE: Active institutions count: 12
✓ Institutions seeded

Step 4: Running Database Verification...
✓ Verification completed
Verification report saved to: verification_report.txt

========================================
DATABASE UPDATE COMPLETE
========================================

✓ Migration 003 applied
✓ 12 Institutions seeded
✓ Database verified
```

**If you see this output, SUCCESS! ✅**

---

### Step 5: Review Verification Report

```bash
cat verification_report.txt | grep -E "(✓|✗|institutions count)"
```

**Should show:**
- ✓ marks for all checks
- "Active institutions count: 12"
- No ✗ marks

**Full report:**
```bash
less verification_report.txt
```
(Press 'q' to exit)

---

### Step 6: Verify Institution Count

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as institution_count FROM institutions WHERE status='ACTIVE';"
```

**Expected Output:**
```
 institution_count
-------------------
                12
(1 row)
```

---

### Step 7: List All Institutions

```bash
psql $DATABASE_URL -c "SELECT code, name_en, status FROM institutions ORDER BY code;"
```

**Expected Output:**
```
     code      |              name_en                | status
---------------+-------------------------------------+--------
 cbe           | Commercial Bank of Ethiopia         | ACTIVE
 construction  | Construction Authority              | ACTIVE
 electric      | Ethiopian Electric Utility          | ACTIVE
 ethiopost     | Ethiopian Postal Service Enterprise | ACTIVE
 ethiotel      | Ethio Telecom                       | ACTIVE
 fayda         | National ID Program / Fayda         | ACTIVE
 investment    | Investment Commission               | ACTIVE
 justice       | Ministry of Justice                 | ACTIVE
 labor         | Labor and Skills Bureau             | ACTIVE
 revenue       | Revenues Bureau                     | ACTIVE
 sidama-bank   | Sidama Bank                         | ACTIVE
 trade         | Trade Bureau                        | ACTIVE
(12 rows)
```

---

### Step 8: Test Helper Function

```bash
psql $DATABASE_URL -c "SELECT generate_application_number();"
```

**Expected Output:**
```
 generate_application_number
-----------------------------
 APP-2024-0001
(1 row)
```

---

### Step 9: Test Backend API

**Start backend server:**
```bash
npm start
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║     🚀 Hawassa MESOB Backend Server Started          ║
╚════════════════════════════════════════════════════════╝

📍 Server running on: http://localhost:5000
🌍 Environment: development
🔗 Frontend URL: http://localhost:5173
📊 Health Check: http://localhost:5000/api/health

✅ Server is ready to accept requests
```

**In another terminal, test API:**
```bash
cd C:\Users\Eyasu\Desktop\IT\Hawssa-mesob-F-B\backend
bash test-all-api.sh
```

**Expected Output:**
```
Testing Hawassa MESOB Backend API...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ POST /api/auth/register - 201
✅ POST /api/auth/login - 200
✅ GET /api/users/profile - 200
✅ GET /api/institutions - 200
✅ GET /api/services - 200
✅ POST /api/applications - 201
✅ GET /api/queues - 200
✅ GET /api/maintenance/reports - 200
❌ GET /api/dashboard/stats - 500 (KNOWN ISSUE)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Results: 8/9 endpoints passing (89%)
```

**8/9 passing is expected (dashboard stats has known issue).**

---

## ✅ SUCCESS CHECKLIST

After completing all steps, mark these off:

- [ ] Step 1: Navigated to backend directory
- [ ] Step 2: Set DATABASE_URL environment variable
- [ ] Step 3: Made script executable
- [ ] Step 4: Ran update script successfully
- [ ] Step 5: Verification report shows all ✓ checks
- [ ] Step 6: Institution count is 12
- [ ] Step 7: All 12 institutions listed correctly
- [ ] Step 8: Helper function returns APP-2024-0001
- [ ] Step 9: Backend starts without errors
- [ ] Step 9: API test shows 8/9 passing

**If all checked: DATABASE UPDATES SUCCESSFUL! ✅**

---

## 🔴 TROUBLESHOOTING

### Problem: "DATABASE_URL not set"

**Solution:**
```bash
# Re-run the export command
export DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres'

# Verify
echo $DATABASE_URL
```

---

### Problem: "psql: command not found"

**Solution:**
Use Supabase SQL Editor instead:

1. Open Supabase Dashboard
2. Go to: SQL Editor
3. Copy contents of `backend/database/migrations/003_fix_enums_and_constraints.sql`
4. Paste and execute
5. Repeat for `backend/database/seeds/004_seed_institutions.sql`
6. Repeat for `backend/database/verification/verify_database.sql`

---

### Problem: "Permission denied: run-database-updates.sh"

**Solution:**
```bash
chmod +x run-database-updates.sh
```

---

### Problem: "Enum value already exists" or "Constraint already exists"

**This is OK!** Scripts use `IF NOT EXISTS` - safe to re-run.

---

### Problem: Backup fails

**Solution:**
Skip automated backup and run manually:

```bash
# Create backup manually
pg_dump $DATABASE_URL > manual_backup.sql

# Run migration only
psql $DATABASE_URL -f database/migrations/003_fix_enums_and_constraints.sql

# Run seed only
psql $DATABASE_URL -f database/seeds/004_seed_institutions.sql

# Run verification only
psql $DATABASE_URL -f database/verification/verify_database.sql
```

---

### Problem: Institution count is NOT 12

**Check what you have:**
```bash
psql $DATABASE_URL -c "SELECT code, name_en FROM institutions;"
```

**If less than 12:** Re-run seed script:
```bash
psql $DATABASE_URL -f database/seeds/004_seed_institutions.sql
```

**If more than 12:** Extra institutions exist (OK, as long as the 12 approved ones are there)

---

### Problem: API test shows 0/9 passing

**Check:**
1. Backend server is running
2. Port 5000 is not blocked by firewall
3. Database connection works:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

---

## 🔄 ROLLBACK (If Needed)

If something goes wrong and you need to rollback:

```bash
# Stop backend server (Ctrl+C)

# Restore from backup
psql $DATABASE_URL < backups/backup_YYYYMMDD_HHMMSS.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM institutions;"
```

---

## 📞 NEED HELP?

1. **Check verification report:** `cat verification_report.txt`
2. **Check DATABASE_UPDATE_REPORT.md** for detailed explanations
3. **Check Supabase Dashboard → Database → Logs** for errors
4. **Rollback using backup** if needed

---

## 🎉 WHAT'S NEXT?

After successful execution:

1. ✅ Database is production-ready
2. ⏳ Next: Fix dashboard stats query (backend work)
3. ⏳ Next: Seed services and service requirements (data work)
4. ⏳ Next: Implement frontend-backend integration (Phase 2-5 of audit)

See **BACKEND_FRONTEND_AUDIT.md** for complete roadmap.

---

## 📄 DOCUMENTATION REFERENCE

- **Quick Overview:** DATABASE_FIXES_SUMMARY.md
- **How to Execute:** DATABASE_UPDATE_QUICKSTART.md (alternative method)
- **Technical Details:** DATABASE_UPDATE_REPORT.md
- **Complete Roadmap:** BACKEND_FRONTEND_AUDIT.md

---

**Ready? Start with Step 1! 🚀**
