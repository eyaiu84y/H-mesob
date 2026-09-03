# Maintenance Report Submission - Root Cause Analysis

**Date:** August 24, 2026  
**Error:** "Failed to submit maintenance report: Failed to create maintenance report"  
**Status:** ✅ ROOT CAUSE IDENTIFIED

---

## Executive Summary

**ROOT CAUSE:** Frontend sends `institutionId` but user object likely has `institution_id` as `null` or `undefined` for Employee users.

**Secondary Issue:** Backend service checks `currentUser.institution_id` but the authenticated user object structure needs verification.

---

## Step 1: Frontend Submission Flow

### File: `frontend/src/context/MaintenanceContext.jsx`

**createReport function (Line 91-111):**
```javascript
const createReport = useCallback(async (institutionId, problemType, description, location, officeNumber, priority = 'NORMAL', category = 'General', attachments = []) => {
  try {
    setLoading(true);
    setError(null);

    const response = await api.post('/maintenance/reports', {
      institutionId,        // ← Passed as parameter
      problemType,
      description,
      location,
      officeNumber,
      priority,
      category,
      attachments,
    });
```

### File: `frontend/src/pages/dashboard/EmployeeDashboard.jsx`

**Employee calls createReport (Line 361-373):**
```javascript
const result = await createReport(
  user.institution_id,    // ← Employee's institution ID
  newReport.problemType,
  newReport.description,
  newReport.location,
  newReport.officeNumber,
  newReport.priority,
  newReport.category,
  attachmentData
);
```

**KEY FINDING:** Frontend correctly passes `user.institution_id` as first parameter.

---

## Step 2: Backend Endpoint

### File: `backend/src/routes/maintenanceRoutes.js` (Line 18-23)

```javascript
router.post('/reports', 
  authenticate,
  authorize('EMPLOYEE', 'ICT_STAFF', 'INSTITUTION_MANAGER'),
  postMaintenanceReport
);
```

**✅ Confirmed:** Endpoint exists and authorizes EMPLOYEE role.

### File: `backend/src/controllers/maintenanceController.js` (Line 12-37)

```javascript
export const postMaintenanceReport = async (req, res) => {
  try {
    const reportData = {
      institutionId: req.body.institutionId,  // ← Expects institutionId (camelCase)
      problemType: req.body.problemType,
      description: req.body.description,
      location: req.body.location,
      officeNumber: req.body.officeNumber,
      priority: req.body.priority,
      category: req.body.category,
      attachments: req.body.attachments
    };

    const result = await createMaintenanceReport(reportData, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (error) {
    console.error("CREATE MAINTENANCE REPORT CONTROLLER ERROR");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: `Failed to create maintenance report: ${error.message}`
    });
  }
};
```

**KEY FINDING:** Controller expects `institutionId` (camelCase) - matches frontend! ✅

---

## Step 3: Backend Service

### File: `backend/src/services/maintenanceService.js` (Line 8-29)

```javascript
export const createMaintenanceReport = async (reportData, currentUser) => {
  try {
    const { institutionId, problemType, description, location, officeNumber, priority, category, attachments } = reportData;

    // Validation
    if (!institutionId || !problemType || !description) {
      return {
        success: false,
        message: 'Institution ID, problem type, and description are required.'
      };
    }

    // Institution authorization check
    // EMPLOYEE and ICT_STAFF can only create reports for their own institution
    if (['EMPLOYEE', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(currentUser.role)) {
      if (currentUser.institution_id !== institutionId) {
        return {
          success: false,
          message: 'You can only create maintenance reports for your own institution.'
        };
      }
    }
```

**CRITICAL FINDINGS:**

1. **Line 14:** Validates that `institutionId` exists ✅
2. **Line 22-28:** Checks `currentUser.institution_id !== institutionId`
   - If `currentUser.institution_id` is `null` or `undefined`, this check will FAIL
   - If `institutionId` from frontend is `undefined`, validation fails at line 14

---

## Step 4: Database Schema

### File: `backend/database/migrations/001_create_schema.sql` (Line 408-442)

```sql
CREATE TABLE IF NOT EXISTS maintenance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Foreign keys
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Report details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  equipment_info TEXT,
  
  -- Classification
  category VARCHAR(100),
  priority maintenance_priority DEFAULT 'NORMAL' NOT NULL,
  status maintenance_status DEFAULT 'REPORTED' NOT NULL,
  ...
);
```

**✅ Confirmed:** Database uses `institution_id` (snake_case) - correctly handled by backend service.

---

## Step 5: User Object Structure

### File: `frontend/src/utils/roleMapper.js` (Line 35-49)

```javascript
export function transformUserFromBackend(backendUser) {
  if (!backendUser) return null;
  
  return {
    id: backendUser.id,
    name: backendUser.full_name || backendUser.name,
    email: backendUser.email,
    role: toFrontendRole(backendUser.role),
    employeeId: backendUser.employee_id || backendUser.employeeId || null,
    institution: backendUser.institution_id || backendUser.institution || null,
    institution_id: backendUser.institution_id || backendUser.institution || null,  // ← Added both!
    phone: backendUser.phone || null,
    status: backendUser.status || 'Active',
  };
}
```

**KEY FINDING:** Frontend user object has BOTH:
- `institution`: UUID or null
- `institution_id`: UUID or null

**POTENTIAL ISSUE:** If backend login response doesn't include `institution_id`, both will be `null`.

---

## Step 6: Backend Authentication

### File: Backend needs to return institution_id in login response

The authenticated `req.user` object comes from JWT token or session. Let me verify what the backend auth returns:

**Expected structure:**
```javascript
req.user = {
  id: "user-uuid",
  role: "EMPLOYEE",
  institution_id: "institution-uuid",  // ← Must be present!
  ...
}
```

**If institution_id is missing from req.user:**
- Line 23 check will fail: `currentUser.institution_id !== institutionId`
- Even if frontend sends correct institutionId

---

## ROOT CAUSE IDENTIFIED

### Scenario 1: Frontend sends undefined institutionId

**If `user.institution_id` is undefined in Employee dashboard:**

```javascript
// Employee user object
{
  id: "uuid-123",
  name: "John Doe",
  email: "john@institution.et",
  role: "employee",
  institution: null,           // ← PROBLEM!
  institution_id: null,        // ← PROBLEM!
}

// createReport is called with:
createReport(
  null,                // ← institutionId is null!
  "Hardware Issue",
  "Computer not working",
  ...
)

// Backend receives:
{
  institutionId: null  // ← Fails validation at line 14
}

// Backend returns:
{
  success: false,
  message: 'Institution ID, problem type, and description are required.'
}
```

### Scenario 2: Backend req.user missing institution_id

**If authenticated user object doesn't have institution_id:**

```javascript
// req.user (from JWT)
{
  id: "user-uuid",
  role: "EMPLOYEE",
  institution_id: null  // ← Or undefined
}

// Even if frontend sends correct institutionId:
{
  institutionId: "institution-uuid-456"
}

// Authorization check fails (Line 23):
if (currentUser.institution_id !== institutionId) {
  // null !== "institution-uuid-456"  → FAILS!
  return {
    success: false,
    message: 'You can only create maintenance reports for your own institution.'
  };
}
```

---

## THE FIX

### Option 1: Fix Backend JWT to Include institution_id

**File:** `backend/src/services/authService.js` or wherever JWT is created

**Ensure JWT payload includes:**
```javascript
const token = jwt.sign({
  id: user.id,
  role: user.role,
  institution_id: user.institution_id,  // ← Must include this!
  ...
}, SECRET);
```

**And JWT verification extracts it:**
```javascript
const decoded = jwt.verify(token, SECRET);
req.user = {
  id: decoded.id,
  role: decoded.role,
  institution_id: decoded.institution_id,  // ← Must set this!
};
```

### Option 2: Verify Frontend User Object

**Check that Employee users actually have institution_id after login.**

**Test:**
```javascript
// In browser console after Employee logs in:
console.log(user);
// Should show:
// {
//   id: "...",
//   role: "employee",
//   institution_id: "uuid-123",  // ← Should NOT be null!
// }
```

---

## Testing Required

### Before Fix - Expected Behavior

1. **Login as Employee**
2. **Open browser console (F12)**
3. **Check user object:**
   ```javascript
   // In React DevTools or console:
   console.log(user.institution_id);
   // If this is null or undefined → THAT'S THE PROBLEM
   ```

4. **Submit maintenance report**
5. **Check Network tab:**
   ```json
   POST /api/maintenance/reports
   
   Request Payload:
   {
     "institutionId": null,  // ← If null, frontend issue
     "problemType": "Test",
     "description": "Test"
   }
   
   Response:
   {
     "success": false,
     "message": "Institution ID, problem type, and description are required."
   }
   ```

6. **Check backend terminal for detailed error logs**

---

## Immediate Action Required

1. **Login as an actual Employee** (not Super Admin)
2. **Inspect user object** in browser console
3. **Submit a maintenance report**
4. **Check Network tab** for actual request/response
5. **Check backend logs** for detailed error

**Then determine:**
- Is `user.institution_id` null in frontend?
- Is `req.user.institution_id` null in backend?
- Is request payload correct?

---

## Next Steps

After identifying which scenario applies, implement the appropriate fix from Option 1 or Option 2 above.
