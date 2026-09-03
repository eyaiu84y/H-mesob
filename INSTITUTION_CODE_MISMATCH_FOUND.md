# 🚨 INSTITUTION CODE MISMATCH DISCOVERED

**Date:** August 24, 2026  
**Status:** ❌ **CRITICAL MISMATCH FOUND**  
**Severity:** HIGH - User creation will fail

---

## Summary

**Frontend and Backend are NOT aligned!**

- **Frontend sends:** Institution UUID (e.g., `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`)
- **Backend expects:** Institution CODE (e.g., `"ethiotel"`)

This will cause **"Invalid institution code specified."** error.

---

## Detailed Analysis

### 1. Database Structure

**File:** `backend/database/seeds/004_seed_institutions.sql`

**Institution Codes in Database:**
```sql
'electric'      -- Ethiopian Electric Utility
'revenue'       -- Revenues Bureau
'justice'       -- Ministry of Justice
'cbe'           -- Commercial Bank of Ethiopia
'ethiotel'      -- Ethio Telecom  ⭐ (Your example)
'ethiopost'     -- Ethiopian Postal Service
'investment'    -- Investment Commission
'labor'         -- Labor and Skills Bureau
'trade'         -- Trade Bureau
'construction'  -- Construction Authority
'fayda'         -- National ID Program / Fayda
'sidama-bank'   -- Sidama Bank
```

**Database Schema:**
```sql
institutions table:
  - id (UUID, primary key)
  - code (TEXT, unique)  ← Backend uses this
  - name_en (TEXT)
  - name_am (TEXT)
  - status (TEXT)
```

---

### 2. Frontend Implementation

**File:** `frontend/src/data/organizations.js`

**Frontend Institution IDs:**
```javascript
{
  id: "electric",       // Matches database code ✅
  name_en: "Ethiopian Electric Utility"
}
{
  id: "ethiotel",       // Matches database code ✅
  name_en: "Ethio Telecom"
}
{
  id: "cbe",            // Matches database code ✅
  name_en: "Commercial Bank of Ethiopia"
}
// ... all 12 institutions use matching codes
```

**Current Frontend Dropdown (SuperAdminDashboard.jsx):**
```javascript
// Line 188
const institutions = institutionsList; // Full institution objects

// Line ~431 (Create User dropdown)
{institutions.map(inst => (
  <option key={inst.id} value={inst.id}>  ← Sends inst.id (UUID!)
    {inst.name_en || inst.name}
  </option>
))}
```

**What frontend sends when user selects "Ethio Telecom":**
```javascript
{
  institution: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  // UUID from database
}
```

---

### 3. Backend Validation

**File:** `backend/src/services/userService.js` (Line 175)

**Backend Expects:**
```javascript
// Backend code (Line 161-184)
let institutionUuid = null;
if (institutionId && ['INSTITUTION_MANAGER', 'EMPLOYEE', 'ICT_STAFF'].includes(role)) {
  const { data: institution, error: instError } = await supabase
    .from('institutions')
    .select('id')
    .eq('code', institutionId.toLowerCase())  // ← Looking for CODE!
    .single();

  if (instError || !institution) {
    return {
      success: false,
      message: 'Invalid institution code specified.'  // ← This error!
    };
  }

  institutionUuid = institution.id;
}
```

**What backend expects:**
```javascript
{
  institutionId: "ethiotel"  // Institution CODE, not UUID!
}
```

---

## The Problem

### Scenario: User creates an Institution Manager for Ethio Telecom

#### Step 1: Frontend
1. User selects "Ethio Telecom" from dropdown
2. Dropdown value = `inst.id` = UUID from database
3. Example UUID: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`

#### Step 2: API Request
```javascript
POST /api/users
{
  "name": "Tigist Haile",
  "email": "tigist.haile@ethiotelecom.et",
  "phone": "+251922345678",
  "role": "INSTITUTION_MANAGER",
  "institutionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // UUID
  "employeeId": "MGR-ET-001"
}
```

#### Step 3: Backend Validation
```javascript
// Backend tries to find institution by CODE
SELECT id FROM institutions 
WHERE code = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  // UUID as code!
// Result: No match found

// Backend returns error
{
  "success": false,
  "message": "Invalid institution code specified."
}
```

#### Step 4: Result
❌ **User creation fails**  
❌ **Error displayed to Super Admin**  
❌ **No user created in database**

---

## Root Cause

**Frontend was recently modified to send UUID instead of CODE.**

### Previous (Correct) Implementation:
```javascript
// Frontend sent institution CODE
const institutions = institutionsList.map(inst => inst.code || inst.id);

// Dropdown sent
<option value="ethiotel">Ethio Telecom</option>

// Backend received
{ institutionId: "ethiotel" }  // Matches database code ✅
```

### Current (Broken) Implementation:
```javascript
// Frontend sends institution UUID
const institutions = institutionsList; // Full objects

// Dropdown sends
<option value="a1b2c3d4-...">Ethio Telecom</option>

// Backend receives
{ institutionId: "a1b2c3d4-..." }  // Does NOT match database code ❌
```

---

## Impact Assessment

### What Doesn't Work:
❌ Creating users with institutional roles (Institution Manager, Employee, ICT Staff)  
❌ All 12 institutions affected  
❌ User Management feature blocked  
❌ Cannot assign users to Ethio Telecom or any institution  

### What Still Works:
✅ Creating Super Admin (no institution needed)  
✅ Creating MESOB Manager (no institution needed)  
✅ Creating Citizen (uses National ID, not institution)  
✅ Login  
✅ Other dashboard features  

---

## Solution Options

### Option 1: Fix Frontend (Send CODE instead of UUID) ⭐ **RECOMMENDED**

**Change:**
```javascript
// SuperAdminDashboard.jsx
// Line ~431, ~565, ~670

// Current (broken)
<option value={inst.id}>  // Sends UUID

// Fix to
<option value={inst.code || inst.id}>  // Sends CODE
```

**Pros:**
- ✅ Minimal change
- ✅ Matches backend expectation
- ✅ Matches database design
- ✅ No API change needed

**Cons:**
- ❌ Must verify `inst.code` exists in response

---

### Option 2: Fix Backend (Accept UUID instead of CODE)

**Change:**
```javascript
// backend/src/services/userService.js
// Line 173

// Current
.eq('code', institutionId.toLowerCase())

// Change to
.eq('id', institutionId)
```

**Pros:**
- ✅ Works with current frontend

**Cons:**
- ❌ Changes API contract
- ❌ May break other code expecting CODE
- ❌ Less semantic (UUIDs are internal)
- ❌ Requires testing entire codebase

---

### Option 3: Support Both CODE and UUID in Backend

**Change:**
```javascript
// Try UUID first, then CODE
let institution = await findByUUID(institutionId);
if (!institution) {
  institution = await findByCode(institutionId);
}
```

**Pros:**
- ✅ Backward compatible
- ✅ Works with any frontend

**Cons:**
- ❌ More complex
- ❌ Two database queries
- ❌ Confusing API contract

---

## Verification Needed

### Check ServiceContext

Need to verify what `useServices().institutions` returns:

**File:** `frontend/src/context/ServiceContext.jsx`

**Question:** Does it return:
```javascript
// Option A: Objects with code
[
  { id: "uuid-123", code: "ethiotel", name_en: "Ethio Telecom" },
  { id: "uuid-456", code: "cbe", name_en: "Commercial Bank of Ethiopia" }
]

// Option B: Objects without code
[
  { id: "uuid-123", name_en: "Ethio Telecom" },
  { id: "uuid-456", name_en: "Commercial Bank of Ethiopia" }
]
```

This determines whether Option 1 (send CODE) is viable.

---

## Test Plan

### After Fix:

1. **Verify institution data structure:**
   ```javascript
   console.log(institutions[0]);
   // Should show: { id: "uuid", code: "ethiotel", name_en: "Ethio Telecom" }
   ```

2. **Test user creation:**
   - Select "Ethio Telecom"
   - Fill form
   - Click "Create User"
   - Should succeed ✅

3. **Verify API request:**
   ```javascript
   // Network tab should show
   {
     "institutionId": "ethiotel"  // CODE, not UUID
   }
   ```

4. **Check database:**
   ```sql
   SELECT institution_id, 
          (SELECT code FROM institutions WHERE id = users.institution_id)
   FROM users 
   WHERE email = 'tigist.haile@ethiotelecom.et';
   
   -- Should show institution_id = UUID, code = "ethiotel"
   ```

---

## Recommended Action

**IMMEDIATE FIX NEEDED:**

1. **Check ServiceContext response** to confirm `code` field exists
2. **Update frontend dropdowns** to send `inst.code` instead of `inst.id`
3. **Test user creation** end-to-end
4. **Verify in database** that users are created correctly

**DO NOT proceed with user creation until this is fixed!**

---

## Files to Check/Modify

### Must Check:
1. ✅ `backend/database/seeds/004_seed_institutions.sql` - Checked
2. ✅ `frontend/src/data/organizations.js` - Checked
3. ✅ `backend/src/services/userService.js` - Checked
4. ❓ `frontend/src/context/ServiceContext.jsx` - **Need to check**
5. ✅ `frontend/src/pages/dashboard/SuperAdminDashboard.jsx` - Checked

### Must Modify (if Option 1):
1. `frontend/src/pages/dashboard/SuperAdminDashboard.jsx` (3 dropdowns)

---

## Next Steps

1. **DO NOT CREATE USERS YET** - Will fail with current code
2. **Check ServiceContext** to see API response structure
3. **Decide on fix option** (Option 1 recommended)
4. **Apply fix**
5. **Test thoroughly**
6. **Then proceed with user creation**

---

**STATUS: MISMATCH CONFIRMED - FIX REQUIRED BEFORE USER CREATION**
