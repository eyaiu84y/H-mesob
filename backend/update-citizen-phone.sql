-- ============================================================================
-- Update Citizen Phone Number
-- Description: Update test citizen user with actual phone number for SMS testing
-- ============================================================================

-- Update citizen user phone number
UPDATE users
SET 
  phone = '+251994351771',
  updated_at = NOW()
WHERE email = 'citizen@mesobcenter.et';

-- Verify update
SELECT 
  email,
  full_name,
  phone,
  role,
  status
FROM users
WHERE email = 'citizen@mesobcenter.et';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Citizen phone number updated to +251994351771';
END $$;
