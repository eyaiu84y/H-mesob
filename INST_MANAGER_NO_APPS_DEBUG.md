#  Institution Manager - No Applications Issue

## Problem
Institution Manager dashboard shows "No Applications" even though applications exist.

## Debug Steps

### Step 1: Check Browser Console
1. Open Institution Manager Dashboard
2. Click on "Applications" in the sidebar
3. Press F12 to open Developer Tools
4. Go to Console tab
5. Look for any errors or warnings

### Step 2: Check What Data is Available
In the browser console, type:
```javascript
// Check applications
console.log('Applications:', window.applications);

// Or if using React DevTools, inspect the ApplicationContext
```

### Step 3: Check User's Institution ID
The issue might be that the institution manager user doesn't have `institution_id` set.

**Check in database**:
```sql
SELECT id, email, role, institution_id, full_name 
FROM users 
WHERE role = 'INSTITUTION_MANAGER';
```

**Expected**: The user should have a valid `institution_id` (UUID).

### Step 4: Check Applications in Database
```sql
-- Check if applications exist
SELECT id, application_number, status, institution_id, service_id
FROM applications 
LIMIT 10;

-- Check specifically for the institution
SELECT id, application_number, status, institution_id, service_id
FROM applications 
WHERE institution_id = '<your-institution-id>';
```

### Step 5: Check Filtering Logic
The Institution Manager filters applications by:
1. `app.institution === userInstitution` (institution name match)
2. `app.institutionId === user.institution_id` (institution ID match)

**Problem**: If the user doesn't have `institution_id` set, no applications will match!

## Quick Fixes

### Fix 1: Set Institution ID for Manager User
```sql
-- Find the institution ID
SELECT id, name_en FROM institutions;

-- Update the manager's institution_id
UPDATE users 
SET institution_id = '<institution-uuid>'
WHERE email = 'instmanager@mesobcenter.et';  -- or your manager email
```

### Fix 2: Check ApplicationContext Fetching
The ApplicationContext might not be fetching applications with institution data joined.

Open `frontend/src/context/ApplicationContext.jsx` and check the `fetchApplications` function.

### Fix 3: Verify Backend Returns Institution Data
Check backend response:
```bash
# In backend terminal, watch for:
GET /api/applications
```

The response should include institution data:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "institution_id": "...",
      "institutions": {
        "id": "...",
        "name_en": "..."
      }
    }
  ]
}
```

## Most Likely Issues

### Issue 1: Manager Has No Institution ID ⭐ MOST LIKELY
**Symptom**: `user.institution_id` is `null` or `undefined`
**Solution**: Set institution_id in database (see Fix 1)

### Issue 2: Applications Have No Institution ID
**Symptom**: Applications exist but `institutionId` field is null
**Solution**: Applications need to be created with valid institution_id

### Issue 3: Backend Not Returning Institution Data
**Symptom**: Backend returns applications but without `institutions` object
**Solution**: Backend query needs to join institutions table

## Testing After Fix

1. Restart frontend (if needed)
2. Login as Institution Manager
3. Go to Applications
4. Should see all applications for that institution

## Quick SQL to Verify Setup

```sql
-- Check manager user
SELECT email, role, institution_id, full_name 
FROM users 
WHERE email = 'instmanager@mesobcenter.et';

-- Check institution
SELECT id, name_en FROM institutions;

-- Check applications for institution
SELECT 
  a.id,
  a.application_number,
  a.status,
  i.name_en as institution_name,
  s.title_en as service_name
FROM applications a
LEFT JOIN institutions i ON a.institution_id = i.id
LEFT JOIN services s ON a.service_id = s.id
WHERE a.institution_id = (
  SELECT institution_id FROM users WHERE email = 'instmanager@mesobcenter.et'
);
```

If the last query returns 0 rows, the manager's institution has no applications yet.
