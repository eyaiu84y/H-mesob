# Super Admin User Creation Guide - Complete Instructions

**Date:** August 24, 2026  
**Purpose:** How Super Admin creates users for Ethio Telecom and other institutions  
**Status:** ✅ READY TO USE

---

## Prerequisites

### 1. Servers Running
```bash
# Terminal 1 - Backend
cd c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/backend
npm start
# Backend runs on: http://localhost:5000

# Terminal 2 - Frontend
cd c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/frontend
npm run dev
# Frontend runs on: http://localhost:5173
```

### 2. Super Admin Login Credentials
- **Email:** `superadmin@mesobcenter.et`
- **Password:** `SuperAdmin@2026`

---

## Part 1: How Super Admin Creates Users

### Step-by-Step Process

#### 1. Login as Super Admin

1. Open browser: `http://localhost:5173`
2. Enter credentials:
   - Email: `superadmin@mesobcenter.et`
   - Password: `SuperAdmin@2026`
3. Click **"Sign In"**
4. You'll see the Super Admin Dashboard

#### 2. Navigate to User Management

1. Look at the left sidebar
2. Click on **"User Management"** (የተጠቃሚዎች አስተዳደር)
3. User Management page opens

#### 3. Create New User

1. Click the **"Add User"** button (top right)
2. A form will appear with these fields:

---

## Part 2: Creating Users for Ethio Telecom

### Institution Information

**Institution Name:** Ethio Telecom  
**Institution Code:** `ethiotel`  
**Full Name (English):** Ethio Telecom  
**Full Name (Amharic):** ኢትዮ ቴሌኮም  

The system will **automatically** select the correct institution ID when you choose "Ethio Telecom" from the dropdown.

---

## User Creation Examples for Ethio Telecom

### Example 1: Create Employee for Ethio Telecom

**Fill the form:**

| Field | Value |
|-------|-------|
| **Full Name** | Abebe Bekele |
| **Email** | abebe.bekele@ethiotelecom.et |
| **Phone Number** | +251911234567 |
| **Role** | Employee (select from dropdown) |
| **Institution** | Ethio Telecom (select from dropdown) |
| **Employee ID** | EMP-ET-001 |
| **Status** | Active |

**Steps:**
1. Click "Add User"
2. Fill all fields as shown above
3. For **Role**: Select **"Employee"**
4. For **Institution**: Select **"Ethio Telecom"** from the dropdown
5. Click **"Create User"**

**Result:**
- ✅ Success message appears
- ✅ Temporary password displayed (example: `TempPass@2026`)
- ✅ User saved in database with Ethio Telecom institution ID
- ✅ User appears in the user list

---

### Example 2: Create Institution Manager for Ethio Telecom

**Fill the form:**

| Field | Value |
|-------|-------|
| **Full Name** | Tigist Haile |
| **Email** | tigist.haile@ethiotelecom.et |
| **Phone Number** | +251922345678 |
| **Role** | Institution Manager (select from dropdown) |
| **Institution** | Ethio Telecom (select from dropdown) |
| **Employee ID** | MGR-ET-001 |
| **Status** | Active |

**Steps:**
1. Click "Add User"
2. Fill all fields as shown above
3. For **Role**: Select **"Institution Manager"**
4. For **Institution**: Select **"Ethio Telecom"**
5. Click **"Create User"**

**Result:**
- ✅ Institution Manager created
- ✅ Can manage Ethio Telecom services
- ✅ Temporary password displayed
- ✅ Saved in database

---

### Example 3: Create ICT Staff for Ethio Telecom

**Fill the form:**

| Field | Value |
|-------|-------|
| **Full Name** | Daniel Tesfaye |
| **Email** | daniel.tesfaye@ethiotelecom.et |
| **Phone Number** | +251933456789 |
| **Role** | ICT Staff (select from dropdown) |
| **Institution** | Ethio Telecom (select from dropdown) |
| **Employee ID** | ICT-ET-001 |
| **Status** | Active |

**Steps:**
1. Click "Add User"
2. Fill all fields as shown above
3. For **Role**: Select **"ICT Staff"**
4. For **Institution**: Select **"Ethio Telecom"**
5. Click **"Create User"**

**Result:**
- ✅ ICT Staff created
- ✅ Has technical access rights
- ✅ Temporary password displayed
- ✅ Saved in database

---

## Part 3: Understanding Institution Assignment

### How Institution ID Works

When you create a user:

1. **You select:** "Ethio Telecom" (human-readable name)
2. **System sends:** The institution UUID (unique identifier)
3. **Database stores:** The correct institution ID
4. **User sees:** "Ethio Telecom" in their dashboard

**Example Behind the Scenes:**
```
User Form Input:
  Institution Dropdown: "Ethio Telecom"

System Processes:
  institution_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" (UUID)

Database Record:
  users table:
    - full_name: "Abebe Bekele"
    - email: "abebe.bekele@ethiotelecom.et"
    - role: "EMPLOYEE"
    - institution_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    - employee_id: "EMP-ET-001"
    - status: "ACTIVE"
```

**You don't need to know or enter the UUID manually!** The dropdown handles this automatically.

---

## Part 4: Available Roles and Their Access

### Role Types

| Role | Description | Access Level |
|------|-------------|--------------|
| **Super Admin** | System administrator | Full system access |
| **MESOB Manager** | MESOB center manager | Cross-institution monitoring |
| **Institution Manager** | Manages specific institution | Institution-level access |
| **Employee** | Regular staff member | Basic employee dashboard |
| **ICT Staff** | Technical support | Technical troubleshooting |
| **Citizen** | Public service user | Service application only |

### Which Roles Need Institution?

**✅ Requires Institution:**
- Institution Manager
- Employee
- ICT Staff

**❌ No Institution:**
- Super Admin (system-wide)
- MESOB Manager (multi-institution)
- Citizen (uses National ID)

---

## Part 5: All 12 Available Institutions

You can create users for any of these institutions:

1. **National ID Program / Fayda** - `fayda`
2. **Commercial Bank of Ethiopia** - `cbe`
3. **Ethio Telecom** - `ethiotel` ⭐ (Your example)
4. **Ethiopian Electric Utility** - `electric`
5. **Labor and Skills Bureau** - `labor`
6. **Revenues Bureau** - `revenue`
7. **Trade Bureau** - `trade`
8. **Ethiopian Postal Service** - `ethiopost`
9. **Ministry of Justice** - `justice`
10. **Investment Commission** - `investment`
11. **Construction Authority** - `construction`
12. **Sidama Bank** - `sidama-bank`

All institutions are **ACTIVE** and ready to use.

---

## Part 6: Creating Multiple Users - Quick Template

### Ethio Telecom User Template

Copy this template to create users quickly:

```
USER 1 - INSTITUTION MANAGER
Name: Tigist Haile
Email: tigist.haile@ethiotelecom.et
Phone: +251922345678
Role: Institution Manager
Institution: Ethio Telecom
Employee ID: MGR-ET-001
Status: Active

USER 2 - EMPLOYEE
Name: Abebe Bekele
Email: abebe.bekele@ethiotelecom.et
Phone: +251911234567
Role: Employee
Institution: Ethio Telecom
Employee ID: EMP-ET-001
Status: Active

USER 3 - ICT STAFF
Name: Daniel Tesfaye
Email: daniel.tesfaye@ethiotelecom.et
Phone: +251933456789
Role: ICT Staff
Institution: Ethio Telecom
Employee ID: ICT-ET-001
Status: Active

USER 4 - EMPLOYEE 2
Name: Sara Alemayehu
Email: sara.alemayehu@ethiotelecom.et
Phone: +251944567890
Role: Employee
Institution: Ethio Telecom
Employee ID: EMP-ET-002
Status: Active
```

**Process:**
1. Click "Add User"
2. Copy data from USER 1
3. Paste into form
4. Click "Create User"
5. Note the temporary password
6. Repeat for USER 2, 3, 4...

---

## Part 7: After User Creation

### What Happens Next

#### 1. Temporary Password Generated

When you create a user:
```
✅ User created successfully!

Temporary Password: TempPass@2026
Email: abebe.bekele@ethiotelecom.et

⚠️ Please share this password securely with the user.
The user must change it on first login.
```

**Important:**
- Copy the temporary password immediately
- Send it to the user securely (not via email if possible)
- User must change it on first login

#### 2. User Saved in Database

The user is immediately saved with:
- ✅ Full name
- ✅ Email (used for login)
- ✅ Phone number
- ✅ Role with correct permissions
- ✅ Institution ID (Ethio Telecom UUID)
- ✅ Employee ID
- ✅ Status: ACTIVE
- ✅ Hashed password

#### 3. User Can Login

The new user can now:
1. Go to `http://localhost:5173`
2. Enter their email
3. Enter the temporary password
4. System forces password change
5. Redirects to their role-specific dashboard

---

## Part 8: Verify Users Created Correctly

### Check in Super Admin Dashboard

**View All Users:**
1. Stay in "User Management" section
2. Scroll through the user table
3. You'll see all created users

**Filter by Institution:**
1. Use the **"Institution"** dropdown filter
2. Select **"Ethio Telecom"**
3. See only Ethio Telecom users

**Search by Name/Email:**
1. Use the search box at top
2. Type user name or email
3. Find specific user quickly

---

## Part 9: Database Verification (Optional)

### Check Database Directly

If you want to verify users are saved correctly:

**SQL Query:**
```sql
-- View all Ethio Telecom users
SELECT 
  u.full_name,
  u.email,
  u.role,
  u.employee_id,
  u.status,
  i.name_en as institution_name,
  i.code as institution_code,
  u.created_at
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel'
ORDER BY u.created_at DESC;
```

**Expected Result:**
```
full_name          | email                           | role                  | employee_id | status | institution_name | institution_code
-------------------|---------------------------------|-----------------------|-------------|--------|------------------|------------------
Tigist Haile       | tigist.haile@ethiotelecom.et   | INSTITUTION_MANAGER   | MGR-ET-001  | ACTIVE | Ethio Telecom    | ethiotel
Abebe Bekele       | abebe.bekele@ethiotelecom.et   | EMPLOYEE              | EMP-ET-001  | ACTIVE | Ethio Telecom    | ethiotel
Daniel Tesfaye     | daniel.tesfaye@ethiotelecom.et | ICT_STAFF             | ICT-ET-001  | ACTIVE | Ethio Telecom    | ethiotel
Sara Alemayehu     | sara.alemayehu@ethiotelecom.et | EMPLOYEE              | EMP-ET-002  | ACTIVE | Ethio Telecom    | ethiotel
```

---

## Part 10: Testing User Login

### Test Institution Manager Login

**Credentials:**
- Email: `tigist.haile@ethiotelecom.et`
- Password: `[temporary password from creation]`

**Expected Flow:**
1. Enter credentials
2. System: "Please change your password"
3. Enter new password (min 8 chars)
4. Redirects to **Institution Manager Dashboard**
5. Dashboard shows: "Ethio Telecom" institution
6. Can see services, applications, queue

### Test Employee Login

**Credentials:**
- Email: `abebe.bekele@ethiotelecom.et`
- Password: `[temporary password]`

**Expected Flow:**
1. Enter credentials
2. Change password
3. Redirects to **Employee Dashboard**
4. Dashboard shows Ethio Telecom context
5. Can manage their tasks

### Test ICT Staff Login

**Credentials:**
- Email: `daniel.tesfaye@ethiotelecom.et`
- Password: `[temporary password]`

**Expected Flow:**
1. Enter credentials
2. Change password
3. Redirects to **ICT Staff Dashboard**
4. Has technical troubleshooting tools
5. Sees Ethio Telecom data

---

## Part 11: Common Issues and Solutions

### Issue 1: "Invalid institution code"

**Cause:** Old bug (already fixed)  
**Solution:** Already fixed - dropdown now sends UUID correctly

### Issue 2: Blank screen in User Management

**Cause:** Old bug (already fixed)  
**Solution:** Already fixed - filter dropdown updated

### Issue 3: Can't find institution in dropdown

**Cause:** Institution not loaded  
**Solution:** 
1. Refresh page
2. Check backend is running
3. Check institutions seeded in database

### Issue 4: User not appearing in list

**Cause:** Page not refreshed  
**Solution:**
1. Refresh the page
2. Check filters (remove all filters)
3. Search by email

### Issue 5: Temporary password not working

**Cause:** Password expired or typo  
**Solution:**
1. Copy password exactly (with special characters)
2. Reset password if needed
3. Contact Super Admin for password reset

---

## Part 12: Best Practices

### Email Format

**Good Examples:**
- `firstname.lastname@ethiotelecom.et`
- `role.name@institutioncode.et`
- `name.dept@ethiotelecom.et`

**Avoid:**
- Personal emails (gmail.com, yahoo.com)
- Duplicate emails
- Invalid formats

### Employee ID Format

**Recommended Patterns:**
- `MGR-ET-001` (Manager, Ethio Telecom, sequence)
- `EMP-ET-001` (Employee, Ethio Telecom, sequence)
- `ICT-ET-001` (ICT Staff, Ethio Telecom, sequence)

**Benefits:**
- Easy to identify role
- Easy to identify institution
- Sequential numbering

### Phone Number Format

**Correct:**
- `+251911234567` (with country code)
- `+251922345678`

**Incorrect:**
- `0911234567` (missing country code)
- `911234567` (missing prefix)

---

## Part 13: Bulk User Creation Process

### If Creating Many Users

**Step 1:** Prepare list in Excel/Text
```
Name | Email | Phone | Role | Institution | Employee ID
-----|-------|-------|------|-------------|------------
User1 | email1 | phone1 | role1 | Ethio Telecom | ID1
User2 | email2 | phone2 | role2 | Ethio Telecom | ID2
...
```

**Step 2:** Create users one by one
- Open "Add User" form
- Copy-paste data from your list
- Create user
- Note temporary password
- Move to next user

**Step 3:** Document temporary passwords
```
User: tigist.haile@ethiotelecom.et
Temp Password: TempPass@2026
Created: 2026-08-24 10:30

User: abebe.bekele@ethiotelecom.et
Temp Password: SecurePass@2026
Created: 2026-08-24 10:32
...
```

**Step 4:** Share credentials securely
- Send via secure channel
- Don't email passwords
- Use encrypted messaging if possible

---

## Summary Checklist

### For Each User Creation:

- [ ] Login as Super Admin
- [ ] Navigate to User Management
- [ ] Click "Add User"
- [ ] Enter Full Name
- [ ] Enter Email (institution email preferred)
- [ ] Enter Phone Number (+251 format)
- [ ] Select Role from dropdown
- [ ] Select **"Ethio Telecom"** from Institution dropdown
- [ ] Enter Employee ID (unique)
- [ ] Set Status to "Active"
- [ ] Click "Create User"
- [ ] Copy temporary password
- [ ] Share password with user securely
- [ ] Verify user appears in list
- [ ] Test user login (optional)

### Success Indicators:

✅ Success message displayed  
✅ Temporary password shown  
✅ User appears in user list  
✅ User can login successfully  
✅ User sees correct dashboard  
✅ User sees Ethio Telecom institution  
✅ Database contains user record  
✅ All permissions work correctly  

---

## Quick Reference

**Super Admin Login:**
- Email: `superadmin@mesobcenter.et`
- Password: `SuperAdmin@2026`

**Frontend URL:** `http://localhost:5173`  
**Backend URL:** `http://localhost:5000`

**Institution:** Ethio Telecom  
**Roles Available:** Institution Manager, Employee, ICT Staff

**Support:**
- Check browser console (F12) for errors
- Check backend terminal for API errors
- Verify database contains institution data
- Refresh page if dropdown empty

---

**THE SYSTEM IS NOW READY TO CREATE USERS!** 🎉

All fixes applied, institution dropdowns work correctly, users save to database with proper institution IDs.
