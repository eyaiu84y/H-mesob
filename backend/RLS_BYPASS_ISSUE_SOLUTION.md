# 🔴 SERVICE_ROLE CANNOT BYPASS RLS - SOLUTION

## ❌ **THE PROBLEM:**

Your service_role key is correct (219 characters, starts with `eyJhbGc`), but you're still getting:

```
Error Code: 42501
Message: permission denied for table institutions
```

This means: **The `service_role` database role doesn't have `BYPASSRLS` privilege.**

---

## ✅ **THE SOLUTION:**

Run this SQL in **Supabase SQL Editor**:

```sql
ALTER ROLE service_role WITH BYPASSRLS;
```

That's it! One line fixes everything.

---

## 📋 **STEP-BY-STEP:**

### **Step 1: Go to Supabase SQL Editor**

1. Open: https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/editor
2. Or navigate: Dashboard → SQL Editor

### **Step 2: Run the Fix**

Paste and run:

```sql
ALTER ROLE service_role WITH BYPASSRLS;

-- Verify it worked
SELECT 
  rolname as role_name,
  rolbypassrls as can_bypass_rls
FROM pg_roles 
WHERE rolname = 'service_role';
```

**Expected output:**
```
role_name: service_role
can_bypass_rls: true
```

### **Step 3: Test Connection**

Back in your terminal:

```bash
cd backend
node src/utils/testServiceRole.js
```

**Expected output:**
```
✅ Success! Found 12 institutions
```

---

## 🔍 **WHY THIS HAPPENED:**

In Supabase, there are three main database roles:

| Role | Purpose | Default BYPASSRLS |
|------|---------|-------------------|
| `anon` | Unauthenticated users | ❌ No |
| `authenticated` | Logged-in users | ❌ No |
| `service_role` | Backend admin | ✅ **Should be YES** |

**Something in your Supabase setup didn't grant `BYPASSRLS` to `service_role`.**

This can happen if:
- The project was created with non-standard settings
- Migrations altered role permissions
- Manual role configuration was done

---

## 🛠️ **DIAGNOSTIC SCRIPTS CREATED:**

I've created two SQL files for you:

### 1. **DIAGNOSE_RLS_ISSUE.sql**
Full diagnostic report showing:
- Institution count
- RLS status
- All policies
- Role permissions

**Location:** `backend/database/DIAGNOSE_RLS_ISSUE.sql`

### 2. **FIX_SERVICE_ROLE_RLS.sql**
Simple one-line fix + verification

**Location:** `backend/database/FIX_SERVICE_ROLE_RLS.sql`

---

## ⚡ **QUICK FIX (COPY-PASTE):**

Open Supabase SQL Editor and run:

```sql
ALTER ROLE service_role WITH BYPASSRLS;
```

Then test:

```bash
node src/utils/testServiceRole.js
```

---

## ✅ **WHAT HAPPENS AFTER FIX:**

Once `service_role` has `BYPASSRLS`:

1. ✅ Backend can query all tables
2. ✅ No more "permission denied" errors
3. ✅ Can insert/update/delete without RLS restrictions
4. ✅ RLS still protects frontend/client requests
5. ✅ Your 12 institutions will be accessible

---

## 🔐 **SECURITY NOTE:**

This is **safe and standard** for Supabase:

- ✅ Service role key should ONLY be in backend `.env` (never in frontend)
- ✅ `.gitignore` already protects `.env` from being committed
- ✅ RLS still protects all anon/authenticated requests
- ✅ Only backend with service_role key can bypass RLS

**This is the intended design for Supabase backend operations.**

---

## 📊 **AFTER SUCCESSFUL FIX:**

Run the migration checker:

```bash
node src/utils/checkMigrations.js
```

**Expected result:**
```
✅ Found 12 institutions
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

✅ MIGRATIONS COMPLETE
Database ready for API development
```

---

## 🎯 **NEXT STEPS AFTER FIX:**

Once the database access works:

1. ✅ Verify 12 institutions exist
2. ✅ Add service catalogue (60+ services)
3. ✅ Build REST API endpoints
4. ✅ Implement authentication
5. ✅ Connect frontend to backend

---

**Run the SQL fix now and test immediately!** 🚀
