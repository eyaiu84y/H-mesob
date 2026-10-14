# Institution Manager Dashboard Reports Fix

## Problem
The Reports section in Institution Manager Dashboard showed a placeholder message:
> "No report data available yet. Reports will be generated when queue, applications, and maintenance data is available"

Even though there WAS actual data available (Maintenance Completed: 6).

## Root Cause
The maintenance task summary table had a **hardcoded empty state** - it always showed the placeholder regardless of actual data.

## Solution
Replaced the hardcoded placeholder with **dynamic maintenance report table** that:
1. Checks if maintenance reports exist
2. Displays actual report data in a table
3. Shows proper empty state only when NO data exists

## Changes Made

### Before ❌
```jsx
<tbody>
  <tr>
    <td colSpan={6} className="text-center text-gray-400 py-8">
      <p className="font-medium text-gray-500">No report data available yet</p>
      <p className="text-sm text-gray-400 mt-1">Reports will be generated when...</p>
    </td>
  </tr>
</tbody>
```

### After ✅
```jsx
<tbody>
  {!maintenanceReports || maintenanceReports.length === 0 ? (
    <tr>
      <td colSpan={6}>No maintenance reports yet</td>
    </tr>
  ) : (
    maintenanceReports.slice(0, 10).map(report => (
      <tr key={report.id}>
        <td>{report.reportNumber}</td>
        <td>{report.problemType}</td>
        <td><span className="badge">{report.priority}</span></td>
        <td>{report.assignedTo || 'Unassigned'}</td>
        <td><span className="badge">{report.status}</span></td>
        <td>{report.date}</td>
      </tr>
    ))
  )}
</tbody>
```

## Features Now Working

### ✅ Top Statistics Cards
- Queue Completed Today (from real data)
- Active Queue (from real data)  
- Maintenance Completed (from real data)

### ✅ Application Status Breakdown
- Completed applications count
- Pending applications count
- In Progress applications count

### ✅ Maintenance Task Summary Table
- Report Number
- Problem Type
- Priority (with color-coded badges)
- Assigned To (shows "Unassigned" if not assigned)
- Status (with color-coded badges)
- Submitted Date

## Color-Coded Badges

**Priority:**
- 🔴 CRITICAL - Red badge
- 🟠 HIGH - Orange badge
- 🔵 NORMAL/LOW - Blue badge

**Status:**
- 🟢 Completed - Green badge
- 🔵 In Progress - Blue badge
- 🟣 Assigned - Purple badge
- 🟡 Pending/Submitted - Amber badge

## Data Source
All data comes from contexts already connected:
- `useQueue()` - Queue statistics
- `useMaintenance()` - Maintenance reports
- `useApplications()` - Application data
- `useAuth()` - User institution ID for filtering

## Institution Filtering
✅ All data automatically filtered by institution_id:
- Only shows maintenance reports for manager's institution
- Only shows applications for manager's institution
- Only shows queue entries for manager's institution

## Display Limits
- Maintenance table shows **up to 10 most recent reports**
- Can be expanded later to show pagination or "View All"

---

**Date:** October 10, 2026  
**Status:** ✅ Fixed and Displaying Real Data  
**Impact:** Institution Managers can now see their maintenance reports immediately
