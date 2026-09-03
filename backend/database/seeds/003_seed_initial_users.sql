-- ============================================================================
-- Seed Data: Initial System Users
-- Version: 1.0.0
-- Description: Create initial users for system testing and deployment
-- IMPORTANT: Change passwords after first deployment!
-- ============================================================================

-- NOTE: These password hashes are for demonstration purposes.
-- In production, generate these using bcrypt with salt rounds 10-12.
-- Example: bcrypt.hash('password', 10)
--
-- Default passwords (CHANGE IN PRODUCTION):
-- - super123
-- - manager123
-- - inst123
-- - emp123
-- - ict123
-- - citizen123

DO $$
DECLARE
  inst_fayda_id UUID;
  inst_cbe_id UUID;
  inst_ethiotel_id UUID;
  super_admin_id UUID;
  mesob_manager_id UUID;
BEGIN

-- Get institution IDs
SELECT id INTO inst_fayda_id FROM institutions WHERE code = 'fayda';
SELECT id INTO inst_cbe_id FROM institutions WHERE code = 'cbe';
SELECT id INTO inst_ethiotel_id FROM institutions WHERE code = 'ethiotel';

-- ============================================================================
-- SUPER_ADMIN (No institution)
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at
) VALUES (
  'superadmin@mesobcenter.et',
  '$2b$10$4aN.B078KaxTjbMCzxigm.0J2lthWICWQPCkwyE7tsCUPX5G/yRHm',  -- SuperAdmin@2026
  'Super Admin',
  '+251911000001',
  'SUPER_ADMIN',
  'ACTIVE',
  NULL,
  'EMP-001',
  TRUE,
  NOW()
) RETURNING id INTO super_admin_id;

-- ============================================================================
-- MESOB_MANAGER (No institution)
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'manager@mesobcenter.et',
  '$2b$10$D9DGTJtkb3yOha4CCFCM6.SzX4gjXSGLl/vmMMbbS/j/KfOJY7tM6',  -- MesobManager@2026
  'MESOB Manager',
  '+251911000002',
  'MESOB_MANAGER',
  'ACTIVE',
  NULL,
  'EMP-002',
  TRUE,
  NOW(),
  super_admin_id
) RETURNING id INTO mesob_manager_id;

-- ============================================================================
-- INSTITUTION_MANAGER - National ID Program / Fayda
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'inst.manager@mesobcenter.et',
  '$2b$10$wRqUtMBWf0YzrSH6N.q.J.44kyR9dh0sk/Qyx5rraWDDD3UM6IasC',  -- InstManager@2026
  'Institution Manager',
  '+251911000003',
  'INSTITUTION_MANAGER',
  'ACTIVE',
  inst_fayda_id,
  'EMP-003',
  TRUE,
  NOW(),
  super_admin_id
);

-- ============================================================================
-- EMPLOYEE - National ID Program / Fayda
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'employee@mesobcenter.et',
  '$2b$10$E4K7ZgBd1eAnYJYLZQ946O5iDfg8D07gilhX1BZ1pY00.qQ01WOru',  -- Employee@2026
  'Abebe Kebede',
  '+251911000004',
  'EMPLOYEE',
  'ACTIVE',
  inst_fayda_id,
  'EMP-004',
  TRUE,
  NOW(),
  super_admin_id
);

-- ============================================================================
-- ICT_STAFF - National ID Program / Fayda
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'ict.staff@mesobcenter.et',
  '$2b$10$JnvpxvRy.8sYAm1ewSUhLuietKi5TirM.1xPNBAXodpEFt65Jsi/W',  -- IctStaff@2026
  'ICT Staff',
  '+251911000005',
  'ICT_STAFF',
  'ACTIVE',
  inst_fayda_id,
  'TECH-001',
  TRUE,
  NOW(),
  super_admin_id
);

-- ============================================================================
-- CITIZEN (No institution)
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at
) VALUES (
  'citizen@mesobcenter.et',
  '$2b$10$OIIU8Dz6tP5ZsYyg6cksjuGWV2yG4dJGq1UeU0raMsWtDEaRCkObe',  -- Citizen@2026
  'Citizen User',
  '+251911000006',
  'CITIZEN',
  'ACTIVE',
  NULL,
  NULL,
  TRUE,
  NOW()
);

-- ============================================================================
-- INSTITUTION_MANAGER - Commercial Bank of Ethiopia (CBE)
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'cbe.manager@mesobcenter.et',
  '$2b$10$XnNDPJL6xZrvN.I1s4v//eYOLu2tqe/wkMfVm.9QXNS6kg6ZLrwy2',  -- CbeManager@2026
  'Yonas Tadesse',
  '+251911000007',
  'INSTITUTION_MANAGER',
  'ACTIVE',
  inst_cbe_id,
  'EMP-007',
  TRUE,
  NOW(),
  super_admin_id
);

-- ============================================================================
-- EMPLOYEE - Commercial Bank of Ethiopia (CBE)
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'cbe.employee@mesobcenter.et',
  '$2b$10$L34N5dkYX9mw5J5Qo4iBOOKbfvfmLSHleFu1coUfLILpk7gmhrx3O',  -- CbeEmployee@2026
  'Meron Alemu',
  '+251911000008',
  'EMPLOYEE',
  'ACTIVE',
  inst_cbe_id,
  'EMP-008',
  TRUE,
  NOW(),
  super_admin_id
);

-- ============================================================================
-- ICT_STAFF - Commercial Bank of Ethiopia (CBE)
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'cbe.ict@mesobcenter.et',
  '$2b$10$1owyBW.iQlg7AJN6f4Ya3OGxTxzSZRGrJkG02Umg0lroXCtazDLzG',  -- CbeIct@2026
  'Solomon Bekele',
  '+251911000009',
  'ICT_STAFF',
  'ACTIVE',
  inst_cbe_id,
  'TECH-002',
  TRUE,
  NOW(),
  super_admin_id
);

-- ============================================================================
-- INSTITUTION_MANAGER - Ethio Telecom
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'ethiotel.manager@mesobcenter.et',
  '$2b$10$8RbL2AbS1DGNzfvuHAmzPuF8UaF3HS2pvKVGfqcfeto5jT77IE3wC',  -- EthioManager@2026
  'Tigist Worku',
  '+251911000010',
  'INSTITUTION_MANAGER',
  'ACTIVE',
  inst_ethiotel_id,
  'EMP-010',
  TRUE,
  NOW(),
  super_admin_id
);

-- ============================================================================
-- EMPLOYEE - Ethio Telecom
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'ethiotel.employee@mesobcenter.et',
  '$2b$10$VVcVYAOtY2/qvSldogN1BuVTHjlN///70bAIkVCgQeX8o42znIf06',  -- EthioEmployee@2026
  'Dawit Haile',
  '+251911000011',
  'EMPLOYEE',
  'ACTIVE',
  inst_ethiotel_id,
  'EMP-011',
  TRUE,
  NOW(),
  super_admin_id
);

-- ============================================================================
-- ICT_STAFF - Ethio Telecom
-- ============================================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  phone,
  role,
  status,
  institution_id,
  employee_id,
  email_verified,
  created_at,
  created_by
) VALUES (
  'ethiotel.ict@mesobcenter.et',
  '$2b$10$DjgcHH4ZJ9jkP4iubgTJwuEv6Yykl04XU/SOyUmV4a7HyvAhuHRxu',  -- EthioIct@2026
  'Hanna Tesfaye',
  '+251911000012',
  'ICT_STAFF',
  'ACTIVE',
  inst_ethiotel_id,
  'TECH-003',
  TRUE,
  NOW(),
  super_admin_id
);

END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all 12 users were created
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  
  IF user_count < 12 THEN
    RAISE EXCEPTION 'User creation failed. Expected 12 users, got %', user_count;
  END IF;
  
  RAISE NOTICE '✅ Successfully created % initial users', user_count;
END $$;

-- Display created users
SELECT 
  email,
  full_name,
  role,
  institution_id IS NOT NULL AS has_institution,
  employee_id,
  status,
  email_verified
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

-- ============================================================================
-- IMPORTANT SECURITY NOTES
-- ============================================================================

-- ⚠️  CRITICAL: These are DEMO users with PLACEHOLDER password hashes!
--
-- Before production deployment:
-- 1. Generate real bcrypt hashes for each password
-- 2. Use strong, unique passwords for each user
-- 3. Ensure all users change passwords on first login
-- 4. Enable password rotation policies
-- 5. Enable MFA for admin users (future enhancement)
--
-- To generate a bcrypt hash in Node.js:
--   const bcrypt = require('bcrypt');
--   const hash = await bcrypt.hash('your_password', 10);
--
-- Password requirements (to be enforced in backend):
-- - Minimum 8 characters
-- - At least one uppercase letter
-- - At least one lowercase letter
-- - At least one number
-- - At least one special character
--
-- Default test passwords (CHANGE IN PRODUCTION):
-- - superadmin@mesobcenter.et: super123
-- - manager@mesobcenter.et: manager123
-- - inst.manager@mesobcenter.et: inst123
-- - employee@mesobcenter.et: emp123
-- - ict.staff@mesobcenter.et: ict123
-- - citizen@mesobcenter.et: citizen123
-- - cbe.manager@mesobcenter.et: cbe123
-- - cbe.employee@mesobcenter.et: cbe123
-- - cbe.ict@mesobcenter.et: cbe123
-- - ethiotel.manager@mesobcenter.et: ethio123
-- - ethiotel.employee@mesobcenter.et: ethio123
-- - ethiotel.ict@mesobcenter.et: ethio123

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================

