# PHASE 5A - MANUAL TESTING GUIDE

**Purpose:** Verify the Employee Maintenance Report form works correctly in the browser.

**Status:** Ready for manual testing

---

## PREREQUISITES

### 1. Servers Running:
- ✅ Backend: http://localhost:5000
- ✅ Frontend: http://localhost:5173

### 2. Database:
- ✅ PostgreSQL database connected
- ✅ `maintenance_reports` table exists
- ✅ Seed data loaded (test users exist)

---

## TEST SCENARIO 1: SUBMIT NEW MAINTENANCE REPORT

### Step 1: Login as Employee

1. Open browser: http://localhost:5173
2. Click "Login" or navigate to login page
3. Enter credentials:
   - **Email:** employee@mesobcenter.et
   - **Password:** Employee@2026
4. Click "Login"

**Expected Result:**
- ✅ Login successful
- ✅ Redirected to Employee Dashboard
- ✅ User name displayed in header
- ✅ Navigation shows employee sections

---

### Step 2: Navigate to Maintenance Report

1. Click "Maintenance Report" in the sidebar/navigation
2. Observe the page

**Expected Result:**
- ✅ "Maintenance Report" heading visible
- ✅ "Report Maintenance Problem" button visible
- ✅ "My Maintenance Reports" table visible
- ✅ Existing reports (if any) displayed in table
- ✅ Loading state appears briefly while fetching reports

---

### Step 3: Open Report Form

1. Click "Report Maintenance Problem" button

**Expected Result:**
- ✅ Form panel appears
- ✅ Form title: "Submit New Maintenance Report"
- ✅ Close button (X) visible in top-right corner
- ✅ Form contains these fields:
  - Problem Type (dropdown)
  - Priority (dropdown, default: Normal)
  - Problem Description (textarea)
  - Location (text input)
  - Office Number (text input)
- ✅ "Submit Maintenance Report" button visible
- ✅ "Cancel" button visible

**NOT Expected (should NOT be visible):**
- ❌ Institution field (auto from auth)
- ❌ Employee ID field (auto from auth)
- ❌ Employee Name field (auto from auth)
- ❌ Photo upload field (not supported)

---

### Step 4: Fill Form (Test Invalid Submission)

1. Leave all fields empty
2. Click "Submit Maintenance Report"

**Expected Result:**
- ✅ Validation errors appear under each field in red text:
  - "Problem type is required"
  - "Problem description is required"
  - "Location is required"
  - "Office number is required"
- ✅ Form does NOT submit
- ✅ Form remains open
- ✅ Button remains enabled (not stuck in submitting state)

---

### Step 5: Fill Form (Valid Submission)

Fill the form with these values:

1. **Problem Type:** Select "Network / Internet"
2. **Priority:** Select "High"
3. **Problem Description:** Type "WiFi connection keeps dropping every 10 minutes. Unable to access internal systems or email."
4. **Location:** Type "2nd Floor, Building A"
5. **Office Number:** Type "Room 204"
6. Click "Submit Maintenance Report"

**Expected Result During Submission:**
- ✅ Button text changes to "Submitting..."
- ✅ Button becomes disabled (grayed out)
- ✅ Button cursor changes to not-allowed

**Expected Result After Submission:**
- ✅ Success message appears (green box with checkmark icon)
- ✅ Success message contains text: "Maintenance report submitted successfully! Report Number: MAINT-2026-XXXXXX"
- ✅ Success message includes: "Your institution manager has been notified."
- ✅ Form automatically closes (form panel disappears)
- ✅ "Report Maintenance Problem" button visible again
- ✅ "My Maintenance Reports" table refreshes
- ✅ New report appears at the top of the table

---

### Step 6: Verify New Report in Table

Look at the "My Maintenance Reports" table:

**Expected Columns:**
1. Report Number
2. Problem Type
3. Priority
4. Location
5. Office
6. Submitted
7. Status
8. Assigned To

**Expected Data for Your Report:**
- ✅ Report Number: MAINT-2026-XXXXXX (6-digit number)
- ✅ Problem Type: "Network / Internet"
- ✅ Priority: Orange badge with "HIGH"
- ✅ Location: "2nd Floor"
- ✅ Office: "Room 204"
- ✅ Submitted: Today's date (e.g., "Aug 30, 2026")
- ✅ Status: Blue badge with "Submitted"
- ✅ Assigned To: "—" (dash, not assigned yet)

---

### Step 7: Submit Another Report (Different Priority)

1. Click "Report Maintenance Problem" again
2. Fill form:
   - Problem Type: "Computer / Hardware"
   - Priority: "Normal"
   - Description: "Keyboard keys are sticking, making typing difficult"
   - Location: "3rd Floor, Building B"
   - Office Number: "Room 305"
3. Click "Submit Maintenance Report"

**Expected Result:**
- ✅ Second report created successfully
- ✅ Second report appears in table
- ✅ Priority badge is blue (NORMAL priority)
- ✅ Both reports visible in table

---

### Step 8: Submit Critical Priority Report

1. Click "Report Maintenance Problem" again
2. Fill form:
   - Problem Type: "Electrical / Power"
   - Priority: "Critical"
   - Description: "Complete power outage in server room. Emergency backup running."
   - Location: "Basement, Building A"
   - Office Number: "Server Room 1"
3. Click "Submit Maintenance Report"

**Expected Result:**
- ✅ Third report created successfully
- ✅ Priority badge is red (CRITICAL priority)
- ✅ All three reports visible in table

---

## TEST SCENARIO 2: FORM VALIDATION

### Test 1: Problem Type Required

1. Open form
2. Fill all fields EXCEPT Problem Type
3. Click Submit

**Expected:** ❌ "Problem type is required" error

---

### Test 2: Description Required

1. Open form
2. Fill all fields EXCEPT Description
3. Click Submit

**Expected:** ❌ "Problem description is required" error

---

### Test 3: Location Required

1. Open form
2. Fill all fields EXCEPT Location
3. Click Submit

**Expected:** ❌ "Location is required" error

---

### Test 4: Office Number Required

1. Open form
2. Fill all fields EXCEPT Office Number
3. Click Submit

**Expected:** ❌ "Office number is required" error

---

### Test 5: Cancel Button

1. Open form
2. Fill some fields
3. Click "Cancel"

**Expected:**
- ✅ Form closes
- ✅ Data not saved
- ✅ Table unchanged

---

### Test 6: Close Button (X)

1. Open form
2. Fill some fields
3. Click X button in top-right corner

**Expected:**
- ✅ Form closes
- ✅ Data not saved
- ✅ Table unchanged

---

## TEST SCENARIO 3: RBAC VERIFICATION

### Test with Different Employee

1. Logout from current session
2. Login with CBE employee:
   - **Email:** cbe.employee@mesobcenter.et
   - **Password:** CbeEmployee@2026
3. Navigate to "Maintenance Report"
4. Submit a new report

**Expected Result:**
- ✅ CBE employee can submit reports
- ✅ CBE employee sees ONLY their institution's reports
- ✅ CBE employee CANNOT see Fayda reports
- ✅ Report is created for Commercial Bank of Ethiopia (not Fayda)

---

## TEST SCENARIO 4: LOADING STATES

### Test 1: Initial Page Load

1. Navigate to Maintenance Report section
2. Observe briefly

**Expected:**
- ✅ Spinning loader appears for 1-2 seconds
- ✅ "Loading reports..." text shown
- ✅ Loader disappears when data loads
- ✅ Table displays with data

---

### Test 2: Submission Loading

1. Open form
2. Fill valid data
3. Click Submit
4. Observe button

**Expected:**
- ✅ Button text: "Submit Maintenance Report" → "Submitting..."
- ✅ Button disabled during submission
- ✅ Button returns to normal after success

---

## TEST SCENARIO 5: ERROR HANDLING

### Test: Network Error (Backend Down)

**Warning:** Only do this if you want to test error handling!

1. Stop the backend server
2. Try to submit a report

**Expected:**
- ✅ Error message appears (alert or inline)
- ✅ Form data preserved (not cleared)
- ✅ User can fix and resubmit

**Recovery:**
1. Restart backend server
2. Try submitting again
3. Should now succeed

---

## TEST SCENARIO 6: EMPTY STATE

### Test: No Reports Yet

**Setup:** Use a fresh employee account with no reports

1. Login as employee with no reports
2. Navigate to Maintenance Report

**Expected:**
- ✅ Empty state message: "No maintenance reports yet"
- ✅ Subtext: "Click 'Report Maintenance Problem' to submit your first report"
- ✅ Gray document icon
- ✅ Table structure still visible (headers)

---

## TEST SCENARIO 7: MOBILE RESPONSIVE

### Desktop (> 1024px)

1. View page at full screen
2. Observe layout

**Expected:**
- ✅ Form fields in one column
- ✅ Table shows all columns
- ✅ Buttons full width
- ✅ Success message readable

---

### Tablet (768px - 1024px)

1. Resize browser to tablet width
2. Observe layout

**Expected:**
- ✅ Form still readable
- ✅ Table may scroll horizontally
- ✅ Buttons adapt to width

---

### Mobile (< 768px)

1. Resize browser to mobile width (iPhone size)
2. Observe layout

**Expected:**
- ✅ Form fields stack vertically
- ✅ Table scrolls horizontally
- ✅ Buttons stack vertically
- ✅ Success message fits screen

---

## TEST SCENARIO 8: DATABASE VERIFICATION

### Method 1: Check Backend Logs

1. Open terminal running backend
2. Look for log entries after form submission

**Expected:**
- ✅ POST /api/maintenance/reports - 201 Created
- ✅ Report ID logged
- ✅ No error messages

---

### Method 2: Direct Database Query

**If you have database access:**

```sql
SELECT 
  report_number,
  title,
  description,
  location,
  equipment_info,
  priority,
  status,
  created_at
FROM maintenance_reports
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- ✅ Your submitted reports appear
- ✅ Data matches what you entered
- ✅ Priority values: NORMAL, HIGH, CRITICAL (NOT URGENT)
- ✅ Status: REPORTED
- ✅ Timestamps are recent

---

### Method 3: API Test

**Using curl or Postman:**

```bash
curl -X GET http://localhost:5000/api/maintenance/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:**
- ✅ JSON array returned
- ✅ Your reports in the list
- ✅ Report numbers match UI

---

## SUCCESS CRITERIA

### ✅ All Tests Pass If:

1. **Form Submission:**
   - [x] Can submit maintenance report
   - [x] Success message appears
   - [x] Report number displayed
   - [x] Form clears after submission
   - [x] Report appears in table

2. **Validation:**
   - [x] Empty fields show errors
   - [x] Cannot submit invalid form
   - [x] Error messages clear when fixed

3. **Data Display:**
   - [x] Reports load from backend
   - [x] Report number visible (MAINT-2026-XXXXXX)
   - [x] Priority badges color-coded
   - [x] Status badges display correctly
   - [x] Dates formatted properly

4. **Loading States:**
   - [x] Spinner shows while loading
   - [x] Button shows "Submitting..." during submit
   - [x] Button disabled during submit

5. **RBAC:**
   - [x] Employee only sees own institution reports
   - [x] Cannot submit for other institutions
   - [x] Institution auto-populated from auth

6. **No Bugs:**
   - [x] No console errors
   - [x] No ESLint warnings
   - [x] No broken UI elements
   - [x] No duplicate submissions

---

## COMMON ISSUES

### Issue: Form doesn't submit
**Check:**
- Backend running?
- JWT token valid?
- All required fields filled?
- Network connection?

---

### Issue: Reports don't load
**Check:**
- Backend running?
- Database connected?
- JWT token valid?
- Logged in as correct role?

---

### Issue: Validation errors don't appear
**Check:**
- Form state updating?
- Console errors?
- React DevTools state?

---

### Issue: Success message doesn't show
**Check:**
- Backend returning success response?
- Report number in response?
- State updating correctly?

---

## REPORTING ISSUES

**If you find any bugs, report:**
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshot (if UI issue)
5. Console errors (if any)
6. Browser and version

---

## NEXT STEPS AFTER TESTING

Once all tests pass:

1. ✅ Phase 5A marked as complete
2. 🎯 Begin Phase 5B: Institution Manager maintenance dashboard
3. 🎯 Begin Phase 5C: ICT Staff maintenance management

---

**HAPPY TESTING!** 🎉

If everything works as described above, Phase 5A is successfully deployed and ready for production use.

---

**END OF TESTING GUIDE**
