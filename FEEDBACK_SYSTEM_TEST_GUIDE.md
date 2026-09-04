# Feedback System - Complete Testing Guide

## 🎯 Purpose
This guide helps you test the complete feedback system to ensure all features work correctly before pushing to GitHub.

---

## ✅ Prerequisites

### 1. Backend Running
```bash
cd backend
npm run dev
```
Backend should be running on: http://localhost:5000

### 2. Frontend Running
```bash
cd frontend
npm run dev
```
Frontend should be running on: http://localhost:5173

### 3. Database Ready
- Supabase connection active
- All migrations applied
- Test users seeded

---

## 🧪 Test Scenario 1: Citizen - Queue Feedback

### Step 1: Login as Citizen
1. Navigate to http://localhost:5173
2. Click "Login"
3. Use citizen credentials:
   - Email: `citizen@test.com` (or your test citizen email)
   - Password: your test password
4. Should redirect to Citizen Dashboard

### Step 2: Join Queue
1. In Citizen Dashboard, click "My Queue" section
2. Click "Join Queue" button
3. Select an institution (e.g., "Hawassa City Administration")
4. Select a service (e.g., "ID Card Issuance")
5. Click "Get Token"
6. You should see your token number (e.g., #A042)

### Step 3: Simulate Queue Completion
**Option A - Via Employee Dashboard**:
1. Open new browser tab/window (incognito recommended)
2. Login as Employee for same institution
3. Go to Queue Management
4. Call your token
5. Complete the service

**Option B - Directly in Database** (for testing):
```sql
UPDATE queue_entries 
SET status = 'completed', 
    completed_at = NOW()
WHERE id = 'YOUR_QUEUE_ENTRY_ID';
```

### Step 4: View Feedback UI
1. Return to Citizen Dashboard
2. Refresh page or navigate to "My Queue"
3. Click on your completed queue entry
4. **✅ VERIFY**: Feedback rating UI should appear below queue details
5. **✅ VERIFY**: Shows "Rate Your Experience" heading

### Step 5: Submit Feedback
1. Click on stars to select rating (try 4 stars)
2. **✅ VERIFY**: Stars fill as you hover
3. **✅ VERIFY**: Rating meaning shows ("Excellent")
4. Optionally add comment: "Great service, very fast!"
5. Click "Submit Rating"
6. **✅ VERIFY**: Loading state shows
7. **✅ VERIFY**: Success message appears with checkmark
8. **✅ VERIFY**: Shows "Thank You!" confirmation

### Step 6: View Feedback History
1. Navigate to "My Feedback" section
2. **✅ VERIFY**: Your submitted feedback appears in list
3. Click on the feedback card
4. **✅ VERIFY**: Full details show (rating, comment, date, service, institution)
5. **✅ VERIFY**: Stars display correctly
6. **✅ VERIFY**: Source shows "Website"

### Step 7: Test Duplicate Prevention
1. Go back to the completed queue entry
2. Try submitting feedback again
3. **✅ VERIFY**: Error message: "You have already rated this service"
4. **✅ VERIFY**: Cannot submit duplicate feedback

**✅ RESULT**: Citizen queue feedback works completely!

---

## 🧪 Test Scenario 2: Citizen - Application Feedback

### Step 1: Create Application
1. Still logged in as Citizen
2. Navigate to "Apply for Service" section
3. Select an institution
4. Select a service
5. Fill out application form
6. Submit application
7. Note the application reference number

### Step 2: Simulate Application Completion
**Via Database** (for testing):
```sql
UPDATE applications 
SET status = 'Completed', 
    updated_at = NOW()
WHERE id = 'YOUR_APPLICATION_ID';
```

### Step 3: View and Rate Application
1. Navigate to "My Applications"
2. Find your completed application
3. Click "View Details"
4. Scroll down
5. **✅ VERIFY**: "Rate This Service" section appears
6. **✅ VERIFY**: FeedbackRating component is visible
7. Select 5 stars rating
8. Add comment: "Excellent service, very helpful staff"
9. Submit feedback
10. **✅ VERIFY**: Success confirmation appears

### Step 4: Verify in Feedback History
1. Navigate to "My Feedback"
2. **✅ VERIFY**: Application feedback appears
3. **✅ VERIFY**: Shows application number
4. **✅ VERIFY**: All details correct

**✅ RESULT**: Application feedback works perfectly!

---

## 🧪 Test Scenario 3: Institution Manager Views Feedback

### Step 1: Login as Institution Manager
1. Logout from Citizen account
2. Login with Institution Manager credentials:
   - Email: `manager@hawassa.gov.et` (or your test manager)
   - Password: your test password
3. Should redirect to Institution Manager Dashboard

### Step 2: Navigate to Feedback Section
1. In sidebar, click "Service Feedback"
2. **✅ VERIFY**: Page loads without errors
3. **✅ VERIFY**: Statistics cards show:
   - Total Feedback
   - Average Rating (with star icon)
   - Excellent & Fantastic count
   - Poor Ratings count

### Step 3: Verify Statistics
1. **✅ VERIFY**: Numbers match the feedback you submitted
2. **✅ VERIFY**: Average rating calculated correctly
3. If you submitted 4-star and 5-star feedback:
   - Total should be 2 (or more if other feedback exists)
   - Average should be around 4.5
   - Excellent & Fantastic should be 2

### Step 4: View Rating Distribution Chart
1. Scroll to "Rating Distribution" section
2. **✅ VERIFY**: Bar chart appears
3. **✅ VERIFY**: Bars show correct counts for each star rating
4. **✅ VERIFY**: Percentages add up to 100%
5. **✅ VERIFY**: Colors match ratings (green=5, blue=4, etc.)

### Step 5: View Feedback List
1. Scroll to feedback list
2. **✅ VERIFY**: Your test feedback appears
3. **✅ VERIFY**: Shows:
   - Service name
   - Rating with stars
   - Comment text
   - Submission date/time
   - Source (Website)
4. **✅ VERIFY**: Cannot see feedback from other institutions

### Step 6: Test Filters
1. Select "Filter by Rating" = "5 Stars"
2. **✅ VERIFY**: List updates to show only 5-star feedback
3. Clear filters
4. Select "Filter by Source" = "Website"
5. **✅ VERIFY**: List updates correctly
6. Click "Clear Filters"
7. **✅ VERIFY**: All feedback shows again

### Step 7: Test Security (Cannot See Other Institutions)
1. Check feedback list carefully
2. **✅ VERIFY**: Only shows feedback for manager's institution
3. **✅ VERIFY**: No feedback from other institutions visible

**✅ RESULT**: Institution Manager feedback dashboard works correctly!

---

## 🧪 Test Scenario 4: MESOB Manager Views All Feedback

### Step 1: Login as MESOB Manager
1. Logout from Institution Manager
2. Login with MESOB Manager credentials:
   - Email: `mesobadmin@mesob.et` (or your test MESOB manager)
   - Password: your test password
3. Should redirect to MESOB Manager Dashboard

### Step 2: Navigate to Feedback Overview
1. In sidebar/navigation, click "Feedback Overview"
2. **✅ VERIFY**: Page loads successfully
3. **✅ VERIFY**: Shows "Service Feedback Overview" heading
4. **✅ VERIFY**: Description mentions "Monitor citizen satisfaction across all institutions"

### Step 3: Verify Overall Statistics
1. **✅ VERIFY**: Statistics cards show:
   - Total Feedback (all institutions)
   - Average Rating (system-wide)
   - Excellent+ count and percentage
   - Good/Very Good count and percentage
   - Poor count and percentage
2. **✅ VERIFY**: Numbers are aggregate of all institutions

### Step 4: View Rating Distribution
1. **✅ VERIFY**: Rating distribution chart shows system-wide data
2. **✅ VERIFY**: Includes feedback from all institutions
3. **✅ VERIFY**: Bars and percentages accurate

### Step 5: View All Feedback
1. Scroll to feedback list
2. **✅ VERIFY**: Shows feedback from MULTIPLE institutions
3. **✅ VERIFY**: Each feedback has institution name badge
4. **✅ VERIFY**: Can see your test feedback
5. **✅ VERIFY**: Can see feedback from other test institutions (if any)

### Step 6: Test Institution Filter
1. Select "Filter by Institution" dropdown
2. **✅ VERIFY**: Shows list of all institutions
3. Select "Hawassa City Administration"
4. **✅ VERIFY**: List filters to show only that institution's feedback
5. **✅ VERIFY**: Statistics update to reflect filtered data

### Step 7: Test Combined Filters
1. Keep institution filter active
2. Select "Filter by Rating" = "5 Stars"
3. **✅ VERIFY**: Shows only 5-star feedback from selected institution
4. Clear all filters
5. **✅ VERIFY**: All feedback returns

### Step 8: Compare Institutions
1. Note average rating for Institution A
2. Filter to Institution B
3. Note average rating for Institution B
4. **✅ VERIFY**: Can compare performance between institutions
5. **✅ VERIFY**: Poor-performing institutions identifiable

**✅ RESULT**: MESOB Manager feedback overview fully functional!

---

## 🧪 Test Scenario 5: Validation & Error Handling

### Test 1: Rating Validation
1. Login as Citizen
2. Try to submit feedback without selecting rating
3. **✅ VERIFY**: Error message: "Please select a rating"
4. **✅ VERIFY**: Submit button disabled until rating selected

### Test 2: Duplicate Feedback Prevention
1. Find a service you already rated
2. Try to rate it again
3. **✅ VERIFY**: Error: "You have already rated this service"
4. **✅ VERIFY**: Cannot bypass duplicate check

### Test 3: Comment Character Limit (Optional Test)
1. Try adding very long comment (>1000 characters)
2. **✅ VERIFY**: Accepts long comments (no hard limit currently)
3. Note: Character limit can be added in future enhancement

### Test 4: Network Error Handling
1. Stop backend server
2. Try to submit feedback
3. **✅ VERIFY**: Shows error message
4. **✅ VERIFY**: Doesn't crash frontend
5. Restart backend
6. Try again
7. **✅ VERIFY**: Works after backend is back

### Test 5: Authentication Errors
1. Clear localStorage (to simulate token expiration)
2. Try to view feedback
3. **✅ VERIFY**: Redirects to login or shows auth error
4. **✅ VERIFY**: Doesn't expose unauthorized data

**✅ RESULT**: Validation and error handling robust!

---

## 🧪 Test Scenario 6: Mobile Responsive (Optional)

### Test with Browser Dev Tools
1. Open browser developer tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar

### Citizen Dashboard
1. Test queue feedback on mobile
2. **✅ VERIFY**: Star rating easy to tap
3. **✅ VERIFY**: Feedback form readable
4. **✅ VERIFY**: Submit button accessible
5. **✅ VERIFY**: Success message displays well

### Manager Dashboards
1. Test Institution Manager feedback page
2. **✅ VERIFY**: Statistics cards stack vertically
3. **✅ VERIFY**: Chart remains readable
4. **✅ VERIFY**: Filters usable on mobile
5. Test MESOB Manager page
6. **✅ VERIFY**: All features accessible on mobile

**✅ RESULT**: Mobile experience acceptable!

---

## 📊 Expected Database State After Testing

### service_feedback table should contain:
```
id | citizen_id | institution_id | service_id | rating | comment | queue_entry_id | application_id | source  | created_at
---|------------|----------------|------------|--------|---------|----------------|----------------|---------|------------
1  | citizen1   | inst1          | svc1       | 4      | Great   | queue1         | null           | WEBSITE | 2026-08-24
2  | citizen1   | inst1          | svc2       | 5      | Excellent| null          | app1           | WEBSITE | 2026-08-24
```

### Key Points:
- ✅ Each feedback has `citizen_id`
- ✅ Each feedback has `institution_id` and `service_id`
- ✅ Either `queue_entry_id` OR `application_id` (not both)
- ✅ Rating is integer 1-5
- ✅ Source is 'WEBSITE'
- ✅ Timestamps populated

---

## 🐛 Troubleshooting Common Issues

### Issue: Feedback UI not showing after queue completion
**Solution**:
1. Check queue entry has `institutionId` and `serviceId` fields
2. Verify queue status is exactly 'completed' (lowercase)
3. Check browser console for errors
4. Refresh page

### Issue: "Failed to submit feedback" error
**Solution**:
1. Check backend console for detailed error
2. Verify database connection
3. Check RLS policies are applied
4. Verify JWT token is valid

### Issue: Statistics showing 0 or incorrect
**Solution**:
1. Refresh browser page
2. Check backend service calculations
3. Verify feedback actually saved in database:
   ```sql
   SELECT * FROM service_feedback WHERE institution_id = 'YOUR_INSTITUTION_ID';
   ```
4. Check for JavaScript errors in console

### Issue: Cannot see feedback as manager
**Solution**:
1. Verify user role is correct (INSTITUTION_MANAGER or MESOB_MANAGER)
2. Check `institution_id` matches for Institution Manager
3. Verify RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'service_feedback';
   ```
4. Check browser network tab for 403 errors

### Issue: Feedback list empty
**Solution**:
1. Ensure feedback was actually submitted (check database)
2. Refresh page
3. Clear filters
4. Check API endpoint is returning data (network tab)
5. Verify no JavaScript errors

---

## ✅ Final Checklist Before Push to GitHub

### Backend
- [ ] All migrations applied successfully
- [ ] RLS policies active
- [ ] Feedback routes registered
- [ ] Service functions tested
- [ ] Controller error handling in place
- [ ] No console errors in backend

### Frontend
- [ ] FeedbackContext properly provides data
- [ ] FeedbackRating component working
- [ ] Citizen dashboard shows feedback UI
- [ ] Institution Manager dashboard loads
- [ ] MESOB Manager dashboard loads
- [ ] No console errors in frontend
- [ ] No TypeScript/ESLint warnings

### Database
- [ ] service_feedback table exists
- [ ] All indexes created
- [ ] RLS policies enabled
- [ ] Constraints enforced
- [ ] Test data cleanup (optional)

### Testing
- [ ] Citizen can submit queue feedback
- [ ] Citizen can submit application feedback
- [ ] Citizen can view feedback history
- [ ] Institution Manager can view their feedback
- [ ] MESOB Manager can view all feedback
- [ ] Statistics calculate correctly
- [ ] Filters work properly
- [ ] Duplicate prevention works
- [ ] Rating validation works
- [ ] Security (RLS) enforced

### Documentation
- [ ] FEEDBACK_SYSTEM_COMPLETE.md created
- [ ] FEEDBACK_SYSTEM_FIX_SUMMARY.md created
- [ ] FEEDBACK_SYSTEM_TEST_GUIDE.md created
- [ ] Comments in code updated
- [ ] API documentation complete

---

## 🚀 Push to GitHub

Once all tests pass:

```bash
# Add all files
git add .

# Commit
git commit -m "Complete feedback system implementation

- Added queue feedback integration
- Fixed citizen feedback submission for completed services
- Institution Manager can view feedback with statistics
- MESOB Manager can view all feedback across institutions
- Rating distribution charts
- Filtering functionality
- RLS security enforced
- Duplicate prevention working
- Complete documentation added"

# Push to GitHub
git push origin main
```

---

## 📋 Test Results Template

Copy this template and fill it out:

```
## Feedback System Test Results
Date: _______________
Tester: _______________

### Citizen - Queue Feedback
- [ ] Queue join successful
- [ ] Feedback UI appears after completion
- [ ] Star rating interactive
- [ ] Comment submission works
- [ ] Success confirmation shown
- [ ] Appears in feedback history
- [ ] Duplicate prevention works

### Citizen - Application Feedback
- [ ] Application submission works
- [ ] Feedback shows for completed application
- [ ] Rating submission successful
- [ ] Appears in history

### Institution Manager
- [ ] Login successful
- [ ] Statistics display correctly
- [ ] Rating distribution accurate
- [ ] Feedback list shows
- [ ] Filters work
- [ ] Cannot see other institutions

### MESOB Manager
- [ ] Login successful
- [ ] Overall statistics show
- [ ] All feedback visible
- [ ] Institution filter works
- [ ] Can compare institutions

### Security
- [ ] RLS enforced
- [ ] Duplicate prevention works
- [ ] Rating validation works
- [ ] No unauthorized access

### Performance
- [ ] Pages load quickly (<2s)
- [ ] No console errors
- [ ] No memory leaks
- [ ] Smooth user experience

Overall Result: [ ] PASS / [ ] FAIL
Notes: _______________________________________________
_____________________________________________________
```

---

**Test completed successfully? Push to GitHub and celebrate! 🎉**
