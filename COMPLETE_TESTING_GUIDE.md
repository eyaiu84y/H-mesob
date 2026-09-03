# Complete Testing Guide - Hawassa MESOB System

**Date:** Testing Instructions  
**Purpose:** Complete system testing including user creation, login, and data verification

---

## 🚀 STEP 1: Login with Super Admin

### Super Admin Credentials
- **URL:** http://localhost:5173
- **Email:** `superadmin@mesobcenter.et`
- **Password:** `SuperAdmin@2026`

### Steps:
1. Open browser: http://localhost:5173
2. Click "Login" button
3. Enter email: `superadmin@mesobcenter.et`
4. Enter password: `SuperAdmin@2026`
5. Click "Sign In"
6. Should redirect to Super Admin Dashboard

---

## 👥 STEP 2: Create New User (Super Admin)

### Create User fkebede150@gmail.com

1. **Navigate to User Management:**
   - In Super Admin Dashboard sidebar
   - Click "User Management"

2. **Click "Add User" or "Create User" button**

3. **Fill User Form:**
   ```
   Full Name: Fikadu Kebede
   Email: fkebede150@gmail.com
   Password: temp671659
   Phone: +251911123456
   Role: Select role (MESOB_MANAGER, INSTITUTION_MANAGER, EMPLOYEE, ICT_STAFF, or CITIZEN)
   Institution: (Select if needed - only for INSTITUTION_MANAGER, EMPLOYEE, ICT_STAFF)
   Status: ACTIVE
   ```

4. **Click "Save" or "Create User"**

5. **Verify User Created:**
   - Should see success message
   - User should appear in user list
   - Note: User is stored in Supabase `users` table

### Create Multiple Test Users

**MESOB Manager:**
```
Email: test.manager@mesobcenter.et
Password: TestManager@2026
Role: MESOB_MANAGER
```

**Institution Manager:**
```
Email: test.inst.manager@mesobcenter.et
Password: TestInst@2026
Role: INSTITUTION_MANAGER
Institution: Select any institution
```

**Employee:**
```
Email: test.employee@mesobcenter.et
Password: TestEmp@2026
Role: EMPLOYEE
Institution: Select any institution
```

**ICT Staff:**
```
Email: test.ict@mesobcenter.et
Password: TestIct@2026
Role: ICT_STAFF
Institution: Select any institution
```

**Citizen:**
```
Email: test.citizen@mesobcenter.et
Password: TestCitizen@2026
Role: CITIZEN
```

---

## 🔐 STEP 3: Test Login with Created Users

### Test Each User

1. **Logout from Super Admin:**
   - Click profile icon or "Logout" button
   - Should return to login page

2. **Login with New User:**
   - Email: `fkebede150@gmail.com`
   - Password: `temp671659`
   - Click "Sign In"

3. **Verify Dashboard Access:**
   - Should redirect to appropriate dashboard based on role
   - Check sidebar navigation loads correctly
   - Check user name displays correctly

4. **Repeat for Each Created User**

---

## 📊 STEP 4: Test Maintenance Reports

### Create Maintenance Report (ICT Staff or Institution Manager)

1. **Login as ICT Staff:**
   - Email: `ict.staff@mesobcenter.et`
   - Password: `IctStaff@2026`

2. **Navigate to Maintenance Section**

3. **Create New Maintenance Report:**
   ```
   Title: Printer Not Working
   Description: Printer in service desk 3 is not responding
   Priority: High
   Category: Hardware
   Institution: National ID Program (auto-selected)
   ```

4. **Submit Report**

5. **Verify Report Created:**
   - Should appear in maintenance list
   - Status should be "Pending" or "Open"

### Assign Maintenance Task (Institution Manager)

1. **Login as Institution Manager:**
   - Email: `inst.manager@mesobcenter.et`
   - Password: `InstManager@2026`

2. **Go to Maintenance Section**

3. **View Submitted Reports**

4. **Assign to Technician:**
   - Click on report
   - Assign to ICT Staff
   - Set priority if needed
   - Add notes

5. **Verify Assignment:**
   - Report status should change to "Assigned"
   - Assigned technician should see it in their dashboard

### Complete Maintenance Task (ICT Staff)

1. **Login as ICT Staff**

2. **Go to My Tasks or Maintenance**

3. **View Assigned Task**

4. **Update Task:**
   - Change status to "In Progress"
   - Add work notes: "Replaced toner cartridge"
   - Upload photo if available

5. **Complete Task:**
   - Change status to "Completed"
   - Add completion notes
   - Submit

6. **Verify in Database:**
   - Open browser console
   - Check Network tab
   - Should see POST/PUT request to `/api/maintenance/reports`
   - Response should show updated data

---

## 🎫 STEP 5: Test Queue Management

### Join Queue (Citizen)

1. **Login as Citizen:**
   - Email: `citizen@mesobcenter.et`
   - Password: `Citizen@2026`

2. **Navigate to Queue or Services**

3. **Select Service:**
   - Choose institution (e.g., National ID Program)
   - Choose service (e.g., New ID Card)

4. **Join Queue:**
   - Click "Join Queue" or "Get Ticket"
   - Should receive ticket number
   - Status: Waiting

5. **Verify Ticket Created:**
   - Should see ticket in "My Queue"
   - Ticket number should display
   - Status should be "Waiting"

### Call Queue Ticket (Employee)

1. **Login as Employee:**
   - Email: `employee@mesobcenter.et`
   - Password: `Employee@2026`

2. **Navigate to Queue Management**

3. **View Waiting Queue**

4. **Call Next Ticket:**
   - Click "Call Next" or "Serve"
   - Ticket status changes to "Called"
   - Counter number displays

5. **Serve Citizen:**
   - Process service
   - Change status to "In Service"
   - Complete service
   - Change status to "Completed"

6. **Verify in Database:**
   - Queue ticket should be in `queues` table
   - Status should be "completed"
   - Completion time recorded

### Monitor Queue (MESOB Manager)

1. **Login as MESOB Manager:**
   - Email: `manager@mesobcenter.et`
   - Password: `MesobManager@2026`

2. **Go to Queue Monitoring Section**

3. **View System-Wide Queue:**
   - Should see all queue tickets
   - Filter by institution
   - Filter by status
   - See waiting/processing/completed counts

---

## 📝 STEP 6: Test Application Tracking

### Submit Application (Citizen)

1. **Login as Citizen**

2. **Navigate to Applications or Services**

3. **Select Service Type:**
   - Choose institution
   - Choose service (e.g., Business License)

4. **Fill Application Form:**
   ```
   Applicant Name: Fikadu Kebede
   Service: Business License
   Documents: Upload required docs (if available)
   Contact: +251911123456
   ```

5. **Submit Application**

6. **Get Application ID:**
   - Should receive application reference number
   - Status: Pending

### Process Application (Employee)

1. **Login as Employee**

2. **Go to Applications Section**

3. **View Pending Applications**

4. **Review Application:**
   - Click on application
   - View details
   - Check documents

5. **Process Application:**
   - Change status to "In Progress"
   - Add processing notes
   - Request additional documents if needed

6. **Approve/Reject:**
   - Change status to "Approved" or "Rejected"
   - Add approval/rejection notes
   - Set completion date

### Track Application (Citizen)

1. **Login as Citizen**

2. **Go to "My Applications"**

3. **View Application Status:**
   - Should see application
   - Status should update
   - Notes from employee visible

### Monitor Applications (MESOB Manager)

1. **Login as MESOB Manager**

2. **Go to Application Monitoring**

3. **View All Applications:**
   - System-wide view
   - Filter by institution
   - Filter by status
   - See pending/processing/completed counts

---

## 📢 STEP 7: Create and Test Announcements

### Create Announcement (MESOB Manager)

1. **Login as MESOB Manager:**
   - Email: `manager@mesobcenter.et`
   - Password: `MesobManager@2026`

2. **Navigate to Announcements Section**

3. **Click "Create Announcement" or "+ New"**

4. **Fill Announcement Form:**
   ```
   Title: System Maintenance Schedule
   Content: The MESOB system will undergo maintenance on Saturday, 8 AM - 12 PM.
   
   Type: SYSTEM or INTERNAL
   Target Roles: All Roles (or specific roles)
   Priority: High
   Publish Date: Today
   Expiry Date: (Optional - set future date)
   ```

5. **Preview Announcement**

6. **Publish Announcement**

7. **Verify Published:**
   - Should appear in announcements list
   - Status: Published

### Create Public Announcement (Super Admin)

1. **Login as Super Admin**

2. **Go to Announcements**

3. **Create Public Announcement:**
   ```
   Title: New Services Available
   Content: We are pleased to announce new online services...
   
   Type: PUBLIC
   Target: All Citizens
   ```

4. **Publish**

### View Announcements (All Users)

1. **Login as any user**

2. **Check Announcements Section:**
   - Should see relevant announcements
   - Filter by category
   - Mark as read

3. **Check Notifications:**
   - Should receive notification about new announcement
   - Click to view details

---

## 🗄️ STEP 8: Verify Data in Database

### Check Users Table

1. **Open Supabase Dashboard:**
   - URL: https://afsaruutbrnnmonciiga.supabase.co
   - Login with Supabase credentials

2. **Navigate to Table Editor**

3. **Open `users` table:**
   ```sql
   SELECT * FROM users 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

4. **Verify:**
   - `fkebede150@gmail.com` exists
   - `password_hash` is bcrypt hash
   - `role` is correct
   - `status` is ACTIVE
   - `created_at` timestamp

### Check Maintenance Reports Table

```sql
SELECT 
  id,
  title,
  description,
  priority,
  status,
  institution,
  assigned_to,
  created_at
FROM maintenance_reports
ORDER BY created_at DESC
LIMIT 10;
```

**Verify:**
- Report created by ICT Staff exists
- Status transitions (Pending → Assigned → In Progress → Completed)
- `assigned_to` has technician name
- Timestamps recorded

### Check Queue Table

```sql
SELECT 
  id,
  ticket_number,
  institution_id,
  service_name,
  citizen_name,
  status,
  counter_number,
  created_at,
  called_at,
  completed_at
FROM queues
ORDER BY created_at DESC
LIMIT 10;
```

**Verify:**
- Ticket created by Citizen exists
- `ticket_number` is unique
- Status transitions tracked
- Timestamps for each status
- Counter assignment recorded

### Check Applications Table

```sql
SELECT 
  id,
  application_number,
  institution_id,
  service_name,
  applicant_name,
  status,
  submitted_at,
  processed_at,
  completed_at
FROM applications
ORDER BY submitted_at DESC
LIMIT 10;
```

**Verify:**
- Application submitted by Citizen exists
- `application_number` is unique
- Status transitions tracked
- Processing employee recorded
- Documents linked (if applicable)

### Check Announcements Table

```sql
SELECT 
  id,
  title,
  content,
  type,
  target_roles,
  priority,
  status,
  published_at,
  expires_at,
  created_by
FROM announcements
ORDER BY published_at DESC
LIMIT 10;
```

**Verify:**
- Announcement created by MESOB Manager exists
- `type` is correct (SYSTEM, INTERNAL, PUBLIC)
- `target_roles` array has correct roles
- `status` is PUBLISHED
- Expiry date set if needed

---

## 🧪 STEP 9: Test Reports Section

### MESOB Manager Reports

1. **Login as MESOB Manager**

2. **Navigate to Reports Section**

3. **Test Each Report Tab:**

   **Queue Report:**
   - Click "Queue Report" tab
   - Verify stats show real numbers (Waiting, Processing, Completed)
   - Verify table shows actual queue tickets
   - Check institution names display
   - Check status badges show correct colors

   **Application Report:**
   - Click "Application Report" tab
   - Verify stats show real numbers
   - Verify table shows actual applications
   - Check dates format correctly
   - Check status badges

   **Maintenance Report:**
   - Click "Maintenance Report" tab
   - Verify stats (Open, Completed, Total)
   - Verify table shows actual maintenance tasks
   - Check priority badges
   - Check technician names

   **Institution Report:**
   - Click "Institution Report" tab
   - Verify institution count (should be 12)
   - Verify Busy/Normal status calculation
   - Verify per-institution stats
   - Check queue/apps/maintenance counts per institution

### Super Admin Reports

1. **Login as Super Admin**

2. **Navigate to Reports Section**

3. **Test Report Tabs:**

   **User Report:**
   - Shows all users
   - Correct role badges
   - Status indicators

   **Institution Report:**
   - Shows 12 institutions from database
   - Not mock data
   - Institution codes display

---

## 📱 STEP 10: Test Language Switching

1. **Login as any user**

2. **Locate Language Switcher:**
   - Top right corner
   - Shows "English" and "አማርኛ" buttons

3. **Switch to Amharic:**
   - Click "አማርኛ" button
   - Verify navigation items change to Amharic
   - Verify page titles change
   - Verify buttons change

4. **Switch back to English:**
   - Click "English" button
   - Verify everything switches back

5. **Test on Different Sections:**
   - Dashboard
   - Reports
   - Announcements
   - My Profile

---

## ✅ STEP 11: Verification Checklist

### User Management
- [ ] Can create new user as Super Admin
- [ ] New user receives email/password
- [ ] New user can login successfully
- [ ] User appears in database `users` table
- [ ] User role is enforced (can only access allowed sections)

### Maintenance System
- [ ] ICT Staff can submit maintenance report
- [ ] Institution Manager can view reports
- [ ] Institution Manager can assign to technician
- [ ] ICT Staff can update task status
- [ ] ICT Staff can complete task
- [ ] Data saved in `maintenance_reports` table
- [ ] MESOB Manager can see all reports system-wide

### Queue System
- [ ] Citizen can join queue
- [ ] Citizen receives ticket number
- [ ] Employee can call ticket
- [ ] Employee can serve citizen
- [ ] Employee can complete service
- [ ] Data saved in `queues` table
- [ ] MESOB Manager can monitor all queues

### Application Tracking
- [ ] Citizen can submit application
- [ ] Citizen receives application number
- [ ] Employee can view application
- [ ] Employee can process application
- [ ] Employee can approve/reject
- [ ] Data saved in `applications` table
- [ ] MESOB Manager can track all applications

### Announcements
- [ ] MESOB Manager can create announcement
- [ ] Super Admin can create public announcement
- [ ] Users see relevant announcements
- [ ] Announcements expire correctly
- [ ] Data saved in `announcements` table

### Reports
- [ ] Reports show real data (not placeholders)
- [ ] Stats match table data
- [ ] Reports navigation visible in sidebar
- [ ] All report tabs work
- [ ] Empty state shows when no data

### Language Support
- [ ] English translation complete
- [ ] Amharic translation complete
- [ ] Language switcher works
- [ ] Language persists across sessions

---

## 🔍 STEP 12: Browser Console Checks

### Open Developer Tools
Press `F12` or Right-click → Inspect

### Check Console Tab
- [ ] No red errors
- [ ] No undefined translation warnings
- [ ] No failed API requests

### Check Network Tab
1. **Filter by XHR/Fetch**

2. **Check API Calls:**
   - `POST /api/auth/login` → Status 200
   - `GET /api/auth/me` → Status 200
   - `GET /api/institutions` → Status 200
   - `GET /api/queues` → Status 200
   - `GET /api/applications` → Status 200
   - `GET /api/maintenance/reports` → Status 200
   - `GET /api/announcements` → Status 200

3. **Check Response Data:**
   - Click on request
   - View "Response" tab
   - Verify data structure matches expected format

---

## 🗃️ Database Verification Queries

### Run in Supabase SQL Editor

**Check Total Users:**
```sql
SELECT COUNT(*) as total_users FROM users;
-- Should be >= 12 (seed users + created users)
```

**Check Users by Role:**
```sql
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;
```

**Check Maintenance Reports:**
```sql
SELECT 
  COUNT(*) as total_reports,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
  COUNT(CASE WHEN status != 'COMPLETED' THEN 1 END) as open
FROM maintenance_reports;
```

**Check Queue Tickets:**
```sql
SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
FROM queues;
```

**Check Applications:**
```sql
SELECT 
  COUNT(*) as total_apps,
  COUNT(CASE WHEN status ILIKE '%pending%' THEN 1 END) as pending,
  COUNT(CASE WHEN status ILIKE '%completed%' OR status ILIKE '%approved%' THEN 1 END) as completed
FROM applications;
```

**Check Announcements:**
```sql
SELECT 
  COUNT(*) as total_announcements,
  COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published,
  type,
  COUNT(*) 
FROM announcements 
GROUP BY type;
```

---

## 🎯 Success Criteria

**System is working correctly when:**

✅ All test users can login with correct credentials  
✅ Role-based access control works (users see only allowed sections)  
✅ Maintenance reports can be created, assigned, and completed  
✅ Queue tickets can be created, called, and served  
✅ Applications can be submitted, processed, and approved  
✅ Announcements can be created and viewed  
✅ Reports section displays real data  
✅ Language switching works  
✅ All data persists in Supabase database  
✅ No console errors  
✅ All API calls return status 200  

---

## 🚨 Troubleshooting

### Login Fails
- Check email matches exactly (case-sensitive)
- Check password matches exactly
- Check user exists in database
- Check backend is running on port 5000
- Check browser console for errors

### Data Not Showing
- Check backend API is responding
- Check browser Network tab for failed requests
- Check Supabase database has data
- Hard refresh browser (Ctrl+Shift+R)

### Reports Empty
- Check translation key `reports:` exists in AppContext
- Check sidebar shows "Reports" navigation item
- Check data exists in database
- Check context providers are wrapping dashboard

---

## 📞 Support

If issues persist:
1. Check backend logs: View terminal running `npm start`
2. Check frontend logs: Browser Developer Tools → Console
3. Check Supabase logs: Supabase Dashboard → Logs
4. Verify database schema: Check migrations ran successfully

**System is ready for comprehensive testing!** 🚀
