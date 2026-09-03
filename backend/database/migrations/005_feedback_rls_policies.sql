-- ============================================================================
-- Feedback RLS Policies
-- Description: Row Level Security policies for service_feedback table
-- Version: 1.0.0
-- Date: 2026-08-24
-- ============================================================================

-- Enable RLS on service_feedback table
ALTER TABLE service_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: Citizens can insert their own feedback
-- ============================================================================

CREATE POLICY feedback_citizen_insert ON service_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be a CITIZEN
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'CITIZEN'
      AND users.status = 'ACTIVE'
    )
    AND
    -- Citizen can only insert feedback for themselves
    citizen_id = auth.uid()
  );

-- ============================================================================
-- POLICY: Citizens can view their own feedback
-- ============================================================================

CREATE POLICY feedback_citizen_select ON service_feedback
  FOR SELECT
  TO authenticated
  USING (
    -- Citizens can see their own feedback
    (citizen_id = auth.uid() AND 
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid()
       AND users.role = 'CITIZEN'
       AND users.status = 'ACTIVE'
     ))
  );

-- ============================================================================
-- POLICY: Institution Managers can view feedback for their institution
-- ============================================================================

CREATE POLICY feedback_institution_manager_select ON service_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'INSTITUTION_MANAGER'
      AND users.status = 'ACTIVE'
      AND users.institution_id = service_feedback.institution_id
    )
  );

-- ============================================================================
-- POLICY: MESOB Managers can view all feedback
-- ============================================================================

CREATE POLICY feedback_mesob_manager_select ON service_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'MESOB_MANAGER'
      AND users.status = 'ACTIVE'
    )
  );

-- ============================================================================
-- POLICY: Super Admins can view all feedback
-- ============================================================================

CREATE POLICY feedback_super_admin_all ON service_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
      AND users.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
      AND users.status = 'ACTIVE'
    )
  );

-- ============================================================================
-- POLICY: Service role can do everything (for backend operations)
-- ============================================================================

CREATE POLICY feedback_service_role_all ON service_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY feedback_citizen_insert ON service_feedback IS 
  'Citizens can only submit feedback for themselves';
  
COMMENT ON POLICY feedback_citizen_select ON service_feedback IS 
  'Citizens can view their own feedback';
  
COMMENT ON POLICY feedback_institution_manager_select ON service_feedback IS 
  'Institution Managers can view feedback for their institution only';
  
COMMENT ON POLICY feedback_mesob_manager_select ON service_feedback IS 
  'MESOB Managers can view all feedback across institutions';
  
COMMENT ON POLICY feedback_super_admin_all ON service_feedback IS 
  'Super Admins have full access to all feedback';
  
COMMENT ON POLICY feedback_service_role_all ON service_feedback IS 
  'Service role (backend) has full access for operations';

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
