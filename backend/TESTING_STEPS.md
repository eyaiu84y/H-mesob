# 🧪 Service Catalogue Testing Steps

## Quick Start

Run the comprehensive test suite to verify all service catalogue fixes:

```bash
cd backend
node test-service-catalogue.js
```

---

## What Gets Tested

### ✅ 8 Test Suites - 20+ Tests Total

1. **Authentication** - Verifies admin login works
2. **Database Schema** - Confirms tables and columns exist correctly
3. **Institutions** - Verifies all 12 institutions present
4. **Service Counts** - Confirms 37+ services with correct distribution
5. **API Endpoints** - Tests all service-related API routes
6. **Data Mapping** - Verifies DB columns map correctly to API fields
7. **Data Quality** - Ensures no missing names, fees, or times
8. **Specific Services** - Confirms key services exist

---

## Expected Results

### ✅ All Tests Should Pass

```
✅ Passed: 20+
❌ Failed: 0
📊 Total: 20+
📈 Success Rate: 100%

🎉 ALL TESTS PASSED!
✅ Service catalogue is fully functional and production ready.
```

---

## Test Output Details

### Test Suite 1: Authentication
```
✅ PASS: 1.1: Admin login - Successfully authenticated
```

### Test Suite 2: Database Schema
```
✅ PASS: 2.1: Services table exists
✅ PASS: 2.2: All required columns exist
✅ PASS: 2.3: Service requirements table exists
```

### Test Suite 3: Institutions
```
✅ PASS: 3.1: Institution count - Expected 12, found 12
✅ PASS: 3.2: All required institutions present - 12/12 institutions found
```

### Test Suite 4: Service Counts
```
✅ PASS: 4.1: Minimum service count - Expected ≥37, found 41
✅ PASS: 4.2: Service distribution by institution
   ℹ️  electric: 1 services (min 1) ✅
   ℹ️  revenue: 2 services (min 1) ✅
   ℹ️  justice: 3 services (min 3) ✅
   ℹ️  cbe: 3 services (min 2) ✅
   ℹ️  ethiotel: 2 services (min 2) ✅
   ℹ️  ethiopost: 11 services (min 11) ✅
   ℹ️  investment: 1 services (min 1) ✅
   ℹ️  labor: 2 services (min 2) ✅
   ℹ️  trade: 7 services (min 7) ✅
   ℹ️  construction: 1 services (min 1) ✅
   ℹ️  fayda: 6 services (min 4) ✅
   ℹ️  sidama-bank: 2 services (min 2) ✅
```

### Test Suite 5: API Endpoints
```
✅ PASS: 5.1: GET /api/services - Retrieved 41 services
✅ PASS: 5.2: API response structure - All required fields present
✅ PASS: 5.3: GET /api/institutions - Retrieved all 12 institutions
✅ PASS: 5.4: GET /api/services/:id - Single service retrieval works
```

### Test Suite 6: Data Mapping
```
✅ PASS: 6.1: Database to API field mapping - All mappings correct
   Database (title_en) → API (name)
   Database (title_am) → API (name_am)
   Database (service_fee) → API (fee_amount)
   Database (is_active) → API (status)
```

### Test Suite 7: Data Quality
```
✅ PASS: 7.1: All services have names - 41/41 services
✅ PASS: 7.2: All services have fees - 41/41 services
✅ PASS: 7.3: All services have processing times - 41/41 services
✅ PASS: 7.4: Most services have URLs - 41/41 services
```

### Test Suite 8: Specific Services
```
✅ PASS: 8.1: Key services verification - 5/5 key services found
   ℹ️  Found: Electricity Bill Payment ✅
   ℹ️  Found: Tax Payment ✅
   ℹ️  Found: Account Opening ✅
   ℹ️  Found: New SIM Card Registration ✅
   ℹ️  Found: Investment License / Permit ✅
```

---

## Prerequisites

### 1. Backend Server Running
```bash
# In terminal 1
cd backend
npm run dev
```

Server should be running on: `http://localhost:5000`

### 2. Environment Variables Set
Verify `.env` file has:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Admin Account Exists
Default credentials:
- Email: `superadmin@mesobcenter.et`
- Password: `SuperAdmin@2026`

---

## Running Individual Verification

If you want to run individual checks:

### Check Service Count
```bash
node verify-catalogue.js
```

### Re-populate Services (idempotent)
```bash
node populate-services.js
```

### Manual API Test
```bash
# Get all services
curl http://localhost:5000/api/services

# Get specific service
curl http://localhost:5000/api/services/{service-id}

# Get all institutions
curl http://localhost:5000/api/institutions
```

---

## Troubleshooting

### ❌ If Backend Not Running
```
Error: ECONNREFUSED localhost:5000

Solution:
cd backend
npm run dev
```

### ❌ If Authentication Fails
```
❌ FAIL: 1.1: Admin login

Solution:
1. Verify admin account in Supabase
2. Check credentials in test-service-catalogue.js
3. Verify JWT secret in .env
```

### ❌ If Service Count Low
```
Expected ≥37, found 4

Solution:
node populate-services.js
```

### ❌ If Schema Errors
```
Column 'title_en' does not exist

Solution:
Check database/migrations/001_create_schema.sql ran correctly
```

---

## Test Results Output

After running tests, results are saved to:
```
service-catalogue-test-results.json
```

### Example Output
```json
{
  "timestamp": "2026-08-29T10:30:00.000Z",
  "passed": 20,
  "failed": 0,
  "total": 20,
  "successRate": 100,
  "results": [
    {
      "test": "1.1: Admin login",
      "status": "PASS",
      "message": "Successfully authenticated"
    },
    ...
  ]
}
```

---

## Success Criteria

All tests must pass with:
- ✅ 12 institutions present
- ✅ 37+ services present
- ✅ All services have names (English & Amharic)
- ✅ All services have fees
- ✅ All services have processing times
- ✅ API endpoints return correct data
- ✅ Database → API mapping correct
- ✅ Key services verified

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Service catalogue is production ready
2. Frontend can safely consume the API
3. Optional: Populate service requirements
4. Optional: Clean up 4 old test services

### If Tests Fail ❌
1. Review failed test messages
2. Check specific test suite that failed
3. Refer to troubleshooting section
4. Fix issues and re-run tests

---

## Quick Commands Reference

```bash
# Run full test suite
node test-service-catalogue.js

# Verify catalogue
node verify-catalogue.js

# Re-populate services
node populate-services.js

# Start backend
npm run dev

# View test results
cat service-catalogue-test-results.json
```

---

## Support Files

- `test-service-catalogue.js` - Main comprehensive test suite
- `verify-catalogue.js` - Quick catalogue verification
- `populate-services.js` - Service data population script
- `SERVICE_CATALOGUE_FIX_REPORT.md` - Complete fix documentation

---

**Last Updated:** August 29, 2026  
**Status:** Ready for testing  
**Expected Duration:** ~30 seconds
