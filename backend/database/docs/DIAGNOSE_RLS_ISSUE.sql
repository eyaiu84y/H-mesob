-- ============================================================================
-- DIAGNOSE RLS ISSUE
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose why service_role can't bypass RLS
--

-- 1. Check if institutions table exists and has data
SELECT 'Table Check' as test_name, COUNT(*) as institution_count 
FROM institutions;

-- 2. Check RLS status
SELECT 
  'RLS Status' as test_name,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'institutions';

-- 3. List all policies on institutions table
SELECT 
  'Policies' as test_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'institutions'
ORDER BY policyname;

-- 4. Check if there's a policy blocking service_role
SELECT 
  'Service Role Policy Check' as test_name,
  policyname,
  'service_role' = ANY(roles::text[]) as blocks_service_role,
  roles
FROM pg_policies 
WHERE tablename = 'institutions';

-- 5. Check database roles
SELECT 
  'Database Roles' as test_name,
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolbypassrls
FROM pg_roles 
WHERE rolname IN ('authenticator', 'service_role', 'anon', 'authenticated')
ORDER BY rolname;

-- ============================================================================
-- SOLUTION: Grant service_role RLS bypass if not already set
-- ============================================================================

-- Check if service_role exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    -- Grant bypass RLS to service_role
    ALTER ROLE service_role WITH BYPASSRLS;
    RAISE NOTICE 'service_role now has BYPASSRLS privilege';
  ELSE
    RAISE NOTICE 'service_role does not exist - this is unusual for Supabase';
  END IF;
END $$;

-- Verify the change
SELECT 
  'Final Verification' as test_name,
  rolname,
  rolbypassrls as can_bypass_rls
FROM pg_roles 
WHERE rolname = 'service_role';

-- ============================================================================
-- EXPECTED RESULT
-- ============================================================================
-- service_role should have can_bypass_rls = true
-- If it's false, that's why you're getting permission denied!
