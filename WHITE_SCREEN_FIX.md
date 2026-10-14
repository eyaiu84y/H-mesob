# White Screen Bug Fix

## Problem
When clicking on a service in the citizen dashboard, the page displayed a white screen.

## Root Cause
The service detail view was still referencing mock data field names instead of the actual backend data structure:

### Mock Data Fields (OLD - INCORRECT):
- `title_en` 
- `description_en`
- `time`
- `fee`
- `docs_en` (array)
- `officialUrl`

### Backend Data Fields (NEW - CORRECT):
- `name`
- `description`
- `processing_time`
- `fee_amount`
- No docs array in basic service object
- No officialUrl field

## What Was Fixed

### 1. Service Detail View (Line ~913)
**Before:**
```javascript
<h2>{selectedService.title_en}</h2>
<p>{selectedService.description_en}</p>
<p>{selectedService.time}</p>
<p>{selectedService.fee}</p>
{selectedService.docs_en.map(...)} // This caused the crash
```

**After:**
```javascript
<h2>{selectedService.name}</h2>
<p>{selectedService.description}</p>
<p>{selectedService.processing_time || 'N/A'}</p>
<p>{selectedService.fee_amount ? `${selectedService.fee_amount} ETB` : 'Free'}</p>
// Removed docs_en.map() - replaced with generic info message
```

### 2. Application Form Header (Line ~803)
**Before:**
```javascript
<p>{selectedService.title_en} - {selectedInstitution.name_en}</p>
```

**After:**
```javascript
<p>{selectedService.name} - {selectedInstitution.name_en}</p>
```

## Files Modified
- `frontend/src/pages/dashboard/CitizenDashboard.jsx`

## How the Error Manifested
1. User clicks on a service
2. Code tries to access `selectedService.docs_en.map()`
3. `docs_en` is undefined (doesn't exist in backend data)
4. JavaScript throws error: `Cannot read property 'map' of undefined`
5. React error boundary catches it or app crashes
6. White screen displayed

## Testing
1. Navigate to Citizen Dashboard
2. Click "Apply for Service"
3. Select an institution
4. Click on any service
5. **Expected**: Service detail page displays correctly with:
   - Service name
   - Description (if available)
   - Processing time
   - Fee amount
   - Generic info message about documents
   - "Apply for this Service" button
6. **No white screen should appear**

## Additional Notes
- The backend service data structure doesn't include a document requirements array in the base service object
- Document requirements may be in a separate `service_requirements` table
- For now, showing a generic message about preparing documents
- Could enhance later by fetching requirements from `/api/services/:serviceId/requirements`
