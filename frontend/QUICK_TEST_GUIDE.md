# Quick Test Guide - Maintenance Report Workflow

## 🎯 Quick Testing Steps

### Test 1: Employee Reports Problem (5 minutes)

1. **Login:**
   - Email: `employee@mesobcenter.et`
   - Password: `emp123`

2. **Navigate:**
   - Click "Maintenance Report" in sidebar

3. **Create Report:**
   - Click "Report Maintenance Problem" button
   - Select Institution: "National ID Program"
   - Verify Employee ID auto-filled: EMP-004
   - Verify Employee Name auto-filled: Abebe Kebede
   - Select Problem Type: "Computer / Hardware"
   - Enter Description: "Desktop won't boot, black screen"
   - Enter Location: "2nd Floor, East Wing"
   - Enter Office Number: "205"
   - Upload a test image (any JPG/PNG)
   - Verify photo preview appears
   - Click "Submit Maintenance Report"

4. **Verify Success:**
   - Should see success message with Report ID (MR-XXXXXX)
   - Should show all submitted details
   - Wait 3 seconds, auto-returns to list
   - Report should appear in table

---

### Test 2: Manager Reviews & Assigns (5 minutes)

1. **Logout & Login:**
   - Logout from Employee
   - Login as Institution Manager:
     - Email: `inst.manager@mesobcenter.et`
     - Password: `inst123`

2. **Navigate:**
   - Click "Maintenance" in sidebar

3. **Review Report:**
   - Find the employee report in "Employee Problem Reports" table
   - Verify you see: Employee Name, Employee ID, Problem Type, Location, Office
   - Click "View" button

4. **View Details:**
   - Verify ALL fields visible:
     - Employee: Abebe Kebede (EMP-004)
     - Problem Type: Computer / Hardware
     - Location: 2nd Floor, East Wing
     - Office: 205
     - Full description
     - Problem photo displayed

5. **Assign Technician:**
   - Click "Assign Technician" button
   - Modal opens showing report summary
   - Select "Technician" from dropdown
   - Click "Assign Task"
   - Should see success alert with Task ID
   - Report status should change to "Assigned"

---

### Test 3: Technician Processes Task (5 minutes)

1. **Logout & Login:**
   - Logout from Manager
   - Login as Technician:
     - Email: `technician@mesobcenter.et`
     - Password: `ict123`

2. **Navigate:**
   - Click "My Tasks" in sidebar

3. **View Task:**
   - Find the newly assigned task
   - Click "Open" button

4. **Review Complete Information:**
   - Verify you see ALL original employee report fields:
     - ✅ Task ID
     - ✅ Employee Name: Abebe Kebede
     - ✅ Employee ID: EMP-004
     - ✅ Problem Type: Computer / Hardware
     - ✅ Location: 2nd Floor, East Wing
     - ✅ Office Number: 205
     - ✅ Full description visible
     - ✅ Problem photo displayed
     - ✅ Institution: National ID Program

5. **Process Task:**
   - Click "Start Task" button
   - Verify status changes to "In Progress"
   - Click "Complete Task" button
   - Verify status changes to "Completed"

---

### Test 4: Verify Complete Workflow (2 minutes)

1. **Check Manager Dashboard:**
   - Login as Institution Manager again
   - Go to Maintenance section
   - Verify:
     - Task shows "Completed" status
     - Report shows "Completed" status

2. **Check Employee Dashboard:**
   - Login as Employee again
   - Go to Maintenance Report section
   - Verify:
     - Report shows "Completed" status
     - "Assigned To" shows "Technician"
     - Can click "View" to see full details

---

## ✅ Expected Results

After completing all tests, you should have:

1. ✅ Employee successfully submitted comprehensive maintenance report
2. ✅ Manager viewed all report details including photo
3. ✅ Manager assigned technician, creating linked task
4. ✅ Technician received task with ALL employee report information
5. ✅ Technician processed task through status workflow
6. ✅ Manager sees completed task
7. ✅ Employee sees completed report with resolution status

---

## 🔧 Troubleshooting

### Photo Upload Issues:
- Use JPG or PNG files only
- Keep file size under 5MB
- Try a smaller test image if upload fails

### No Reports Showing:
- Ensure you're logged in as correct user
- Check that institution matches (National ID Program)
- Refresh page if needed

### Task Not Appearing:
- Verify technician was assigned by manager
- Ensure you're logged in as "Technician" user
- Check "My Tasks" section

---

## 📋 Test Data Summary

| Role | Email | Password | Employee ID | Institution |
|------|-------|----------|-------------|-------------|
| Employee | employee@mesobcenter.et | emp123 | EMP-004 | National ID Program |
| Institution Manager | inst.manager@mesobcenter.et | inst123 | EMP-003 | National ID Program |
| Technician | technician@mesobcenter.et | ict123 | TECH-001 | - |

---

## 🎉 Success Indicators

The implementation is working correctly if:
- ✅ `npm run lint` passes with 0 errors
- ✅ `npm run build` succeeds
- ✅ All form validations work
- ✅ Photo upload and preview work
- ✅ Employee info auto-populates
- ✅ Reports appear in correct dashboards
- ✅ Manager can assign technicians
- ✅ Technician sees all employee report details
- ✅ Status updates flow through system
- ✅ Everyone sees current status

---

**Testing Time:** ~15-20 minutes total
**Status:** ✅ READY TO TEST
