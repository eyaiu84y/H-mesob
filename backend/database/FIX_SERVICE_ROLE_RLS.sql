-- ============================================================================
-- FIX SERVICE_ROLE RLS BYPASS
-- ============================================================================
-- This script grants the service_role the ability to bypass RLS
-- Run this in Supabase SQL Editor
--

-- Grant BYPASSRLS privilege to service_role
ALTER ROLE service_role WITH BYPASSRLS;

-- Verify it worked
SELECT 
  rolname as role_name,
  rolbypassrls as can_bypass_rls,
  CASE 
    WHEN rolbypassrls THEN '✅ Can bypass RLS'
    ELSE '❌ Cannot bypass RLS'
  END as status
FROM pg_roles 
WHERE rolname = 'service_role';

-- Expected output:
-- role_name: service_role
-- can_bypass_rls: true
-- status: ✅ Can bypass RLS
