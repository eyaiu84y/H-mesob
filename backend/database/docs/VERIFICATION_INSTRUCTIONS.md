# 🔍 Database Verification Instructions

## ⚠️ CURRENT STATUS: VERIFICATION BLOCKED

**Reason:** Supabase credentials not configured in `backend/.env`

---

## 📋 Quick Start: Complete Database Setup & Verification

Follow these steps in order to set up and verify the database:

---

### Step 1: Get Supabase Credentials

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in or create account

2. **Create New Project** (if needed)
   - Click "New Project"
   - Enter project details
   - Wait for database provisioning (2-3 minutes)

3. **Get Your Credentials**
   - Select your project
   - Go to **Settings** (⚙️ icon) → **API**
   - Find these values:
     - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
     - **service_role** key (under "Project API keys")
       - ⚠️ Copy the **service_role** key, NOT the anon key!

---

### Step 2: Configure Backend Environment

1. **Open File:** `backend/.env`

2. **Replace Placeholder Values:**
   ```env
   # BEFORE (placeholders):
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   # AFTER (your actual values):
   SUPABASE_URL=https://abcdefgh.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Save the file**

---

### Step 3: Run Database Migrations

1. **Go to Supabase SQL Editor**
   - In Supabase dashboard
   - Click **SQL Editor** (in left sidebar)

2. **Run Migration 1: Create Schema**
   - Click "+ New query"
   - Copy entire contents of: `backend/database/migrations/001_create_schema.sql`
   - Paste into editor
   - Click **Run** (or press F5)
   - Wait for completion (should see "Success")

3. **Run Migration 2: Create RLS Policies**
   - Create new query
   - Copy entire contents of: `backend/database/migrations/002_create_rls_policies.sql`
   - Paste and run
   - Wait for completion

4. **Run Migration 3: Create Functions & Views**
   - Create new query
   - Copy entire contents of: `backend/database/migrations/003_create_functions_views.sql`
   - Paste and run
   - Wait for completion

5. **Run Seed Data: Insert Institutions**
   - Create new query
   - Copy entire contents of: `backend/database/seeds/001_seed_institutions.sql`
   - Paste and run
   - Wait for completion

---

### Step 4: Verify Installation

Run a quick check in Supabase SQL Editor:

```sql
-- Check tables exist (should return 12)
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Check institutions exist (should return 12)
SELECT COUNT(*) as institution_count FROM institutions;

-- View institution list
SELECT code, name_en, status FROM institutions ORDER BY name_en;
```

**Expected Results:**
- table_count: 12
- institution_count: 12
- 12 institutions listed

---

### Step 5: Run Automated Verification Script

Now run the comprehensive verification:

```bash
cd backend
node database/verify_database.js
```

**This script will verify:**
- ✅ All 12 tables exist
- ✅ All 6 user roles defined
- ✅ Exactly 12 institutions (no 13th)
- ✅ All foreign key relationships
- ✅ All indexes created
- ✅ RLS enabled on all tables
- ✅ Workflow support verified

---

## 📊 Expected Verification Output

### If Everything is Correct:

```
╔════════════════════════════════════════════════════════╗
║     🔍 DATABASE VERIFICATION (READ-ONLY)              ║
╚════════════════════════════════════════════════════════╝

📊 Checking Tables...
   Found 12 tables
✅ PASS: Exactly 12 tables exist
✅ PASS: Table 'users' exists
✅ PASS: Table 'institutions' exists
... (all tables)

👥 Checking User Roles...
   Found 6 valid roles
✅ PASS: All 6 required roles exist
✅ PASS: Role 'SUPER_ADMIN' exists
... (all roles)

🏛️  Checking Institutions...
   Found 12 institutions
✅ PASS: Exactly 12 institutions exist (no 13th institution)
✅ PASS: Institution 'electric' exists
... (all institutions)

🔗 Checking Foreign Key Relationships...
✅ PASS: Relationship: users.institution_id → institutions.id
... (all relationships)

🔄 Checking Workflow Support...
✅ PASS: Maintenance workflow: All required tables and columns exist
✅ PASS: Queue workflow: All required columns exist
✅ PASS: Queue workflow: No automatic 15-second advancement in schema

╔════════════════════════════════════════════════════════╗
║     📊 VERIFICATION RESULTS                           ║
╚════════════════════════════════════════════════════════╝

✅ PASSED: 50+ checks
❌ FAILED: 0 checks
⚠️  WARNINGS: 0 checks

╔════════════════════════════════════════════════════════╗
║     ✅ DATABASE VERIFICATION PASSED                   ║
║     ✅ READY FOR APPROVED DATA SEEDING                ║
╚════════════════════════════════════════════════════════╝
```

---

### If Issues Are Found:

```
❌ FAILED CHECKS:

❌ FAIL: Expected 12 institutions, found 11
   Details: Missing institutions

❌ FAIL: Institution 'ethiopost' missing
   Details: Expected: Ethiopian Postal Service Enterprise

❌ FAIL: Relationship: services.institution_id → institutions.id
   Details: Foreign key constraint missing or incorrect

╔════════════════════════════════════════════════════════╗
║     ❌ DATABASE VERIFICATION FAILED                   ║
║     ⚠️  DO NOT PROCEED WITH SEEDING                   ║
╚════════════════════════════════════════════════════════╝

Please fix the issues above before proceeding.
```

**If this happens:**
1. Review the error messages
2. Check which migration step failed
3. Re-run the failed migration
4. Run verification again

---

## 🔧 Troubleshooting

### Issue: "Supabase credentials not configured"

**Solution:** Complete Step 2 above (Configure Backend Environment)

---

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution:** Install dependencies:
```bash
cd backend
npm install
```

---

### Issue: Migration fails with "already exists" error

**Solution:** The table/function already exists. Either:
- Skip to next migration, OR
- Drop and recreate (⚠️ will delete data):
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  -- Then re-run all migrations
  ```

---

### Issue: "Permission denied" in SQL Editor

**Solution:** Make sure you're using the correct project and have owner/admin access

---

### Issue: Verification shows "RLS may not be configured"

**Solution:** This is a warning, not an error. RLS is likely working correctly if migration 2 ran successfully.

---

## 📝 Verification Checklist

Use this checklist to track your progress:

- [ ] Step 1: Got Supabase credentials
- [ ] Step 2: Updated `backend/.env` file
- [ ] Step 3.1: Ran migration 001_create_schema.sql
- [ ] Step 3.2: Ran migration 002_create_rls_policies.sql
- [ ] Step 3.3: Ran migration 003_create_functions_views.sql
- [ ] Step 3.4: Ran seed 001_seed_institutions.sql
- [ ] Step 4: Quick verification in SQL Editor (12 tables, 12 institutions)
- [ ] Step 5: Ran `node database/verify_database.js`
- [ ] ✅ Verification PASSED

---

## 🎯 After Verification Passes

Once you see:
```
✅ DATABASE VERIFICATION PASSED
✅ READY FOR APPROVED DATA SEEDING
```

You can proceed with:
1. Creating test users for each role
2. Adding sample services (optional)
3. Implementing backend API endpoints
4. Connecting frontend to backend

---

## 📞 Need Help?

### Common Questions:

**Q: Which Supabase key should I use?**  
A: Use the **service_role** key, NOT the anon/public key

**Q: Do I need to run migrations every time?**  
A: No, only once. After that, the database structure is permanent.

**Q: Can I modify the schema after migrations?**  
A: Yes, but create new migration files (004, 005, etc.) for changes

**Q: What if I want to start over?**  
A: Drop the public schema in Supabase SQL Editor:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
Then re-run all migrations.

---

**Last Updated:** January 2024  
**Status:** Awaiting Supabase credentials configuration  
**Next Step:** Complete Step 1 (Get Supabase Credentials)
