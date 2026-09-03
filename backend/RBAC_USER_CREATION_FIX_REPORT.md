# 🔐 RBAC USER CREATION AUTHORIZATION FIX REPORT

**Date:** 2026-08-24  
**Task:** Backend user creation authorization - restrict to SUPER_ADMIN only  
**Status:** ✅ COMPLETE

---

## 📋 OBJECTIVE

Implement backend authorization so that **ONLY SUPER_ADMIN can create system users**.

### Final Authorization Rules:

| Role | Can Create Users? |
|------|-------------------|
| **SUPER_ADMIN** | ✅ YES - All 6 roles |
| **MESOB_MANAGER** | ❌ NO |
| **INSTITUTION_MANAGER** | ❌ NO |
| **EMPLOYEE** | ❌ NO |
| **ICT_STAFF** | ❌ NO |
| **CITIZEN** | ⚠️ Self-registration only (via public /signup) |

---

## 🔧 FILES CHANGED

### 1. **backend/src/routes/userRoutes.js**

**Location:** Line 31-35

**Before:**
```javascript
router.post('/', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  postUser
);
```

**After:**
```javascript
router.post('/', 
  authenticate,
  authorize('SUPER_ADMIN'),
  postUser
);
```

**Change:** Removed `'MESOB_MANAGER'` and `'INSTITUTION_MANAGER'` from authorized roles.

---

### 2. **backend/src/services/userService.js**

**Location:** Lines 133-169

**Added Authorization Check:**
```javascript
createUser = async (userData, currentUser) => {
  try {
    const { email, password, fullName, phone, role, institutionId, employeeId, nationalId } = userData;

    // Authorization: Only SUPER_ADMIN can create users
    if (currentUser.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        message: 'Only Super Admin can create users.'
      };
    }

    // ... rest of validation and creation logic
```

**Removed Redundant Check:**
```javascript
// REMOVED: Old authorization logic that allowed MESOB_MANAGER
// Authorization: Only SUPER_ADMIN and MESOB_MANAGER can create SUPER_ADMIN or MESOB_MANAGER
if ((role === 'SUPER_ADMIN' || role === 'MESOB_MANAGER') && 
    (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'MESOB_MANAGER')) {
  return {
    success: false,
    message: 'You do not have permission to create this role.'
  };
}
```

**Change:** Added SUPER_ADMIN-only check at the top of the function, removed old role-based authorization logic.

---

### 3. **backend/src/services/authService.js** (CRITICAL SECURITY FIX)

**Location:** Line 149-155

**Before:**
```javascript
registerUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'CITIZEN', institutionId } = userData;

    // Step 1: Validate email format
```

**After:**
```javascript
registerUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, phone, institutionId } = userData;
    
    // SECURITY: Public registration ALWAYS creates CITIZEN accounts
    // Ignore any role parameter sent in request body to prevent privilege escalation
    const role = 'CITIZEN';

    // Step 1: Validate email format
```

**Change:** 
- Removed `role` from destructuring
- Force `role = 'CITIZEN'` to prevent role injection attacks
- Added security comment explaining the fix

**Security Issue Fixed:** Previously, anyone could send `role: 'SUPER_ADMIN'` to the public registration endpoint and create an admin account!

---

## 🔒 SECURITY VULNERABILITIES FIXED

### 🚨 CRITICAL: Public Registration Role Injection

**Before:** Public registration accepted `role` parameter from request body
```bash
# This would have created a SUPER_ADMIN account!
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hacker@evil.com",
    "password": "password123",
    "role": "SUPER_ADMIN"
  }'
```

**After:** Public registration forces `role = 'CITIZEN'`, ignoring any role parameter
```bash
# Now this creates a CITIZEN account (role parameter ignored)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "SUPER_ADMIN"  # ← IGNORED
  }'
```

---

## ✅ FUNCTIONS CHANGED

### 1. **createUser()** - `backend/src/services/userService.js`
- Added SUPER_ADMIN authorization check
- Removed old MESOB_MANAGER authorization logic
- Preserved all existing validation (email, role, institution, duplicate checks)
- Preserved password hashing
- Preserved audit logging

### 2. **registerUser()** - `backend/src/services/authService.js`
- Force role to 'CITIZEN'
- Removed role parameter from request destructuring
- Preserved all existing validation (email format, password strength, duplicate checks)
- Preserved token generation
- Preserved session creation

---

## 🧪 TESTING INSTRUCTIONS

### Prerequisites:
1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Ensure seed users exist in database (run migrations if needed)

### Run Authorization Tests:

```bash
cd backend
bash test-user-creation-rbac.sh
```

### Expected Test Results:

| Role | Test | Expected Result |
|------|------|----------------|
| SUPER_ADMIN | Create EMPLOYEE | ✅ ALLOWED - User created successfully |
| MESOB_MANAGER | Create EMPLOYEE | ✅ FORBIDDEN - "You do not have permission to access this resource" |
| INSTITUTION_MANAGER | Create EMPLOYEE | ✅ FORBIDDEN - "You do not have permission to access this resource" |
| EMPLOYEE | Create EMPLOYEE | ✅ FORBIDDEN - "You do not have permission to access this resource" |
| ICT_STAFF | Create EMPLOYEE | ✅ FORBIDDEN - "You do not have permission to access this resource" |
| CITIZEN | Create EMPLOYEE | ✅ FORBIDDEN - "You do not have permission to access this resource" |

---

## 📊 AUTHORIZATION LAYERS

The fix implements **defense in depth** with multiple authorization layers:

### Layer 1: Route Middleware
```javascript
authorize('SUPER_ADMIN')
```
- Rejects requests from non-SUPER_ADMIN users at the route level
- Returns HTTP 403 Forbidden
- Message: "You do not have permission to access this resource"

### Layer 2: Service Function
```javascript
if (currentUser.role !== 'SUPER_ADMIN') {
  return { success: false, message: 'Only Super Admin can create users.' };
}
```
- Double-checks authorization in the service layer
- Prevents direct service calls from bypassing route middleware
- Returns structured error response

---

## 🔐 PRESERVED FEATURES

### ✅ Authentication System
- JWT token generation/verification unchanged
- Session management unchanged
- Login/logout flows unchanged

### ✅ RBAC Architecture
- Role definitions unchanged (6 roles preserved)
- Role-based route protection unchanged
- RequireAuth middleware unchanged

### ✅ User Creation Validation
- Email format validation ✓
- Duplicate email check ✓
- Role validation (6 valid roles) ✓
- Institution requirement for institutional roles ✓
- Employee ID requirement for institutional roles ✓
- Password hashing (bcrypt) ✓
- Status handling (ACTIVE by default) ✓

### ✅ Public Citizen Registration
- Public `/api/auth/register` endpoint still works
- Citizens can self-register
- Role automatically forced to CITIZEN
- No authentication required for signup

### ✅ Audit Logging
- User creation events still logged
- Audit trail preserved

---

## 🚫 UNCHANGED FEATURES (AS REQUESTED)

- ✅ Frontend UI (no modifications)
- ✅ Frontend dashboards (no modifications)
- ✅ Maintenance system
- ✅ Queue management
- ✅ Applications
- ✅ Feedback
- ✅ Announcements
- ✅ Notifications
- ✅ Telegram bot
- ✅ Institution CRUD
- ✅ Service catalogue
- ✅ Database schema (no migrations required)

---

## 📝 MANUAL TESTING GUIDE

### Test 1: SUPER_ADMIN Can Create Users ✅

```bash
# 1. Login as SUPER_ADMIN
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@mesobcenter.et",
    "password": "SuperAdmin@2026"
  }'

# 2. Extract token from response: "accessToken": "..."

# 3. Create a user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "newemployee@test.com",
    "password": "TempPassword123!",
    "fullName": "New Employee",
    "phone": "+251911223344",
    "role": "EMPLOYEE",
    "institutionId": "CBE",
    "employeeId": "EMP001"
  }'

# Expected: HTTP 201 Created
# Response: { "success": true, "message": "User created successfully", "data": {...} }
```

---

### Test 2: INSTITUTION_MANAGER Cannot Create Users ✅

```bash
# 1. Login as INSTITUTION_MANAGER
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inst.manager@mesobcenter.et",
    "password": "InstManager@2026"
  }'

# 2. Extract token

# 3. Attempt to create a user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "staffmember@test.com",
    "password": "TempPassword123!",
    "fullName": "Staff Member",
    "phone": "+251911223344",
    "role": "EMPLOYEE",
    "institutionId": "Fayda",
    "employeeId": "EMP002"
  }'

# Expected: HTTP 403 Forbidden
# Response: {
#   "success": false,
#   "message": "You do not have permission to access this resource.",
#   "requiredRole": ["SUPER_ADMIN"],
#   "yourRole": "INSTITUTION_MANAGER"
# }
```

---

### Test 3: Public Citizen Registration Still Works ✅

```bash
# No authentication required
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newcitizen@example.com",
    "password": "SecurePass123!",
    "firstName": "Abebe",
    "lastName": "Kebede",
    "phone": "+251911556677"
  }'

# Expected: HTTP 201 Created
# Response: {
#   "success": true,
#   "message": "Registration successful",
#   "data": {
#     "user": { "role": "CITIZEN", ... },
#     "accessToken": "...",
#     "refreshToken": "..."
#   }
# }
```

---

### Test 4: Role Injection Attack Prevented ✅

```bash
# Attempt to register as SUPER_ADMIN via public endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hacker@evil.com",
    "password": "HackerPass123!",
    "firstName": "Hacker",
    "lastName": "Person",
    "role": "SUPER_ADMIN"
  }'

# Expected: HTTP 201 Created (but role forced to CITIZEN!)
# Response: {
#   "success": true,
#   "message": "Registration successful",
#   "data": {
#     "user": { "role": "CITIZEN", ... }  # ← Role is CITIZEN, not SUPER_ADMIN!
#   }
# }
```

---

## 📈 IMPACT ANALYSIS

### Frontend Impact:
- **No changes required** to frontend code
- Institution Manager dashboard "Add Staff" button will now fail when clicked
- Frontend should show proper error message from backend
- Future frontend fix: Remove or disable "Add Staff" button for Institution Managers

### Backend Impact:
- ✅ All existing SUPER_ADMIN user creation flows work
- ❌ MESOB_MANAGER can no longer create users (blocked at route level)
- ❌ INSTITUTION_MANAGER can no longer create staff (blocked at route level)
- ✅ Public citizen registration still works
- ✅ No database schema changes required
- ✅ No migration required

### API Breaking Changes:
- **POST /api/users** now requires SUPER_ADMIN role
- Previously authorized roles (MESOB_MANAGER, INSTITUTION_MANAGER) will receive HTTP 403

---

## 🔍 CODE REVIEW CHECKLIST

- [x] Route authorization updated to SUPER_ADMIN only
- [x] Service function has authorization check
- [x] Public registration forces CITIZEN role
- [x] Role injection vulnerability fixed
- [x] Existing validation preserved
- [x] Password hashing preserved
- [x] Audit logging preserved
- [x] Authentication system unchanged
- [x] RBAC architecture unchanged
- [x] No frontend changes
- [x] No database schema changes
- [x] No other backend features modified

---

## 🎯 SUCCESS CRITERIA

✅ **SUPER_ADMIN** can create all 6 roles  
✅ **MESOB_MANAGER** receives HTTP 403 when attempting to create users  
✅ **INSTITUTION_MANAGER** receives HTTP 403 when attempting to create users  
✅ **EMPLOYEE** receives HTTP 403 when attempting to create users  
✅ **ICT_STAFF** receives HTTP 403 when attempting to create users  
✅ **CITIZEN** receives HTTP 403 when attempting to create users  
✅ Public citizen self-registration still works  
✅ Role injection attack prevented  

---

## 🚀 DEPLOYMENT NOTES

### To Deploy This Fix:

1. **Pull changes** from repository
2. **No database migration required**
3. **Restart backend server** (to load new code)
4. **Test authorization** using the test script
5. **Monitor** for any authorization errors in logs

### Rollback Procedure (if needed):

1. Revert 3 files:
   - `backend/src/routes/userRoutes.js`
   - `backend/src/services/userService.js`
   - `backend/src/services/authService.js`
2. Restart backend server

---

## 📞 SUPPORT

If Institution Managers report they cannot create staff:
- ✅ This is expected behavior
- ✅ Only SUPER_ADMIN can now create users
- ✅ Inform them to contact SUPER_ADMIN for user creation

If public citizen registration fails:
- ❌ This should NOT happen
- Check server logs
- Verify `/api/auth/register` endpoint is accessible
- Verify role is forced to 'CITIZEN'

---

## 📄 SUMMARY

**Files Modified:** 3  
**Security Issues Fixed:** 1 critical (role injection)  
**Authorization Layers:** 2 (route + service)  
**Breaking Changes:** POST /api/users now SUPER_ADMIN only  
**Database Changes:** None  
**Frontend Changes:** None (backend-only fix)  

**Result:** ✅ Backend successfully restricts user creation to SUPER_ADMIN only, with public CITIZEN self-registration preserved and role injection vulnerability fixed.

---

**End of Report**
