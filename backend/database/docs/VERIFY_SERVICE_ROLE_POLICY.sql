-- ============================================================================
-- VERIFY SERVICE ROLE POLICIES ARE WORKING
-- ============================================================================

-- 1. Check all policies on institutions table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'institutions'
ORDER BY policyname;

-- 2. Check if service_role has the right privileges
SELECT 
  rolname,
  rolsuper,
  rolbypassrls,
  rolcanlogin
FROM pg_roles 
WHERE rolname IN ('service_role', 'authenticator', 'anon', 'authenticated');

-- 3. Test if we can query as service_role
SET ROLE service_role;
SELECT COUNT(*) as institution_count FROM institutions;
SELECT code, name_en FROM institutions LIMIT 5;
RESET ROLE;

-- 4. Check table ownership
SELECT 
  t.tablename,
  t.tableowner,
  t.hasindexes,
  t.hasrules,
  t.hastriggers
FROM pg_tables t
WHERE t.tablename = 'institutions';

-- 5. Grant explicit permissions to service_role (as a fallback)
GRANT ALL ON institutions TO service_role;
GRANT ALL ON users TO service_role;
GRANT ALL ON services TO service_role;
GRANT ALL ON service_requirements TO service_role;
GRANT ALL ON applications TO service_role;
GRANT ALL ON queue_entries TO service_role;
GRANT ALL ON maintenance_reports TO service_role;
GRANT ALL ON maintenance_attachments TO service_role;
GRANT ALL ON maintenance_tasks TO service_role;
GRANT ALL ON announcements TO service_role;
GRANT ALL ON notifications TO service_role;
GRANT ALL ON telegram_users TO service_role;

-- Also grant on sequences (for auto-increment IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 6. Verify grants
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'service_role' 
  AND table_schema = 'public'
ORDER BY table_name, privilege_type;
