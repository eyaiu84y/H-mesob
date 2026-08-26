# Reports Sections Fix Needed

## Issue
Three dashboards have "Reports" or "Search Applications" sections that reference deleted mock data, causing them to not display when clicked:

### 1. InstitutionManagerDashboard
- **Section**: Reports
- **Status**: ✅ FIXED
- **Issue**: Referenced `mockApplications`, `mockQueue`, `mockMaintenanceTasks`
- **Fix Applied**: Replaced with empty states and 0 values

### 2. MesobManagerDashboard  
- **Section**: Reports AND Analytics
- **Status**: ❌ NEEDS FIX
- **Issue**: 
  - SectionReports references: `mockQueueItems`, `mockApplications`, `mockMaintenanceItems`, `mockInstitutionStats`
  - SectionAnalytics references: `mockInstitutionStats`
- **Fix Needed**: Replace all mock data references with empty states/0 values

### 3. EmployeeDashboard
- **Section**: Search Applications AND Reports
- **Status**: ❌ NEEDS CHECK
- **Issue**: Need to verify if Search Applications and Reports sections exist and work
- **Fix Needed**: Check and fix if needed

## Next Steps
1. Fix MesobManagerDashboard SectionReports and SectionAnalytics
2. Check and fix EmployeeDashboard sections
3. Run build to verify
4. Test all sections in all dashboards
