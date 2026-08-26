# Maintenance Workflow - Quick Testing Guide

## Test Accounts

### Employee
- **Email**: employee@mesobcenter.et
- **Password**: emp123
- **Name**: Abebe Kebede
- **Employee ID**: EMP-004
- **Institution**: National ID Program
- **Role**: Employee

### Institution Manager
- **Email**: inst.manager@mesobcenter.et
- **Password**: inst123
- **Name**: Institution Manager
- **Employee ID**: EMP-003
- **Institution**: National ID Program
- **Role**: Institution Manager

### Technician (ICT Staff)
- **Email**: ict.staff@mesobcenter.et
- **Password**: ict123
- **Name**: ICT Staff
- **Employee ID**: TECH-001
- **Institution**: National ID Program
- **Role**: Technician

---

## Quick Test Steps

### 1. Employee Creates Report (5 minutes)

1. **Login** as Employee
2. Click **"Maintenance Report"** in sidebar
3. Click **"Report Maintenance Problem"** button
4. **Verify** auto-filled fields:
   - Institution: "National ID Program" ✓
   - Employee ID: "EMP-004" ✓
   - Employee Name: "Abebe Kebede" ✓
5. **Fill** required fields:
   - Problem Type: Select "Computer / Hardware"
   - Description: "Desktop computer in Room 204 won't power on. Checked power cable, no response."
   - Location: "2nd Floor, Building A"
   - Office Number: "Room 204"
6. **Upload** problem photo:
   - Click upload area
   - Select any image file (JPG/PNG)
   - Verify preview appears
7. Click **"Submit Maintenance Report"**
8. **Verify** success alert shows:
   - Report ID (e.g., MR-123456) ✓
   - Your name ✓
   - Employee ID ✓
   - Institution ✓
   - Status: Submitted ✓
9. **Verify** report appears in "My Maintenance Reports" table below
10. **Note** the Report ID for next steps

### 2. Manager Reviews & Assigns (3 minutes)

1. **Logout** and **Login** as Institution Manager
2. Click **"Maintenance"** in sidebar
3. **Verify** employee's report appears in "Maintenance Reports" table
4. Click **"View"** on the report
5. **Verify** all details shown:
   - Report ID ✓
   - Employee: "Abebe Kebede" ✓
   - Employee ID: "EMP-004" ✓
   - Problem Type: "Computer / Hardware" ✓
   - Description visible ✓
   - Location: "2nd Floor, Building A" ✓
   - Office: "Room 204" ✓
   - **Problem photo displayed** ✓
6. Click **"Assign Technician"** button
7. **Select** "ICT Staff (ict.staff@mesobcenter.et)" from dropdown
8. Click **"Assign Task"**
9. **Verify** success alert shows task assignment
10. Click **"Back to Maintenance"**
11. **Verify** report now shows:
    - Status: "Assigned" (blue badge) ✓
    - Assigned To: "ICT Staff" ✓
    - Task ID appears ✓

### 3. Technician Processes Task (3 minutes)

1. **Logout** and **Login** as Technician (ICT Staff)
2. Click **"My Tasks"** in sidebar
3. **Verify** newly assigned task appears in table
4. **Verify** shows:
   - Task ID ✓
   - Institution: "National ID Program" ✓
   - Problem Type: "Computer / Hardware" ✓
   - Status: "Assigned" (yellow badge) ✓
5. Click **"Open"** on the task
6. **Verify** complete details shown:
   - Task ID ✓
   - Related Report ID (matches employee's report) ✓
   - Institution ✓
   - **Reporter Information:**
     - Employee Name: "Abebe Kebede" ✓
     - Employee ID: "EMP-004" ✓
   - **Problem Details:**
     - Problem Type: "Computer / Hardware" ✓
     - Location: "2nd Floor, Building A" ✓
     - Office Number: "Room 204" ✓
     - Description visible ✓
   - **Problem Photo displayed** ✓
7. Click **"Start Task"** button
8. **Verify** status changes to "In Progress" (blue badge)
9. **Verify** button changes to "Complete Task"
10. Click **"Complete Task"**
11. **Verify** status changes to "Completed" (green badge)
12. **Verify** action button disappears (task done)

### 4. Verify Manager Sees Completion (2 minutes)

1. **Logout** and **Login** as Institution Manager
2. Click **"Maintenance"** in sidebar
3. **Locate** the original report
4. **Verify** shows:
   - Status: "Completed" (green badge) ✓
   - Assigned To: "ICT Staff" ✓
   - Task ID present ✓
5. Click **"View"** to see full details
6. **Verify** complete resolution information visible

### 5. Verify Employee Sees Resolution (2 minutes)

1. **Logout** and **Login** as Employee
2. Click **"Maintenance Report"** in sidebar
3. **Locate** your report in "My Maintenance Reports" table
4. **Verify** shows:
   - Status: "Completed" (green badge) ✓
   - Assigned To: "ICT Staff" ✓
5. Click **"View"** if available
6. **Verify** can see resolution status

---

## Status Flow Verification

### Expected Status Progression:

```
Employee Creates Report
    ↓
Status: "Submitted" (yellow badge)
    ↓
Manager Assigns Technician
    ↓
Status: "Assigned" (blue badge)
    ↓
Technician Starts Task
    ↓
Status: "In Progress" (blue badge)
    ↓
Technician Completes Task
    ↓
Status: "Completed" (green badge)
```

All three users (Employee, Manager, Technician) should see the updated status.

---

## Data Verification Checklist

After completing the test workflow, verify:

### ✅ Employee Report Contains:
- [ ] Report ID (unique)
- [ ] Institution
- [ ] Employee ID
- [ ] Employee Name
- [ ] Problem Type
- [ ] Problem Description
- [ ] Location
- [ ] Office Number
- [ ] Problem Photo
- [ ] Submission Date
- [ ] Status (tracks through workflow)
- [ ] Assigned Technician (after assignment)
- [ ] Task ID (after assignment)

### ✅ Manager Can See:
- [ ] All reports for their institution
- [ ] Complete report details
- [ ] Problem photo
- [ ] Reporter information
- [ ] Can assign technician
- [ ] Created task links to report
- [ ] Status updates from technician

### ✅ Technician Can See:
- [ ] All tasks assigned to them
- [ ] Complete original report details
- [ ] Problem photo from employee
- [ ] Reporter information (Employee ID, Name)
- [ ] Location details
- [ ] Can update task status
- [ ] Status changes persist

### ✅ Data Relationships:
- [ ] Maintenance Report created by Employee
- [ ] Technical Task created from Report by Manager
- [ ] Task contains reportId linking back to Report
- [ ] Report contains taskId linking to Task
- [ ] Status updates sync between Task and Report
- [ ] All three users see the same status

---

## Common Issues & Solutions

### Issue: Photo upload fails
**Solution**: Ensure file is:
- Image type (JPG, PNG, GIF)
- Under 5MB in size
- Browser supports FileReader API

### Issue: Report not appearing for Manager
**Solution**: Verify:
- Employee and Manager are same institution
- Manager logged in to correct account
- Report successfully submitted (check localStorage)

### Issue: Task not appearing for Technician
**Solution**: Verify:
- Manager actually clicked "Assign Task"
- Correct technician selected
- Technician logged in to correct account
- Task created successfully (check console)

### Issue: Status not updating
**Solution**: Verify:
- Technician clicked status button
- No JavaScript errors in console
- localStorage has updated data
- Page refreshed if needed

---

## Browser Developer Tools

### Check localStorage Data:

**Open Console** (F12) and run:

```javascript
// View all maintenance reports
JSON.parse(localStorage.getItem('mesob_maintenance_reports'))

// View all maintenance tasks
JSON.parse(localStorage.getItem('mesob_maintenance_tasks'))

// Clear data to start fresh (WARNING: Deletes all data)
localStorage.removeItem('mesob_maintenance_reports')
localStorage.removeItem('mesob_maintenance_tasks')
```

---

## Success Criteria

The workflow is working correctly if:

✅ Employee can submit report with all fields + photo
✅ Manager sees report with all details + photo
✅ Manager can assign technician
✅ Task automatically created with linked reportId
✅ Technician receives task in "My Tasks"
✅ Technician sees all original report details + photo
✅ Technician can update status (Assigned → In Progress → Completed)
✅ Status updates sync back to maintenance report
✅ Manager sees completed status
✅ Employee sees completed status
✅ No broken links, errors, or missing data
✅ Photo displays correctly at all stages

---

## Test Completion Time

**Total Time**: ~15 minutes
- Employee: 5 min
- Manager: 3 min
- Technician: 3 min
- Verification: 4 min

---

## After Testing

If all tests pass:
1. ✅ Mark workflow as verified
2. ✅ Document any findings
3. ✅ Ready for user acceptance testing
4. ✅ Ready for production deployment

If tests fail:
1. Note which step failed
2. Check browser console for errors
3. Verify localStorage data
4. Review error messages
5. Report issue with specific details
