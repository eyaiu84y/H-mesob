-- ============================================================================
-- Verification Script: Ethio Telecom Users
-- Purpose: Check all users created for Ethio Telecom institution
-- Date: August 24, 2026
-- ============================================================================

-- ============================================================================
-- 1. Check Ethio Telecom Institution Exists
-- ============================================================================

SELECT 
  '1. INSTITUTION CHECK' as section,
  id,
  code,
  name_en,
  name_am,
  status,
  created_at
FROM institutions
WHERE code = 'ethiotel';

-- Expected Result: One row with status = 'ACTIVE'

-- ============================================================================
-- 2. Get Ethio Telecom Institution ID
-- ============================================================================

SELECT 
  '2. INSTITUTION ID' as section,
  id as institution_id,
  name_en as institution_name
FROM institutions
WHERE code = 'ethiotel';

-- Copy this UUID for reference

-- ============================================================================
-- 3. Count All Users by Institution
-- ============================================================================

SELECT 
  '3. USER COUNT BY INSTITUTION' as section,
  i.name_en as institution,
  COUNT(u.id) as user_count
FROM institutions i
LEFT JOIN users u ON u.institution_id = i.id
WHERE i.status = 'ACTIVE'
GROUP BY i.id, i.name_en
ORDER BY user_count DESC, i.name_en;

-- Shows user distribution across all institutions

-- ============================================================================
-- 4. List All Ethio Telecom Users
-- ============================================================================

SELECT 
  '4. ETHIO TELECOM USERS' as section,
  u.full_name,
  u.email,
  u.role,
  u.employee_id,
  u.phone_number,
  u.status,
  u.created_at
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel'
ORDER BY 
  CASE u.role
    WHEN 'INSTITUTION_MANAGER' THEN 1
    WHEN 'ICT_STAFF' THEN 2
    WHEN 'EMPLOYEE' THEN 3
    ELSE 4
  END,
  u.created_at;

-- Should show all users created for Ethio Telecom

-- ============================================================================
-- 5. Verify User Roles for Ethio Telecom
-- ============================================================================

SELECT 
  '5. USERS BY ROLE' as section,
  u.role,
  COUNT(*) as count,
  STRING_AGG(u.full_name, ', ') as users
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel'
GROUP BY u.role
ORDER BY count DESC;

-- Shows distribution of roles (Institution Manager, Employee, ICT Staff)

-- ============================================================================
-- 6. Check User Status
-- ============================================================================

SELECT 
  '6. USER STATUS' as section,
  u.status,
  COUNT(*) as count,
  STRING_AGG(u.full_name, ', ') as users
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel'
GROUP BY u.status;

-- All should be ACTIVE

-- ============================================================================
-- 7. Verify Complete User Details
-- ============================================================================

SELECT 
  '7. COMPLETE USER DETAILS' as section,
  u.id as user_id,
  u.full_name,
  u.email,
  u.phone_number,
  u.role,
  u.employee_id,
  u.status,
  i.name_en as institution_name,
  i.code as institution_code,
  u.institution_id,
  u.created_at,
  u.updated_at,
  CASE 
    WHEN u.password_hash IS NOT NULL THEN '✓ Password Set'
    ELSE '✗ No Password'
  END as password_status
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel'
ORDER BY u.created_at DESC;

-- Shows all details for each user

-- ============================================================================
-- 8. Test Data Integrity
-- ============================================================================

-- Check for duplicate emails (should return 0 rows)
SELECT 
  '8A. DUPLICATE EMAIL CHECK' as section,
  email,
  COUNT(*) as count
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel'
GROUP BY email
HAVING COUNT(*) > 1;

-- Check for duplicate employee IDs (should return 0 rows)
SELECT 
  '8B. DUPLICATE EMPLOYEE ID CHECK' as section,
  employee_id,
  COUNT(*) as count
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel' AND employee_id IS NOT NULL
GROUP BY employee_id
HAVING COUNT(*) > 1;

-- Check for users with missing required fields
SELECT 
  '8C. MISSING REQUIRED FIELDS CHECK' as section,
  full_name,
  email,
  CASE WHEN full_name IS NULL THEN '✗ Missing Name' ELSE '✓' END as name_check,
  CASE WHEN email IS NULL THEN '✗ Missing Email' ELSE '✓' END as email_check,
  CASE WHEN role IS NULL THEN '✗ Missing Role' ELSE '✓' END as role_check,
  CASE WHEN institution_id IS NULL THEN '✗ Missing Institution' ELSE '✓' END as institution_check
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel'
  AND (full_name IS NULL OR email IS NULL OR role IS NULL OR institution_id IS NULL);

-- Should return 0 rows (all fields present)

-- ============================================================================
-- 9. Sample Expected Results
-- ============================================================================

-- After creating the 4 example users, you should see:
-- 
-- USER 1: Institution Manager
--   full_name: Tigist Haile
--   email: tigist.haile@ethiotelecom.et
--   role: INSTITUTION_MANAGER
--   employee_id: MGR-ET-001
--   institution: Ethio Telecom
--   status: ACTIVE
--
-- USER 2: Employee
--   full_name: Abebe Bekele
--   email: abebe.bekele@ethiotelecom.et
--   role: EMPLOYEE
--   employee_id: EMP-ET-001
--   institution: Ethio Telecom
--   status: ACTIVE
--
-- USER 3: ICT Staff
--   full_name: Daniel Tesfaye
--   email: daniel.tesfaye@ethiotelecom.et
--   role: ICT_STAFF
--   employee_id: ICT-ET-001
--   institution: Ethio Telecom
--   status: ACTIVE
--
-- USER 4: Employee
--   full_name: Sara Alemayehu
--   email: sara.alemayehu@ethiotelecom.et
--   role: EMPLOYEE
--   employee_id: EMP-ET-002
--   institution: Ethio Telecom
--   status: ACTIVE

-- ============================================================================
-- 10. Quick Summary Query
-- ============================================================================

SELECT 
  '10. SUMMARY' as section,
  (SELECT name_en FROM institutions WHERE code = 'ethiotel') as institution,
  (SELECT COUNT(*) FROM users u JOIN institutions i ON u.institution_id = i.id WHERE i.code = 'ethiotel') as total_users,
  (SELECT COUNT(*) FROM users u JOIN institutions i ON u.institution_id = i.id WHERE i.code = 'ethiotel' AND u.role = 'INSTITUTION_MANAGER') as managers,
  (SELECT COUNT(*) FROM users u JOIN institutions i ON u.institution_id = i.id WHERE i.code = 'ethiotel' AND u.role = 'EMPLOYEE') as employees,
  (SELECT COUNT(*) FROM users u JOIN institutions i ON u.institution_id = i.id WHERE i.code = 'ethiotel' AND u.role = 'ICT_STAFF') as ict_staff,
  (SELECT COUNT(*) FROM users u JOIN institutions i ON u.institution_id = i.id WHERE i.code = 'ethiotel' AND u.status = 'ACTIVE') as active_users;

-- Single row summary of all Ethio Telecom users

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================

-- HOW TO USE:
-- 1. Connect to your database
-- 2. Run this entire script
-- 3. Check results for each section
-- 4. Verify users appear correctly
-- 5. Check for any integrity issues

-- EXPECTED RESULTS AFTER CREATING 4 USERS:
-- - Section 1: Shows Ethio Telecom institution (ACTIVE)
-- - Section 4: Lists 4 users (Tigist, Abebe, Daniel, Sara)
-- - Section 5: Shows roles (1 Manager, 2 Employees, 1 ICT Staff)
-- - Section 6: All status = ACTIVE
-- - Section 8: No duplicates, no missing fields
-- - Section 10: Summary shows total_users = 4

COMMENT ON SCRIPT IS 'Verification script for Ethio Telecom users - Run after creating users via Super Admin dashboard';
