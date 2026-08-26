-- ============================================================================
-- Database Status Check
-- Run this in Supabase SQL Editor to see current database status
-- ============================================================================

-- Check all tables exist
SELECT 
  'Tables Check' as check_type,
  COUNT(*) as table_count,
  'Expected: 12' as expected
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Check institutions count
SELECT 
  'Institutions' as check_type,
  COUNT(*) as count,
  'Expected: 12' as expected
FROM institutions;

-- List all institutions
SELECT 
  'Institution List' as info,
  code,
  name_en,
  status
FROM institutions
ORDER BY name_en;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count RLS policies
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as policy_count,
  'Expected: 40+' as expected
FROM pg_policies
WHERE schemaname = 'public';

-- Check functions exist
SELECT 
  'Functions' as check_type,
  COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%user%' OR p.proname LIKE '%institution%' OR p.proname LIKE '%generate%';
