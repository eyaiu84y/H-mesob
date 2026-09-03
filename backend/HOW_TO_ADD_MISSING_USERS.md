# 🔧 How to Add Missing Users (CBE & Ethio Telecom)

## 📊 Current Status

```
✅ 6 users exist in database
❌ 6 users missing (CBE + Ethio Telecom)
```

---

## ✅ Solution: Run SQL Script in Supabase

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy the SQL Script

Open the file: `seed_missing_users.sql`

Or copy this:

```sql
-- Copy the entire contents of seed_missing_users.sql
-- (The file is in the backend folder)
```

### Step 3: Run the Script

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait for completion (should take ~2 seconds)

### Step 4: Verify Success

You should see output like:
```
NOTICE: Found CBE institution: ...
NOTICE: Found Ethio Telecom institution: ...
NOTICE: Created: cbe.manager@mesobcenter.et
NOTICE: Created: cbe.employee@mesobcenter.et
NOTICE: Created: cbe.ict@mesobcenter.et
NOTICE: Created: ethiotel.manager@mesobcenter.et
NOTICE: Created: ethiotel.employee@mesobcenter.et
NOTICE: Created: ethiotel.ict@mesobcenter.et
NOTICE: ✅ Success! Total users in database: 12
```

---

## 🧪 Step 5: Test the Users

After running the SQL, test that all users now work:

```bash
# Check users again
bash check-users.sh
```

**Expected result:**
```
System Roles:
✅ superadmin@mesobcenter.et
✅ manager@mesobcenter.et
✅ citizen@mesobcenter.et

Fayda Institution:
✅ inst.manager@mesobcenter.et
✅ employee@mesobcenter.et
✅ ict.staff@mesobcenter.et

CBE Institution:
✅ cbe.manager@mesobcenter.et          ← Should now work!
✅ cbe.employee@mesobcenter.et         ← Should now work!
✅ cbe.ict@mesobcenter.et              ← Should now work!

Ethio Telecom:
✅ ethiotel.manager@mesobcenter.et     ← Should now work!
✅ ethiotel.employee@mesobcenter.et    ← Should now work!
✅ ethiotel.ict@mesobcenter.et         ← Should now work!

Total users in database: 12
```

---

## 🎯 Step 6: Test All Roles

```bash
bash test-all-roles.sh
```

**Expected result:**
```
1. SUPER_ADMIN
  ✅ Login successful
  ✅ Profile access successful

2. MESOB_MANAGER
  ✅ Login successful
  ✅ Profile access successful

3. INSTITUTION_MANAGER (Fayda)
  ✅ Login successful
  ✅ Profile access successful

4. EMPLOYEE (Fayda)
  ✅ Login successful
  ✅ Profile access successful

5. ICT_STAFF (Fayda)
  ✅ Login successful
  ✅ Profile access successful

6. CITIZEN
  ✅ Login successful
  ✅ Profile access successful

7. CBE (Commercial Bank of Ethiopia)
Testing: CBE Manager
  ✅ Login successful              ← Should now work!
  ✅ Profile access successful

Testing: CBE Employee
  ✅ Login successful              ← Should now work!
  ✅ Profile access successful

Testing: CBE ICT
  ✅ Login successful              ← Should now work!
  ✅ Profile access successful

8. ETHIO TELECOM
Testing: Ethio Telecom Manager
  ✅ Login successful              ← Should now work!
  ✅ Profile access successful

Testing: Ethio Telecom Employee
  ✅ Login successful              ← Should now work!
  ✅ Profile access successful

Testing: Ethio Telecom ICT
  ✅ Login successful              ← Should now work!
  ✅ Profile access successful

✅ All 12 seed users tested successfully!
```

---

## 🎉 Final Verification

```bash
# Run complete API test
bash test-all-api.sh
```

**Expected:**
```
Total Endpoints:  37
Passed:           37 (100%)
Failed:           0
🎉 EXCELLENT! (100%) - Production Ready!
```

---

## 📋 User Credentials (For Reference)

After running the script, these users will be available:

### CBE Users
```
Email: cbe.manager@mesobcenter.et
Password: CbeManager@2026
Role: INSTITUTION_MANAGER

Email: cbe.employee@mesobcenter.et
Password: CbeEmployee@2026
Role: EMPLOYEE

Email: cbe.ict@mesobcenter.et
Password: CbeIct@2026
Role: ICT_STAFF
```

### Ethio Telecom Users
```
Email: ethiotel.manager@mesobcenter.et
Password: EthioManager@2026
Role: INSTITUTION_MANAGER

Email: ethiotel.employee@mesobcenter.et
Password: EthioEmployee@2026
Role: EMPLOYEE

Email: ethiotel.ict@mesobcenter.et
Password: EthioIct@2026
Role: ICT_STAFF
```

---

## 🆘 If Script Fails

### Error: "CBE institution not found"
```
Solution: Run 004_seed_institutions.sql first
```

### Error: "Ethio Telecom institution not found"
```
Solution: Run 004_seed_institutions.sql first
```

### Error: Duplicate key violation
```
This means users already exist!
Check with: bash check-users.sh
```

---

## ✅ Quick Summary

1. **Open Supabase SQL Editor**
2. **Copy** `seed_missing_users.sql` content
3. **Run** the script
4. **Test** with `bash check-users.sh`
5. **Verify** with `bash test-all-roles.sh`

**That's it!** All 12 users should now work. 🎉

---

## 📞 Next Steps After Adding Users

Once all 12 users are working:

1. ✅ All endpoints: 37/37 passing
2. ✅ All users: 12/12 working
3. ✅ All roles: 6/6 tested
4. ✅ Multi-institution: Fully functional
5. 🚀 **Ready for production!**

---

**Note:** Remember to change all these test passwords before production deployment! ⚠️
