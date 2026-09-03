# Feedback System - End-to-End Testing Report

## Testing Status: IN PROGRESS

This document tracks all end-to-end tests for the citizen service feedback and 5-star rating system.

## Test Environment Setup

### Prerequisites Checklist
- [ ] Database migrations run (004_create_feedback_table.sql, 005_feedback_rls_policies.sql)
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000 (or deployed)
- [ ] Telegram bot running (optional for Telegram tests)
- [ ] Test user accounts created (Citizen, Institution Manager, MESOB Manager)
- [ ] Test institution and service data available
- [ ] Test application with "Completed" status

### Environment Variables
```bash
# Backend .env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
TELEGRAM_BOT_TOKEN=your_bot_token (for Telegram tests)

# Frontend .env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Test Suite 1: Database Layer

### Test 1.1: Table Creation ✓
**Objective:** Verify `service_feedback` table exists with correct schema

```sql
-- Run in Supabase SQL Editor
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'service_feedback'
ORDER BY ordinal_position;
```

**Expected Result:**
- ✓ `id` (uuid, PK, default: gen_random_uuid())
- ✓ `citizen_id` (uuid, NOT NULL, FK to users)
- ✓ `institution_id` (uuid, NOT NULL, FK to institutions)
- ✓ `service_id` (uuid, NOT NULL, FK to services)
- ✓ `rating` (integer, NOT NULL, CHECK 1-5)
- ✓ `comment` (text, nullable)
- ✓ `application_id` (uuid, nullable, FK to applications)
- ✓ `queue_entry_id` (uuid, nullable, FK to queue_entries)
- ✓ `source` (text, NOT NULL, default 'WEBSITE')
- ✓ `created_at` (timestamptz, default now())

**Status:** [ ] PASS / [ ] FAIL

---

### Test 1.2: Rating Constraint ✓
**Objective:** Verify rating must be between 1-5

```sql
-- Should FAIL with constraint violation
INSERT INTO service_feedback (
  citizen_id, institution_id, service_id, rating
) VALUES (
  'test-user-id', 'test-inst-id', 'test-service-id', 6
);

-- Should FAIL with constraint violation
INSERT INTO service_feedback (
  citizen_id, institution_id, service_id, rating
) VALUES (
  'test-user-id', 'test-inst-id', 'test-service-id', 0
);

-- Should SUCCEED
INSERT INTO service_feedback (
  citizen_id, institution_id, service_id, rating
) VALUES (
  'test-user-id', 'test-inst-id', 'test-service-id', 3
);
```

**Expected Result:**
- ✓ Rating 6 rejected
- ✓ Rating 0 rejected
- ✓ Rating 3 accepted

**Status:** [ ] PASS / [ ] FAIL

---

### Test 1.3: Unique Constraint ✓
**Objective:** Prevent duplicate feedback per application/queue

```sql
-- First submission - should SUCCEED
INSERT INTO service_feedback (
  citizen_id, institution_id, service_id, rating, application_id
) VALUES (
  'test-user-id', 'test-inst-id', 'test-service-id', 4, 'test-app-id'
);

-- Duplicate submission - should FAIL
INSERT INTO service_feedback (
  citizen_id, institution_id, service_id, rating, application_id
) VALUES (
  'test-user-id', 'test-inst-id', 'test-service-id', 5, 'test-app-id'
);
```

**Expected Result:**
- ✓ First submission accepted
- ✓ Duplicate submission rejected with unique constraint error

**Status:** [ ] PASS / [ ] FAIL

---

### Test 1.4: RLS Policies ✓
**Objective:** Verify role-based access control

```sql
-- Test Citizen access (should see only own feedback)
SET request.jwt.claims = '{"role": "Citizen", "sub": "citizen-user-id"}';
SELECT * FROM service_feedback; -- Should return only citizen's feedback

-- Test Institution Manager access (should see only own institution)
SET request.jwt.claims = '{"role": "Institution Manager", "institution_id": "inst-1"}';
SELECT * FROM service_feedback; -- Should return only inst-1 feedback

-- Test MESOB Manager access (should see all)
SET request.jwt.claims = '{"role": "MESOB Manager"}';
SELECT * FROM service_feedback; -- Should return all feedback

-- Test unauthorized role (should see nothing)
SET request.jwt.claims = '{"role": "Employee"}';
SELECT * FROM service_feedback; -- Should return empty
```

**Expected Result:**
- ✓ Citizens see only their own feedback
- ✓ Institution Managers see only their institution's feedback
- ✓ MESOB Managers see all feedback
- ✓ Unauthorized roles see nothing

**Status:** [ ] PASS / [ ] FAIL

---

## Test Suite 2: Backend API

### Test 2.1: Submit Feedback (POST /api/feedback) ✓
**Objective:** Citizen submits feedback via API

```bash
# Test with curl
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CITIZEN_JWT_TOKEN" \
  -d '{
    "institution_id": "valid-institution-id",
    "service_id": "valid-service-id",
    "rating": 4,
    "comment": "Great service!",
    "application_id": "valid-application-id"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": "uuid",
    "rating": 4,
    "comment": "Great service!",
    "source": "WEBSITE",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Status:** [ ] PASS / [ ] FAIL

---

### Test 2.2: Duplicate Feedback Prevention ✓
**Objective:** Prevent duplicate feedback submission

```bash
# Submit same feedback twice
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CITIZEN_JWT_TOKEN" \
  -d '{
    "institution_id": "same-institution-id",
    "service_id": "same-service-id",
    "rating": 5,
    "application_id": "same-application-id"
  }'

# Second attempt should fail
```

**Expected Response (2nd attempt):**
```json
{
  "success": false,
  "message": "You have already submitted feedback for this service."
}
```

**Status:** [ ] PASS / [ ] FAIL

---

### Test 2.3: Get My Feedback (GET /api/feedback/my-feedback) ✓
**Objective:** Citizen retrieves their own feedback

```bash
curl -X GET http://localhost:5000/api/feedback/my-feedback \
  -H "Authorization: Bearer YOUR_CITIZEN_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rating": 4,
      "comment": "Great service!",
      "source": "WEBSITE",
      "institution_name": "Example Institution",
      "service_name": "Birth Certificate",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Status:** [ ] PASS / [ ] FAIL

---

### Test 2.4: Check Can Submit (GET /api/feedback/can-submit) ✓
**Objective:** Check if citizen can submit feedback for service

```bash
curl -X GET "http://localhost:5000/api/feedback/can-submit?application_id=test-app-id" \
  -H "Authorization: Bearer YOUR_CITIZEN_JWT_TOKEN"
```

**Expected Response (not submitted yet):**
```json
{
  "success": true,
  "data": {
    "canSubmit": true
  }
}
```

**Expected Response (already submitted):**
```json
{
  "success": true,
  "data": {
    "canSubmit": false
  }
}
```

**Status:** [ ] PASS / [ ] FAIL

---

### Test 2.5: Institution Manager - Get Feedback ✓
**Objective:** Manager retrieves institution feedback

```bash
curl -X GET http://localhost:5000/api/feedback/institution \
  -H "Authorization: Bearer YOUR_INSTITUTION_MANAGER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rating": 4,
      "comment": "Great service!",
      "source": "WEBSITE",
      "citizen_name": "John Doe",
      "service_name": "Birth Certificate",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Status:** [ ] PASS / [ ] FAIL

---

### Test 2.6: Institution Manager - Get Statistics ✓
**Objective:** Manager retrieves feedback statistics

```bash
curl -X GET http://localhost:5000/api/feedback/institution/stats \
  -H "Authorization: Bearer YOUR_INSTITUTION_MANAGER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalFeedback": 10,
    "averageRating": 4.2,
    "ratingDistribution": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 4,
      "5": 3
    }
  }
}
```

**Status:** [ ] PASS / [ ] FAIL

---

### Test 2.7: MESOB Manager - Get All Feedback ✓
**Objective:** MESOB Manager retrieves all feedback

```bash
curl -X GET http://localhost:5000/api/feedback \
  -H "Authorization: Bearer YOUR_MESOB_MANAGER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rating": 4,
      "source": "TELEGRAM",
      "citizen_name": "Jane Doe",
      "institution_name": "Institution A",
      "service_name": "License Renewal",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Status:** [ ] PASS / [ ] FAIL

---

### Test 2.8: MESOB Manager - Get Overall Statistics ✓
**Objective:** MESOB Manager retrieves system-wide statistics

```bash
curl -X GET http://localhost:5000/api/feedback/stats \
  -H "Authorization: Bearer YOUR_MESOB_MANAGER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalFeedback": 50,
    "averageRating": 4.1,
    "ratingDistribution": {
      "1": 2,
      "2": 5,
      "3": 10,
      "4": 18,
      "5": 15
    },
    "bySource": {
      "WEBSITE": 30,
      "TELEGRAM": 20
    }
  }
}
```

**Status:** [ ] PASS / [ ] FAIL

---

## Test Suite 3: Frontend UI

### Test 3.1: FeedbackRating Component ✓
**Objective:** Test 5-star rating UI component

**Steps:**
1. Login as Citizen
2. Navigate to CitizenDashboard → My Applications
3. Find completed application
4. Click "Rate Service" button
5. Hover over stars (should show rating meaning)
6. Click 4 stars
7. Optionally add comment
8. Click "Submit Rating"

**Expected Result:**
- ✓ Star icons display correctly
- ✓ Hover shows rating meanings (Poor, Good, Very Good, Excellent, Fantastic)
- ✓ Selected rating highlighted
- ✓ Comment textarea optional
- ✓ Success message: "Thank you for your feedback!"
- ✓ Rating button becomes "Already Rated" (disabled)

**Status:** [ ] PASS / [ ] FAIL

---

### Test 3.2: My Feedback Section ✓
**Objective:** View citizen's own feedback history

**Steps:**
1. Login as Citizen
2. Navigate to CitizenDashboard → My Feedback
3. View feedback list

**Expected Result:**
- ✓ List shows all citizen's feedback
- ✓ Each item shows: institution name, service name, rating (stars), comment, date
- ✓ Source badge visible ("Website" or "Telegram")
- ✓ Rating meanings displayed below stars

**Status:** [ ] PASS / [ ] FAIL

---

### Test 3.3: InstitutionFeedback Component ✓
**Objective:** Institution Manager views feedback dashboard

**Steps:**
1. Login as Institution Manager
2. Navigate to dashboard → Service Feedback
3. View feedback list and statistics

**Expected Result:**
- ✓ Only shows own institution's feedback
- ✓ Statistics dashboard displays:
  - Total feedback count
  - Average rating (with stars)
  - Rating distribution chart
- ✓ Feedback list shows: citizen name, service, rating, comment, source, date
- ✓ Filters work (by rating, by source, by date)
- ✓ Source badges visible ("Website"/"Telegram")

**Status:** [ ] PASS / [ ] FAIL

---

### Test 3.4: MesobFeedbackOverview Component ✓
**Objective:** MESOB Manager views system-wide feedback

**Steps:**
1. Login as MESOB Manager
2. Navigate to dashboard → Feedback Overview
3. View cross-institution feedback and statistics

**Expected Result:**
- ✓ Shows feedback from ALL institutions
- ✓ Overall statistics dashboard:
  - Total feedback count
  - Average rating
  - Rating distribution chart
  - Feedback by source (Website vs Telegram)
- ✓ Feedback list shows: citizen, institution, service, rating, source, date
- ✓ Filters work (by institution, by rating, by source)
- ✓ Can drill down to specific institution

**Status:** [ ] PASS / [ ] FAIL

---

### Test 3.5: Rating Meanings Display ✓
**Objective:** Verify exact rating meanings shown everywhere

**Expected Display:**
- ⭐ 1/5 — Poor
- ⭐⭐ 2/5 — Good
- ⭐⭐⭐ 3/5 — Very Good
- ⭐⭐⭐⭐ 4/5 — Excellent
- ⭐⭐⭐⭐⭐ 5/5 — Fantastic

**Check Locations:**
- [ ] FeedbackRating component hover tooltips
- [ ] My Feedback list
- [ ] InstitutionFeedback list
- [ ] MesobFeedbackOverview list
- [ ] Telegram bot keyboard buttons

**Status:** [ ] PASS / [ ] FAIL

---

## Test Suite 4: Telegram Bot

### Test 4.1: Test Feedback Command ✓
**Objective:** Test /testfeedback command

**Steps:**
1. Start Telegram bot: `npm run bot`
2. Open Telegram chat with bot
3. Send `/testfeedback`

**Expected Result:**
- ✓ 5-star rating keyboard appears
- ✓ Buttons show: ⭐ 1/5 — Poor through ⭐⭐⭐⭐⭐ 5/5 — Fantastic
- ✓ Message: "Rate Your Service Experience"

**Status:** [ ] PASS / [ ] FAIL

---

### Test 4.2: Rating Submission via Telegram ✓
**Objective:** Submit rating through Telegram bot

**Steps:**
1. Run `/testfeedback`
2. Click "⭐⭐⭐⭐ 4/5 — Excellent"
3. Wait for response

**Expected Result:**
- ✓ Success message appears
- ✓ Message shows: "You rated our service 4/5 Stars ⭐⭐⭐⭐"
- ✓ Subtitle: "_Excellent_"
- ✓ Text: "Your feedback helps us improve!"
- ✓ Rating is DYNAMIC (not hard-coded "3/5")

**Status:** [ ] PASS / [ ] FAIL

---

### Test 4.3: Telegram Bilingual Support ✓
**Objective:** Test Amharic language support

**Steps:**
1. Send `/start`
2. Select "🇪🇹 አማርኛ" language
3. Send `/testfeedback`
4. Select rating

**Expected Result:**
- ✓ Feedback prompt in Amharic
- ✓ Rating buttons show Amharic labels
- ✓ Success message in Amharic
- ✓ Rating still dynamic

**Status:** [ ] PASS / [ ] FAIL

---

### Test 4.4: Duplicate Prevention (Telegram) ✓
**Objective:** Prevent duplicate feedback via Telegram

**Steps:**
1. Run `/testfeedback`
2. Select rating (e.g., 3 stars)
3. Immediately run `/testfeedback` again
4. Try to select different rating

**Expected Result:**
- ✓ Second attempt shows error: "⚠️ You have already rated this service"
- ✓ No database insert on second attempt

**Status:** [ ] PASS / [ ] FAIL

---

### Test 4.5: Telegram Feedback in Dashboard ✓
**Objective:** Verify Telegram feedback appears in website dashboards

**Steps:**
1. Submit feedback via Telegram bot (4 stars)
2. Login to website as Institution Manager
3. Navigate to Service Feedback

**Expected Result:**
- ✓ Telegram feedback visible in list
- ✓ Source badge shows "Telegram"
- ✓ Rating shows 4 stars
- ✓ Statistics include Telegram feedback

**Status:** [ ] PASS / [ ] FAIL

---

### Test 4.6: Realtime Trigger (Application Completion) ✓
**Objective:** Test automatic feedback prompt on application completion

**Steps:**
1. Ensure Telegram bot running
2. Ensure test user has Telegram account linked
3. Login as Institution Employee
4. Mark test application as "Completed"
5. Check Telegram chat

**Expected Result:**
- ✓ Feedback prompt appears automatically in Telegram
- ✓ Shows correct institution and service names
- ✓ 5-star keyboard appears
- ✓ Citizen can submit rating

**Status:** [ ] PASS / [ ] FAIL

---

## Test Suite 5: Integration Tests

### Test 5.1: Website to Database to Dashboard ✓
**Objective:** End-to-end flow from website submission to dashboard view

**Steps:**
1. Login as Citizen
2. Submit feedback (rating 5, comment "Excellent!")
3. Logout
4. Login as Institution Manager
5. View Service Feedback

**Expected Result:**
- ✓ Feedback appears in manager dashboard
- ✓ Rating: 5 stars
- ✓ Comment: "Excellent!"
- ✓ Source: "Website"
- ✓ Statistics updated correctly

**Status:** [ ] PASS / [ ] FAIL

---

### Test 5.2: Telegram to Database to Dashboard ✓
**Objective:** End-to-end flow from Telegram submission to dashboard view

**Steps:**
1. Submit feedback via Telegram (rating 4)
2. Login to website as Institution Manager
3. View Service Feedback

**Expected Result:**
- ✓ Telegram feedback visible
- ✓ Rating: 4 stars
- ✓ Source: "Telegram"
- ✓ Statistics include Telegram rating

**Status:** [ ] PASS / [ ] FAIL

---

### Test 5.3: Mixed Source Statistics ✓
**Objective:** Verify statistics calculate correctly with mixed sources

**Steps:**
1. Submit 3 feedback via Website (ratings: 3, 4, 5)
2. Submit 2 feedback via Telegram (ratings: 4, 5)
3. Check Institution Manager statistics

**Expected Result:**
- ✓ Total feedback: 5
- ✓ Average rating: 4.2
- ✓ Distribution: 3/5=1, 4/5=2, 5/5=2
- ✓ By source: Website=3, Telegram=2

**Status:** [ ] PASS / [ ] FAIL

---

### Test 5.4: RBAC Enforcement ✓
**Objective:** Verify role-based access control works end-to-end

**Test Cases:**
1. **Citizen attempts to view other citizen's feedback** → BLOCKED
2. **Citizen attempts to view institution statistics** → BLOCKED
3. **Institution Manager attempts to view other institution's feedback** → BLOCKED
4. **Employee attempts to submit feedback** → BLOCKED
5. **MESOB Manager views all feedback** → ALLOWED

**Status:** [ ] PASS / [ ] FAIL

---

## Test Suite 6: Edge Cases

### Test 6.1: Invalid Rating Values ✓
**Test Cases:**
- Rating = 0 → Rejected
- Rating = 6 → Rejected
- Rating = -1 → Rejected
- Rating = "abc" → Rejected
- Rating = null → Rejected

**Status:** [ ] PASS / [ ] FAIL

---

### Test 6.2: Missing Required Fields ✓
**Test Cases:**
- Missing citizen_id → Rejected
- Missing institution_id → Rejected
- Missing service_id → Rejected
- Missing rating → Rejected
- Missing both application_id and queue_entry_id → Allowed (general feedback)

**Status:** [ ] PASS / [ ] FAIL

---

### Test 6.3: Long Comments ✓
**Test:** Submit feedback with 1000+ character comment

**Expected Result:**
- ✓ Accepted (no length limit in database)
- ✓ Displays correctly in dashboard (with scrolling or truncation)

**Status:** [ ] PASS / [ ] FAIL

---

### Test 6.4: Special Characters in Comments ✓
**Test:** Submit feedback with emojis, quotes, HTML tags

**Expected Result:**
- ✓ Stored correctly
- ✓ Displayed correctly (XSS protection)
- ✓ No SQL injection

**Status:** [ ] PASS / [ ] FAIL

---

### Test 6.5: Concurrent Submissions ✓
**Test:** Two users submit feedback for same service simultaneously

**Expected Result:**
- ✓ Both submissions succeed
- ✓ Statistics updated correctly
- ✓ No race conditions

**Status:** [ ] PASS / [ ] FAIL

---

## Performance Tests

### Test 7.1: Load Test - Dashboard Statistics ✓
**Test:** Load dashboard with 1000+ feedback records

**Expected Result:**
- ✓ Page loads in < 3 seconds
- ✓ Statistics calculate correctly
- ✓ Pagination works smoothly

**Status:** [ ] PASS / [ ] FAIL

---

### Test 7.2: Load Test - Telegram Bot ✓
**Test:** 10 users submit feedback simultaneously via Telegram

**Expected Result:**
- ✓ All submissions succeed
- ✓ No bot crashes
- ✓ All messages delivered

**Status:** [ ] PASS / [ ] FAIL

---

## Security Tests

### Test 8.1: SQL Injection ✓
**Test:** Attempt SQL injection in comment field

```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "rating": 5,
    "comment": "'; DROP TABLE service_feedback; --"
  }'
```

**Expected Result:**
- ✓ Submission succeeds
- ✓ Comment stored as literal string
- ✓ Table not dropped

**Status:** [ ] PASS / [ ] FAIL

---

### Test 8.2: XSS Attack ✓
**Test:** Attempt XSS in comment field

```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "rating": 5,
    "comment": "<script>alert('XSS')</script>"
  }'
```

**Expected Result:**
- ✓ Stored safely
- ✓ Rendered as text (not executed)
- ✓ No alert popup in dashboard

**Status:** [ ] PASS / [ ] FAIL

---

### Test 8.3: JWT Token Validation ✓
**Test Cases:**
- No token → 401 Unauthorized
- Expired token → 401 Unauthorized
- Invalid signature → 401 Unauthorized
- Wrong role → 403 Forbidden

**Status:** [ ] PASS / [ ] FAIL

---

## Summary

### Overall Test Results

**Database Layer:** [ ] 0/4 PASSED
**Backend API:** [ ] 0/8 PASSED
**Frontend UI:** [ ] 0/5 PASSED
**Telegram Bot:** [ ] 0/6 PASSED
**Integration Tests:** [ ] 0/4 PASSED
**Edge Cases:** [ ] 0/5 PASSED
**Performance Tests:** [ ] 0/2 PASSED
**Security Tests:** [ ] 0/3 PASSED

**TOTAL:** [ ] 0/37 PASSED

### Critical Issues Found
(To be filled during testing)

### Non-Critical Issues Found
(To be filled during testing)

### Recommendations
(To be filled after testing)

---

## Next Steps

1. [ ] Run database migrations
2. [ ] Execute database layer tests
3. [ ] Start backend server and run API tests
4. [ ] Start frontend and run UI tests
5. [ ] Start Telegram bot and run bot tests
6. [ ] Execute integration tests
7. [ ] Run security tests
8. [ ] Document all issues found
9. [ ] Fix critical issues
10. [ ] Retest failed cases
11. [ ] Mark task #7 complete when all tests pass

---

**Testing Started:** [DATE]
**Testing Completed:** [DATE]
**Tested By:** [NAME]
