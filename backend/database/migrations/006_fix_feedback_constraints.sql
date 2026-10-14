-- Fix feedback unique constraints to properly handle applications vs queues
-- This migration fixes the issue where NULL queue_entry_id values were being treated as duplicates

-- Drop the problematic constraint
ALTER TABLE service_feedback 
DROP CONSTRAINT IF EXISTS unique_feedback_per_queue;

-- Create partial unique indexes that handle NULLs correctly
-- These indexes ensure:
-- 1. One feedback per citizen per application (for application-based feedback)
-- 2. One feedback per citizen per queue entry (for queue-based feedback)  
-- 3. One feedback per citizen per service (for general service feedback)

-- For application feedback (where queue_entry_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_feedback_per_application 
ON service_feedback (citizen_id, application_id) 
WHERE queue_entry_id IS NULL AND application_id IS NOT NULL;

-- For queue feedback (where application_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_feedback_per_queue_entry 
ON service_feedback (citizen_id, queue_entry_id) 
WHERE application_id IS NULL AND queue_entry_id IS NOT NULL;

-- For general service feedback (no application or queue reference)
CREATE UNIQUE INDEX IF NOT EXISTS unique_feedback_per_service 
ON service_feedback (citizen_id, service_id) 
WHERE application_id IS NULL AND queue_entry_id IS NULL;

-- Add comments for documentation
COMMENT ON INDEX unique_feedback_per_application IS 
'Ensures one feedback per citizen per application';

COMMENT ON INDEX unique_feedback_per_queue_entry IS 
'Ensures one feedback per citizen per queue entry';

COMMENT ON INDEX unique_feedback_per_service IS 
'Ensures one feedback per citizen per service (when no application/queue reference)';
