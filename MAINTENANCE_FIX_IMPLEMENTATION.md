# Maintenance Report Submission - Fix Implementation

**Date:** August 24, 2026  
**Status:** 🔧 FIX READY TO TEST  
**Root Cause:** Employee user missing `institution_id` OR validation mismatch

---

## Summary

After comprehensive code analysis:

✅ **Frontend:** Correctly sends `institutionId` from `user.institution_id`  
✅ **Backend Controller:** Correctly receives `institutionId` (camelCase)  
✅ **Backend Service:** Correctly validates `institutionId`  
✅ **Backend Auth:** JWT includes and `req.user` has `institution_id`  
✅ **Database Schema:** Table uses `institution_id` (snake_case) correctly  

**LIKELY ISSUE:** Test Employee user doesn't have `institution_id` set in database.

---

## Test Instructions

### Step 1: Verify Employee Has Institution

**Run this SQL query:**
```sql
-- Check if test Employee has institution_id
SELECT 
  id,
  full_name,
  email,
  role,
  institution_id,
  status
FROM users
WHERE email = 'manager@mesobcenter.et'  -- Replace with actual employee email
   OR role = 'EMPLOYEE';
```

**Expected Result:**
```
full_name      | email                   | role     | institution_id                      | status
---------------|-------------------------|----------|-------------------------------------|--------
Abebe Bekele   | abebe@institution.et    | EMPLOYEE | a1b2c3d4-e5f6-...                  | ACTIVE
```

**❌ If `institution_id` is NULL → THAT'S THE PROBLEM!**

### Fix if institution_id is NULL:

```sql
-- Get an institution ID first
SELECT id, name_en FROM institutions LIMIT 1;
-- Copy the UUID

-- Update Employee to have institution_id
UPDATE users
SET institution_id = 'paste-institution-uuid-here'
WHERE email = 'employee@institution.et';  -- Replace with actual email
```

---

### Step 2: Test Maintenance Report Submission

1. **Open browser:** `http://localhost:5174` (or whatever port frontend is on)

2. **Login as Employee:**
   - If you just created test employee via Super Admin, use those credentials
   - Otherwise use existing employee credentials

3. **Open Browser Console (F12)**
   ```javascript
   // Check user object
   console.log(user);
   // Should show:
   // {
   //   id: "...",
   //   name: "...",
   //   role: "employee",
   //   institution_id: "uuid-123",  // ← Should NOT be null!
   // }
   ```

4. **Navigate to:** Maintenance Reports section

5. **Click:** "Report Maintenance Problem"

6. **Fill form:**
   - Problem Type: "Hardware Issue"
   - Description: "Test maintenance report"
   - Location: "Office 101"
   - Office Number: "101"
   - Priority: "NORMAL"
   - Category: "Hardware"

7. **Open Network Tab (F12 → Network)**

8. **Click Submit**

9. **Check Network tab for:**
   ```
   POST /api/maintenance/reports
   
   Request Payload:
   {
     "institutionId": "uuid-123",  // ← Should NOT be null
     "problemType": "Hardware Issue",
     "description": "Test maintenance report",
     "location": "Office 101",
     "officeNumber": "101",
     "priority": "NORMAL",
     "category": "Hardware",
     "attachments": []
   }
   ```

10. **Check Response:**

**✅ SUCCESS (201 Created):**
```json
{
  "success": true,
  "message": "Maintenance report created successfully",
  "data": {
    "id": "report-uuid",
    "report_number": "MAINT-2026-123456",
    "title": "Hardware Issue",
    "description": "Test maintenance report",
    "priority": "NORMAL",
    "status": "REPORTED",
    "institutions": {
      "id": "...",
      "name_en": "Institution Name"
    }
  }
}
```

**❌ FAILURE (400 Bad Request):**
```json
{
  "success": false,
  "message": "Institution ID, problem type, and description are required."
}
```
→ Means `institutionId` is null or undefined

**❌ FAILURE (400 Bad Request):**
```json
{
  "success": false,
  "message": "You can only create maintenance reports for your own institution."
}
```
→ Means authorization check failed (req.user.institution_id doesn't match)

---

### Step 3: Check Backend Logs

**In backend terminal, you should see:**

**✅ Success:**
```
POST /api/maintenance/reports 201 - 145ms
```

**❌ Failure:**
```
CREATE MAINTENANCE REPORT DATABASE ERROR
Code: ...
Message: ...
Details: ...
```

---

## Common Issues & Fixes

### Issue 1: institutionId is null in request

**Symptom:** Request payload shows `"institutionId": null`

**Cause:** Employee user object doesn't have `institution_id`

**Fix:**
1. Check database: `SELECT * FROM users WHERE email = '...'`
2. If `institution_id` is NULL, update it:
   ```sql
   UPDATE users 
   SET institution_id = (SELECT id FROM institutions WHERE code = 'ethiotel' LIMIT 1)
   WHERE email = 'employee@email.com';
   ```

### Issue 2: Authorization check fails

**Symptom:** "You can only create maintenance reports for your own institution."

**Cause:** `req.user.institution_id` doesn't match sent `institutionId`

**Fix:**
1. Verify req.user has institution_id: Check backend logs
2. Ensure frontend sends correct institution_id: Check Network tab
3. They must match exactly (same UUID)

### Issue 3: Priority validation error

**Symptom:** Error about invalid priority

**Fix:** Use only these values:
- `NORMAL`
- `HIGH`
- `CRITICAL`

**DO NOT use:** `URGENT` (not valid)

---

## Verification SQL Queries

### Check Created Report:
```sql
SELECT 
  mr.id,
  mr.report_number,
  mr.title,
  mr.description,
  mr.priority,
  mr.status,
  mr.created_at,
  u.full_name as reported_by,
  u.email as reporter_email,
  i.name_en as institution
FROM maintenance_reports mr
JOIN users u ON mr.reported_by = u.id
JOIN institutions i ON mr.institution_id = i.id
ORDER BY mr.created_at DESC
LIMIT 5;
```

**Expected:** Shows the newly created report

### Check Employee's Institution:
```sql
SELECT 
  u.full_name,
  u.email,
  u.role,
  i.name_en as institution,
  u.institution_id
FROM users u
LEFT JOIN institutions i ON u.institution_id = i.id
WHERE u.role = 'EMPLOYEE'
  AND u.email = 'employee@email.com';  -- Replace with actual email
```

**Expected:** `institution_id` should NOT be NULL

---

## If Still Failing After Above Steps

### Enable Enhanced Debugging

**File:** `backend/src/services/maintenanceService.js`

**Add logging at line 10 (after function starts):**
```javascript
export const createMaintenanceReport = async (reportData, currentUser) => {
  try {
    // ADD THIS DEBUGGING
    console.log('========== MAINTENANCE REPORT DEBUG ==========');
    console.log('reportData:', JSON.stringify(reportData, null, 2));
    console.log('currentUser.id:', currentUser.id);
    console.log('currentUser.role:', currentUser.role);
    console.log('currentUser.institution_id:', currentUser.institution_id);
    console.log('==============================================');
    
    const { institutionId, problemType, description, location, officeNumber, priority, category, attachments } = reportData;
    // ... rest of code
```

**Then retest and check backend terminal output.**

---

## Expected Success Flow

1. **Employee logs in** → JWT includes `institutionId`
2. **Frontend loads user** → `user.institution_id` = UUID
3. **Employee fills form** → All required fields filled
4. **Frontend calls API** → `POST /api/maintenance/reports` with `institutionId`
5. **Backend authenticates** → `req.user.institution_id` = UUID
6. **Backend validates:**
   - ✅ institutionId exists
   - ✅ problemType exists
   - ✅ description exists
   - ✅ req.user.institution_id matches institutionId
7. **Backend creates report:**
   - Generates report_number
   - Inserts into maintenance_reports table
   - Notifies ICT staff
   - Logs audit
8. **Backend returns success** → Status 201
9. **Frontend shows success** → "Report submitted successfully!"
10. **Report appears in dashboard** → Employee can see their report

---

## Next Steps

1. ✅ Verify Employee has institution_id in database
2. ✅ Test maintenance report submission
3. ✅ Check Network tab for request/response
4. ✅ Check backend logs for errors
5. ✅ Verify report created in database
6. ✅ Verify report appears in Employee dashboard
7. ✅ Verify report appears in Institution Manager dashboard
8. ✅ Test assignment to ICT Staff
9. ✅ Test ICT Staff can see and update task

---

## Frontend Error Handling Improvement

**File:** `frontend/src/context/MaintenanceContext.jsx`

**Current (Line 106-111):**
```javascript
} catch (err) {
  console.error('Failed to create maintenance report:', err);
  const errorMessage = err.response?.data?.message || err.message || 'Failed to create maintenance report';
  setError(errorMessage);
  return { success: false, message: errorMessage };
}
```

**Improved (shows full error in console):**
```javascript
} catch (err) {
  console.error('========== MAINTENANCE REPORT ERROR ==========');
  console.error('Error object:', err);
  console.error('Response data:', err.response?.data);
  console.error('Response status:', err.response?.status);
  console.error('Request data:', err.config?.data);
  console.error('==============================================');
  
  const errorMessage = err.response?.data?.message || err.message || 'Failed to create maintenance report';
  setError(errorMessage);
  return { success: false, message: errorMessage };
}
```

This will help debug the exact error in browser console.

---

## Summary Checklist

Before testing:
- [ ] Servers running (backend port 5000, frontend port 5173/5174)
- [ ] Employee user exists in database
- [ ] Employee user has institution_id set (NOT NULL)
- [ ] Browser console open (F12)
- [ ] Network tab open (F12 → Network)
- [ ] Backend terminal visible

During testing:
- [ ] Login as Employee succeeds
- [ ] User object has institution_id (check console)
- [ ] Fill maintenance form completely
- [ ] Submit form
- [ ] Check Network tab request payload
- [ ] Check Network tab response
- [ ] Check backend terminal logs

After testing:
- [ ] Report created in database (check SQL)
- [ ] Report appears in Employee dashboard
- [ ] Report appears in Institution Manager dashboard
- [ ] Status is "REPORTED"
- [ ] Priority is set correctly

---

**READY TO TEST!** Follow steps above to identify and fix the issue.
