# 🔧 Announcement Enum Fix

## Problem
When trying to publish an announcement with scope "INTERNAL" from the Super Admin dashboard, you get the error:

```
invalid input value for enum announcement_scope: "INTERNAL"
```

## Root Cause
The database enum type `announcement_scope` only has these values:
- SYSTEM
- INSTITUTION  
- ROLE
- PUBLIC

The value **INTERNAL** is missing from the enum, even though:
- The migration file `003a_add_enum_values.sql` exists to add it
- The frontend and backend code expect it to be available

## Solution

### Option 1: Run SQL in Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase SQL Editor:**
   - Open: https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql/new

2. **Paste and execute this SQL:**

```sql
ALTER TYPE announcement_scope ADD VALUE IF NOT EXISTS 'INTERNAL';
```

3. **Verify it worked:**

```sql
SELECT unnest(enum_range(NULL::announcement_scope))::text AS scope_values;
```

You should see: SYSTEM, INSTITUTION, ROLE, PUBLIC, INTERNAL

4. **Restart the backend server** (it will automatically reconnect)

### Option 2: Alternative Scopes

If you cannot access Supabase dashboard right now, use these alternative scopes that already exist:

- **PUBLIC** - Visible to everyone (including citizens)
- **SYSTEM** - Visible to Super Admins and MESOB Managers only
- **ROLE** - Visible to specific roles (select which ones)
- **INSTITUTION** - Visible to specific institution

**INTERNAL** was meant for: "All staff (not citizens)" - same as PUBLIC but excludes CITIZEN role.

**Temporary workaround:** Use **SYSTEM** scope instead of INTERNAL until the enum is fixed.

## Files Involved

- **Migration:** `backend/database/migrations/003a_add_enum_values.sql`
- **Schema:** `backend/database/migrations/001_create_schema.sql` (lines 130-135)
- **Service:** `backend/src/services/announcementService.js`
- **Frontend:** `frontend/src/pages/dashboard/SuperAdminDashboard.jsx`

## After Fix

Once INTERNAL is added to the enum:
1. All existing announcement functionality will work
2. INTERNAL scope will show announcements to all staff roles: SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER, EMPLOYEE, ICT_STAFF (but not CITIZEN)
3. No code changes needed - everything is already implemented

## Verification

After applying the fix, test by:
1. Login as Super Admin
2. Go to Announcements
3. Click "New Announcement"
4. Select "Internal - Staff only" as Audience
5. Fill title and content
6. Click "Publish Announcement"
7. Should succeed without errors

---

**Date:** October 9, 2026  
**Status:** Migration pending - database enum needs update
