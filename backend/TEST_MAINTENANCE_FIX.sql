-- ============================================================================
-- Test Script: Maintenance Report Creation Fix
-- ============================================================================

-- Step 1: Apply the RLS policy fix
DROP POLICY IF EXISTS "employee_create_maintenance_reports" ON maintenance_reports;
CREATE POLICY "employee_create_maintenance_reports" ON maintenance_reports
  FOR INSERT
  WITH CHECK (
    public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER', 'ICT_STAFF') 
    AND institution_id = public.current_user_institution()
  );

-- Step 2: Verify the policy was created
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
WHERE tablename = 'maintenance_reports'
  AND policyname = 'employee_create_maintenance_reports';

-- Step 3: Test data - Get a test employee and institution
SELECT 
  u.id as user_id,
  u.full_name,
  u.email,
  u.role,
  u.institution_id,
  i.code as institution_code,
  i.name_en as institution_name
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE u.role = 'EMPLOYEE'
  AND u.status = 'ACTIVE'
LIMIT 1;

-- Step 4: Verify maintenance_reports table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'maintenance_reports'
ORDER BY ordinal_position;

-- Step 5: Check enum values for priority
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'maintenance_priority'
ORDER BY enumsortorder;

-- Step 6: Check enum values for status
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'maintenance_status'
ORDER BY enumsortorder;

-- ============================================================================
-- Manual Insert Test (simulate what backend does)
-- Replace these UUIDs with actual values from Step 3
-- ============================================================================

/*
-- Example test insert (uncomment and replace UUIDs after running Step 3)

INSERT INTO maintenance_reports (
  report_number,
  reported_by,
  institution_id,
  title,
  description,
  location,
  equipment_info,
  category,
  priority,
  status
) VALUES (
  'MAINT-2026-TEST01',
  'user-uuid-from-step-3',  -- Replace
  'institution-uuid-from-step-3',  -- Replace
  'Test Hardware Issue',
  'Test maintenance report description',
  'Building A, Floor 2',
  'Office: 201',
  'Hardware',
  'NORMAL',
  'REPORTED'
) RETURNING *;
*/

-- ============================================================================
-- Verify existing maintenance reports
-- ============================================================================

SELECT 
  mr.id,
  mr.report_number,
  mr.title,
  mr.priority,
  mr.status,
  mr.created_at,
  u.full_name as reported_by,
  i.name_en as institution
FROM maintenance_reports mr
JOIN users u ON mr.reported_by = u.id
JOIN institutions i ON mr.institution_id = i.id
ORDER BY mr.created_at DESC
LIMIT 5;

-- ============================================================================
-- END OF TEST SCRIPT
-- ============================================================================
