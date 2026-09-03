# Complete Error Audit & Fix Plan

**Status:** Phase 1-2 Complete, Phase 3 In Progress  
**Build Status:** ✅ SUCCESS (frontend compiles)  
**Lint Status:** ❌ 62 errors, 4 warnings (fixing in progress)

---

## FIXES APPLIED SO FAR

### ✅ Fix #1: Added organizationsData Import
**Files:**
- [x] MesobManagerDashboard.jsx - Added import
- [x] SuperAdminDashboard.jsx - Added import, removed unused imports

**Impact:** Fixes 18 "organizationsData is not defined" errors

---

## REMAINING CRITICAL FIXES (In Order)

### 🔴 Priority 1: Institution Management Functions (SuperAdminDashboard)

**Problem:** Functions not defined:
- `updateInstitution()` - lines 954, 1014
- `getInstitutions()` - lines 956, 968
- `createInstitution()` - lines 966
- `deleteInstitution()` - lines 1046

**Investigation:**
1. Check if ServiceContext provides institution methods
2. Check if API utility has institution endpoints
3. If missing, implement using backend API:
   - `GET /api/institutions`
   - `POST /api/institutions`
   - `PUT /api/institutions/:id`
   - `DELETE /api/institutions/:id`

**Fix Pattern:**
```javascript
// In SuperAdminDashboard.jsx

// Use backend institutions from ServiceContext
const { institutions: backendInstitutions } = useServices();

// Create API functions
async function getInstitutions() {
  // Already available from ServiceContext
  return backendInstitutions;
}

async function createInstitution(data) {
  const response = await api.post('/institutions', data);
  return response;
}

async function updateInstitution(id, data) {
  const response = await api.put(`/institutions/${id}`, data);
  return response;
}

async function deleteInstitution(id) {
  const response = await api.delete(`/institutions/${id}`);
  return response;
}
```

---

### 🔴 Priority 2: getMaintenanceTasks (MesobManagerDashboard)

**Problem:** `getMaintenanceTasks` not defined (line 329)

**Investigation:**
1. Check MaintenanceContext for this method
2. Check if it should be `getMaintenanceReports()` instead
3. Verify backend endpoint exists

**Fix:**
```javascript
// Option A: Use from MaintenanceContext
const { getMaintenanceTasks } = useMaintenance();

// Option B: If method doesn't exist, use correct method
const { maintenanceReports } = useMaintenance();
// Then reference maintenanceReports directly
```

---

### 🟡 Priority 3: Fix Function Hoisting (React Best Practices)

**Files:**
- InstitutionFeedback.jsx
- MesobFeedbackOverview.jsx

**Problem:** Functions called in useEffect before declaration

**Fix Pattern:**
```javascript
// BEFORE (causes error):
useEffect(() => {
  fetchFeedback(); // ❌ Called before declaration
  fetchStats();
}, [filters]);

async function fetchFeedback() { ... }
async function fetchStats() { ... }

// AFTER (Option A - Move declarations up):
async function fetchFeedback() { ... }
async function fetchStats() { ... }

useEffect(() => {
  fetchFeedback(); // ✅ OK
  fetchStats();
}, [filters]);

// AFTER (Option B - useCallback):
const fetchFeedback = useCallback(async () => {
  // ... implementation
}, []);

const fetchStats = useCallback(async () => {
  // ... implementation
}, []);

useEffect(() => {
  fetchFeedback();
  fetchStats();
}, [fetchFeedback, fetchStats, filters]);
```

**Recommended:** Option A (simpler)

---

### 🟡 Priority 4: setState in useEffect (SuperAdminDashboard line 783)

**Problem:** ESLint flags direct setState in useEffect

**Current Code:**
```javascript
useEffect(() => {
  setInstitutions(backendInstitutions || []);
}, [backendInstitutions]);
```

**Analysis:** This pattern is actually OK - syncing external state. Two options:

**Option A (Recommended):** Add eslint-disable with comment
```javascript
useEffect(() => {
  // Sync local state with backend institutions from context
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setInstitutions(backendInstitutions || []);
}, [backendInstitutions]);
```

**Option B:** Restructure to avoid local state if not needed
```javascript
// Just use backendInstitutions directly instead of local state
// Remove setInstitutions state if possible
```

---

### 🟢 Priority 5: Cleanup Unused Imports/Variables

**Files to Clean:**

1. **EmployeeQueueManagement.jsx line 59:**
```javascript
// Remove unused 'error' variable
```

2. **MesobManagerDashboard.jsx:**
```javascript
// Line 619: Remove unused 'user' parameter
// Already fixed: removed useNotifications import
```

3. **SuperAdminDashboard.jsx:**
```javascript
// Line 767: Remove unused isSubmitting, setIsSubmitting
const [isSubmitting, setIsSubmitting] = useState(false); // ❌ Remove this line
// Already fixed: removed useNotifications, api imports
```

---

## VERIFICATION STEPS AFTER FIXES

### Step 1: Run Lint Again
```bash
cd frontend
npm run lint
```
Expected: 0 errors, 0 warnings

### Step 2: Run Build
```bash
npm run build
```
Expected: SUCCESS

### Step 3: Test Runtime - All Dashboards
```bash
npm run dev
```

Test each role:
1. Super Admin - Test Institution Management CRUD
2. MESOB Manager - Verify organizationsData displays, check maintenance tasks
3. Institution Manager - Check feedback component loads
4. Employee - Basic functionality
5. ICT Staff - Basic functionality
6. Citizen - Check feedback component loads

### Step 4: Check Browser Console
- Open F12 Developer Tools
- Navigate each dashboard
- Verify NO errors in console

---

## BACKEND AUDIT PLAN (After Frontend Fixes)

### Part 1: Verify Backend Starts
```bash
cd backend
npm start
```
Expected: Server running on port 5000

### Part 2: Run API Tests
```bash
bash test-all-api.sh
```

### Part 3: Run RBAC Tests
```bash
node test-auth-rbac-complete.js
```

### Part 4: Verify Database Schema
Check actual Supabase schema:
1. Services table columns
2. Applications table columns  
3. Queue entries foreign keys
4. Institutions table
5. Users table with institution_id

### Part 5: Verify 37+ Services
```bash
node verify-catalogue.js
```

### Part 6: Search for Mock Data
```bash
# Search frontend
grep -r "mockEmployees" frontend/src/
grep -r "mockUsers" frontend/src/
grep -r "mockData" frontend/src/
grep -r "mesob_users" frontend/src/
grep -r "mesob_institutions" frontend/src/

# Search backend
grep -r "mock" backend/src/
```

### Part 7: Search for TODOs/FIXMEs
```bash
grep -r "TODO" frontend/src/
grep -r "FIXME" frontend/src/
grep -r "TODO" backend/src/
grep -r "FIXME" backend/src/
```

### Part 8: Test Telegram Compatibility
1. Verify bot files exist
2. Check bot doesn't duplicate business logic
3. Verify bot uses existing backend services
4. Test bot credentials configured

---

## SYSTEMATIC FIX PROCESS

For each fix:
1. ✅ Identify root cause
2. ✅ Document the fix
3. ✅ Apply the fix
4. ✅ Run lint to verify
5. ✅ Run build to verify
6. ✅ Test affected component
7. ✅ Update this document

---

## FILES MODIFIED SO FAR

### Frontend:
1. ✅ MesobManagerDashboard.jsx - Added organizationsData import, removed unused import
2. ✅ SuperAdminDashboard.jsx - Added organizationsData import, removed unused imports

### Backend:
- None yet

---

## ESTIMATED COMPLETION TIME

- ✅ Phase 1-2: Complete (1 hour)
- 🔄 Phase 3: In Progress - Critical Fixes (30 min remaining)
- ⏳ Phase 4-5: React Best Practices & Cleanup (45 min)
- ⏳ Phase 6-10: Backend Audit (2-3 hours)
- ⏳ Phase 11-23: Feature Testing (3-4 hours)
- ⏳ Phase 24-27: Final Build, Regression, Report (2 hours)

**Total Remaining:** ~8-10 hours

---

## NEXT IMMEDIATE ACTION

1. Fix institution management functions in SuperAdminDashboard
2. Fix getMaintenanceTasks in MesobManagerDashboard
3. Fix function hoisting in feedback components
4. Run lint - verify 0 errors
5. Test all dashboards
6. Continue with backend audit

---

**This document serves as the master plan for completing all 27 parts of the audit**
