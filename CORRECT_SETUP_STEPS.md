# ✅ CORRECT DATABASE SETUP - STEP BY STEP

**Issue Found:** Your database doesn't have the base tables yet!  
**Solution:** Run migrations in the correct order

---

## 🔍 STEP 1: Check What You Have

In **Supabase SQL Editor**, run this query:

```sql
-- Copy and paste from: backend/database/check_and_setup.sql
```

Or run this quick check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**If you see very few or NO tables** (users, institutions, services, etc.), continue to Step 2.

---

## 🏗️ STEP 2: Create Base Schema (Migration 001)

**File:** `backend/database/migrations/001_create_schema.sql`

1. Open the file in your editor
2. **Copy the ENTIRE contents** (Ctrl+A, Ctrl+C)
3. In **Supabase SQL Editor**:
   - Click **New Query**
   - Paste the contents
   - Click **Run**

**Expected:** You'll see:
```
CREATE EXTENSION
CREATE TYPE (multiple times)
CREATE TABLE (multiple times)
CREATE INDEX (multiple times)
CREATE FUNCTION
CREATE TRIGGER (multiple times)
...
Success. No rows returned
```

**This creates:**
- ✅ 11 enum types
- ✅ 12 tables (users, institutions, services, applications, queue_entries, maintenance_reports, etc.)
- ✅ All indexes
- ✅ All triggers

---

## 🔒 STEP 3: Create RLS Policies (Migration 002)

**File:** `backend/database/migrations/002_create_rls_policies.sql`

1. Open the file
2. Copy ENTIRE contents
3. In **Supabase SQL Editor**:
   - Click **New Query**
   - Paste
   - Click **Run**

**Expected:**
```
CREATE FUNCTION (multiple times)
ALTER TABLE (multiple times - enabling RLS)
CREATE POLICY (multiple times)
...
Success. No rows returned
```

**This creates:**
- ✅ Helper functions (get_current_user_id, current_user_role, etc.)
- ✅ RLS policies for all tables
- ✅ Role-based access control

---

## ✨ STEP 4: Fix Enums & Add Constraints (Migration 003)

**File:** `backend/database/migrations/003_fix_enums_and_constraints.sql` (now corrected!)

1. Open the file
2. Copy ENTIRE contents
3. In **Supabase SQL Editor**:
   - Click **New Query**
   - Paste
   - Click **Run**

**Expected:**
```
ALTER TYPE (adding new enum values)
✓ Added chk_staff_has_institution constraint
✓ Added chk_staff_has_employee_id constraint
...
CREATE INDEX (multiple times)
CREATE FUNCTION (3 functions)
CREATE VIEW (3 views)
...
Success. No rows returned
```

**This adds:**
- ✅ New enum values (WAITING, CALLED, PENDING, etc.)
- ✅ 7 data integrity constraints
- ✅ 10 performance indexes
- ✅ 3 helper functions
- ✅ 3 helpful views

---

## 📦 STEP 5: Seed 12 Institutions (Seed 004)

**File:** `backend/database/seeds/004_seed_institutions.sql`

1. Open the file
2. Copy ENTIRE contents
3. In **Supabase SQL Editor**:
   - Click **New Query**
   - Paste
   - Click **Run**

**Expected:**
```
NOTICE: ✓ 12 institutions seeded successfully
NOTICE: Active institutions count: 12

 code         | name_en                            | ...
--------------+------------------------------------+----
 cbe          | Commercial Bank of Ethiopia        | ...
 construction | Construction Authority             | ...
 electric     | Ethiopian Electric Utility         | ...
 ...
```

**This seeds:**
- ✅ 12 approved government institutions
- ✅ English and Amharic names
- ✅ Official website URLs

---

## ✅ STEP 6: Verify Everything

Run these verification queries in **Supabase SQL Editor**:

### Check Tables

```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'institutions', 'services', 'service_requirements',
    'applications', 'queue_entries', 'maintenance_reports',
    'maintenance_attachments', 'maintenance_tasks', 'announcements',
    'notifications', 'telegram_users'
  );
```

**Expected:** `table_count: 12`

---

### Check Enums

```sql
SELECT 
  'queue_status' AS enum_name,
  unnest(enum_range(NULL::queue_status))::text AS value
ORDER BY value;
```

**Expected:** Should include WAITING, CALLED, PENDING, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

---

### Check Institutions

```sql
SELECT COUNT(*) as institution_count 
FROM institutions 
WHERE status='ACTIVE';
```

**Expected:** `institution_count: 12`

---

### Check Functions

```sql
SELECT generate_application_number();
```

**Expected:** `APP-2024-0001` (or similar)

---

### Check Views

```sql
SELECT COUNT(*) FROM v_active_queues;
```

**Expected:** `0` (or any number - no error means view exists)

---

## 🧪 STEP 7: Test Backend

Now test the backend with the complete database:

```bash
cd C:\Users\Eyasu\Desktop\IT\Hawssa-mesob-F-B\backend
npm start
```

**Expected:**
```
╔════════════════════════════════════════════════════════╗
║     🚀 Hawassa MESOB Backend Server Started          ║
╚════════════════════════════════════════════════════════╝
...
✅ Server is ready to accept requests
```

In another terminal:

```bash
bash test-all-api.sh
```

**Expected:** 8/9 endpoints passing (89%)

---

## 📋 COMPLETE CHECKLIST

Mark off as you complete each step:

- [ ] **Step 1:** Checked existing tables
- [ ] **Step 2:** Ran migration 001 (create schema) - 12 tables created
- [ ] **Step 3:** Ran migration 002 (RLS policies) - policies created
- [ ] **Step 4:** Ran migration 003 (enums & constraints) - constraints added
- [ ] **Step 5:** Ran seed 004 (institutions) - 12 institutions seeded
- [ ] **Step 6:** Verified table count is 12
- [ ] **Step 6:** Verified enum values include WAITING, CALLED
- [ ] **Step 6:** Verified institution count is 12
- [ ] **Step 6:** Verified helper function works
- [ ] **Step 6:** Verified views exist
- [ ] **Step 7:** Backend starts successfully
- [ ] **Step 7:** API test shows 8/9 passing

**If all checked: DATABASE IS PRODUCTION-READY! ✅**

---

## 🎯 QUICK SUMMARY

### What Order To Run:

1. ✅ **001_create_schema.sql** - Creates all tables, indexes, triggers
2. ✅ **002_create_rls_policies.sql** - Creates RLS policies
3. ✅ **003_fix_enums_and_constraints.sql** - Fixes enums, adds constraints (NOW CORRECTED)
4. ✅ **004_seed_institutions.sql** - Seeds 12 institutions

### What Each Does:

| Migration | Purpose | Time |
|-----------|---------|------|
| 001 | Create 12 tables, 11 enums, base indexes | ~10 sec |
| 002 | Create RLS policies for security | ~5 sec |
| 003 | Add enums values, constraints, indexes, functions, views | ~10 sec |
| 004 | Seed 12 government institutions | ~5 sec |

**Total:** ~30 seconds

---

## 🐛 TROUBLESHOOTING

### "relation does not exist"

**Cause:** You tried to run migration 003 before migration 001.

**Solution:** Run migrations in order: 001 → 002 → 003 → 004

---

### "type already exists"

**This is OK!** The script handles this gracefully. It means you ran it before.

---

### "constraint already exists"

**This is OK!** The script now checks if tables exist before adding constraints.

---

### "institution count is 0"

**Solution:** Run seed 004 again:
```sql
-- Run: backend/database/seeds/004_seed_institutions.sql
```

---

## 🎉 SUCCESS!

Once all steps complete, you have:

- ✅ Complete database schema (12 tables)
- ✅ Complete RLS policies
- ✅ Fixed enums (queue status, maintenance status)
- ✅ Data integrity constraints
- ✅ Performance indexes
- ✅ Helper functions
- ✅ Helpful views
- ✅ 12 government institutions

**Next:** Move to frontend-backend integration (Phase 2-5 from audit)!

---

**Ready? Start with Step 1!** 🚀
