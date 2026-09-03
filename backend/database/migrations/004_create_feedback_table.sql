-- ============================================================================
-- Feedback Table Migration
-- Description: Citizen service feedback and 5-star rating system
-- Version: 1.0.0
-- Date: 2026-08-24
-- ============================================================================

-- ============================================================================
-- TABLE: service_feedback
-- Description: Citizen feedback and ratings for completed services
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_feedback (
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
  source VARCHAR(20) DEFAULT 'WEBSITE' NOT NULL,  -- 'WEBSITE' or 'TELEGRAM'
  
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
-- INDEXES
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
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

DROP TRIGGER IF EXISTS update_service_feedback_updated_at ON service_feedback;
CREATE TRIGGER update_service_feedback_updated_at 
  BEFORE UPDATE ON service_feedback 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE service_feedback IS 'Citizen feedback and ratings for completed services';
COMMENT ON COLUMN service_feedback.rating IS 'Star rating from 1 (Poor) to 5 (Fantastic)';
COMMENT ON COLUMN service_feedback.source IS 'Submission source: WEBSITE or TELEGRAM';
COMMENT ON COLUMN service_feedback.application_id IS 'Optional link to specific application';
COMMENT ON COLUMN service_feedback.queue_entry_id IS 'Optional link to specific queue entry';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions (adjust based on your RLS setup)
GRANT SELECT, INSERT, UPDATE ON service_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON service_feedback TO service_role;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
