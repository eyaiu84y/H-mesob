# Feedback 500 Error Fix

## Problem
Feedback submission was failing with:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
POST /api/feedback
```

## Root Cause
In `backend/src/services/feedbackService.js` line 82-85, the duplicate feedback check was using `.single()`:

```javascript
const { data: existingFeedback } = await duplicateQuery.single();
```

The `.single()` method in Supabase throws an error when:
- No rows are found (PGRST116 error)
- More than one row is found

When checking for duplicate feedback, **not finding a duplicate is the expected/normal case**. But `.single()` was throwing an error, causing the 500 Internal Server Error.

## Solution
Changed `.single()` to `.maybeSingle()` and properly handle the error:

```javascript
const { data: existingFeedback, error: duplicateError } = await duplicateQuery.maybeSingle();

// Ignore "no rows" error (PGRST116) - it means no duplicate exists, which is good
if (duplicateError && duplicateError.code !== 'PGRST116') {
  console.error('Error checking for duplicate feedback:', duplicateError);
  throw new Error('Failed to check for existing feedback');
}

if (existingFeedback) {
  throw new Error('You have already rated this service');
}
```

## Difference between `.single()` and `.maybeSingle()`

### `.single()`
- Returns exactly one row
- Throws error if 0 rows found
- Throws error if >1 rows found
- Use when you EXPECT exactly one row

### `.maybeSingle()`
- Returns one row or null
- Returns `{ data: null, error: null }` if 0 rows found
- Throws error if >1 rows found
- Use when you want to CHECK if a row exists

## Files Modified
- `backend/src/services/feedbackService.js` (Line ~82-90)

## Testing
1. Start/restart the backend server (the code change needs to be loaded)
2. Login as a citizen
3. Go to a completed application
4. Submit feedback with a rating
5. **Expected**: Feedback submits successfully
6. **No 500 error**

## Additional Notes
- This same pattern should be checked in other places where `.single()` is used for existence checks
- The fix properly handles the PGRST116 error code (no rows returned)
- If there are other database errors, they will still be caught and reported
