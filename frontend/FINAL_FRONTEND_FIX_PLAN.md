# FINAL FRONTEND FIX - IMPLEMENTATION PLAN

## Date: August 22, 2026

## Inspection Complete - Issues Identified

### Critical Issues to Fix:

1. **Automatic Queue Advancement** (QueueContext.jsx line 66-104)
   - Remove 15-second setInterval that automatically advances queue
   - Keep manual callNextToken function for employee control

2. **mockEmployees** (InstitutionManagerDashboard.jsx line 20-27)
   - Replace with dynamic user loading from AuthContext
   - Filter technicians by institution

3. **Placeholder URLs** (organizations.js)
   - Construction Authority has `officialUrl: "#"`
   - Remove or mark as unavailable

4. **Notification System** (NOT IMPLEMENTED)
   - Create NotificationContext
   - Connect to maintenance workflow
   - Connect to announcements

### Files Requiring Changes:

1. **src/context/QueueContext.jsx** - Remove automatic advancement
2. **src/pages/dashboard/InstitutionManagerDashboard.jsx** - Replace mockEmployees
3. **src/data/organizations.js** - Fix placeholder URLs, verify all 12 institutions
4. **src/context/NotificationContext.jsx** - CREATE NEW FILE
5. **src/utils/sharedData.js** - Add notification functions
6. **src/App.jsx** - Add NotificationProvider

### All 12 Institutions Status:

Based on organizations.js inspection:
1. ✅ Ethiopian Electric Utility
2. ✅ Revenues Bureau
3. ✅ Ministry of Justice
4. ✅ Commercial Bank of Ethiopia
5. ✅ Ethio Telecom
6. ✅ Ethiopian Postal Service Enterprise
7. ✅ Investment Commission
8. ✅ Labor and Skills Bureau
9. ✅ Trade Bureau
10. ⚠️ Construction Authority (has placeholder URL)
11. ✅ National ID Program / Fayda
12. ❌ **MISSING - Need to verify 12th institution**

Need to verify if there are exactly 12 institutions or if one is missing.

## Implementation Order:

1. Fix QueueContext (remove auto-advancement)
2. Fix organizations.js (URLs, verify 12 institutions)
3. Create NotificationContext
4. Replace mockEmployees
5. Connect notifications to workflows
6. Test all workflows
7. Run build and lint
8. Generate final report

## Estimated Changes:
- 6-8 files to be modified
- 1 new file to be created
- No UI redesign required
- All existing functionality preserved
