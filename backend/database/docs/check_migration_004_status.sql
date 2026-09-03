-- ============================================================================
-- Check Migration 004 Status
-- Quick verification to see what's already created
-- ============================================================================

\echo '🔍 Checking Migration 004 Status...'
\echo ''

-- Check if new tables exist
\echo '1. Checking Security Tables:'
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs') 
    THEN '✅ audit_logs exists' 
    ELSE '❌ audit_logs missing' 
  END AS status
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'password_reset_tokens') 
    THEN '✅ password_reset_tokens exists' 
    ELSE '❌ password_reset_tokens missing' 
  END
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_verification_tokens') 
    THEN '✅ email_verification_tokens exists' 
    ELSE '❌ email_verification_tokens missing' 
  END
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions') 
    THEN '✅ user_sessions exists' 
    ELSE '❌ user_sessions missing' 
  END
UNION ALL
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'failed_login_attempts') 
    THEN '✅ failed_login_attempts exists' 
    ELSE '❌ failed_login_attempts missing' 
  END;

\echo ''
\echo '2. Checking Users Table Enhancements:'

-- Check if new user columns exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN '✅ email_verified column exists' 
    ELSE '❌ email_verified column missing' 
  END AS status
UNION ALL
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'failed_login_attempts'
  ) THEN '✅ failed_login_attempts column exists' 
    ELSE '❌ failed_login_attempts column missing' 
  END
UNION ALL
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'locked_until'
  ) THEN '✅ locked_until column exists' 
    ELSE '❌ locked_until column missing' 
  END
UNION ALL
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_changed_at'
  ) THEN '✅ password_changed_at column exists' 
    ELSE '❌ password_changed_at column missing' 
  END;

\echo ''
\echo '3. Checking Security Functions:'

-- Check if new functions exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'log_audit_event'
  ) THEN '✅ log_audit_event function exists' 
    ELSE '❌ log_audit_event function missing' 
  END AS status
UNION ALL
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'check_account_lockout'
  ) THEN '✅ check_account_lockout function exists' 
    ELSE '❌ check_account_lockout function missing' 
  END
UNION ALL
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'record_failed_login'
  ) THEN '✅ record_failed_login function exists' 
    ELSE '❌ record_failed_login function missing' 
  END
UNION ALL
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'clean_expired_tokens'
  ) THEN '✅ clean_expired_tokens function exists' 
    ELSE '❌ clean_expired_tokens function missing' 
  END;

\echo ''
\echo '4. Summary:'

-- Count total tables
SELECT 
  'Total Tables: ' || COUNT(*)::TEXT || ' / 17' AS summary
FROM pg_tables 
WHERE schemaname = 'public';

\echo ''
\echo '✅ If all items show ✅ above, Migration 004 is COMPLETE'
\echo '✅ You can safely proceed to Step 5 (User Seed)'
\echo ''

-- ============================================================================
-- END OF STATUS CHECK
-- ============================================================================
