-- ============================================================================
-- FIX: Add CITIZEN INSERT policy for queue_entries
-- Issue: Citizens could not register for queue because INSERT policy was missing
-- ============================================================================

-- Allow citizens to create queue entries
DROP POLICY IF EXISTS "citizen_create_queue_entry" ON queue_entries;

CREATE POLICY "citizen_create_queue_entry" ON queue_entries
  FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'CITIZEN'
    AND citizen_id = public.get_current_user_id()
  );

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies 
WHERE tablename = 'queue_entries'
  AND policyname = 'citizen_create_queue_entry';
