# Mock Data Cleanup & Supabase Integration Guide

**Date:** August 20, 2026  
**Status:** Phase 1 - Complete Audit Done ✅

---

## Executive Summary

This document tracks the comprehensive removal of ALL mock/demo/fake data from the H-MESOB frontend application and integration with real Supabase backend. The project currently has **NO backend** - everything uses localStorage and in-memory mock data.

---

## Current State Analysis

### ❌ Backend Status: NOT CONFIGURED

**Critical Finding:** Supabase is NOT installed or configured
- No `@supabase/supabase-js` dependency in package.json
- No Supabase client initialization found
- No services/api directory exists
- No `.env` configuration for Supabase credentials

### 📊 Mock Data Audit Results

#### **Core Data Management Files:**

1. **`src/context/AuthContext.jsx`**
   - `DEMO_USERS` array (12 demo users with hard-coded credentials)
   - `getUsers()` / `saveUsers()` localStorage-based user management
   - Mock authentication system (no real auth)
   - **Status:** NEEDS REPLACEMENT with Supabase Auth

2. **`src/utils/sharedData.js`**
   - `MAINTENANCE_REPORTS_KEY` localStorage-based reports
   - `MAINTENANCE_TASKS_KEY` localStorage-based tasks
   - `ANNOUNCEMENTS_KEY` localStorage-based announcements
   - Functions: `getMaintenanceReports()`, `createMaintenanceReport()`, `updateMaintenanceReport()`
   - Functions: `getMaintenanceTasks()`, `createMaintenanceTask()`, `updateMaintenanceTask()`
   - Functions: `getAnnouncements()`, `createAnnouncement()`, `markAnnouncementRead()`
   - **Status:** NEEDS REPLACEMENT with Supabase queries

#### **Dashboard-Specific Mock Data:**

3. **`src/pages/dashboard/EmployeeDashboard.jsx`**
   - `mockQueue` (4 queue items)
   - `mockApplications` (4 applications)
   - Hard-coded statistics (14 in queue, 27 processed)
   - **Status:** NEEDS REPLACEMENT

4. **`src/pages/dashboard/InstitutionManagerDashboard.jsx`**
   - `mockQueue` (5 queue items)
   - `mockApplications` (5 applications)
   - `mockMaintenanceTasks` (3 tasks)
   - `mockAnnouncements` (3 announcements)
   - `mockEmployees` (3 employees)
   - **Status:** NEEDS REPLACEMENT

5. **`src/pages/dashboard/MesobManagerDashboard.jsx`**
   - `mockInstitutionStats` (12 institutions with stats)
   - `mockQueueItems` (7 queue items)
   - `mockApplications` (7 applications)
   - `mockMaintenanceItems` (5 maintenance tasks)
   - **Status:** NEEDS REPLACEMENT

6. **`src/pages/dashboard/CitizenDashboard.jsx`**
   - Hard-coded application data (7 applications in table)
   - Hard-coded statistics (2 active, 5 completed)
   - Hard-coded announcements (4 announcements)
   - **Status:** NEEDS REPLACEMENT

7. **`src/pages/dashboard/ICTStaffDashboard.jsx`**
   - Uses `getMaintenanceTasks()` from sharedData (OK pattern)
   - Uses `getAnnouncements()` from sharedData (OK pattern)
   - **Status:** WILL WORK after sharedData.js is fixed

8. **`src/pages/dashboard/SuperAdminDashboard.jsx`**
   - `mockAnnouncements` (3 system announcements)
   - `getStoredUsers()` from localStorage
   - Uses `organizationsData` (may be legitimate config)
   - **Status:** NEEDS PARTIAL REPLACEMENT

#### **Static Configuration Data (May Be Legitimate):**

9. **`src/data/organizations.js`**
   - Institution definitions with services
   - **Status:** REVIEW - May be system configuration, not mock data

10. **`src/data/services.js`**
    - Service catalog definitions
    - **Status:** REVIEW - May be system configuration, not mock data

---

## Implementation Phases

### ✅ **Phase 1: Complete Audit** (DONE)
- [x] Read all dashboard files
- [x] Document all mock data locations
- [x] Classify data types
- [x] Identify dependencies

### 🔄 **Phase 2: Supabase Setup** (IN PROGRESS)

#### Step 2.1: Install Supabase Dependency
```bash
npm install @supabase/supabase-js
```

#### Step 2.2: Configure Environment Variables
Create `.env` file:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Step 2.3: Create Supabase Client
Create `src/lib/supabaseClient.js`

#### Step 2.4: Update .gitignore
```gitignore
.env
.env.local
.env.production
```

### ⏳ **Phase 3: Database Schema Design**

#### Required Tables:
- `profiles` - User profiles
- `institutions` - Institution details
- `maintenance_reports` - Employee maintenance reports
- `maintenance_tasks` - Technician tasks
- `queue` - Service queue
- `applications` - Citizen applications
- `announcements` - System/Institution announcements
- `services` - Service catalog
- `organizations` - Institution configurations

#### Security:
- Row-Level Security (RLS) policies for all tables
- Role-based access control
- Institution-based data isolation

### ⏳ **Phase 4: Services Layer Creation**

Create API service files:
- `src/services/authService.js` - Supabase Auth
- `src/services/maintenanceService.js` - Reports & Tasks
- `src/services/institutionService.js` - Institutions
- `src/services/queueService.js` - Queue management
- `src/services/applicationService.js` - Applications
- `src/services/announcementService.js` - Announcements

### ⏳ **Phase 5: Replace Mock Data (Per Dashboard)**

**Priority Order:**
1. Employee Dashboard (simplest, good test case)
2. Institution Manager Dashboard (core functionality)
3. ICT Staff Dashboard (already uses shared data)
4. Citizen Dashboard
5. MESOB Manager Dashboard (most complex)
6. Super Admin Dashboard (system-wide)

### ⏳ **Phase 6: Testing & Validation**

**Test Cases:**
- [ ] User authentication with real credentials
- [ ] Data persistence after browser refresh
- [ ] Data isolation (institution-based)
- [ ] Role-based access control
- [ ] CRUD operations for all entities
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states

---

## Mock Data Removal Checklist

### 🔴 High Priority (Core System)
- [ ] Remove `DEMO_USERS` from AuthContext.jsx
- [ ] Replace localStorage user management
- [ ] Remove all mock data from `sharedData.js`
- [ ] Implement real Supabase authentication

### 🟡 Medium Priority (Dashboard Data)
- [ ] Replace Employee Dashboard mock data
- [ ] Replace Institution Manager Dashboard mock data
- [ ] Replace MESOB Manager Dashboard mock data
- [ ] Replace Citizen Dashboard mock data
- [ ] Replace Super Admin Dashboard mock data

### 🟢 Low Priority (Configuration)
- [ ] Review `organizations.js` - keep if config
- [ ] Review `services.js` - keep if config

---

## Technical Debt to Address

1. **No Real Authentication:** Currently using demo credentials
2. **No Data Persistence:** Everything in localStorage
3. **No Backend Validation:** All validation is client-side
4. **No Data Relationships:** No foreign keys or referential integrity
5. **No Audit Trail:** No tracking of who changed what
6. **No File Upload:** Photos stored as base64 in localStorage
7. **No Search/Filter Backend:** All filtering done client-side

---

## Security Considerations

### Current Issues:
- ❌ Passwords stored in plain text (DEMO_USERS)
- ❌ No authentication tokens
- ❌ No session management
- ❌ No API authorization
- ❌ No data encryption

### Required Security:
- ✅ Supabase Auth with JWT tokens
- ✅ Row-Level Security policies
- ✅ Secure password hashing
- ✅ Role-based access control
- ✅ Institution-based data isolation
- ✅ Audit logging

---

## File Tracking

### Files to Create:
- [ ] `src/lib/supabaseClient.js`
- [ ] `src/services/authService.js`
- [ ] `src/services/maintenanceService.js`
- [ ] `src/services/institutionService.js`
- [ ] `src/services/queueService.js`
- [ ] `src/services/applicationService.js`
- [ ] `src/services/announcementService.js`
- [ ] `.env`

### Files to Modify:
- [ ] `src/context/AuthContext.jsx` (replace DEMO_USERS)
- [ ] `src/utils/sharedData.js` (replace localStorage)
- [ ] `src/pages/dashboard/EmployeeDashboard.jsx`
- [ ] `src/pages/dashboard/InstitutionManagerDashboard.jsx`
- [ ] `src/pages/dashboard/MesobManagerDashboard.jsx`
- [ ] `src/pages/dashboard/CitizenDashboard.jsx`
- [ ] `src/pages/dashboard/ICTStaffDashboard.jsx`
- [ ] `src/pages/dashboard/SuperAdminDashboard.jsx`
- [ ] `.gitignore` (add .env)

### Files to Review (May Keep):
- [ ] `src/data/organizations.js`
- [ ] `src/data/services.js`

---

## Next Steps

**IMMEDIATE ACTION REQUIRED:**

1. **Install Supabase:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **User must provide Supabase credentials:**
   - Create Supabase project at https://supabase.com
   - Get Project URL and Anon Key
   - Provide credentials to create .env file

3. **Create Supabase client configuration**

4. **Design and implement database schema**

5. **Build services layer**

6. **Start replacing dashboard mock data**

---

## Success Criteria

✅ **Complete when:**
- [ ] No mock data in any dashboard
- [ ] All data persists in Supabase
- [ ] Real authentication working
- [ ] All CRUD operations functional
- [ ] Loading/error states implemented
- [ ] Data isolation working (institution-based)
- [ ] RBAC enforced via RLS policies
- [ ] All tests passing
- [ ] Documentation updated

---

**Last Updated:** August 20, 2026  
**Next Review:** After Supabase installation
