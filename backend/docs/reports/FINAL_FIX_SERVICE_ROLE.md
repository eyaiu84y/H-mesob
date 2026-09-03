# ✅ FINAL FIX: Service Role Access

## 🔍 **THE PROBLEM:**

You got error:
```
"service_role" is a reserved role, only superusers can modify it
```

**This means:** Supabase doesn't give you superuser access (this is normal for managed hosting).

**Original approach failed:** We cannot grant `BYPASSRLS` to `service_role`.

---

## ✅ **THE CORRECT SOLUTION:**

Instead of modifying the role, we create **explicit RLS policies** that allow `service_role` full access to all tables.

This is the **Supabase-recommended approach** for managed instances.

---

## ⚡ **RUN THIS MIGRATION:**

### **Step 1: Go to Supabase SQL Editor**
https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/editor

### **Step 2: Copy the migration file content**

Open file: `backend/database/004_add_service_role_policies.sql`

Or copy this:

```sql
-- Service role policies for all tables
DROP POLICY IF EXISTS "service_role_all_institutions" ON institutions;
DROP POLICY IF EXISTS "service_role_all_users" ON users;
DROP POLICY IF EXISTS "service_role_all_services" ON services;
DROP POLICY IF EXISTS "service_role_all_service_requirements" ON service_requirements;
DROP POLICY IF EXISTS "service_role_all_applications" ON applications;
DROP POLICY IF EXISTS "service_role_all_queue_entries" ON queue_entries;
DROP POLICY IF EXISTS "service_role_all_maintenance_reports" ON maintenance_reports;
DROP POLICY IF EXISTS "service_role_all_maintenance_attachments" ON maintenance_attachments;
DROP POLICY IF EXISTS "service_role_all_maintenance_tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "service_role_all_announcements" ON announcements;
DROP POLICY IF EXISTS "service_role_all_notifications" ON notifications;
DROP POLICY IF EXISTS "service_role_all_telegram_users" ON telegram_users;

-- Grant full access
CREATE POLICY "service_role_all_institutions" ON institutions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_services" ON services FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_service_requirements" ON service_requirements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_applications" ON applications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_queue_entries" ON queue_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_maintenance_reports" ON maintenance_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_maintenance_attachments" ON maintenance_attachments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_maintenance_tasks" ON maintenance_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_announcements" ON announcements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_telegram_users" ON telegram_users FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### **Step 3: Paste and Run**

Paste the SQL into Supabase SQL Editor and click **Run**.

**Expected output:**
```
Success. 12 rows returned
✅ All policies show "Full Access"
```

---

## 🧪 **TEST THE FIX:**

Back in your terminal:

```bash
cd backend
node src/utils/testServiceRole.js
```

**Expected result:**
```
✅ Success! Found 12 institutions
  - cbe: Commercial Bank of Ethiopia
  - construction: Construction Authority
  - electric: Ethiopian Electric Utility
  - ethiopost: Ethiopian Postal Service
  - health: Health Bureau
  - justice: Justice Office
  - kebele: Kebele Administration
  - land: Land Development Office
  - notary: Notary Office
  - revenue: Revenue Authority
  - telecom: Ethio Telecom
  - water: Water & Sewerage Authority

✅ Insert successful - service_role has write access
✅ Test record cleaned up
```

---

## 📊 **WHAT THIS DOES:**

### **Before (Error 42501):**
```
service_role key → RLS enabled → No matching policy → ❌ Permission Denied
```

### **After (Working):**
```
service_role key → RLS enabled → service_role policy matches → ✅ Access Granted
```

**RLS is still active!** Frontend requests still require proper authentication.

Only the `service_role` key (which you have in backend `.env`) gets full access.

---

## 🔐 **SECURITY:**

This is **safe and recommended by Supabase**:

✅ RLS stays enabled (protects frontend)
✅ Existing policies remain (user-based access control)
✅ Only adds one policy per table for `service_role`
✅ Service role key is secret (in `.env`, not committed to git)
✅ Frontend cannot access service role key

**This is how Supabase expects you to use service_role in managed instances.**

---

## 📋 **MIGRATION SUMMARY:**

| Migration | Status | Purpose |
|-----------|--------|---------|
| 001_create_schema.sql | ✅ Done | Create all tables |
| 002_create_rls_policies.sql | ✅ Done | Enable RLS + user policies |
| 003_create_functions_views.sql | ✅ Done | Helper functions |
| 001_seed_institutions.sql | ✅ Done | Insert 12 institutions |
| **004_add_service_role_policies.sql** | ⏳ **RUN NOW** | **Grant service_role access** |

---

## ✅ **SUCCESS CRITERIA:**

After running migration 004:

- [ ] No "permission denied" errors
- [ ] `testServiceRole.js` shows 12 institutions
- [ ] Backend can read/write all tables
- [ ] RLS still protects anon/authenticated users
- [ ] Ready to build API endpoints

---

## 🎯 **NEXT STEPS AFTER SUCCESS:**

1. Verify database access working
2. Create service catalogue (60+ services)
3. Build authentication endpoints
4. Implement REST API
5. Connect frontend to backend

---

**Run migration 004 now in Supabase SQL Editor!** 🚀
