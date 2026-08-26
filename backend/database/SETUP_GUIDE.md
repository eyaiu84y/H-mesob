## 🚀 Database Setup Guide

Step-by-step guide to set up the Hawassa MESOB database in Supabase.

---

## Prerequisites

- Supabase account and project created
- Database credentials configured in `backend/.env`
- Supabase SQL Editor access

---

## Setup Steps

### Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Run Migration Files (In Order)

#### Migration 1: Create Schema
```sql
-- Copy and paste the contents of:
-- database/migrations/001_create_schema.sql
```

**This will create:**
- All enums (user_role, user_status, etc.)
- 12 tables with indexes
- Foreign key constraints
- Triggers for auto-updating timestamps
- Comments on all tables

**Expected:** No errors, 12 tables created

---

#### Migration 2: Create RLS Policies
```sql
-- Copy and paste the contents of:
-- database/migrations/002_create_rls_policies.sql
```

**This will create:**
- Row Level Security policies for all tables
- Helper functions (current_user_role, current_user_institution)
- 50+ security policies

**Expected:** No errors, RLS enabled on all tables

---

#### Migration 3: Create Functions & Views
```sql
-- Copy and paste the contents of:
-- database/migrations/003_create_functions_views.sql
```

**This will create:**
- Number generation functions
- 6 views for simplified queries
- Helper functions for notifications and stats
- Comments on all functions and views

**Expected:** No errors, 6 views and 7 functions created

---

### Step 3: Seed Initial Data

#### Seed 1: Insert Institutions
```sql
-- Copy and paste the contents of:
-- database/seeds/001_seed_institutions.sql
```

**This will insert:**
- 12 approved government institutions

**Verification:**
```sql
SELECT COUNT(*) as total_institutions FROM institutions;
-- Expected: 12

SELECT code, name_en, status FROM institutions ORDER BY name_en;
-- Should list all 12 institutions
```

---

## Verification Checklist

### ✅ Tables Created (12)

Run this query to verify all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected tables:**
1. announcements
2. applications
3. institutions
4. maintenance_attachments
5. maintenance_reports
6. maintenance_tasks
7. notifications
8. queue_entries
9. service_requirements
10. services
11. telegram_users
12. users

---

### ✅ Views Created (6)

Run this query to verify all views exist:
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected views:**
1. active_announcements
2. application_summary
3. maintenance_summary
4. queue_statistics
5. service_catalogue
6. user_profiles

---

### ✅ Functions Created (7+)

Run this query to verify functions exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected functions:**
1. current_user_institution
2. current_user_role
3. generate_application_number
4. generate_maintenance_number
5. generate_queue_number
6. get_dashboard_stats
7. get_unread_notification_count
8. mark_all_notifications_read
9. update_updated_at_column

---

### ✅ Enums Created (10)

Run this query to verify enums exist:
```sql
SELECT typname 
FROM pg_type 
WHERE typcategory = 'E'
AND typname NOT LIKE 'pg_%'
ORDER BY typname;
```

**Expected enums:**
1. announcement_scope
2. application_status
3. institution_status
4. maintenance_priority
5. maintenance_status
6. notification_type
7. queue_priority
8. queue_status
9. task_status
10. user_role
11. user_status

---

### ✅ Institutions Seeded (12)

```sql
SELECT code, name_en, status 
FROM institutions 
ORDER BY name_en;
```

**Expected institutions:**
1. cbe - Commercial Bank of Ethiopia
2. construction - Construction Authority
3. electric - Ethiopian Electric Utility
4. ethiopost - Ethiopian Postal Service Enterprise
5. ethiotel - Ethio Telecom
6. fayda - National ID Program / Fayda
7. investment - Investment Commission
8. justice - Ministry of Justice
9. labor - Labor and Skills Bureau
10. revenue - Revenues Bureau
11. sidama-bank - Sidama Bank
12. trade - Trade Bureau

---

### ✅ Foreign Keys Check

```sql
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

**Expected:** 25+ foreign key relationships

---

### ✅ Indexes Check

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Expected:** 60+ indexes (including primary keys and custom indexes)

---

### ✅ RLS Policies Check

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:** 50+ RLS policies across all tables

---

## Test Data (Optional)

### Create Test Super Admin

```sql
INSERT INTO users (
  email,
  password_hash,
  full_name,
  role,
  status
) VALUES (
  'admin@mesob.gov.et',
  '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  -- Hash for 'Admin@123'
  'System Administrator',
  'SUPER_ADMIN',
  'ACTIVE'
);
```

**Note:** Use bcrypt to hash the password before inserting.

---

### Create Test Citizen

```sql
INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status
) VALUES (
  'citizen@example.com',
  '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  -- Hash for 'Test@123'
  'Test Citizen',
  '+251911234567',
  'CITIZEN',
  'ACTIVE'
);
```

---

### Create Test Employee

First, get an institution ID:
```sql
SELECT id FROM institutions WHERE code = 'revenue' LIMIT 1;
```

Then create the employee:
```sql
INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id
) VALUES (
  'employee@revenue.gov.et',
  '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  -- Hash for 'Emp@123'
  'Test Employee',
  '+251911234568',
  'EMPLOYEE',
  'ACTIVE',
  'institution-uuid-here',  -- Replace with actual UUID
  'EMP-001'
);
```

---

## Troubleshooting

### Error: "enum type already exists"
**Solution:** The enum might already exist. Drop and recreate:
```sql
DROP TYPE IF EXISTS user_role CASCADE;
-- Then re-run the enum creation
```

### Error: "table already exists"
**Solution:** Drop the table first:
```sql
DROP TABLE IF EXISTS table_name CASCADE;
-- Then re-run the table creation
```

### Error: "function already exists"
**Solution:** Use CREATE OR REPLACE:
```sql
CREATE OR REPLACE FUNCTION function_name...
```

### RLS policies not working
**Solution:** Verify RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
-- rowsecurity should be TRUE for all tables
```

---

## Performance Optimization

### Analyze Tables
After seeding data, analyze tables for query optimization:
```sql
ANALYZE users;
ANALYZE institutions;
ANALYZE services;
ANALYZE applications;
ANALYZE queue_entries;
ANALYZE maintenance_reports;
-- ... for all tables
```

### Vacuum Tables
Clean up dead rows:
```sql
VACUUM ANALYZE;
```

---

## Backup and Restore

### Create Backup
In Supabase dashboard:
1. Go to **Database** → **Backups**
2. Create a manual backup
3. Download backup file if needed

### Restore from Backup
```sql
-- Use Supabase dashboard to restore from backup
-- Or use pg_restore command with backup file
```

---

## Next Steps

After successful database setup:

1. ✅ Verify all tables, views, and functions exist
2. ✅ Verify 12 institutions are seeded
3. ✅ Create test users for each role
4. ✅ Test RLS policies with different roles
5. ✅ Update backend configuration with database URL
6. ✅ Test backend API endpoints
7. ✅ Connect frontend to backend

---

## Support

For issues during setup:
1. Check Supabase logs in dashboard
2. Verify syntax errors in SQL
3. Ensure correct order of migrations
4. Review foreign key dependencies

---

**Setup Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** ✅ Ready for Implementation
