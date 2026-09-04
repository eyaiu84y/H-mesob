# 🎯 HAWASSA MESOB SYSTEM - FINAL END-TO-END TEST CHECKLIST

**Date**: September 4, 2026  
**System**: Hawassa MESOB Digital Information System  
**Status**: Pre-Submission Final Testing

---

## 📋 SYSTEM OVERVIEW

### Core Components
- ✅ Frontend: React + Vite (Production build ready)
- ✅ Backend: Node.js + Express + Supabase
- ✅ Database: PostgreSQL (Supabase)
- ✅ Authentication: JWT-based
- ✅ File Storage: Supabase Storage

### User Roles (6 Total)
1. Super Admin
2. MESOB Manager
3. Institution Manager (12 institutions)
4. Employee
5. ICT Staff
6. Citizen

---

## 🔐 1. AUTHENTICATION & AUTHORIZATION

### Test Users (From seed data)
```
Super Admin:     superadmin@mesobcenter.et     / SuperAdmin@2026
MESOB Manager:   manager@mesobcenter.et        / MesobManager@2026
Inst. Manager:   inst.manager@mesobcenter.et   / InstManager@2026
Employee:        employee@mesobcenter.et       / Employee@2026
ICT Staff:       ict.staff@mesobcenter.et      / IctStaff@2026
Citizen:         citizen@mesobcenter.et        / Citizen@2026
```

### ✅ Authentication Tests
- [ ] Login with Super Admin credentials
- [ ] Login with MESOB Manager credentials
- [ ] Login with Institution Manager credentials
- [ ] Login with Employee credentials
- [ ] Login with ICT Staff credentials
- [ ] Login with Citizen credentials
- [ ] Test invalid credentials (should fail)
- [ ] Test logout functionality
- [ ] Test session persistence (refresh page)
- [ ] Test role-based dashboard routing

**Expected**: Each role should land on their specific dashboard after login.

---

## 🏛️ 2. INSTITUTION SETUP (12 Institutions)

### Verify 12 Institutions Exist
Check in Super Admin dashboard → Institution Management:
1. [ ] Sidama Bank
2. [ ] Commercial Bank of Ethiopia
3. [ ] Awash Bank
4. [ ] Dashen Bank
5. [ ] Bank of Abyssinia
6. [ ] Wegagen Bank
7. [ ] United Bank
8. [ ] Nib Bank
9. [ ] Cooperative Bank of Oromia
10. [ ] Lion International Bank
11. [ ] Zemen Bank
12. [ ] Bunna Bank

**Test**:
- [ ] Each institution has name_en, name_am
- [ ] Each institution has logo
- [ ] Each institution has description
- [ ] Each institution appears in public Service Catalogue

---

## 👤 3. SUPER ADMIN DASHBOARD

### Core Features
- [ ] **Dashboard Overview**: Shows system-wide statistics
- [ ] **User Management**: Can view all users across all institutions
- [ ] **Institution Management**: Can view all 12 institutions
- [ ] **Service Management**: Can manage services (if implemented)
- [ ] **Queue Monitoring**: Can see all queue tickets system-wide
- [ ] **Application Monitoring**: Can see all applications system-wide
- [ ] **Maintenance Oversight**: Can see all maintenance reports
- [ ] **Feedback Overview**: Can see all feedback system-wide
- [ ] **Reports**: Can generate system-wide reports
- [ ] **Analytics**: Can view system analytics
- [ ] **Announcements**: 
  - [ ] Can create PUBLIC/INTERNAL/SYSTEM/ROLE/INSTITUTION announcements
  - [ ] Can edit ALL announcements
  - [ ] Can delete ALL announcements
- [ ] **My Profile**: Can view own profile

### Test Announcements (Super Admin)
- [ ] Create PUBLIC announcement → Should appear on public website
- [ ] Create INTERNAL announcement → Should appear in all staff dashboards
- [ ] Create SYSTEM announcement → Should appear in admin/manager dashboards only
- [ ] Edit any announcement → Should save successfully
- [ ] Delete any announcement → Should delete with confirmation

---

## 🎯 4. MESOB MANAGER DASHBOARD

### Core Features
- [ ] **Dashboard Overview**: Shows MESOB-wide statistics
- [ ] **Institution Monitoring**: Can view all 12 institutions
- [ ] **Queue Monitoring**: Can see all queue tickets
- [ ] **Application Monitoring**: Can see all applications
- [ ] **Maintenance Oversight**: Can see all maintenance reports
- [ ] **Feedback Overview**: Can see all feedback
- [ ] **Reports**: Can generate MESOB-wide reports
- [ ] **Analytics**: Can view MESOB analytics
- [ ] **Announcements**:
  - [ ] Can create PUBLIC/INTERNAL/SYSTEM/ROLE announcements
  - [ ] Can edit ALL announcements
  - [ ] Can delete ALL announcements
- [ ] **My Profile**: Can view own profile

### Test Permissions
- [ ] Cannot manage users (Super Admin only)
- [ ] Cannot create institutions (Super Admin only)
- [ ] Can view all institutions but not edit them

---

## 🏦 5. INSTITUTION MANAGER DASHBOARD

### Core Features (Scoped to THEIR institution only)
- [ ] **Dashboard Overview**: Shows stats for their institution
- [ ] **Queue Management**: 
  - [ ] See only their institution's queue
  - [ ] Can call citizens
  - [ ] Can complete service
- [ ] **Applications**:
  - [ ] See only their institution's applications
  - [ ] Can search applications
  - [ ] Can view application details
  - [ ] Can update application status
- [ ] **Maintenance**:
  - [ ] See only their institution's maintenance reports
  - [ ] Can view maintenance reports
  - [ ] Can assign maintenance to ICT staff
  - [ ] Shows "Employee Problem Reports" table
  - [ ] Shows "Maintenance Tasks" table
- [ ] **Task Assignment**: Can assign maintenance tasks to ICT staff
- [ ] **Service Feedback**: Can view feedback for their services
- [ ] **Staff Management**: Can view staff in their institution (read-only)
- [ ] **Reports**: Can generate reports for their institution
- [ ] **Announcements**:
  - [ ] Can create PUBLIC/INTERNAL/INSTITUTION announcements
  - [ ] Can edit ONLY THEIR OWN announcements
  - [ ] Can delete ONLY THEIR OWN announcements
- [ ] **My Profile**: Can view own profile

### Critical Tests
- [ ] Verify ONLY sees data from their assigned institution
- [ ] Verify CANNOT see other institutions' data
- [ ] Verify maintenance reports appear (no "No maintenance reports")
- [ ] Verify can assign tasks to ICT staff in same institution

---

## 👨‍💼 6. EMPLOYEE DASHBOARD

### Core Features (Scoped to THEIR institution)
- [ ] **Dashboard Overview**: Shows personal stats
- [ ] **Queue Management**:
  - [ ] Can generate queue tickets
  - [ ] Can call next citizen
  - [ ] Can complete service
- [ ] **Search Applications**:
  - [ ] Can search applications by criteria
  - [ ] Can view application details
  - [ ] Can update application status
- [ ] **Service Requirements**: Can view required documents for services
- [ ] **Maintenance Reports**: Can view reports they submitted
- [ ] **Announcements**: Can view PUBLIC/INTERNAL/INSTITUTION announcements
- [ ] **My Profile**: Can view own profile

### Test Workflow
1. [ ] Employee logs in
2. [ ] Generates queue ticket for walk-in citizen
3. [ ] Calls citizen from queue
4. [ ] Searches for citizen's application
5. [ ] Views application details
6. [ ] Updates application status
7. [ ] Completes service
8. [ ] Views service requirements for reference

---

## 🔧 7. ICT STAFF DASHBOARD

### Core Features (Scoped to THEIR institution)
- [ ] **Dashboard Overview**: Shows task statistics
- [ ] **My Tasks**:
  - [ ] See tasks assigned to them
  - [ ] Can view task details with photos
  - [ ] Can start task (status → In Progress)
  - [ ] Can complete task with resolution notes
  - [ ] Photo attachments display correctly
- [ ] **Maintenance Reports**: Can view all reports for their institution
- [ ] **Announcements**: Can view PUBLIC/INTERNAL/INSTITUTION announcements
- [ ] **My Profile**: Can view own profile

### Test Maintenance Workflow
1. [ ] ICT Staff logs in
2. [ ] Sees task assigned by Institution Manager
3. [ ] Clicks "View" on task
4. [ ] Sees task details + photo attachment
5. [ ] Clicks "Start Task" → Status changes to "In Progress"
6. [ ] Enters completion notes
7. [ ] Clicks "Complete Task" → Status changes to "Completed"
8. [ ] Notification sent to reporter

---

## 👥 8. CITIZEN DASHBOARD

### Core Features
- [ ] **Dashboard Overview**: Shows personal statistics
- [ ] **My Queue Tickets**: Can view own queue tickets
- [ ] **My Applications**:
  - [ ] Can view all submitted applications
  - [ ] Can search applications
  - [ ] Can view application details
  - [ ] Can track application status
- [ ] **Submit Application**:
  - [ ] Can select service
  - [ ] Can select institution
  - [ ] Can fill application form
  - [ ] Can submit successfully
- [ ] **Service Feedback**: 
  - [ ] Can rate completed services (1-5 stars)
  - [ ] Can add comments
  - [ ] Feedback submitted successfully
- [ ] **Announcements**: Can view PUBLIC announcements only
- [ ] **My Profile**: Can view and edit profile

### Test Application Submission
1. [ ] Citizen logs in
2. [ ] Clicks "Submit Application"
3. [ ] Selects service and institution
4. [ ] Fills form (handles null IDs correctly)
5. [ ] Submits application → Success message
6. [ ] Application appears in "My Applications"
7. [ ] After completion, can leave feedback

---

## 🌐 9. PUBLIC WEBSITE (No Login Required)

### Home Page
- [ ] Hero section displays correctly
- [ ] Navigation works (Services, News, Contact)
- [ ] Language switcher works (English ↔ አማርኛ)
- [ ] Responsive on mobile

### Service Catalogue Page
- [ ] All 12 institutions display with logos
- [ ] Institution cards clickable
- [ ] Institution detail view shows:
  - [ ] Institution name (English & Amharic)
  - [ ] Logo
  - [ ] Description
  - [ ] Services offered
  - [ ] Required documents
  - [ ] Service fees
  - [ ] Processing time
  - [ ] Contact information

### Latest News Section
- [ ] Shows PUBLIC announcements only
- [ ] Does NOT show role names (no "Super Administrator")
- [ ] Shows date only
- [ ] Click announcement opens detail view
- [ ] Detail view shows full content
- [ ] "Back to News" button works

### Test Public Visibility
- [ ] PUBLIC announcements appear on website
- [ ] INTERNAL announcements DO NOT appear
- [ ] SYSTEM announcements DO NOT appear
- [ ] ROLE announcements DO NOT appear
- [ ] INSTITUTION announcements DO NOT appear

---

## 📢 10. ANNOUNCEMENTS SYSTEM (Cross-Role)

### Announcement Scopes
1. **PUBLIC**: Visible to everyone (including public website)
2. **INTERNAL**: Visible to all staff (not citizens, not public)
3. **SYSTEM**: Visible to Super Admin and MESOB Manager only
4. **ROLE**: Visible to specific roles
5. **INSTITUTION**: Visible to specific institution staff

### Creation Permissions
| Role | Can Create | Scopes Available |
|------|-----------|------------------|
| Super Admin | ✅ | ALL scopes |
| MESOB Manager | ✅ | PUBLIC, INTERNAL, SYSTEM, ROLE |
| Institution Manager | ✅ | PUBLIC, INTERNAL, INSTITUTION |
| Employee | ❌ | None |
| ICT Staff | ❌ | None |
| Citizen | ❌ | None |

### Edit/Delete Permissions
| Role | Can Edit/Delete |
|------|-----------------|
| Super Admin | ALL announcements |
| MESOB Manager | ALL announcements |
| Institution Manager | ONLY their own |
| Others | None |

### Test Matrix
- [ ] Super Admin creates PUBLIC → Appears on website + all dashboards
- [ ] Super Admin creates INTERNAL → Appears in all staff dashboards, NOT on website
- [ ] Super Admin creates SYSTEM → Appears only in Super Admin + MESOB Manager
- [ ] MESOB Manager creates ROLE (EMPLOYEE) → Appears only in Employee dashboards
- [ ] Institution Manager creates INSTITUTION → Appears only in their institution's staff
- [ ] Super Admin can edit ANY announcement
- [ ] MESOB Manager can edit ANY announcement
- [ ] Institution Manager can edit ONLY THEIR OWN
- [ ] Buttons show/hide based on permissions

---

## 🎫 11. QUEUE MANAGEMENT SYSTEM

### Employee Creates Queue Ticket
1. [ ] Employee dashboard → Queue Management
2. [ ] Click "Generate New Token"
3. [ ] Select service
4. [ ] Enter citizen name
5. [ ] Ticket generated with unique token
6. [ ] Ticket appears in queue list

### Institution Manager Views Queue
- [ ] Institution Manager sees all queue tickets for their institution
- [ ] Can call citizen
- [ ] Can complete service
- [ ] Status updates correctly

### MESOB Manager Views All Queues
- [ ] MESOB Manager sees ALL queue tickets across all 12 institutions
- [ ] Can filter by institution
- [ ] Can monitor queue conditions system-wide

---

## 📝 12. APPLICATION TRACKING SYSTEM

### Citizen Submits Application
1. [ ] Citizen dashboard → Submit Application
2. [ ] Select service from dropdown
3. [ ] Select institution from dropdown
4. [ ] Fill application form
5. [ ] Submit → Success message
6. [ ] Application ID generated

### Employee Searches Application
1. [ ] Employee dashboard → Search Applications
2. [ ] Enter search criteria
3. [ ] Results show matching applications
4. [ ] Click "View" → Details displayed correctly
5. [ ] Can update status

### Institution Manager Tracks Applications
- [ ] Sees all applications for their institution
- [ ] Can search by criteria
- [ ] Can view details
- [ ] Can update status
- [ ] Statistics updated

### Status Flow
- [ ] Pending → In Progress → Completed
- [ ] Status changes reflect immediately
- [ ] Citizen sees status updates in their dashboard

---

## 🔧 13. MAINTENANCE SYSTEM

### Employee Reports Problem
1. [ ] Employee dashboard → Maintenance Reports
2. [ ] Click "Report Problem"
3. [ ] Fill form:
   - [ ] Problem type
   - [ ] Description
   - [ ] Location
   - [ ] Office number
   - [ ] Priority
   - [ ] Photo upload (optional)
4. [ ] Submit → Report created
5. [ ] Report number generated

### Institution Manager Assigns Task
1. [ ] Institution Manager dashboard → Maintenance
2. [ ] Sees new report in "Employee Problem Reports" table
3. [ ] Click "View" on report
4. [ ] Click "Assign Technician"
5. [ ] Select ICT staff from dropdown (only shows staff in same institution)
6. [ ] Assign → Task created
7. [ ] Report moves to "Maintenance Tasks" table

### ICT Staff Completes Task
1. [ ] ICT Staff dashboard → My Tasks
2. [ ] Sees assigned task
3. [ ] Click "View" → Sees details + photo
4. [ ] Click "Start Task" → Status: In Progress
5. [ ] Enter completion notes
6. [ ] Click "Complete Task" → Status: Completed
7. [ ] Reporter notified

### Cross-Role Visibility
- [ ] Employee sees only THEIR reports
- [ ] ICT Staff sees tasks assigned to THEM
- [ ] Institution Manager sees ALL reports for THEIR institution
- [ ] MESOB Manager sees ALL reports system-wide
- [ ] Super Admin sees ALL reports system-wide

---

## ⭐ 14. SERVICE FEEDBACK SYSTEM

### Citizen Leaves Feedback
1. [ ] Citizen completes a service
2. [ ] Dashboard shows "Leave Feedback" prompt
3. [ ] Click "Leave Feedback"
4. [ ] Select service and institution
5. [ ] Rate 1-5 stars
6. [ ] Add optional comment
7. [ ] Submit → Feedback saved

### Feedback Visibility
- [ ] MESOB Manager sees all feedback system-wide
- [ ] Institution Manager sees feedback for their services
- [ ] Feedback statistics calculated:
  - [ ] Average rating
  - [ ] Total feedback count
  - [ ] Rating distribution
  - [ ] Sentiment breakdown

### Feedback Sources
- [ ] WEBSITE feedback tracked separately
- [ ] TELEGRAM feedback tracked separately
- [ ] Both displayed in dashboards

---

## 📊 15. REPORTS & ANALYTICS

### Super Admin / MESOB Manager
- [ ] Queue reports (waiting, processing, completed)
- [ ] Application reports (pending, in progress, completed)
- [ ] Maintenance reports (open, completed)
- [ ] Institution performance reports
- [ ] Feedback summary reports

### Institution Manager
- [ ] Queue reports for their institution
- [ ] Application reports for their institution
- [ ] Maintenance reports for their institution
- [ ] Feedback for their services

---

## 🔔 16. NOTIFICATIONS SYSTEM

### Notification Triggers
- [ ] Application status change → Notify citizen
- [ ] Maintenance task assigned → Notify ICT staff
- [ ] Maintenance task completed → Notify reporter
- [ ] Queue ticket called → Notify citizen (if implemented)

### Notification Display
- [ ] Notification icon shows unread count
- [ ] Click icon opens notification list
- [ ] Notifications marked as read
- [ ] Notifications cleared properly

---

## 🔗 17. BACKEND API ENDPOINTS

### Test API Health
```bash
GET /api/health → Should return 200 OK
```

### Authentication
```bash
POST /api/auth/login → Returns JWT token
POST /api/auth/signup → Creates new user (citizen)
GET /api/auth/me → Returns current user
POST /api/auth/logout → Logs out user
```

### Users
```bash
GET /api/users → Returns users (filtered by role)
GET /api/users/:id → Returns user by ID
POST /api/users → Creates user (admin only)
PATCH /api/users/:id → Updates user
DELETE /api/users/:id → Deletes user (admin only)
```

### Institutions
```bash
GET /api/institutions → Returns all institutions
GET /api/institutions/:id → Returns institution by ID
GET /api/institutions/:id/services → Returns services
```

### Services
```bash
GET /api/services → Returns all services
GET /api/services/:id → Returns service by ID
GET /api/services/:id/requirements → Returns requirements
```

### Queue
```bash
GET /api/queue/tickets → Returns tickets (filtered by institution)
POST /api/queue/tickets → Creates ticket
PATCH /api/queue/tickets/:id → Updates ticket status
```

### Applications
```bash
GET /api/applications → Returns applications (filtered by role)
POST /api/applications → Creates application
PATCH /api/applications/:id → Updates application status
GET /api/applications/:id → Returns application by ID
```

### Maintenance
```bash
GET /api/maintenance/reports → Returns reports (filtered by institution)
POST /api/maintenance/reports → Creates report
POST /api/maintenance/reports/:id/assign → Assigns to ICT
GET /api/maintenance/tasks → Returns tasks (for ICT)
PATCH /api/maintenance/tasks/:id → Updates task status
POST /api/maintenance/tasks/:id/complete → Completes task
```

### Feedback
```bash
GET /api/feedback → Returns feedback (filtered by role)
POST /api/feedback → Creates feedback
GET /api/feedback/stats → Returns statistics
```

### Announcements
```bash
GET /api/announcements → Returns announcements (filtered by scope)
POST /api/announcements → Creates announcement
PATCH /api/announcements/:id → Updates announcement
DELETE /api/announcements/:id → Deletes announcement
```

---

## ⚙️ 18. FRONTEND BUILD & DEPLOYMENT

### Production Build
```bash
cd frontend
npm run build
```

Expected output:
- [ ] ✓ Build completes without errors
- [ ] dist/ folder created
- [ ] index.html generated
- [ ] assets/ folder contains JS/CSS bundles
- [ ] All dashboard components code-split
- [ ] File sizes optimized

### Bundle Sizes (Approximate)
- [ ] Main bundle: ~381 KB
- [ ] CSS: ~66 KB
- [ ] SuperAdminDashboard: ~74 KB
- [ ] MesobManagerDashboard: ~61 KB
- [ ] InstitutionManagerDashboard: ~76 KB
- [ ] EmployeeDashboard: ~47 KB
- [ ] ICTStaffDashboard: ~25 KB
- [ ] CitizenDashboard: ~73 KB

---

## 🗄️ 19. DATABASE VERIFICATION

### Check Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- [ ] users
- [ ] institutions
- [ ] services
- [ ] service_requirements
- [ ] queue_tickets
- [ ] applications
- [ ] maintenance_reports
- [ ] maintenance_tasks
- [ ] maintenance_attachments
- [ ] feedback
- [ ] announcements
- [ ] notifications
- [ ] audit_logs

### Check Seed Data
```sql
-- Check institutions
SELECT COUNT(*) FROM institutions; -- Should be 12

-- Check users
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check services
SELECT COUNT(*) FROM services;
```

---

## 🔒 20. SECURITY CHECKS

### Authentication
- [ ] JWT tokens expire correctly
- [ ] Refresh tokens work (if implemented)
- [ ] Invalid tokens rejected
- [ ] Password hashing works (bcrypt)

### Authorization
- [ ] Role-based access control works
- [ ] Users cannot access other roles' endpoints
- [ ] Institution-scoped data filtered correctly
- [ ] RLS (Row Level Security) enabled on sensitive tables

### Input Validation
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] File upload validation works
- [ ] Form validation works

---

## 📱 21. RESPONSIVE DESIGN

### Test on Devices
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Responsive Features
- [ ] Navigation menu collapses on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Forms stack vertically on mobile
- [ ] Buttons are touch-friendly
- [ ] Text remains readable

---

## 🌍 22. LOCALIZATION

### Language Support
- [ ] English language works
- [ ] አማርኛ (Amharic) language works
- [ ] Language switcher works
- [ ] Language preference persists
- [ ] All text translates correctly

### Test Translations
- [ ] Navigation menu
- [ ] Dashboard labels
- [ ] Form labels
- [ ] Button text
- [ ] Error messages
- [ ] Success messages

---

## ⚡ 23. PERFORMANCE

### Load Times
- [ ] Home page loads < 2 seconds
- [ ] Dashboard loads < 3 seconds
- [ ] API responses < 500ms
- [ ] Images optimized
- [ ] Lazy loading works

### Caching
- [ ] Browser caching works
- [ ] Static assets cached
- [ ] API responses cached where appropriate

---

## 🐛 24. ERROR HANDLING

### Test Error Scenarios
- [ ] Network error → Shows user-friendly message
- [ ] API error → Shows error message
- [ ] Form validation error → Shows field errors
- [ ] 404 Not Found → Shows 404 page
- [ ] 500 Server Error → Shows error page
- [ ] Unauthorized access → Redirects to login

---

## ✅ 25. FINAL CHECKLIST

### Documentation
- [ ] README.md complete
- [ ] API documentation exists
- [ ] Setup instructions clear
- [ ] Environment variables documented
- [ ] Database schema documented

### Code Quality
- [ ] No console errors in browser
- [ ] No backend errors in logs
- [ ] Code formatted consistently
- [ ] No unused imports
- [ ] No TODO comments in production code

### Deployment Readiness
- [ ] .env.example provided
- [ ] Build script works
- [ ] Start script works
- [ ] Database migrations ready
- [ ] Seed data ready

### Final Tests
- [ ] Test complete workflow: Citizen submits → Employee processes → Manager reviews
- [ ] Test complete workflow: Employee reports → Manager assigns → ICT resolves
- [ ] Test complete workflow: Manager creates announcement → Citizens see it
- [ ] Test all 6 roles can login and access their dashboards
- [ ] Test all 12 institutions visible and functional

---

## 🎉 SUBMISSION CHECKLIST

- [ ] All critical bugs fixed
- [ ] All role dashboards functional
- [ ] All 12 institutions configured
- [ ] Frontend production build created
- [ ] Backend running without errors
- [ ] Database seeded with test data
- [ ] Documentation complete
- [ ] Code committed to git
- [ ] System tested end-to-end
- [ ] Ready for demonstration

---

## 📞 SUPPORT CONTACTS

- System Administrator: superadmin@mesobcenter.et
- MESOB Manager: manager@mesobcenter.et
- Technical Support: [Your contact]

---

**Last Updated**: September 4, 2026  
**Version**: 1.0.0  
**Status**: ✅ READY FOR SUBMISSION
