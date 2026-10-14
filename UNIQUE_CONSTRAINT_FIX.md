# Unique Constraint Issue Fix

## Error
```
duplicate key value violates unique constraint "unique_feedback_per_queue"
Key (citizen_id, queue_entry_id)=(19ba3411-fe53-46c8-93c7-4b0f29ddc030, null) already exists.
```

## Root Cause
The database has a unique constraint on `(citizen_id, queue_entry_id)` that treats NULL values as equal. When you submit feedback for an **application** (not a queue), the `queue_entry_id` is NULL. If you previously submitted feedback with NULL queue_entry_id, you cannot submit again.

## The Problem with the Database Constraint

The constraint `unique_feedback_per_queue` was designed to prevent duplicate feedback for queue entries, but it's incorrectly blocking application feedback because:

1. Application feedback has `queue_entry_id = NULL`
2. The unique constraint treats NULL as a value
3. Multiple rows with `(citizen_id, NULL)` violate the constraint

## Solutions

### Option 1: Delete Old Test Feedback (Quick Fix)
Run this SQL to delete your test feedback:

```sql
-- Check existing feedback
SELECT * FROM service_feedback 
WHERE citizen_id = '19ba3411-fe53-46c8-93c7-4b0f29ddc030';

-- Delete old feedback
DELETE FROM service_feedback 
WHERE citizen_id = '19ba3411-fe53-46c8-93c7-4b0f29ddc030';
```

### Option 2: Fix the Database Constraint (Proper Fix)
The database needs separate constraints for applications and queues:

```sql
-- Drop the problematic constraint
ALTER TABLE service_feedback 
DROP CONSTRAINT IF EXISTS unique_feedback_per_queue;

-- Add separate constraints for applications and queues
-- For application feedback: one feedback per citizen per application
ALTER TABLE service_feedback 
ADD CONSTRAINT unique_feedback_per_application 
UNIQUE (citizen_id, application_id);

-- For queue feedback: one feedback per citizen per queue entry
ALTER TABLE service_feedback 
ADD CONSTRAINT unique_feedback_per_queue_entry 
UNIQUE (citizen_id, queue_entry_id);
```

**Note**: The above constraints will only work if `application_id` and `queue_entry_id` are NOT NULL when used. If they can be NULL, we need a different approach.

### Option 3: Better Constraint (Recommended)
Use a partial unique index that handles NULLs correctly:

```sql
-- Drop old constraint
ALTER TABLE service_feedback 
DROP CONSTRAINT IF EXISTS unique_feedback_per_queue;

-- Create partial unique indexes that ignore NULLs
-- For applications only (where queue_entry_id IS NULL)
CREATE UNIQUE INDEX unique_feedback_per_application 
ON service_feedback (citizen_id, application_id) 
WHERE queue_entry_id IS NULL AND application_id IS NOT NULL;

-- For queues only (where application_id IS NULL)
CREATE UNIQUE INDEX unique_feedback_per_queue_entry 
ON service_feedback (citizen_id, queue_entry_id) 
WHERE application_id IS NULL AND queue_entry_id IS NOT NULL;

-- For general service feedback (no application or queue)
CREATE UNIQUE INDEX unique_feedback_per_service 
ON service_feedback (citizen_id, service_id) 
WHERE application_id IS NULL AND queue_entry_id IS NULL;
```

## Quick Test Steps

1. **Delete your old feedback**:
   ```sql
   DELETE FROM service_feedback WHERE citizen_id = '19ba3411-fe53-46c8-93c7-4b0f29ddc030';
   ```

2. **Restart backend** (code changes already applied)

3. **Try submitting feedback again** - should work now!

## Files Modified
- `backend/src/services/feedbackService.js` - Improved duplicate checking logic

## Next Steps
After testing, implement Option 3 (partial unique indexes) for the proper long-term fix.
