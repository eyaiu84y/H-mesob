# STEP 1: Institution Manager Report Visibility Fix

## ROOT CAUSE ANALYSIS

### The Problem Flow:

1. **Employee Submits Report** ✅
   - Report saved with `institution_id` (UUID from users.institution_id)
   
2. **Institution Manager Fetches Reports**
   - Backend query: `query.eq('institution_id', currentUser.institution_id)` ✅
   - Backend returns: `institutions.id` (UUID) in joined data ✅
   
3. **Frontend Transforms Report**
   - Maps: `institutionId: backendReport.institutions?.id` ✅
   
4. **Frontend Filter** ❌ **FAILS HERE**
   - User: `user.institution` (UUID string)
   - Report: `report.institutionId` (UUID from institutions.id)
   - Comparison: `r.institutionId === userInstitution`
   
### ROOT CAUSE:

**The comparison should work BUT there's a subtle issue:**

Looking at the InstitutionManagerDashboard, `userInstitution` comes from `user?.institution`.

In roleMapper.js:
```javascript
institution: backendUser.institution_id || backendUser.institution || null,
```

So `user.institution` = the UUID from `currentUser.institution_id`.

The problem is likely that:
1. Both are UUIDs (strings)
2. Both should match
3. **BUT** the filter is correct

Wait... let me check if the issue is that the MaintenanceContext isn't refreshing after submission!

### ACTUAL ROOT CAUSE:

After reviewing the code, I believe the issue is **NOT** in the filter logic itself, but rather:

**The MaintenanceContext doesn't automatically refetch after a report is created!**

Looking at MaintenanceContext.jsx `createReport` function (lines 113-145), after creating a report:
1. It adds the new report to local state
2. It calls `fetchReports()` to refresh

BUT the `fetchReports()` uses `useCallback` with no dependencies, so it won't trigger a re-fetch for Institution Manager who is in a different session!

The Institution Manager needs to **manually refresh** or the page needs to **poll** for updates.

However, looking more carefully, when Institution Manager loads the page, the `useEffect` should fetch all reports for their institution.

Let me trace this more carefully...

Actually, re-reading the code at line 89-111 in MaintenanceContext.jsx:
```javascript
useEffect(() => {
  let mounted = true;
  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/maintenance/reports');
      if (mounted) {
        const transformed = (response.data.data || []).map(transformReport);
        setReports(transformed);
      }
```

This looks correct!

So the REAL issue must be in the filter comparison.

Let me check: are we comparing UUID strings correctly?

## THE REAL ROOT CAUSE:

After thorough analysis, I believe the issue is:

**The DEBUG logs will tell us**, but my hypothesis is:

`user.institution` is set but `report.institutionId` might be undefined or null if `backendReport.institutions` is null or undefined.

Why would `backendReport.institutions` be null?
- If the join fails
- If institution_id in maintenance_reports doesn't match an existing institution

This needs to be verified with actual data.

## FIX STRATEGY:

1. Add null checks in the filter
2. Ensure the comparison handles UUID strings properly
3. Add logging to understand what's happening

