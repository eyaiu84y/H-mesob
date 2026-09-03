# 🗄️ DATABASE PERSISTENCE VERIFICATION REPORT

**Date:** 2026-08-24  
**Task:** Verify user creation database persistence  
**Status:** ⏳ READY FOR TESTING

---

## 📋 OBJECTIVE

Verify that user creation via Super Admin actually persists to the Supabase PostgreSQL `users` table.

---

## 🧪 TEST SCENARIOS

### Test Users to Create:

1. ✅ **Institution Manager**
   - Role: INSTITUTION_MANAGER
   - Institution: CBE
   - Employee ID: Required

2. ✅ **Employee**
   - Role: EMPLOYEE
   - Institution: CBE
   - Employee ID: Required

3. ✅ **ICT Staff**
   - Role: ICT_STAFF
   - Institution: CBE
   - Employee ID: Required

4. ✅ **MESOB Manager**
   - Role: MESOB_MANAGER
   - Institution: null
   - Employee ID: Not required

5. ✅ **Citizen (Admin Created)**
   - Role: CITIZEN
   - Institution: null
   - Via: POST /api/users (Super Admin)

6. ✅ **Citizen (Public Signup)**
   - Role: CITIZEN
   - Institution: null
   - Via: POST /api/auth/register (Public)

7. ✅ **Duplicate Email Rejection**
   - Attempt to create user with existing email
   - Should be rejected

---

## 📝 FIELDS TO VERIFY

For each created user, verify:

| Field | Description | Expected |
|-------|-------------|----------|
| `id` | UUID | Auto-generated |
| `email` | User email | Unique, lowercase |
| `full_name` | User's full name | As provided |
| `password_hash` | Bcrypt hash | Starts with `$2` |
| `phone` | Phone number | As provided or null |
| `role` | User role | UPPERCASE (SUPER_ADMIN, MESOB_MANAGER, etc.) |
| `institution_id` | Institution code | Required for institutional roles, null otherwise |
| `employee_id` | Employee/Staff ID | Required for institutional roles, null otherwise |
| `national_id` | National ID | Optional, null if not provided |
| `status` | Account status | 'ACTIVE' by default |
| `created_at` | Creation timestamp | Auto-generated |
| `updated_at` | Update timestamp | Auto-generated or null |

---

## 🚀 HOW TO RUN TESTS

### Prerequisites:

1. **Backend server running:**
   ```bash
   cd backend
   npm start
   ```

2. **Super Admin account exists:**
   - Email: `superadmin@mesobcenter.et`
   - Password: `SuperAdmin@2026`

3. **Database accessible:**
   - Supabase connection configured in `.env`

---

### Step 1: Run Automated Test Script

```bash
cd backend
bash test-database-persistence.sh
```

**What it does:**
1. Logs in as Super Admin
2. Creates 6 test users (one of each role type)
3. Verifies each user exists in database via API
4. Checks role assignment
5. Checks institution assignment
6. Tests duplicate email rejection
7. Provides summary of results

**Test user naming:**
- All test users use `@test.mesob.et` domain
- Includes timestamp for uniqueness
- Example: `test.employee.1724524800@test.mesob.et`

---

### Step 2: Verify in Database (Optional)

If you have database access, run SQL verification:

```bash
# Using psql (if you have direct database access)
psql -h <host> -U <user> -d <database> -f verify-test-users.sql

# Or copy queries from verify-test-users.sql and run manually
```

**SQL Queries Provided:**
1. List all test users
2. Count users by role
3. Check institutional users
4. Check non-institutional users
5. Verify password hashing
6. Check timestamps
7. Find duplicate emails (should be empty)
8. Verify all users are ACTIVE
9. Full details of test users
10. Cleanup query (optional)

---

## ✅ EXPECTED RESULTS

### Test 1: Institution Manager Creation

**API Call:**
```bash
POST /api/users
Authorization: Bearer <super_admin_token>
{
  "email": "test.instmgr.TIMESTAMP@test.mesob.et",
  "password": "TestPass123!",
  "fullName": "Test Institution Manager",
  "phone": "+251911111111",
  "role": "INSTITUTION_MANAGER",
  "institutionId": "CBE",
  "employeeId": "IMTESTTIMESTAMP"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "<uuid>",
    "email": "test.instmgr.TIMESTAMP@test.mesob.et",
    "full_name": "Test Institution Manager",
    "phone": "+251911111111",
    "role": "INSTITUTION_MANAGER",
    "institution_id": "CBE",
    "employee_id": "IMTESTTIMESTAMP",
    "status": "ACTIVE",
    "created_at": "2026-08-24T..."
  }
}
```

**Database Verification:**
```sql
SELECT * FROM users 
WHERE email = 'test.instmgr.TIMESTAMP@test.mesob.et';
```

**Expected:**
- ✅ Row exists
- ✅ `role = 'INSTITUTION_MANAGER'`
- ✅ `institution_id = 'CBE'`
- ✅ `employee_id` populated
- ✅ `password_hash` starts with `$2`
- ✅ `status = 'ACTIVE'`
- ✅ `created_at` populated

---

### Test 2: Employee Creation

**API Call:**
```bash
POST /api/users
{
  "email": "test.employee.TIMESTAMP@test.mesob.et",
  "password": "TestPass123!",
  "fullName": "Test Employee",
  "role": "EMPLOYEE",
  "institutionId": "CBE",
  "employeeId": "EMPTESTTIMESTAMP"
}
```

**Expected:**
- ✅ User created in database
- ✅ `role = 'EMPLOYEE'`
- ✅ `institution_id = 'CBE'`
- ✅ `employee_id` populated

---

### Test 3: ICT Staff Creation

**API Call:**
```bash
POST /api/users
{
  "email": "test.ict.TIMESTAMP@test.mesob.et",
  "password": "TestPass123!",
  "fullName": "Test ICT Staff",
  "role": "ICT_STAFF",
  "institutionId": "CBE",
  "employeeId": "ICTTESTTIMESTAMP"
}
```

**Expected:**
- ✅ User created in database
- ✅ `role = 'ICT_STAFF'`
- ✅ `institution_id = 'CBE'`
- ✅ `employee_id` populated

---

### Test 4: MESOB Manager Creation

**API Call:**
```bash
POST /api/users
{
  "email": "test.mesobmgr.TIMESTAMP@test.mesob.et",
  "password": "TestPass123!",
  "fullName": "Test MESOB Manager",
  "role": "MESOB_MANAGER"
}
```

**Expected:**
- ✅ User created in database
- ✅ `role = 'MESOB_MANAGER'`
- ✅ `institution_id = null` (not required)
- ✅ `employee_id = null` (not required)

---

### Test 5: Citizen (Admin Created)

**API Call:**
```bash
POST /api/users
{
  "email": "test.admincitizen.TIMESTAMP@test.mesob.et",
  "password": "TestPass123!",
  "fullName": "Test Admin Citizen",
  "role": "CITIZEN"
}
```

**Expected:**
- ✅ User created in database
- ✅ `role = 'CITIZEN'`
- ✅ `institution_id = null`
- ✅ `employee_id = null`

---

### Test 6: Citizen (Public Signup)

**API Call:**
```bash
POST /api/auth/register
{
  "email": "test.publiccitizen.TIMESTAMP@test.mesob.et",
  "password": "TestPass123!",
  "firstName": "Test Public",
  "lastName": "Citizen"
}
```

**Expected:**
- ✅ User created in database
- ✅ `role = 'CITIZEN'` (forced by backend)
- ✅ `institution_id = null`
- ✅ `employee_id = null`
- ✅ JWT token returned
- ✅ User can login

---

### Test 7: Duplicate Email Rejection

**API Call:**
```bash
POST /api/users
{
  "email": "test.employee.TIMESTAMP@test.mesob.et",  # Already exists
  "password": "DifferentPass123!",
  "fullName": "Duplicate User",
  "role": "EMPLOYEE",
  "institutionId": "CBE"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "A user with this email already exists."
}
```

**Database Verification:**
- ✅ Only ONE user with that email exists
- ✅ Original user unchanged

---

## 📊 ROLE VALUES VERIFICATION

### Database Role Format:

All roles stored in **UPPERCASE**:

| Frontend Role | Backend Role | Database Value |
|---------------|--------------|----------------|
| `super_admin` | `SUPER_ADMIN` | `SUPER_ADMIN` |
| `mesob_manager` | `MESOB_MANAGER` | `MESOB_MANAGER` |
| `institution_manager` | `INSTITUTION_MANAGER` | `INSTITUTION_MANAGER` |
| `employee` | `EMPLOYEE` | `EMPLOYEE` |
| `ict_staff` | `ICT_STAFF` | `ICT_STAFF` |
| `citizen` | `CITIZEN` | `CITIZEN` |

**Verification Query:**
```sql
SELECT DISTINCT role FROM users ORDER BY role;
```

**Expected Output:**
```
CITIZEN
EMPLOYEE
ICT_STAFF
INSTITUTION_MANAGER
MESOB_MANAGER
SUPER_ADMIN
```

---

## 🏢 INSTITUTION RELATIONSHIPS

### Roles Requiring Institution:

| Role | Institution Required | Employee ID Required |
|------|---------------------|---------------------|
| INSTITUTION_MANAGER | ✅ Yes | ✅ Yes |
| EMPLOYEE | ✅ Yes | ✅ Yes |
| ICT_STAFF | ✅ Yes | ✅ Yes |
| MESOB_MANAGER | ❌ No | ❌ No |
| SUPER_ADMIN | ❌ No | ❌ No |
| CITIZEN | ❌ No | ❌ No |

**Verification Query:**
```sql
-- Should return institutional users with institution_id
SELECT email, role, institution_id, employee_id
FROM users
WHERE role IN ('INSTITUTION_MANAGER', 'EMPLOYEE', 'ICT_STAFF')
  AND email LIKE '%@test.mesob.et';

-- Should return non-institutional users with NULL institution_id
SELECT email, role, institution_id
FROM users
WHERE role IN ('MESOB_MANAGER', 'SUPER_ADMIN', 'CITIZEN')
  AND email LIKE '%@test.mesob.et';
```

---

## 🔒 PASSWORD HASHING VERIFICATION

**Query:**
```sql
SELECT 
    email,
    role,
    LEFT(password_hash, 10) as hash_prefix,
    LENGTH(password_hash) as hash_length
FROM users
WHERE email LIKE '%@test.mesob.et';
```

**Expected:**
- ✅ All users have `password_hash` populated
- ✅ Hash starts with `$2a$`, `$2b$`, or `$2y$` (bcrypt)
- ✅ Hash length is ~60 characters

**Security Check:**
- ❌ Raw passwords should NEVER be stored
- ❌ password_hash should NEVER be returned in API responses

---

## 🧹 CLEANUP

### To Remove Test Users:

**Option 1: Via SQL (Direct Database)**
```sql
DELETE FROM users WHERE email LIKE '%@test.mesob.et';
```

**Option 2: Via API (Super Admin)**
```bash
# Get list of test users
curl -s "$API_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | grep '@test.mesob.et'

# Delete each user by ID
curl -X DELETE "$API_URL/users/<user_id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Note:** Test users are clearly identified with `@test.mesob.et` domain for safe cleanup.

---

## 📝 VERIFICATION CHECKLIST

After running tests, verify:

### ✅ Database Persistence:
- [ ] Institution Manager exists in database
- [ ] Employee exists in database
- [ ] ICT Staff exists in database
- [ ] MESOB Manager exists in database
- [ ] Citizen (admin created) exists in database
- [ ] Citizen (public signup) exists in database

### ✅ Role Values:
- [ ] All roles stored in UPPERCASE
- [ ] Role values match expected enum

### ✅ Institution Relationships:
- [ ] Institutional users have institution_id
- [ ] Non-institutional users have NULL institution_id
- [ ] Employee IDs populated for institutional users

### ✅ Required Fields:
- [ ] id (UUID) populated
- [ ] email (unique) populated
- [ ] full_name populated
- [ ] password_hash (bcrypt) populated
- [ ] role populated
- [ ] status = 'ACTIVE'
- [ ] created_at populated

### ✅ Security:
- [ ] Passwords hashed with bcrypt
- [ ] Duplicate emails rejected
- [ ] Password hashes not exposed in API
- [ ] JWT tokens generated correctly

### ✅ Functionality:
- [ ] Created users can login
- [ ] Users assigned correct dashboard
- [ ] Profile endpoint works

---

## 🎯 SUCCESS CRITERIA

**All tests PASS if:**

1. ✅ All 6 user types created successfully
2. ✅ All users persist to database
3. ✅ All roles stored correctly (UPPERCASE)
4. ✅ Institutional relationships correct
5. ✅ Passwords hashed securely
6. ✅ Duplicate email rejected
7. ✅ Created users can login
8. ✅ All required fields populated

**Any test FAILS if:**

1. ❌ User creation succeeds but not in database
2. ❌ Role stored incorrectly (lowercase or wrong value)
3. ❌ Institution required but NULL
4. ❌ Password stored in plaintext
5. ❌ Duplicate email accepted
6. ❌ Created user cannot login
7. ❌ Required field is NULL

---

## 📊 TEST ARTIFACTS

### Files Created:

1. **`test-database-persistence.sh`**
   - Automated test script
   - Creates 6 test users
   - Verifies database persistence via API
   - Tests duplicate email rejection

2. **`verify-test-users.sql`**
   - SQL queries for manual verification
   - Checks all test users
   - Verifies role and institution relationships
   - Includes cleanup query

3. **`DATABASE_PERSISTENCE_VERIFICATION_REPORT.md`**
   - This document
   - Test plan and expected results
   - Verification checklist

---

## 🚀 NEXT STEPS

1. **Run automated test:**
   ```bash
   cd backend
   npm start  # In one terminal
   bash test-database-persistence.sh  # In another terminal
   ```

2. **Review test output:**
   - Check for any failures
   - Verify all users created
   - Confirm database persistence

3. **Optional database verification:**
   - Run SQL queries from `verify-test-users.sql`
   - Verify data integrity

4. **Cleanup test users:**
   - Use SQL cleanup query if needed
   - Or keep for further testing

5. **Report any issues found:**
   - User creation failures
   - Database persistence problems
   - Role assignment errors
   - Institution relationship issues

---

**End of Report**
