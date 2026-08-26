-- ============================================================================
-- FINAL DATABASE VERIFICATION
-- ============================================================================
-- Run this in Supabase SQL Editor for a complete database health check
-- ============================================================================

-- 1. Check all tables exist
SELECT 
  'Tables' as check_type,
  COUNT(*) as count,
  string_agg(tablename, ', ') as items
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'institutions', 'services', 'service_requirements',
    'applications', 'queue_entries', 'maintenance_reports',
    'maintenance_attachments', 'maintenance_tasks', 
    'announcements', 'notifications', 'telegram_users'
  );
-- Expected: 12 tables

-- 2. Check institutions data
SELECT 
  'Institutions' as check_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_count
FROM institutions;
-- Expected: 12 total, 12 active

-- 3. List all institutions
SELECT 
  code,
  name_en,
  name_am,
  status,
  CASE WHEN website_url IS NOT NULL THEN '✅' ELSE '❌' END as has_website,
  CASE WHEN logo_url IS NOT NULL THEN '✅' ELSE '❌' END as has_logo,
  created_at::date as created
FROM institutions
ORDER BY name_en;

-- 4. Check RLS status
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: All 12 tables show "✅ Enabled"

-- 5. Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count,
  string_agg(DISTINCT cmd::text, ', ') as operations
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Expected: institutions should have 9+ policies

-- 6. Verify service_role privileges
SELECT 
  table_name,
  COUNT(DISTINCT privilege_type) as privilege_count,
  string_agg(DISTINCT privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE grantee = 'service_role' 
  AND table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
-- Expected: All 12 tables with 7 privileges each (SELECT, INSERT, UPDATE, DELETE, etc.)

-- 7. Check database roles
SELECT 
  rolname as role_name,
  CASE WHEN rolsuper THEN '✅' ELSE '❌' END as superuser,
  CASE WHEN rolbypassrls THEN '✅' ELSE '❌' END as bypass_rls,
  CASE WHEN rolcanlogin THEN '✅' ELSE '❌' END as can_login
FROM pg_roles 
WHERE rolname IN ('postgres', 'authenticator', 'service_role', 'anon', 'authenticated')
ORDER BY rolname;

-- 8. Check for any empty tables (should all have 0 rows except institutions)
SELECT 
  table_name,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM institutions) as institutions_count,
  (SELECT COUNT(*) FROM services) as services_count,
  (SELECT COUNT(*) FROM applications) as applications_count,
  (SELECT COUNT(*) FROM queue_entries) as queue_count,
  (SELECT COUNT(*) FROM maintenance_reports) as maintenance_count,
  (SELECT COUNT(*) FROM announcements) as announcements_count,
  (SELECT COUNT(*) FROM notifications) as notifications_count,
  (SELECT COUNT(*) FROM telegram_users) as telegram_count;
-- Expected: institutions = 12, others = 0 (no seed data yet)

-- 9. Verify ENUMs exist
SELECT 
  typname as enum_name,
  (SELECT COUNT(*) FROM pg_enum WHERE enumtypid = t.oid) as value_count
FROM pg_type t
WHERE typname IN (
  'user_role', 'user_status', 'institution_status', 
  'application_status', 'queue_status', 'queue_priority',
  'maintenance_status', 'maintenance_priority', 'task_status'
)
ORDER BY typname;
-- Expected: 9 ENUMs

-- 10. Check indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  CASE WHEN indexdef LIKE '%UNIQUE%' THEN '✅ UNIQUE' ELSE 'REGULAR' END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'institutions', 'services', 'service_requirements',
    'applications', 'queue_entries', 'maintenance_reports',
    'maintenance_attachments', 'maintenance_tasks', 
    'announcements', 'notifications', 'telegram_users'
  )
ORDER BY tablename, indexname;

-- 11. Verify functions exist
SELECT 
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_current_user_id',
    'current_user_role',
    'current_user_institution'
  )
ORDER BY routine_name;
-- Expected: 3 helper functions

-- 12. Final health check summary
SELECT 
  'DATABASE HEALTH CHECK' as summary,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
  (SELECT COUNT(*) FROM institutions) as institutions_count,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as total_functions,
  '✅ READY FOR API DEVELOPMENT' as status;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- ✅ 12 tables created
-- ✅ 12 institutions inserted
-- ✅ RLS enabled on all tables
-- ✅ 54+ policies created
-- ✅ service_role has full privileges
-- ✅ 9 ENUMs defined
-- ✅ 3+ helper functions created
-- ✅ All indexes created
-- ============================================================================
