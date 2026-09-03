-- ============================================================================
-- Database Check and Setup
-- Description: Check what exists and guide next steps
-- ============================================================================

\echo '========================================';
\echo 'HAWASSA MESOB DATABASE CHECK';
\echo '========================================';
\echo '';

-- Check if tables exist
\echo 'Checking existing tables...';
\echo '----------------------------';

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
    THEN '✓ users table EXISTS'
    ELSE '✗ users table MISSING'
  END AS users_table;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'institutions') 
    THEN '✓ institutions table EXISTS'
    ELSE '✗ institutions table MISSING'
  END AS institutions_table;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') 
    THEN '✓ services table EXISTS'
    ELSE '✗ services table MISSING'
  END AS services_table;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') 
    THEN '✓ applications table EXISTS'
    ELSE '✗ applications table MISSING'
  END AS applications_table;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'queue_entries') 
    THEN '✓ queue_entries table EXISTS'
    ELSE '✗ queue_entries table MISSING'
  END AS queue_entries_table;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_reports') 
    THEN '✓ maintenance_reports table EXISTS'
    ELSE '✗ maintenance_reports table MISSING'
  END AS maintenance_reports_table;

\echo '';
\echo 'Checking enums...';
\echo '----------------------------';

-- Check if enums exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
    THEN '✓ user_role enum EXISTS'
    ELSE '✗ user_role enum MISSING'
  END AS user_role_enum;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_status') 
    THEN '✓ queue_status enum EXISTS'
    ELSE '✗ queue_status enum MISSING'
  END AS queue_status_enum;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') 
    THEN '✓ maintenance_status enum EXISTS'
    ELSE '✗ maintenance_status enum MISSING'
  END AS maintenance_status_enum;

\echo '';
\echo 'Checking institution data...';
\echo '----------------------------';

-- Check institution count (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'institutions') THEN
    EXECUTE 'SELECT COUNT(*) as institution_count FROM institutions';
  ELSE
    RAISE NOTICE 'institutions table does not exist yet';
  END IF;
END $$;

\echo '';
\echo '========================================';
\echo 'NEXT STEPS:';
\echo '========================================';
\echo '';
\echo 'If tables are MISSING:';
\echo '  1. Run: database/migrations/001_create_schema.sql';
\echo '  2. Run: database/migrations/002_create_rls_policies.sql';
\echo '  3. Then run: database/migrations/003_fix_enums_and_constraints.sql';
\echo '';
\echo 'If tables EXIST but institutions are 0:';
\echo '  1. Run: database/seeds/004_seed_institutions.sql';
\echo '';
\echo 'If everything EXISTS:';
\echo '  You are ready to go!';
\echo '';
