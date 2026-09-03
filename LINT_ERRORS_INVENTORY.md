# Frontend Lint Errors Inventory

**Date:** 2026-08-31  
**Total Errors:** 62 errors, 4 warnings  
**Status:** REQUIRES FIXING

---

## ERROR SUMMARY

### 1. EmployeeQueueManagement.jsx
- **Line 59:** Unused variable `error`

### 2. InstitutionFeedback.jsx  
- **Line 28:** `fetchFeedback` accessed before declaration (react-hooks/immutability)
- **Line 29:** `fetchStats` accessed before declaration (react-hooks/immutability)
- **Line 30:** Missing dependency in useEffect (react-hooks/exhaustive-deps)

### 3. MesobFeedbackOverview.jsx
- **Line 28:** `fetchFeedback` accessed before declaration (react-hooks/immutability)
- **Line 29:** `fetchStats` accessed before declaration (react-hooks/immutability)
- **Line 30:** Missing dependency in useEffect (react-hooks/exhaustive-deps)

### 4. CitizenDashboard.jsx
- **Lines 1119-1120:** Missing dependency in useEffect (react-hooks/exhaustive-deps)

### 5. MesobManagerDashboard.jsx
- **Line 3:** Unused import `useNotifications`
- **Line 96:** `organizationsData` is not defined (no-undef)
- **Line 170:** `organizationsData` is not defined
- **Line 222:** `organizationsData` is not defined
- **Line 329:** `getMaintenanceTasks` is not defined
- **Line 515:** `organizationsData` is not defined
- **Line 517:** `organizationsData` is not defined
- **Line 525:** `organizationsData` is not defined
- **Line 551:** `organizationsData` is not defined
- **Line 619:** Unused parameter `user`

### 6. SuperAdminDashboard.jsx
- **Line 3:** Unused import `useNotifications`
- **Line 6:** Unused import `api`
- **Line 767:** Unused variables `isSubmitting`, `setIsSubmitting`
- **Line 783:** setState in effect (react-hooks/set-state-in-effect)
- **Line 954:** `updateInstitution` is not defined
- **Line 956:** `getInstitutions` is not defined
- **Line 958:** `organizationsData` is not defined
- **Line 966:** `createInstitution` is not defined
- **Line 968:** `getInstitutions` is not defined
- **Line 970:** `organizationsData` is not defined
- **Line 1014:** `updateInstitution` is not defined
- **Line 1046:** `deleteInstitution` is not defined
- **Line 1650:** `organizationsData` is not defined
- **Line 1651:** `organizationsData` is not defined
- **Line 1659:** `organizationsData` is not defined
- **Line 1702:** `organizationsData` is not defined
- **Line 1703:** `organizationsData` is not defined
- **Line 1726:** `organizationsData` is not defined

---

## CRITICAL ISSUES IDENTIFIED

### Issue #1: organizationsData Not Imported
**Impact:** HIGH - Multiple dashboards reference undefined variable  
**Affected Files:**
- MesobManagerDashboard.jsx (8 instances)
- SuperAdminDashboard.jsx (10 instances)

**Root Cause:** Missing import statement  
**Fix:** Add `import { organizationsData } from '../../data/organizations';`

### Issue #2: Feedback Components - Function Hoisting
**Impact:** MEDIUM - React hooks immutability violation  
**Affected Files:**
- InstitutionFeedback.jsx
- MesobFeedbackOverview.jsx

**Root Cause:** useEffect calls functions declared below it  
**Fix:** Either:
- Option A: Move function declarations above useEffect
- Option B: Wrap functions in useCallback
- Option C: Add functions to dependency array (with useCallback)

### Issue #3: Institution Management Functions Not Defined
**Impact:** HIGH - Institution CRUD will fail  
**Affected File:** SuperAdminDashboard.jsx

**Root Cause:** Missing context or API functions  
**Functions Needed:**
- updateInstitution
- getInstitutions
- createInstitution
- deleteInstitution

**Fix:** Check if these should come from context or API utility

### Issue #4: Unused Imports/Variables
**Impact:** LOW - Code quality issue  
**Fix:** Remove unused imports and variables

---

## FIX PRIORITY

### Priority 1 (Breaks Functionality):
1. organizationsData imports
2. Institution management functions
3. getMaintenanceTasks undefined

### Priority 2 (React Best Practices):
4. Function hoisting in feedback components
5. setState in effect (SuperAdminDashboard)

### Priority 3 (Code Cleanup):
6. Unused imports
7. Unused variables
8. Missing dependencies in useEffect

---

## NEXT STEPS

1. Fix Priority 1 errors (breaks functionality)
2. Run lint again to verify fixes
3. Fix Priority 2 errors (React best practices)
4. Fix Priority 3 errors (cleanup)
5. Ensure build still succeeds
6. Test affected components

---

**Note:** Build succeeds despite lint errors, but these must be fixed for code quality and to prevent runtime issues.
