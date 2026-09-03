# Backend Services Data Analysis

## Overview
Analysis of all backend services and their shared data structures, focusing on how `institution_id` is used across the system.

---

## Core Services & Data Flow

### 1. **authService.js** - Authentication & Login
**Primary Data:**
- User authentication
- JWT token generation
- Login/logout functionality

**Key Fields Returned:**
```javascript
{
  id,
  email,
  full_name,
  phone,
  role,
  status,
  institution_id,  // ← KEY: Institution ID from users table
  created_at,
  last_login_at
}
```

**Institution Handling:**
- ✅ Returns `institution_id` in user object
- ✅ Used for role-based access control

---

### 2. **userService.js** - User Management
**Primary Data:**
- User CRUD operations
- User listing with filters

**Key Fields:**
```javascript
{
  id,
  email,
  full_name,
  phone,
  role,
  status,
  institution_id,  // ← KEY: Used for scoping
  created_at,
  last_login_at
}
```

**Institution Filtering:**
```javascript
// Institution Managers see only their institution's users
if (user.role === 'INSTITUTION_MANAGER' || user.role === 'EMPLOYEE' || user.role === 'ICT_STAFF') {
  query = query.eq('institution_id', user.institution_id);
}
```

---

### 3. **maintenanceService.js** - Maintenance Reports
**Primary Data:**
- Maintenance report creation
- Report assignment to ICT staff
- Task management

**Key Fields:**
```javascript
{
  id,
  report_number,
  title,
  description,
  institution_id,  // ← KEY: From maintenance_reports table
  institutions: {  // ← Joined data
    id,
    name_en,
    name_am
  },
  reporter: {
    id,
    full_name,
    phone
  },
  assigned_user: {
    id,
    full_name
  }
}
```

**Institution Filtering Logic:**
```javascript
// EMPLOYEE: See reports they created OR from their institution
if (currentUser.role === 'EMPLOYEE') {
  query = query.or(`reported_by.eq.${currentUser.id},institution_id.eq.${currentUser.institution_id}`);
}

// ICT_STAFF: See all reports in their institution
else if (currentUser.role === 'ICT_STAFF') {
  query = query.eq('institution_id', currentUser.institution_id);
}

// INSTITUTION_MANAGER: See all reports in their institution
else if (currentUser.role === 'INSTITUTION_MANAGER') {
  query = query.eq('institution_id', currentUser.institution_id);
}
```

---

### 4. **queueService.js** - Queue Management
**Primary Data:**
- Queue entry creation
- Queue status management
- Citizen queue tracking

**Key Fields:**
```javascript
{
  id,
  queue_number,
  citizen_id,
  institution_id,  // ← KEY: Institution for queue
  service_id,
  status,
  institutions: {  // ← Joined data
    id,
    name_en,
    name_am
  }
}
```

**Institution Filtering:**
- Queue entries filtered by `institution_id`
- Employees see only their institution's queue

---

### 5. **applicationService.js** - Application Tracking
**Primary Data:**
- Citizen applications
- Application status tracking

**Key Fields:**
```javascript
{
  id,
  application_number,
  citizen_id,
  institution_id,  // ← KEY: Target institution
  service_id,
  status,
  institutions: {
    id,
    name_en,
    name_am
  }
}
```

---

### 6. **institutionService.js** - Institution Management
**Primary Data:**
- Institution CRUD
- Institution listing

**Key Fields:**
```javascript
{
  id,              // ← UUID or INTEGER primary key
  name_en,
  name_am,
  code,            // Unique institution code (e.g., 'ET001')
  description,
  status,
  phone,
  email,
  address
}
```

---

## Critical Data Relationships

### Institution ID Flow:

```
1. User logs in (authService)
   ↓
   Returns user object with institution_id
   
2. Frontend stores user
   ↓
   user.institution_id (numeric or UUID)
   
3. Frontend transforms user (roleMapper)
   ↓
   user.institution = institution_id
   user.institution_id = institution_id
   
4. Maintenance reports created
   ↓
   Stored with institution_id in database
   
5. Frontend fetches reports (maintenanceService)
   ↓
   Backend filters by: query.eq('institution_id', currentUser.institution_id)
   
6. Frontend transforms reports (MaintenanceContext)
   ↓
   report.institutionId = institutions.id
   
7. Institution Manager filters
   ↓
   reports.filter(r => r.institutionId === userInstitution)
```

---

## Identified Issue: Institution Manager Reports

### Problem:
Institution Manager cannot see employee-submitted maintenance reports

### Data Flow Analysis:

**Backend (maintenanceService.js:216-218):**
```javascript
else if (currentUser.role === 'INSTITUTION_MANAGER') {
  query = query.eq('institution_id', currentUser.institution_id);
}
```
✅ Correctly filters by institution_id

**Frontend Transform (MaintenanceContext.jsx:line 47):**
```javascript
institutionId: backendReport.institutions?.id,
```
✅ Maps institutions.id to institutionId

**Frontend Filter (InstitutionManagerDashboard.jsx:line 198):**
```javascript
const reports = useMemo(() => {
  return (allReports || []).filter(r => r.institutionId === userInstitution)
}, [allReports, userInstitution]);
```
⚠️ Compares r.institutionId with userInstitution

**User Institution Value (InstitutionManagerDashboard.jsx:line 1290):**
```javascript
const userInstitution = user?.institution || null;
```
⚠️ Gets user.institution (from roleMapper)

**RoleMapper (roleMapper.js:line 43):**
```javascript
institution: backendUser.institution_id || backendUser.institution || null,
institution_id: backendUser.institution_id || backendUser.institution || null,
```
✅ Both set to institution_id

---

## Potential Issues:

### 1. **Type Mismatch**
- Backend `institution_id` might be INTEGER
- Frontend comparison might fail if one is string and one is number

### 2. **Null/Undefined Values**
- If `user.institution` is null or undefined
- Filter will not match any reports

### 3. **Join Data Structure**
- Backend returns `institutions.id`
- Frontend expects this to match `user.institution`

---

## Recommended Fix:

### Check Type Consistency:
```javascript
// Debug logging already added to see:
console.log('userInstitution:', userInstitution, typeof userInstitution);
console.log('r.institutionId:', r.institutionId, typeof r.institutionId);
```

### Possible Solutions:

**Option 1: Ensure numeric comparison**
```javascript
return r.institutionId === Number(userInstitution);
```

**Option 2: Ensure string comparison**
```javascript
return String(r.institutionId) === String(userInstitution);
```

**Option 3: Use user.institution_id directly**
```javascript
const userInstitution = user?.institution_id || null;
```

---

## Summary

### ✅ Working Correctly:
1. Backend filters maintenance reports by institution_id
2. Backend returns proper joined institution data
3. Frontend transforms backend data with institutionId field
4. ESLint checks pass
5. Build succeeds

### ⚠️ Needs Investigation:
1. Type of userInstitution value (string vs number)
2. Type of report.institutionId value (string vs number)
3. Whether values are actually matching

### 📋 Next Action:
**Test application and check browser console debug output** to see:
- Actual values being compared
- Data types of both values
- Why the filter isn't matching

---

Generated: $(date)
