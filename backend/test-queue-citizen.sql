-- ============================================================================
-- Test Script: Verify Citizen Queue Registration
-- ============================================================================

-- Step 1: Check if citizen user exists and has correct role
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  institution_id,
  created_at
FROM users 
WHERE email = 'citizen@mesobcenter.et';

-- Step 2: Check if Sidama Bank institution exists
SELECT 
  id,
  code,
  name_en,
  name_am,
  status
FROM institutions 
WHERE code = 'sidama-bank';

-- Step 3: Check if Sidama Bank has services
SELECT 
  id,
  code,
  title_en,
  title_am,
  institution_id,
  is_active
FROM services 
WHERE institution_id = (SELECT id FROM institutions WHERE code = 'sidama-bank');

-- Step 4: Check RLS policies on queue_entries for CITIZEN role
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
WHERE tablename = 'queue_entries';

-- Step 5: Check if citizen has any existing queue entries
SELECT 
  qe.id,
  qe.queue_number,
  qe.status,
  qe.created_at,
  i.name_en as institution,
  s.title_en as service,
  u.full_name as citizen
FROM queue_entries qe
JOIN institutions i ON qe.institution_id = i.id
JOIN services s ON qe.service_id = s.id
JOIN users u ON qe.citizen_id = u.id
WHERE u.email = 'citizen@mesobcenter.et'
ORDER BY qe.created_at DESC
LIMIT 5;

-- Step 6: Check queue_entries table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'queue_entries'
ORDER BY ordinal_position;

