# Announcement Edit/Delete Buttons Not Showing - Troubleshooting

## 🔴 Problem
Edit and Delete buttons are not appearing in the announcement detail view for MESOB Manager.

## 🔍 Debugging Steps

### Step 1: Check Browser Console

1. **Open Developer Tools** (F12 or Right-click → Inspect)
2. **Go to Console tab**
3. **Click on an announcement** to view details
4. **Look for debug logs**:
   ```
   canModify check: {
     userRole: "MESOB_MANAGER",
     announcementCreator: "...",
     announcementPublishedBy: "...",
     userId: "..."
   }
   User is admin/manager - can modify all
   ```

### Step 2: Verify User Role

**Check in console**:
```javascript
// The userRole should be one of:
"MESOB_MANAGER"
"SUPER_ADMIN"
"INSTITUTION_MANAGER"
```

**If it shows something else** (like "MESOB Manager" with spaces or different case):
- The role format doesn't match
- Need to update the check

### Step 3: Hard Refresh Browser

The new code might not be loaded yet:

**Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
**Mac**: `Cmd + Shift + R`

This clears the cache and reloads all JavaScript files.

---

## 🔧 Quick Fixes

### Fix 1: Browser Cache Issue

**Problem**: Old JavaScript still running

**Solution**:
1. Hard refresh: `Ctrl + Shift + R`
2. Or clear browser cache completely
3. Or open in Incognito/Private mode

### Fix 2: Role Name Mismatch

**Problem**: User role doesn't match expected format

**Check actual role value**:
1. Open Console (F12)
2. Type: `JSON.parse(localStorage.getItem('user')).role`
3. Check the output

**If role is different** (e.g., "Mesob Manager" instead of "MESOB_MANAGER"):

Update the check in code:
```javascript
if ([
  'SUPER_ADMIN', 
  'MESOB_MANAGER', 
  'Mesob Manager',  // Add variations
  'Super Admin'
].includes(user?.role)) {
  return true;
}
```

### Fix 3: User Object Not Available

**Problem**: `user` is null or undefined

**Check**:
```javascript
// In console:
console.log(user);
```

**If null**: AuthContext not providing user

**Solution**: Check AuthContext is properly set up

---

## 📝 Manual Verification Checklist

### ✅ Code is Present

Check the file has the buttons:
```bash
grep -n "Edit.*Delete" frontend/src/pages/dashboard/MesobManagerDashboard.jsx
```

Should show lines with Edit and Delete buttons.

### ✅ Function Exists

Check `canModify` function exists:
```bash
grep -n "function canModify" frontend/src/pages/dashboard/MesobManagerDashboard.jsx
```

### ✅ User is Imported

Check `useAuth` is imported and used:
```bash
grep -n "useAuth" frontend/src/pages/dashboard/MesobManagerDashboard.jsx
```

Should show:
```javascript
import { useAuth } from '../../context/AuthContext';
const { user } = useAuth();
```

---

## 🧪 Test with Console Commands

### Test 1: Check User Object

Open Console and run:
```javascript
// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user);
console.log('Role:', user.role);
```

Expected output for MESOB Manager:
```javascript
{
  id: "some-uuid",
  role: "MESOB_MANAGER",
  email: "mesob_manager@mesob.gov.et",
  ...
}
```

### Test 2: Check Announcement Data

```javascript
// This will show announcement structure
const announcements = /* from React DevTools or API call */;
console.log('Announcement:', announcements[0]);
console.log('Creator:', announcements[0].creator);
console.log('Published by:', announcements[0].published_by);
```

### Test 3: Manually Test canModify Logic

```javascript
const user = { role: 'MESOB_MANAGER', id: 'user-123' };
const ann = { published_by: 'other-456' };

const canModify = ['SUPER_ADMIN', 'MESOB_MANAGER'].includes(user.role);
console.log('Can modify:', canModify);  // Should be true
```

---

## 🔄 Complete Reset Instructions

If buttons still don't show, try complete reset:

### Step 1: Kill Frontend Process
```bash
# Windows
taskkill /F /IM node.exe

# Or just Ctrl+C in the terminal running frontend
```

### Step 2: Clear Cache
```bash
# In frontend directory
rm -rf node_modules/.vite
# or
rmdir /s /q node_modules\.vite
```

### Step 3: Restart Frontend
```bash
cd frontend
npm run dev
```

### Step 4: Hard Refresh Browser
- Clear all site data
- Or use Incognito mode
- `Ctrl + Shift + R`

---

## 🐛 Common Issues

### Issue 1: Buttons Show But Don't Work

**Symptoms**: Buttons appear but clicking does nothing

**Check**:
1. Console for errors
2. `handleEdit` and `handleDelete` functions exist
3. `updateAnnouncement` and `deleteAnnouncement` methods in context

**Fix**: Ensure AnnouncementContext has these methods

### Issue 2: Buttons Show for Wrong Users

**Symptoms**: Regular users see Edit/Delete buttons

**Check**: `canModify` function logic

**Fix**: Ensure proper role checking

### Issue 3: Cannot Update After Edit

**Symptoms**: Edit form works but update fails

**Check**:
1. Network tab - API call status
2. Backend logs
3. Authorization headers

**Fix**: Check backend authorization rules

---

## 📊 Expected Behavior

### For MESOB Manager (viewing ANY announcement):

```
┌────────────────────────────────────────────┐
│ ← Back to Announcements                    │
├────────────────────────────────────────────┤
│ Announcement Title    [Active] [Edit] [Delete] │
│ Date • Creator Name                        │
├────────────────────────────────────────────┤
│ Content here...                            │
└────────────────────────────────────────────┘
```

Buttons should be:
- ✅ **Edit**: Blue text, hover effect
- ✅ **Delete**: Red text, hover effect
- ✅ Both clickable and functional

### For Institution Manager (viewing OWN announcement):

Same as above - Edit and Delete buttons appear

### For Institution Manager (viewing OTHERS' announcement):

```
┌────────────────────────────────────────────┐
│ ← Back to Announcements                    │
├────────────────────────────────────────────┤
│ Announcement Title              [Active]   │  ← No Edit/Delete
│ Date • Creator Name                        │
├────────────────────────────────────────────┤
│ Content here...                            │
└────────────────────────────────────────────┘
```

No Edit/Delete buttons for others' announcements.

---

## 🔍 Debug Output Interpretation

### Good Output (Buttons Should Show):

```javascript
canModify check: {
  userRole: "MESOB_MANAGER",
  announcementCreator: "abc-123",
  announcementPublishedBy: "abc-123",
  userId: "xyz-789"
}
User is admin/manager - can modify all
```

Result: `canModify = true` → Buttons appear ✅

### Bad Output (Buttons Won't Show):

```javascript
canModify check: {
  userRole: undefined,  // ❌ User not loaded
  announcementCreator: "abc-123",
  announcementPublishedBy: "abc-123",
  userId: undefined
}
Is owner: false
```

Result: `canModify = false` → No buttons ❌

---

## ✅ Verification Steps

After applying fixes:

1. **Hard refresh browser** (`Ctrl + Shift + R`)
2. **Login as MESOB Manager**
3. **Go to Announcements**
4. **Click any announcement**
5. **Check for Edit and Delete buttons** next to "Active" badge
6. **Click Edit** → Should open edit form
7. **Click Delete** → Should show confirmation
8. **Check console** → Should see debug logs

---

## 🚀 Quick Test Script

Paste this in browser console to test:

```javascript
// Quick test
const testUser = { role: 'MESOB_MANAGER', id: 'test-123' };
const testAnn = { published_by: 'other-456', creator: { id: 'other-456' } };

function canModify(ann, user) {
  if (['SUPER_ADMIN', 'MESOB_MANAGER'].includes(user?.role)) {
    return true;
  }
  return ann.creator?.id === user?.id || ann.published_by === user?.id;
}

console.log('Test result:', canModify(testAnn, testUser));
// Should output: true
```

If this outputs `false`, the role check isn't working.

---

**Last Updated**: 2026-08-24
**Status**: Troubleshooting Guide

**Next Steps**:
1. Hard refresh browser
2. Check console logs
3. Verify user role format
4. Restart frontend if needed
