-- Delete old/test feedback that's blocking new submissions
-- Run this in your PostgreSQL/Supabase SQL editor

-- Check existing feedback first
SELECT * FROM service_feedback 
WHERE citizen_id = '19ba3411-fe53-46c8-93c7-4b0f29ddc030';

-- Delete the feedback (uncomment to run)
-- DELETE FROM service_feedback 
-- WHERE citizen_id = '19ba3411-fe53-46c8-93c7-4b0f29ddc030';

-- OR delete all feedback for testing (uncomment to run)
-- DELETE FROM service_feedback;
