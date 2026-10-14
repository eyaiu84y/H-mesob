-- URGENT FIX: Remove problematic feedback constraint and replace with proper partial indexes
-- This fixes the issue where citizens can't submit multiple queue feedbacks

-- 1. Drop the old problematic constraint that treats all NULL application_ids as duplicates
ALTER TABLE service_feedback 
DROP CONSTRAINT IF EXISTS unique_feedback_per_application;

-- 2. Drop the old queue constraint if it exists
ALTER TABLE service_feedback 
DROP CONSTRAINT IF EXISTS unique_feedback_per_queue;

-- 3. Create partial unique indexes that handle NULLs correctly

-- For application feedback (where queue_entry_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_feedback_per_application 
ON service_feedback (citizen_id, application_id) 
WHERE queue_entry_id IS NULL AND application_id IS NOT NULL;

-- For queue feedback (where application_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_feedback_per_queue_entry 
ON service_feedback (citizen_id, queue_entry_id) 
WHERE application_id IS NULL AND queue_entry_id IS NOT NULL;

-- For general service feedback (no application or queue reference)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_feedback_per_service 
ON service_feedback (citizen_id, service_id) 
WHERE application_id IS NULL AND queue_entry_id IS NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_unique_feedback_per_application IS 
'Ensures one feedback per citizen per application';

COMMENT ON INDEX idx_unique_feedback_per_queue_entry IS 
'Ensures one feedback per citizen per queue entry';

COMMENT ON INDEX idx_unique_feedback_per_service IS 
'Ensures one feedback per citizen per service (when no application/queue reference)';

-- Verify the changes
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint 
WHERE conrelid = 'service_feedback'::regclass
    AND conname LIKE '%feedback%';

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'service_feedback'
    AND indexname LIKE '%feedback%';
