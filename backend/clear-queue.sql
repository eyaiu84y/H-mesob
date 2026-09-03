-- Delete all existing queue entries to clear duplicate keys
DELETE FROM queue_entries;

-- Reset sequence (if you have one) - optional
-- This ensures clean slate for testing

-- Verify deletion
SELECT COUNT(*) as remaining_queues FROM queue_entries;
