-- ============================================================================
-- Database Verification Script
-- Date: 2026-08-24
-- Description: Comprehensive database verification for Hawassa MESOB system
-- ============================================================================

\echo '========================================';
\echo 'HAWASSA MESOB DATABASE VERIFICATION';
\echo '========================================';
\echo '';

-- ============================================================================
-- 1. VERIFY ENUMS
-- ============================================================================

\echo '1. Verifying Enums...';
\echo '-------------------';

SELECT 
  'user_role' AS enum_name,
  unnest(enum_range(NULL::user_role))::text AS value
UNION ALL
SELECT 
  'user_status',
  unnest(enum_range(NULL::user_status))::text
UNION ALL
SELECT 
  'institution_status',
  unnest(enum_range(NULL::institution_status))::text
UNION ALL
SELECT 
  'application_status',
  unnest(enum_range(NULL::application_status))::text
UNION ALL
SELECT 
  'queue_status',
  unnest(enum_range(NULL::queue_status))::text
UNION ALL
SELECT 
  'queue_priority',
  unnest(enum_range(NULL::queue_priority))::text
UNION ALL
SELECT 
  'maintenance_status',
  unnest(enum_range(NULL::maintenance_status))::text
UNION ALL
SELECT 
  'maintenance_priority',
  unnest(enum_range(NULL::maintenance_priority))::text
UNION ALL
SELECT 
  'task_status',
  unnest(enum_range(NULL::task_status))::text
UNION ALL
SELECT 
  'announcement_scope',
  unnest(enum_range(NULL::announcement_scope))::text
UNION ALL
SELECT 
  'notification_type',
  unnest(enum_range(NULL::notification_type))::text
ORDER BY enum_name, value;

\echo '';

-- ============================================================================
-- 2. VERIFY TABLES EXIST
-- ============================================================================

\echo '2. Verifying Tables...';
\echo '-------------------';

SELECT 
  tablename AS table_name,
  CASE 
    WHEN tablename IN (
      'users', 'institutions', 'services', 'service_requirements',
      'applications', 'queue_entries', 'maintenance_reports',
      'maintenance_attachments', 'maintenance_tasks', 'announcements',
      'notifications', 'telegram_users'
    ) THEN '✓ EXISTS'
    ELSE '✗ UNKNOWN TABLE'
  END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

\echo '';

-- ============================================================================
-- 3. VERIFY PRIMARY KEYS
-- ============================================================================

\echo '3. Verifying Primary Keys...';
\echo '-------------------------';

SELECT 
  tc.table_name,
  kcu.column_name,
  '✓ PRIMARY KEY' AS status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

\echo '';

-- ============================================================================
-- 4. VERIFY FOREIGN KEYS
-- ============================================================================

\echo '4. Verifying Foreign Keys...';
\echo '-------------------------';

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✓ FOREIGN KEY' AS status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo '';

-- ============================================================================
-- 5. VERIFY NOT NULL CONSTRAINTS
-- ============================================================================

\echo '5. Verifying NOT NULL Constraints...';
\echo '----------------------------------';

SELECT 
  table_name,
  column_name,
  data_type,
  '✓ NOT NULL' AS constraint_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND is_nullable = 'NO'
  AND table_name IN (
    'users', 'institutions', 'services', 'service_requirements',
    'applications', 'queue_entries', 'maintenance_reports',
    'maintenance_attachments', 'maintenance_tasks', 'announcements',
    'notifications', 'telegram_users'
  )
ORDER BY table_name, ordinal_position;

\echo '';

-- ============================================================================
-- 6. VERIFY UNIQUE CONSTRAINTS
-- ============================================================================

\echo '6. Verifying UNIQUE Constraints...';
\echo '-------------------------------';

SELECT 
  tc.table_name,
  kcu.column_name,
  '✓ UNIQUE' AS status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo '';

-- ============================================================================
-- 7. VERIFY CHECK CONSTRAINTS
-- ============================================================================

\echo '7. Verifying CHECK Constraints...';
\echo '------------------------------';

SELECT 
  con.conname AS constraint_name,
  rel.relname AS table_name,
  pg_get_constraintdef(con.oid) AS constraint_definition,
  '✓ CHECK' AS status
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE con.contype = 'c'
  AND rel.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY rel.relname, con.conname;

\echo '';

-- ============================================================================
-- 8. VERIFY INDEXES
-- ============================================================================

\echo '8. Verifying Indexes...';
\echo '--------------------';

SELECT 
  schemaname,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS index_definition,
  '✓ INDEX' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'institutions', 'services', 'service_requirements',
    'applications', 'queue_entries', 'maintenance_reports',
    'maintenance_attachments', 'maintenance_tasks', 'announcements',
    'notifications', 'telegram_users'
  )
ORDER BY tablename, indexname;

\echo '';

-- ============================================================================
-- 9. VERIFY TRIGGERS
-- ============================================================================

\echo '9. Verifying Triggers...';
\echo '---------------------';

SELECT 
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event_type,
  action_timing AS timing,
  '✓ TRIGGER' AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'users', 'institutions', 'services', 'service_requirements',
    'applications', 'queue_entries', 'maintenance_reports',
    'maintenance_tasks', 'announcements'
  )
ORDER BY event_object_table, trigger_name;

\echo '';

-- ============================================================================
-- 10. VERIFY INSTITUTIONS (SHOULD BE 12)
-- ============================================================================

\echo '10. Verifying Institutions (Should be 12)...';
\echo '-----------------------------------------';

SELECT 
  COUNT(*) AS total_institutions,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_institutions,
  CASE 
    WHEN COUNT(*) = 12 THEN '✓ CORRECT COUNT (12)'
    ELSE '✗ INCORRECT COUNT (Expected 12, Found ' || COUNT(*) || ')'
  END AS verification_status
FROM institutions;

-- List all institutions
SELECT 
  ROW_NUMBER() OVER (ORDER BY code) AS "#",
  code,
  name_en,
  name_am,
  status,
  created_at
FROM institutions
ORDER BY code;

\echo '';

-- ============================================================================
-- 11. VERIFY SERVICES
-- ============================================================================

\echo '11. Verifying Services...';
\echo '----------------------';

SELECT 
  i.code AS institution_code,
  i.name_en AS institution_name,
  COUNT(s.id) AS service_count,
  CASE 
    WHEN COUNT(s.id) > 0 THEN '✓ HAS SERVICES'
    ELSE '✗ NO SERVICES'
  END AS status
FROM institutions i
LEFT JOIN services s ON i.id = s.institution_id
GROUP BY i.code, i.name_en
ORDER BY i.code;

\echo '';

-- ============================================================================
-- 12. VERIFY USERS BY ROLE
-- ============================================================================

\echo '12. Verifying Users by Role...';
\echo '----------------------------';

SELECT 
  role,
  COUNT(*) AS user_count,
  '✓' AS status
FROM users
GROUP BY role
ORDER BY role;

\echo '';

-- ============================================================================
-- 13. VERIFY RLS POLICIES
-- ============================================================================

\echo '13. Verifying RLS Policies...';
\echo '---------------------------';

SELECT 
  schemaname,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd AS command,
  '✓ POLICY' AS status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo '';

-- ============================================================================
-- 14. VERIFY FUNCTIONS
-- ============================================================================

\echo '14. Verifying Functions...';
\echo '-----------------------';

SELECT 
  routine_name AS function_name,
  routine_type AS type,
  data_type AS return_type,
  '✓ FUNCTION' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type IN ('FUNCTION', 'PROCEDURE')
  AND routine_name IN (
    'update_updated_at_column',
    'get_current_user_id',
    'current_user_role',
    'current_user_institution',
    'generate_application_number',
    'generate_queue_number',
    'generate_maintenance_number'
  )
ORDER BY routine_name;

\echo '';

-- ============================================================================
-- 15. VERIFY DATA INTEGRITY
-- ============================================================================

\echo '15. Verifying Data Integrity...';
\echo '-----------------------------';

-- Check for orphaned records (foreign keys pointing to non-existent records)

-- Users with invalid institution_id
SELECT 
  'users' AS table_name,
  'institution_id' AS foreign_key,
  COUNT(*) AS orphaned_records,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ NO ORPHANS'
    ELSE '✗ ORPHANS FOUND'
  END AS status
FROM users u
WHERE u.institution_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = u.institution_id);

-- Applications with invalid citizen_id
SELECT 
  'applications' AS table_name,
  'citizen_id' AS foreign_key,
  COUNT(*) AS orphaned_records,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ NO ORPHANS'
    ELSE '✗ ORPHANS FOUND'
  END AS status
FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.citizen_id);

-- Applications with invalid service_id
SELECT 
  'applications' AS table_name,
  'service_id' AS foreign_key,
  COUNT(*) AS orphaned_records,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ NO ORPHANS'
    ELSE '✗ ORPHANS FOUND'
  END AS status
FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.id = a.service_id);

-- Applications with invalid institution_id
SELECT 
  'applications' AS table_name,
  'institution_id' AS foreign_key,
  COUNT(*) AS orphaned_records,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ NO ORPHANS'
    ELSE '✗ ORPHANS FOUND'
  END AS status
FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = a.institution_id);

\echo '';

-- ============================================================================
-- 16. VERIFY TIMESTAMPS
-- ============================================================================

\echo '16. Verifying Timestamp Columns...';
\echo '-------------------------------';

SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  '✓ TIMESTAMP' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'timestamp with time zone'
  AND table_name IN (
    'users', 'institutions', 'services', 'service_requirements',
    'applications', 'queue_entries', 'maintenance_reports',
    'maintenance_attachments', 'maintenance_tasks', 'announcements',
    'notifications', 'telegram_users'
  )
ORDER BY table_name, column_name;

\echo '';

-- ============================================================================
-- 17. VERIFY VIEWS
-- ============================================================================

\echo '17. Verifying Views...';
\echo '-------------------';

SELECT 
  table_name AS view_name,
  '✓ VIEW EXISTS' AS status
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

\echo '';

-- ============================================================================
-- 18. DATABASE STATISTICS
-- ============================================================================

\echo '18. Database Statistics...';
\echo '-----------------------';

SELECT 
  'users' AS table_name,
  COUNT(*) AS row_count
FROM users
UNION ALL
SELECT 'institutions', COUNT(*) FROM institutions
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'service_requirements', COUNT(*) FROM service_requirements
UNION ALL
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'queue_entries', COUNT(*) FROM queue_entries
UNION ALL
SELECT 'maintenance_reports', COUNT(*) FROM maintenance_reports
UNION ALL
SELECT 'maintenance_attachments', COUNT(*) FROM maintenance_attachments
UNION ALL
SELECT 'maintenance_tasks', COUNT(*) FROM maintenance_tasks
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'telegram_users', COUNT(*) FROM telegram_users
ORDER BY table_name;

\echo '';
\echo '========================================';
\echo 'VERIFICATION COMPLETE';
\echo '========================================';

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================
