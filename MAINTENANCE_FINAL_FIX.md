# Maintenance Report Submission - Complete Fix & Test Guide

**Date:** August 24, 2026  
**Status:** ✅ READY TO TEST  
**Servers:** Backend (port 5000), Frontend (port 5174)

---

## Test Credentials

### Employee - Ethio Telecom
- **Email:** `ethiotel.employee@mesobcenter.et`
- **Password:** `EthioEmployee@2026`
- **Institution:** Ethio Telecom (has institution_id set ✅)

### Employee - National ID/Fayda  
- **Email:** `employee@mesobcenter.et`
- **Password:** `Employee@2026`
- **Institution:** National ID Program / Fayda (has institution_id set ✅)

### Employee - CBE
- **Email:** `cbe.employee@mesobcenter.et`
- **Password:** `CbeEmployee@2026`
- **Institution:** Commercial Bank of Ethiopia (has institution_id set ✅)

---

## Quick Test Procedure

### 1. Open Application
```
http://localhost:5174
```

### 2. Login as Employee
```
Email: ethiotel.employee@mesobcenter.et
Password: EthioEmployee@2026
```

### 3. Open Developer Tools
- Press `F12`
- Go to **Console** tab
- Go to **Network** tab

### 4. Navigate to Maintenance Section
- Find "Maintenance Reports" or similar in Employee Dashboard
- Click "Report Maintenance Problem" or "Create Report"

### 5. Fill the Form
```
Problem Type:    Hardware Issue
Description:     Test computer not working properly  
Location:        Building A, Floor 2
Office Number:   201
Priority:        NORMAL
Category:        Hardware
```

### 6. Submit and Check

**In Network Tab:**
- Find: `POST /api/maintenance/reports`
- Check **Request Payload** (should have `institutionId`)
- Check **Response** (should be status 201 with success)

**In Console Tab:**
- Look for any red errors
- Check logged user object

**In Backend Terminal:**
- Look for success log: `POST /api/maintenance/reports 201`
- Or error logs with details

---

## Expected Request Payload

```json
{
  "institutionId": "uuid-of-ethio-telecom",
  "problemType": "Hardware Issue",
  "description": "Test computer not working properly",
  "location": "Building A, Floor 2",
  "officeNumber": "201",
  "priority": "NORMAL",
  "category": "Hardware",
  "attachments": []
}
```

**❌ If you see `"institutionId": null` → Issue with frontend user object**

---

## Expected Success Response (201)

```json
{
  "success": true,
  "message": "Maintenance report created successfully",
  "data": {
    "id": "some-uuid",
    "report_number": "MAINT-2026-123456",
    "title": "Hardware Issue",
    "description": "Test computer not working properly",
    "priority": "NORMAL",
    "status": "REPORTED",
    "created_at": "2026-08-24T...",
    "institutions": {
      "id": "inst-uuid",
      "name_en": "Ethio Telecom",
      "name_am": "ኢትዮ ቴሌኮም"
    }
  }
}
```

---

## Common Error Scenarios

### Error 1: "Institution ID, problem type, and description are required."

**Cause:** Frontend sending `institutionId: null`

**Debug:**
```javascript
// In browser console:
console.log(user);
// Check if user.institution_id is null
```

**Fix:** Verify user has institution_id in database:
```sql
SELECT id, email, role, institution_id
FROM users
WHERE email = 'ethiotel.employee@mesobcenter.et';
```

If NULL, update:
```sql
UPDATE users
SET institution_id = (SELECT id FROM institutions WHERE code = 'ethiotel')
WHERE email = 'ethiotel.employee@mesobcenter.et';
```

---

### Error 2: "You can only create maintenance reports for your own institution."

**Cause:** Authorization check failed - `req.user.institution_id` doesn't match sent `institutionId`

**Debug Backend:** Add logging to `maintenanceService.js` line 10:
```javascript
console.log('User institution:', currentUser.institution_id);
console.log('Sent institution:', institutionId);
console.log('Match:', currentUser.institution_id === institutionId);
```

**Possible Causes:**
- Frontend sending wrong institution ID
- JWT not including correct institution_id
- Database institution_id mismatch

---

### Error 3: Network Error / CORS

**Symptom:** Network request fails, no response

**Fix:**
- Check backend is running on port 5000
- Check frontend API base URL is correct
- Check CORS settings in backend

---

### Error 4: 401 Unauthorized

**Cause:** Token expired or invalid

**Fix:**
- Logout and login again
- Check token in localStorage
- Verify JWT is included in Authorization header

---

## Verification SQL

### Check Report Was Created:
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
  i.name_en as institution
FROM maintenance_reports mr
JOIN users u ON mr.reported_by = u.id
JOIN institutions i ON mr.institution_id = i.id
WHERE mr.created_at > NOW() - INTERVAL '1 hour'
ORDER BY mr.created_at DESC;
```

**Expected:** See the test report you just created

---

## Complete Workflow Test

### Phase 1: Employee Creates Report ✅

1. Login as Employee
2. Create maintenance report
3. Verify success message
4. See report in "My Reports" list

### Phase 2: Institution Manager Sees Report

1. Logout
2. Login as Institution Manager:
   - Email: `ethiotel.manager@mesobcenter.et`
   - Password: `EthioManager@2026`
3. Navigate to Maintenance Reports
4. Should see the Employee's report
5. Status should be "REPORTED"

### Phase 3: Manager Assigns to ICT Staff

1. Still logged in as Manager
2. Open the maintenance report
3. Click "Assign" or similar
4. Select ICT Staff member
5. Confirm assignment
6. Status changes to "ASSIGNED"

### Phase 4: ICT Staff Sees Task

1. Logout
2. Login as ICT Staff:
   - Email: `ethiotel.ict@mesobcenter.et`
   - Password: `EthioIct@2026`
3. Navigate to "My Tasks" or Maintenance section
4. Should see assigned task
5. Can update status: PENDING → IN_PROGRESS → COMPLETED

### Phase 5: Mark as Resolved

1. ICT Staff opens task
2. Clicks "Resolve" or "Complete"
3. Adds resolution notes
4. Submits
5. Task status: COMPLETED
6. Report status: RESOLVED

### Phase 6: Employee Sees Resolution

1. Logout
2. Login back as Employee
3. Check "My Reports"
4. Report status should show "Completed" or "Resolved"
5. Can see resolution notes

---

## If Still Failing - Enhanced Debugging

### Frontend Debug (MaintenanceContext.jsx)

**Add at line 91 before API call:**
```javascript
const createReport = useCallback(async (institutionId, problemType, description, location, officeNumber, priority = 'NORMAL', category = 'General', attachments = []) => {
  try {
    // ADD THIS
    console.log('========== CREATE REPORT DEBUG ==========');
    console.log('institutionId:', institutionId);
    console.log('problemType:', problemType);
    console.log('description:', description);
    console.log('priority:', priority);
    console.log('=========================================');
    
    setLoading(true);
    setError(null);
    // ...rest of code
```

### Backend Debug (maintenanceService.js)

**Add at line 10:**
```javascript
export const createMaintenanceReport = async (reportData, currentUser) => {
  try {
    // ADD THIS
    console.log('========== BACKEND DEBUG ==========');
    console.log('reportData:', JSON.stringify(reportData, null, 2));
    console.log('currentUser:', {
      id: currentUser.id,
      role: currentUser.role,
      institution_id: currentUser.institution_id
    });
    console.log('===================================');
    
    const { institutionId, problemType, description, location, officeNumber, priority, category, attachments } = reportData;
    // ...rest of code
```

---

## Build & Lint

### Frontend:
```bash
cd c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/frontend
npm run lint
npm run build
```

**Expected:** No errors

### Backend:
```bash
cd c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/backend
node --check src/server.js
```

**Expected:** No syntax errors

---

## Success Criteria

✅ **Phase 1 Complete:**
- Employee can login
- Employee dashboard loads
- Maintenance form appears
- Employee can fill form
- Form submits without error
- Success message shows
- Report number displayed

✅ **Phase 2 Complete:**
- Report saved in database (verified by SQL)
- Report has correct institution_id
- Report status is "REPORTED"
- Report priority is set correctly

✅ **Phase 3 Complete:**
- Institution Manager can see report
- Manager can assign to ICT Staff
- Status updates to "ASSIGNED"

✅ **Phase 4 Complete:**
- ICT Staff sees task in "My Tasks"
- ICT Staff can update status
- Status progresses: PENDING → IN_PROGRESS → COMPLETED

✅ **Phase 5 Complete:**
- ICT Staff can resolve task
- Report status updates to "RESOLVED"
- Resolution notes saved

✅ **Phase 6 Complete:**
- Employee sees resolved report
- All data displays correctly
- No console errors
- No backend errors

---

## Priority Values

**✅ Valid:**
- `NORMAL`
- `HIGH`
- `CRITICAL`

**❌ Invalid:**
- `URGENT` (not in database enum)
- `LOW`
- `MEDIUM`
- Any other value

---

## Final Checklist

Before reporting completion:
- [ ] Tested with actual Employee account
- [ ] Verified request payload in Network tab
- [ ] Verified success response (201)
- [ ] Verified report in database (SQL query)
- [ ] Verified report appears in Employee dashboard
- [ ] Verified report appears in Manager dashboard
- [ ] Tested assignment to ICT Staff
- [ ] Tested ICT Staff task workflow
- [ ] Tested resolution
- [ ] No console errors
- [ ] No backend errors
- [ ] Frontend builds successfully
- [ ] Backend syntax check passes

---

## Next Steps

1. **Test NOW** with provided Employee credentials
2. **Document results** (success or specific error)
3. **If fails:** Share Network tab Request/Response
4. **If fails:** Share backend terminal error logs
5. **If fails:** Share browser console errors

**Ready to test!** Use Employee account: `ethiotel.employee@mesobcenter.et` / `EthioEmployee@2026`
