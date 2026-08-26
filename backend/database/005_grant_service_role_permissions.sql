-- ============================================================================
-- GRANT SERVICE ROLE TABLE PERMISSIONS
-- ============================================================================
-- RLS policies alone are not enough - we also need table-level GRANT permissions
-- This is the missing piece!
-- ============================================================================

-- Grant ALL privileges on all tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant usage on all sequences (for auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Make these grants the default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================================================
-- VERIFY GRANTS
-- ============================================================================

SELECT 
  'Table Privileges' as grant_type,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'service_role' 
  AND table_schema = 'public'
  AND table_name IN (
    'users', 'institutions', 'services', 'service_requirements',
    'applications', 'queue_entries', 'maintenance_reports',
    'maintenance_attachments', 'maintenance_tasks', 
    'announcements', 'notifications', 'telegram_users'
  )
ORDER BY table_name, privilege_type;

-- Expected output: Multiple rows showing service_role has SELECT, INSERT, UPDATE, DELETE, etc.
-- If you see 0 rows or missing permissions, that was the problem!
