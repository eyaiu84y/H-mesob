# Quick User Creation Reference Card

## 🚀 Quick Start

### 1. Login as Super Admin
- **URL:** `http://localhost:5173`
- **Email:** `superadmin@mesobcenter.et`
- **Password:** `SuperAdmin@2026`

### 2. Go to User Management
- Click **"User Management"** in left sidebar

### 3. Click "Add User" Button

---

## 📋 Example: Create Users for Ethio Telecom

### Institution Manager
```
Full Name:        Tigist Haile
Email:            tigist.haile@ethiotelecom.et
Phone:            +251922345678
Role:             Institution Manager
Institution:      Ethio Telecom (select from dropdown)
Employee ID:      MGR-ET-001
Status:           Active
```
**Click "Create User"** → Copy temporary password

---

### Employee #1
```
Full Name:        Abebe Bekele
Email:            abebe.bekele@ethiotelecom.et
Phone:            +251911234567
Role:             Employee
Institution:      Ethio Telecom
Employee ID:      EMP-ET-001
Status:           Active
```
**Click "Create User"** → Copy temporary password

---

### ICT Staff
```
Full Name:        Daniel Tesfaye
Email:            daniel.tesfaye@ethiotelecom.et
Phone:            +251933456789
Role:             ICT Staff
Institution:      Ethio Telecom
Employee ID:      ICT-ET-001
Status:           Active
```
**Click "Create User"** → Copy temporary password

---

### Employee #2
```
Full Name:        Sara Alemayehu
Email:            sara.alemayehu@ethiotelecom.et
Phone:            +251944567890
Role:             Employee
Institution:      Ethio Telecom
Employee ID:      EMP-ET-002
Status:           Active
```
**Click "Create User"** → Copy temporary password

---

## ✅ Success Checklist

After creating each user:
- [ ] Success message appears
- [ ] Temporary password displayed
- [ ] User appears in user list
- [ ] Note temporary password for the user

---

## 🔐 Test User Login

### Example: Test Institution Manager
1. **Logout** from Super Admin
2. **Login** with new user:
   - Email: `tigist.haile@ethiotelecom.et`
   - Password: `[temporary password]`
3. System prompts: **"Change password"**
4. Enter new password
5. Redirects to **Institution Manager Dashboard**
6. Should see "Ethio Telecom" institution

---

## 🏢 All Available Institutions

Create users for any of these:

1. National ID Program / Fayda
2. Commercial Bank of Ethiopia
3. **Ethio Telecom** ⭐
4. Ethiopian Electric Utility
5. Labor and Skills Bureau
6. Revenues Bureau
7. Trade Bureau
8. Ethiopian Postal Service
9. Ministry of Justice
10. Investment Commission
11. Construction Authority
12. Sidama Bank

---

## 📝 Template for More Users

Copy this template:

```
Full Name:        [Enter Name]
Email:            [name]@ethiotelecom.et
Phone:            +2519[xxxxxxxx]
Role:             [Select: Institution Manager / Employee / ICT Staff]
Institution:      Ethio Telecom
Employee ID:      [EMP/MGR/ICT]-ET-[###]
Status:           Active
```

---

## ⚠️ Important Notes

### Institution Selection
- ✅ **Just select "Ethio Telecom" from dropdown**
- ✅ System automatically uses correct institution ID
- ✅ No manual UUID entry needed
- ✅ Works perfectly after recent fixes

### Employee ID Format
- **Manager:** `MGR-ET-001`, `MGR-ET-002`...
- **Employee:** `EMP-ET-001`, `EMP-ET-002`...
- **ICT Staff:** `ICT-ET-001`, `ICT-ET-002`...

### Phone Number Format
- ✅ Correct: `+251911234567` (with +251)
- ❌ Wrong: `0911234567` (missing country code)

### Email Format
- ✅ Correct: `firstname.lastname@ethiotelecom.et`
- ✅ Correct: `name.dept@ethiotelecom.et`
- ❌ Avoid: `personal@gmail.com`

---

## 🔍 Verify Users Created

### In Super Admin Dashboard

**View all users:**
- Stay in "User Management" section
- Scroll through user table

**Filter by institution:**
1. Use "Institution" dropdown filter
2. Select "Ethio Telecom"
3. See only Ethio Telecom users

**Search specific user:**
- Type name or email in search box

---

## 🗄️ Database Verification (Optional)

Check users in database:

```sql
SELECT 
  u.full_name,
  u.email,
  u.role,
  i.name_en as institution,
  u.employee_id,
  u.status
FROM users u
JOIN institutions i ON u.institution_id = i.id
WHERE i.code = 'ethiotel'
ORDER BY u.created_at DESC;
```

Expected to see all created Ethio Telecom users.

---

## 🎯 Quick Troubleshooting

**Issue:** Dropdown doesn't show institutions  
**Fix:** Refresh page, check backend running

**Issue:** "Invalid institution code" error  
**Fix:** Already fixed - just refresh browser (Ctrl+Shift+R)

**Issue:** User not in list  
**Fix:** Remove all filters, refresh page

**Issue:** Can't login with new user  
**Fix:** Check email exact, use temporary password exactly as shown

---

## 📞 Support Checklist

If something doesn't work:

1. Check both servers running:
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:5173`

2. Check browser console (F12) for errors

3. Check backend terminal for API errors

4. Refresh browser (Ctrl+Shift+R)

5. Verify institution dropdown shows all 12 institutions

---

## ✨ System Status

- ✅ User creation: **WORKING**
- ✅ Institution dropdown: **FIXED**
- ✅ User Management section: **FIXED**
- ✅ Database saving: **WORKING**
- ✅ All roles: **WORKING**
- ✅ All institutions: **ACTIVE**

**Everything is ready to use!** 🎉

---

## 🎓 For More Details

See complete guide: `SUPER_ADMIN_USER_CREATION_GUIDE.md`
