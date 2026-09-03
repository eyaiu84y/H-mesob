-- Database Persistence Verification Queries
-- Run these queries after test-database-persistence.sh completes

-- 1. Check all test users created
SELECT 
    id,
    email,
    full_name,
    role,
    institution_id,
    employee_id,
    status,
    created_at
FROM users
WHERE email LIKE '%@test.mesob.et'
ORDER BY created_at DESC;

-- 2. Count users by role
SELECT 
    role,
    COUNT(*) as count
FROM users
WHERE email LIKE '%@test.mesob.et'
GROUP BY role
ORDER BY role;

-- 3. Check institutional users
SELECT 
    email,
    full_name,
    role,
    institution_id,
    employee_id
FROM users
WHERE email LIKE '%@test.mesob.et'
  AND role IN ('INSTITUTION_MANAGER', 'EMPLOYEE', 'ICT_STAFF')
ORDER BY role, email;

-- 4. Check non-institutional users (MESOB_MANAGER, CITIZEN, SUPER_ADMIN)
SELECT 
    email,
    full_name,
    role,
    institution_id
FROM users
WHERE email LIKE '%@test.mesob.et'
  AND role IN ('MESOB_MANAGER', 'CITIZEN', 'SUPER_ADMIN')
ORDER BY role, email;

-- 5. Verify password hashing (should all have password_hash populated)
SELECT 
    email,
    role,
    LENGTH(password_hash) as hash_length,
    CASE 
        WHEN password_hash LIKE '$2%' THEN 'bcrypt'
        ELSE 'unknown'
    END as hash_type
FROM users
WHERE email LIKE '%@test.mesob.et'
ORDER BY email;

-- 6. Verify created_at timestamps
SELECT 
    email,
    role,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) as seconds_ago
FROM users
WHERE email LIKE '%@test.mesob.et'
ORDER BY created_at DESC;

-- 7. Check for any duplicate emails (should be empty)
SELECT 
    email,
    COUNT(*) as count
FROM users
WHERE email LIKE '%@test.mesob.et'
GROUP BY email
HAVING COUNT(*) > 1;

-- 8. Verify all test users are ACTIVE
SELECT 
    email,
    role,
    status
FROM users
WHERE email LIKE '%@test.mesob.et'
  AND status != 'ACTIVE';

-- 9. Full details of all test users
SELECT 
    id,
    email,
    full_name,
    phone,
    role,
    institution_id,
    employee_id,
    national_id,
    status,
    created_at,
    updated_at
FROM users
WHERE email LIKE '%@test.mesob.et'
ORDER BY created_at DESC;

-- 10. CLEANUP: Delete all test users (ONLY RUN IF YOU WANT TO CLEAN UP)
-- UNCOMMENT THE LINE BELOW TO DELETE TEST USERS
-- DELETE FROM users WHERE email LIKE '%@test.mesob.et';
