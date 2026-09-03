-- ============================================================================
-- Production Database Verification Script
-- Version: 1.1.0
-- Description: Comprehensive verification of database foundation
-- ============================================================================

\echo '═══════════════════════════════════════════════════════════════════════'
\echo '🔍 HAWASSA MESOB PRODUCTION DATABASE VERIFICATION'
\echo '═══════════════════════════════════════════════════════════════════════'
\echo ''

-- ============================================================================
-- SECTION 1: TABLE COUNT VERIFICATION
-- ============================================================================

\echo '📊 SECTION 1: TABLE COUNT VERIFICATION'
\echo '─────────────────────────────────────────'

SELECT 
  '✅ Total Tables' AS check_name,
  COUNT(*)::TEXT AS actual,
  '17' AS expected,
  CASE WHEN COUNT(*) = 17 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_tables 
WHERE schemaname = 'public';

-- List all tables
\echo ''
\echo 'All Tables:'
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''

-- ============================================================================
-- SECTION 2: ENUM VERIFICATION
-- ============================================================================

\echo '📊 SECTION 2: ENUM VERIFICATION'
\echo '─────────────────────────────────────────'

-- Check user_role enum has exactly 6 values
SELECT 
  '✅ User Roles' AS check_name,
  COUNT(*)::TEXT AS actual,
  '6' AS expected,
  CASE WHEN COUNT(*) = 6 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype;

\echo ''
\echo 'User Roles (Should be 6):'
SELECT enumlabel AS role
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumsortorder;

\echo ''

-- ============================================================================
-- SECTION 3: INSTITUTION DATA VERIFICATION
-- ============================================================================

\echo '📊 SECTION 3: INSTITUTION DATA VERIFICATION'
\echo '─────────────────────────────────────────'

SELECT 
  '✅ Total Institutions' AS check_name,
  COUNT(*)::TEXT AS actual,
  '12' AS expected,
  CASE WHEN COUNT(*) = 12 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM institutions;

\echo ''
\echo 'All Institutions:'
SELECT 
  ROW_NUMBER() OVER (ORDER BY name_en) AS "#",
  code,
  name_en,
  status
FROM institutions
ORDER BY name_en;

\echo ''

-- ============================================================================
-- SECTION 4: SERVICE CATALOGUE VERIFICATION
-- ============================================================================

\echo '📊 SECTION 4: SERVICE CATALOGUE VERIFICATION'
\echo '─────────────────────────────────────────'

SELECT 
  '✅ Total Services' AS check_name,
  COUNT(*)::TEXT AS actual,
  '37' AS expected,
  CASE WHEN COUNT(*) = 37 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM services;

SELECT 
  '✅ Total Requirements' AS check_name,
  COUNT(*)::TEXT AS actual,
  '170' AS expected,
  CASE WHEN COUNT(*) >= 170 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM service_requirements;

\echo ''
\echo 'Services per Institution:'
SELECT 
  i.name_en AS institution,
  COUNT(s.id) AS service_count
FROM institutions i
LEFT JOIN services s ON s.institution_id = i.id
GROUP BY i.id, i.name_en
ORDER BY i.name_en;

\echo ''

-- ============================================================================
-- SECTION 5: USER DATA VERIFICATION
-- ============================================================================

\echo '📊 SECTION 5: USER DATA VERIFICATION'
\echo '─────────────────────────────────────────'

SELECT 
  '✅ Total Users' AS check_name,
  COUNT(*)::TEXT AS actual,
  '13' AS expected,
  CASE WHEN COUNT(*) = 13 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM users;

\echo ''
\echo 'Users by Role:'
SELECT 
  role,
  COUNT(*) AS count
FROM users
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'MESOB_MANAGER' THEN 2
    WHEN 'INSTITUTION_MANAGER' THEN 3
    WHEN 'EMPLOYEE' THEN 4
    WHEN 'ICT_STAFF' THEN 5
    WHEN 'CITIZEN' THEN 6
  END;

\echo ''
\echo 'All Users:'
SELECT 
  ROW_NUMBER() OVER (ORDER BY 
    CASE role
      WHEN 'SUPER_ADMIN' THEN 1
      WHEN 'MESOB_MANAGER' THEN 2
      WHEN 'INSTITUTION_MANAGER' THEN 3
      WHEN 'EMPLOYEE' THEN 4
      WHEN 'ICT_STAFF' THEN 5
      WHEN 'CITIZEN' THEN 6
    END,
    email
  ) AS "#",
  email,
  full_name,
  role,
  status,
  CASE WHEN institution_id IS NOT NULL THEN '✅' ELSE '—' END AS has_institution,
  employee_id
FROM users
ORDER BY 
  CASE role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'MESOB_MANAGER' THEN 2
    WHEN 'INSTITUTION_MANAGER' THEN 3
    WHEN 'EMPLOYEE' THEN 4
    WHEN 'ICT_STAFF' THEN 5
    WHEN 'CITIZEN' THEN 6
  END,
  email;

\echo ''

-- ============================================================================
-- SECTION 6: SECURITY VERIFICATION
-- ============================================================================

\echo '📊 SECTION 6: SECURITY VERIFICATION'
\echo '─────────────────────────────────────────'

-- Check password hashing
SELECT 
  '✅ Passwords Hashed' AS check_name,
  COUNT(*)::TEXT AS actual,
  COUNT(*)::TEXT AS expected,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE password_hash LIKE '$2%') THEN '✅ PASS'
    ELSE '❌ FAIL - Some passwords not hashed!'
  END AS status
FROM users;

-- Check email verification
SELECT 
  '✅ Users Email Verified' AS check_name,
  COUNT(*) FILTER (WHERE email_verified = TRUE)::TEXT AS actual,
  COUNT(*)::TEXT AS expected,
  CASE 
    WHEN COUNT(*) FILTER (WHERE email_verified = TRUE) = COUNT(*) THEN '✅ PASS'
    ELSE '⚠️ WARN - Some emails not verified'
  END AS status
FROM users;

-- Check RLS enabled
SELECT 
  '✅ RLS Enabled on All Tables' AS check_name,
  COUNT(*) FILTER (WHERE rowsecurity = TRUE)::TEXT AS actual,
  COUNT(*)::TEXT AS expected,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE rowsecurity = TRUE) THEN '✅ PASS'
    ELSE '❌ FAIL - RLS not enabled on all tables!'
  END AS status
FROM pg_tables 
WHERE schemaname = 'public';

\echo ''

-- ============================================================================
-- SECTION 7: FUNCTION VERIFICATION
-- ============================================================================

\echo '📊 SECTION 7: FUNCTION VERIFICATION'
\echo '─────────────────────────────────────────'

-- Count critical functions
WITH expected_functions AS (
  SELECT unnest(ARRAY[
    'update_updated_at_column',
    'get_current_user_id',
    'current_user_role',
    'current_user_institution',
    'generate_application_number',
    'generate_queue_number',
    'generate_maintenance_number',
    'get_unread_notification_count',
    'mark_all_notifications_read',
    'get_dashboard_stats',
    'log_audit_event',
    'check_account_lockout',
    'record_failed_login',
    'reset_failed_login_attempts',
    'clean_expired_tokens',
    'get_user_login_stats'
  ]) AS function_name
)
SELECT 
  '✅ Critical Functions' AS check_name,
  COUNT(DISTINCT r.routine_name)::TEXT AS actual,
  '16' AS expected,
  CASE 
    WHEN COUNT(DISTINCT r.routine_name) >= 16 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing functions!'
  END AS status
FROM expected_functions ef
LEFT JOIN information_schema.routines r 
  ON r.routine_name = ef.function_name
  AND r.routine_schema = 'public'
  AND r.routine_type = 'FUNCTION';

\echo ''
\echo 'All Functions:'
SELECT routine_name AS function_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

\echo ''

-- ============================================================================
-- SECTION 8: VIEW VERIFICATION
-- ============================================================================

\echo '📊 SECTION 8: VIEW VERIFICATION'
\echo '─────────────────────────────────────────'

SELECT 
  '✅ Critical Views' AS check_name,
  COUNT(*)::TEXT AS actual,
  '7' AS expected,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing views!'
  END AS status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'user_profiles',
    'application_summary',
    'queue_statistics',
    'maintenance_summary',
    'active_announcements',
    'user_notification_summary',
    'service_catalogue'
  );

\echo ''
\echo 'All Views:'
SELECT table_name AS view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''

-- ============================================================================
-- SECTION 9: DATA INTEGRITY CHECKS
-- ============================================================================

\echo '📊 SECTION 9: DATA INTEGRITY CHECKS'
\echo '─────────────────────────────────────────'

-- Check for orphaned service requirements
SELECT 
  '✅ No Orphaned Requirements' AS check_name,
  COUNT(*)::TEXT AS actual,
  '0' AS expected,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Found orphaned requirements!'
  END AS status
FROM service_requirements sr
WHERE NOT EXISTS (
  SELECT 1 FROM services s WHERE s.id = sr.service_id
);

-- Check for users with invalid institution references
SELECT 
  '✅ No Invalid Institution Refs' AS check_name,
  COUNT(*)::TEXT AS actual,
  '0' AS expected,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Found invalid institution references!'
  END AS status
FROM users u
WHERE u.institution_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institutions i WHERE i.id = u.institution_id
  );

-- Check staff users have employee_id
SELECT 
  '✅ Staff Have Employee IDs' AS check_name,
  COUNT(*)::TEXT AS actual,
  '0' AS expected,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Staff missing employee_id!'
  END AS status
FROM users
WHERE role IN ('INSTITUTION_MANAGER', 'EMPLOYEE', 'ICT_STAFF')
  AND employee_id IS NULL;

-- Check institution-scoped users have institution_id
SELECT 
  '✅ Staff Have Institution ID' AS check_name,
  COUNT(*)::TEXT AS actual,
  '0' AS expected,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Staff missing institution_id!'
  END AS status
FROM users
WHERE role IN ('INSTITUTION_MANAGER', 'EMPLOYEE', 'ICT_STAFF')
  AND institution_id IS NULL;

\echo ''

-- ============================================================================
-- SECTION 10: CONSTRAINT VERIFICATION
-- ============================================================================

\echo '📊 SECTION 10: CONSTRAINT VERIFICATION'
\echo '─────────────────────────────────────────'

-- Count foreign keys
SELECT 
  '✅ Foreign Key Constraints' AS check_name,
  COUNT(*)::TEXT AS actual,
  '>= 20' AS expected,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ PASS'
    ELSE '⚠️ WARN - Few foreign keys'
  END AS status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- Count unique constraints
SELECT 
  '✅ Unique Constraints' AS check_name,
  COUNT(*)::TEXT AS actual,
  '>= 10' AS expected,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS'
    ELSE '⚠️ WARN - Few unique constraints'
  END AS status
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
  AND table_schema = 'public';

-- Count check constraints
SELECT 
  '✅ Check Constraints' AS check_name,
  COUNT(*)::TEXT AS actual,
  '>= 5' AS expected,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS'
    ELSE '⚠️ WARN - Few check constraints'
  END AS status
FROM information_schema.table_constraints
WHERE constraint_type = 'CHECK'
  AND table_schema = 'public';

\echo ''

-- ============================================================================
-- SECTION 11: INDEX VERIFICATION
-- ============================================================================

\echo '📊 SECTION 11: INDEX VERIFICATION'
\echo '─────────────────────────────────────────'

SELECT 
  '✅ Total Indexes' AS check_name,
  COUNT(*)::TEXT AS actual,
  '>= 50' AS expected,
  CASE 
    WHEN COUNT(*) >= 50 THEN '✅ PASS'
    ELSE '⚠️ WARN - Consider adding more indexes'
  END AS status
FROM pg_indexes
WHERE schemaname = 'public';

\echo ''

-- ============================================================================
-- SECTION 12: PRODUCTION ENHANCEMENT TABLES
-- ============================================================================

\echo '📊 SECTION 12: PRODUCTION ENHANCEMENT TABLES'
\echo '─────────────────────────────────────────'

SELECT 
  '✅ Audit Logs Table' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs') THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 
  '✅ Password Reset Tokens Table' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'password_reset_tokens') THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 
  '✅ Email Verification Table' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_verification_tokens') THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 
  '✅ User Sessions Table' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 
  '✅ Failed Login Attempts Table' AS check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'failed_login_attempts') THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

\echo ''

-- ============================================================================
-- SECTION 13: USER TABLE ENHANCEMENTS
-- ============================================================================

\echo '📊 SECTION 13: USER TABLE ENHANCEMENTS'
\echo '─────────────────────────────────────────'

SELECT 
  '✅ email_verified column' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 
  '✅ failed_login_attempts column' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'failed_login_attempts'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 
  '✅ locked_until column' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'locked_until'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

SELECT 
  '✅ password_changed_at column' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_changed_at'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

\echo ''

-- ============================================================================
-- SECTION 14: FUNCTIONAL TESTS
-- ============================================================================

\echo '📊 SECTION 14: FUNCTIONAL TESTS'
\echo '─────────────────────────────────────────'

-- Test number generation functions
\echo ''
\echo 'Testing Number Generation Functions:'

DO $$
DECLARE
  test_app_number VARCHAR;
  test_queue_number VARCHAR;
  test_maint_number VARCHAR;
BEGIN
  -- Test application number generation
  test_app_number := generate_application_number('fayda', 'digital-id-application');
  RAISE NOTICE '✅ Application Number: %', test_app_number;
  
  -- Test queue number generation
  test_queue_number := generate_queue_number('fayda');
  RAISE NOTICE '✅ Queue Number: %', test_queue_number;
  
  -- Test maintenance number generation
  test_maint_number := generate_maintenance_number();
  RAISE NOTICE '✅ Maintenance Number: %', test_maint_number;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Number generation test failed: %', SQLERRM;
END $$;

\echo ''

-- Test account lockout function
\echo 'Testing Account Lockout Function:'
SELECT 
  is_locked,
  failed_attempts,
  CASE WHEN is_locked THEN '⚠️ LOCKED' ELSE '✅ NOT LOCKED' END AS status
FROM check_account_lockout('citizen@mesobcenter.et');

\echo ''

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════'
\echo '📊 VERIFICATION SUMMARY'
\echo '═══════════════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  '🗄️ Database Tables' AS component,
  (SELECT COUNT(*)::TEXT FROM pg_tables WHERE schemaname = 'public') || ' / 17' AS status,
  CASE WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') = 17 THEN '✅' ELSE '❌' END AS result;

SELECT 
  '🏛️ Institutions' AS component,
  (SELECT COUNT(*)::TEXT FROM institutions) || ' / 12' AS status,
  CASE WHEN (SELECT COUNT(*) FROM institutions) = 12 THEN '✅' ELSE '❌' END AS result;

SELECT 
  '📋 Services' AS component,
  (SELECT COUNT(*)::TEXT FROM services) || ' / 37' AS status,
  CASE WHEN (SELECT COUNT(*) FROM services) = 37 THEN '✅' ELSE '❌' END AS result;

SELECT 
  '📝 Requirements' AS component,
  (SELECT COUNT(*)::TEXT FROM service_requirements) || ' / 170' AS status,
  CASE WHEN (SELECT COUNT(*) FROM service_requirements) >= 170 THEN '✅' ELSE '❌' END AS result;

SELECT 
  '👥 Users' AS component,
  (SELECT COUNT(*)::TEXT FROM users) || ' / 13' AS status,
  CASE WHEN (SELECT COUNT(*) FROM users) = 13 THEN '✅' ELSE '❌' END AS result;

SELECT 
  '🔐 RLS Policies' AS component,
  'Enabled on ' || (SELECT COUNT(*)::TEXT FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = TRUE) || ' tables' AS status,
  CASE WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = TRUE) = 17 THEN '✅' ELSE '❌' END AS result;

SELECT 
  '⚙️ Functions' AS component,
  (SELECT COUNT(*)::TEXT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') || ' available' AS status,
  CASE WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') >= 16 THEN '✅' ELSE '❌' END AS result;

SELECT 
  '👁️ Views' AS component,
  (SELECT COUNT(*)::TEXT FROM information_schema.views WHERE table_schema = 'public') || ' / 7' AS status,
  CASE WHEN (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') >= 7 THEN '✅' ELSE '❌' END AS result;

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════'
\echo ''
\echo '✅ Database foundation verification complete!'
\echo ''
\echo 'Next Steps:'
\echo '  1. Review any ❌ FAIL items above'
\echo '  2. Ensure all passwords are properly hashed'
\echo '  3. Begin Phase 2: Authentication API Implementation'
\echo ''
\echo '═══════════════════════════════════════════════════════════════════════'

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================

