# Debugging Feedback Submission Error

## Current Status
Getting "Failed to submit feedback" error when trying to submit feedback from the citizen dashboard.

## Debug Logging Added
Added console logging to `FeedbackContext.jsx` that will show:
1. The data being sent to the API
2. The response received from the server

## How to Debug

### Step 1: Open Browser Console
1. Open the citizen dashboard
2. Press F12 or right-click → Inspect
3. Go to the "Console" tab

### Step 2: Try to Submit Feedback
1. Navigate to a completed application
2. Try to submit a feedback rating
3. Watch the console output

### Step 3: Check Console Output
You should see logs like:

```
=== FEEDBACK PROPS ===
institutionId: <some-uuid>
serviceId: <some-uuid>
institutionName: <institution-name>
serviceName: <service-name>
applicationId: <application-id>
=====================

=== SUBMITTING FEEDBACK ===
feedbackData: {
  "institution_id": "<uuid>",
  "service_id": "<uuid>",
  "rating": 3,
  "comment": "test",
  "application_id": "<uuid>",
  "queue_entry_id": null,
  "source": "WEBSITE"
}

=== FEEDBACK RESPONSE ===
response: {
  "success": false,
  "message": "Some error message here"
}
========================
```

## Common Issues to Check

### Issue 1: Missing IDs
**Symptom**: Console shows `institutionId: null` or `serviceId: null`
**Cause**: Application doesn't have valid service/institution IDs
**Solution**: This application was created with mock data. Only applications created after the fix will have valid IDs.

### Issue 2: Backend Validation Error
**Symptom**: Response shows `{ success: false, message: "Institution ID is required" }`
**Cause**: The IDs are not being sent correctly to the backend
**Check**: 
- Verify `feedbackData` has `institution_id` and `service_id` fields
- Make sure they are not null or undefined

### Issue 3: Backend Service Error
**Symptom**: Response shows `{ success: false, message: "Service not found" }` or similar
**Cause**: The service or institution ID doesn't exist in the database
**Check**:
- Run: `SELECT * FROM services WHERE id = '<service-id>'`
- Run: `SELECT * FROM institutions WHERE id = '<institution-id>'`

### Issue 4: Authentication Error
**Symptom**: Response shows `{ success: false, message: "Unauthorized" }` or 401 error
**Cause**: User is not properly authenticated
**Solution**: 
- Check if JWT token exists in localStorage
- Try logging out and logging back in

### Issue 5: Duplicate Feedback
**Symptom**: Response shows `{ success: false, message: "You have already rated this service" }`
**Cause**: Backend prevents duplicate feedback for the same service
**Solution**: This is expected behavior if you already submitted feedback for this service

## Backend Endpoint Details

**Endpoint**: `POST /api/feedback`

**Expected Request Body**:
```json
{
  "institution_id": "uuid",
  "service_id": "uuid",
  "rating": 1-5,
  "comment": "optional string",
  "application_id": "optional uuid",
  "queue_entry_id": "optional uuid",
  "source": "WEBSITE"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": "feedback-uuid",
    "citizen_id": "user-uuid",
    "institution_id": "institution-uuid",
    "service_id": "service-uuid",
    "rating": 5,
    "comment": "Great service",
    "source": "WEBSITE",
    "created_at": "2024-..."
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Institution ID is required"
}
```

## Next Steps

1. **Check the console output** - Share what you see in the console logs
2. **Check the application data** - Verify the application has valid serviceId and institutionId
3. **Check backend logs** - Look at the backend server console for any error messages
4. **Check database** - Verify the service and institution exist in the database

## Quick Test SQL Queries

```sql
-- Check if services exist
SELECT id, title_en, institution_id FROM services LIMIT 5;

-- Check if institutions exist
SELECT id, name_en FROM institutions LIMIT 5;

-- Check existing feedback
SELECT * FROM feedback ORDER BY created_at DESC LIMIT 5;

-- Check a specific application
SELECT 
  id,
  application_number,
  service_id,
  institution_id,
  status
FROM applications 
WHERE id = '<application-id>';
```

## Temporary Workaround
If the issue is that old applications don't have valid IDs:
1. Create a NEW application using the updated "Apply for Service" flow
2. Mark it as completed (you might need database access or admin panel)
3. Try submitting feedback for that new application

## Files with Logging
- `frontend/src/context/FeedbackContext.jsx` - Logs API request and response
- `frontend/src/components/dashboard/FeedbackRating.jsx` - Logs props and validation
