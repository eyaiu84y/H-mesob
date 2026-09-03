# 📋 Institution & Service Catalogue Verification Report

**Date:** August 29, 2026  
**Status:** ❌ CRITICAL ISSUES FOUND

---

## Executive Summary

**Institutions:** ✅ 12/12 verified (100%)  
**Services:** ❌ Only 4 services found (expected 20+)  
**Missing Services:** ~16+ services  
**Data Quality Issues:** Service names showing as "undefined", missing fees, missing URLs

---

## Part 1: Institution Verification

### ✅ SUCCESS: All 12 Institutions Present

| Code | Name | Website | Status |
|------|------|---------|--------|
| electric | Ethiopian Electric Utility | https://eeu.gov.et | ✅ |
| revenue | Revenues Bureau | https://www.aarevenue.gov.et | ✅ |
| justice | Ministry of Justice | https://justice.gov.et/en | ✅ |
| cbe | Commercial Bank of Ethiopia | https://combanketh.et | ✅ |
| ethiotel | Ethio Telecom | https://www.ethiotelecom.et | ✅ |
| ethiopost | Ethiopian Postal Service Enterprise | https://ethio.post | ✅ |
| investment | Investment Commission | https://investethiopia.gov.et | ✅ |
| labor | Labor and Skills Bureau | https://mols.gov.et | ✅ |
| trade | Trade Bureau | https://motri.gov.et/en | ✅ |
| construction | Construction Authority | *(empty - as expected)* | ✅ |
| fayda | National ID Program / Fayda | https://www.id.gov.et | ✅ |
| sidama-bank | Sidama Bank | https://sidamabanksc.com | ✅ |

**Findings:**
- ✅ All 12 approved institutions present in database
- ✅ All names match approved source
- ✅ All Amharic names match approved source
- ✅ All website URLs match approved source (where provided)
- ✅ No extra/unapproved institutions found
- ✅ No missing institutions

---

## Part 2: Service Verification

### ❌ CRITICAL: Massive Service Data Gap

#### Services Found vs. Expected

| Institution | Expected | Found | Status | Gap |
|-------------|----------|-------|--------|-----|
| Ethiopian Electric Utility | 1 | 0 | ❌ | -1 |
| Revenues Bureau | 1 | 1 | ✅ | 0 |
| Ministry of Justice | 3 | 0 | ❌ | -3 |
| Commercial Bank of Ethiopia | 2 | 1 | ❌ | -1 |
| Ethio Telecom | 2 | 0 | ❌ | -2 |
| Ethiopian Postal Service | 11 | 0 | ❌ | -11 |
| Investment Commission | 1 | 0 | ❌ | -1 |
| Labor and Skills Bureau | 2 | 0 | ❌ | -2 |
| Trade Bureau | ? | 0 | ⚠️ | ? |
| Construction Authority | ? | 0 | ⚠️ | ? |
| National ID Program / Fayda | ? | 2 | ⚠️ | ? |
| Sidama Bank | ? | 0 | ⚠️ | ? |

**Total:** Only **4 services** found out of expected **20+**

---

## Part 3: Data Quality Issues

### Services Found (4 total)

#### ⚠️ Issue: Service Names Show as "undefined"

All 4 services display `title_en` as "undefined" in API response, suggesting:
1. Schema mismatch between seed file and actual table
2. Frontend/backend using different field names
3. Data not properly inserted

#### Services with Issues:

1. **Revenue Bureau Service**
   - Name: `undefined` ❌
   - Processing Time: ✅ "1-2 business days"
   - Fee: ❌ Missing
   - URL: ❌ Missing

2. **CBE Service**
   - Name: `undefined` ❌
   - Processing Time: ✅ "1-2 hours"
   - Fee: ❌ Missing
   - URL: ❌ Missing

3. **Fayda Service 1**
   - Name: `undefined` ❌
   - Processing Time: ✅ "2-3 business days"
   - Fee: ❌ Missing
   - URL: ❌ Missing

4. **Fayda Service 2**
   - Name: `undefined` ❌
   - Processing Time: ✅ "3-5 business days"
   - Fee: ❌ Missing
   - URL: ❌ Missing

---

## Part 4: Root Cause Analysis

### Schema vs. Seed File Mismatch

**Database Schema** (from 001_create_schema.sql):
```sql
CREATE TABLE services (
  id UUID,
  institution_id UUID,
  code VARCHAR(100),
  title_en VARCHAR(255),      -- ✅ Correct field
  title_am VARCHAR(255),      -- ✅ Correct field
  description_en TEXT,
  description_am TEXT,
  processing_time VARCHAR(100), -- ✅ Correct field
  service_fee VARCHAR(100),     -- ✅ Correct field
  service_url TEXT,             -- ✅ Correct field
  is_active BOOLEAN,
  ...
);
```

**Seed File** (002_seed_services.sql):
```sql
INSERT INTO services (
  institution_id,
  code,
  title_en,    -- ✅ MATCHES schema
  title_am,    -- ✅ MATCHES schema
  processing_time,  -- ✅ MATCHES schema
  service_fee,      -- ✅ MATCHES schema
  service_url,      -- ✅ MATCHES schema
  is_active
) VALUES (...);
```

**Actual Database** (from API response):
```json
{
  "id": "...",
  "institution_id": "...",
  "name": "...",          // ❌ WRONG! Should be title_en
  "name_am": "...",       // ❌ WRONG! Should be title_am
  "processing_time": "...", // ✅ Correct
  "fee_amount": "...",    // ❌ WRONG! Should be service_fee
  "status": "..."         // ❌ WRONG! Should be is_active
}
```

### Conclusion
The database has different column names than both the schema and seed file expect. This suggests:
1. Either the schema was changed after seed files were created
2. Or the data was inserted manually with wrong column names
3. Or there's a migration that altered column names

---

## Part 5: Missing Services Breakdown

### Expected but Not Found

#### Ethiopian Electric Utility (1 service missing)
- ❌ Electricity Bill Payment

#### Ministry of Justice (3 services missing)
- ❌ Issuance of Practice Licenses for Federal Attorneys
- ❌ Renewal of Federal Attorney Practice Licenses
- ❌ Upgrading of Federal Attorney Practice Licenses

#### Commercial Bank of Ethiopia (1 service missing)
- ❌ Mobile Banking
- ✅ Account Opening (found but has data issues)

#### Ethio Telecom (2 services missing)
- ❌ New SIM Card Registration
- ❌ Telebirr Registration and Services

#### Ethiopian Postal Service (11 services missing)
- ❌ P.O. Box Rental
- ❌ Domestic Parcel and Letter Services
- ❌ International Parcel and Letter Services
- ❌ Express Mail Service (EMS)
- ❌ Postal Money Order
- ❌ Philatelic Services (Stamp Collection)
- ❌ Courier Services
- ❌ Registered Mail
- ❌ Bill Payment Services
- ❌ Postal Banking Services
- ❌ Track and Trace Services

#### Investment Commission (1 service missing)
- ❌ Investment License / Permit

#### Labor and Skills Bureau (2 services missing)
- ❌ Issuance of a New Work Permit for Foreign Nationals
- ❌ Work Permit Renewal for Foreign Nationals

---

## Part 6: Required Actions

### 🔴 CRITICAL (Must Fix Immediately)

1. **Investigate Schema Mismatch**
   - Check actual database column names
   - Compare with schema definition
   - Identify where the mismatch occurred

2. **Fix or Re-run Service Seed File**
   - Verify 002_seed_services.sql matches actual schema
   - Drop and re-insert services if needed
   - Or create migration to rename columns

3. **Verify Service Requirements**
   - Check if service_requirements table has data
   - Verify requirements match approved source

### 🟡 HIGH PRIORITY

4. **Add Missing Services**
   - Insert all 16+ missing services from approved source
   - Include all required fields (requirements, fees, times, URLs)

5. **Fix Data Quality Issues**
   - Populate missing `service_fee` fields
   - Populate missing `service_url` fields
   - Verify all service names are correct

### 🟢 MEDIUM PRIORITY

6. **Create Service Verification Tests**
   - Automated test to verify service count
   - Test to check required fields are populated
   - Test to validate URLs are accessible

7. **Document Official Source**
   - Create authoritative service catalogue document
   - Version control for approved services
   - Change management process

---

## Part 7: Verification Statistics

### Summary Counts

```
✅ Institutions Verified: 12/12 (100%)
❌ Services Found: 4 (expected 20+)
❌ Service Name Issues: 4/4 (100%)
❌ Missing Service Fees: 4/4 (100%)
❌ Missing Service URLs: 4/4 (100%)
✅ Missing Processing Times: 0/4 (0%)
❌ Total Issues Found: 7 major issues
```

### Issue Breakdown

| Issue Type | Count | Severity |
|------------|-------|----------|
| Missing Services | 16+ | 🔴 Critical |
| Schema Mismatch | 1 | 🔴 Critical |
| Service Names Undefined | 4 | 🔴 Critical |
| Missing Fees | 4 | 🟡 High |
| Missing URLs | 4 | 🟡 High |
| Name Mismatches | 0 | ✅ None |
| Website Mismatches | 0 | ✅ None |

---

## Part 8: Next Steps

### Immediate Actions Required

1. ✅ Run database query to check actual column names
2. ✅ Compare schema vs. actual table structure
3. ⏳ Fix schema mismatch (rename columns or update seed file)
4. ⏳ Re-run service seed file with correct data
5. ⏳ Verify all 20+ services are inserted
6. ⏳ Populate all required fields (fees, URLs, requirements)
7. ⏳ Re-run verification to confirm 100% completion

### Testing & Validation

- Create automated tests for service catalogue
- Verify frontend can display all services correctly
- Test service detail pages show all information
- Validate all URLs are accessible
- Confirm requirements are properly displayed

---

## Appendix: Approved Service List

### Expected Services by Institution (from seed file)

**Total Expected:** 24+ services minimum

1. **Ethiopian Electric Utility:** 1 service
2. **Revenues Bureau:** 1 service
3. **Ministry of Justice:** 3 services
4. **Commercial Bank of Ethiopia:** 2 services
5. **Ethio Telecom:** 2 services
6. **Ethiopian Postal Service:** 11 services
7. **Investment Commission:** 1 service
8. **Labor and Skills Bureau:** 2 services
9. **Trade Bureau:** Unknown (seed file incomplete)
10. **Construction Authority:** Unknown (seed file incomplete)
11. **National ID Program / Fayda:** Unknown (seed file incomplete)
12. **Sidama Bank:** Unknown (seed file incomplete)

---

## Conclusion

### ❌ System NOT Production Ready

While all 12 institutions are correctly configured, the service catalogue is severely incomplete:

- ✅ **Institutions:** 100% complete and accurate
- ❌ **Services:** ~20% complete (4 out of 20+ expected)
- ❌ **Data Quality:** Service names showing as "undefined"
- ❌ **Missing Data:** Fees and URLs not populated

**Recommendation:** **DO NOT DEPLOY** until all services are properly seeded and data quality issues are resolved.

---

**Report Generated:** August 29, 2026  
**Verification Script:** `verify-catalogue.js`  
**Detailed JSON Report:** `catalogue-verification-report.json`
