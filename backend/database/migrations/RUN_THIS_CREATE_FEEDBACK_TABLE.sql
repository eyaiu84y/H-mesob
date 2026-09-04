-- ============================================================================
-- FEEDBACK TABLE CREATION - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- Step 1: Create the service_feedback table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  
  -- Optional: Link to specific application or queue entry
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL,
  
  -- Rating (1-5 stars)
  rating INTEGER NOT NULL,
  
  -- Optional comment
  comment TEXT,
  
  -- Submission source
  source VARCHAR(20) DEFAULT 'WEBSITE' NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT source_type CHECK (source IN ('WEBSITE', 'TELEGRAM')),
  
  -- Prevent duplicate feedback for same application
  CONSTRAINT unique_feedback_per_application UNIQUE NULLS NOT DISTINCT (citizen_id, application_id),
  
  -- Prevent duplicate feedback for same queue entry
  CONSTRAINT unique_feedback_per_queue UNIQUE NULLS NOT DISTINCT (citizen_id, queue_entry_id)
);

-- ============================================================================
-- Step 2: Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_feedback_citizen_id ON service_feedback(citizen_id);
CREATE INDEX IF NOT EXISTS idx_feedback_institution_id ON service_feedback(institution_id);
CREATE INDEX IF NOT EXISTS idx_feedback_service_id ON service_feedback(service_id);
CREATE INDEX IF NOT EXISTS idx_feedback_application_id ON service_feedback(application_id);
CREATE INDEX IF NOT EXISTS idx_feedback_queue_entry_id ON service_feedback(queue_entry_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON service_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON service_feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON service_feedback(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_institution_rating ON service_feedback(institution_id, rating);
CREATE INDEX IF NOT EXISTS idx_feedback_service_rating ON service_feedback(service_id, rating);
CREATE INDEX IF NOT EXISTS idx_feedback_citizen_service ON service_feedback(citizen_id, service_id);

-- ============================================================================
-- Step 3: Create Trigger for updated_at
-- ============================================================================

-- First, ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_service_feedback_updated_at ON service_feedback;
CREATE TRIGGER update_service_feedback_updated_at 
  BEFORE UPDATE ON service_feedback 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Step 4: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE service_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 5: Create RLS Policies
-- ============================================================================

-- Policy: Citizens can insert their own feedback
CREATE POLICY feedback_citizen_insert ON service_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'CITIZEN'
      AND users.status = 'ACTIVE'
    )
    AND
    citizen_id = auth.uid()
  );

-- Policy: Citizens can view their own feedback
CREATE POLICY feedback_citizen_select ON service_feedback
  FOR SELECT
  TO authenticated
  USING (
    (citizen_id = auth.uid() AND 
     EXISTS (
       SELECT 1 FROM users 
       WHERE users.id = auth.uid() 
       AND users.role = 'CITIZEN'
     ))
  );

-- Policy: Institution Managers can view feedback for their institution
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

-- Policy: MESOB Managers can view all feedback
CREATE POLICY feedback_mesob_manager_select ON service_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'MESOB_MANAGER'
    )
  );

-- Policy: Super Admins can view all feedback
CREATE POLICY feedback_super_admin_all ON service_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Policy: Service role (backend) has full access
CREATE POLICY feedback_service_role_all ON service_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Step 6: Grant Permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON service_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_feedback TO service_role;

-- ============================================================================
-- Step 7: Add Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE service_feedback IS 'Citizen feedback and ratings for completed services';
COMMENT ON COLUMN service_feedback.rating IS 'Star rating from 1 (Poor) to 5 (Fantastic)';
COMMENT ON COLUMN service_feedback.source IS 'Submission source: WEBSITE or TELEGRAM';
COMMENT ON COLUMN service_feedback.application_id IS 'Optional link to specific application';
COMMENT ON COLUMN service_feedback.queue_entry_id IS 'Optional link to specific queue entry';

-- ============================================================================
-- Step 8: Verify the table was created
-- ============================================================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_feedback') 
    THEN '✅ service_feedback table created successfully!'
    ELSE '❌ ERROR: service_feedback table was not created'
  END AS result;

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'service_feedback'
ORDER BY ordinal_position;

-- ============================================================================
-- DONE! 
-- The service_feedback table is now ready to use.
-- Restart your backend server and the feedback system will work.
-- ============================================================================
