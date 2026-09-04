# Announcement Edit & Delete Feature - Complete Guide

## ✅ Feature Status: IMPLEMENTED

Yes, **MESOB Manager**, **Super Admin**, and **Institution Manager** CAN update and delete announcements!

---

## 🔐 Permissions & Authorization

### Who Can Edit/Delete Announcements?

| Role | Can Edit/Delete |
|------|-----------------|
| **SUPER_ADMIN** | ✅ ALL announcements (system-wide) |
| **MESOB_MANAGER** | ✅ ALL announcements (system-wide) |
| **INSTITUTION_MANAGER** | ✅ Only THEIR OWN announcements (ones they created) |
| **Employee** | ❌ No edit/delete permissions |
| **Citizen** | ❌ No edit/delete permissions |

### Authorization Rules (Backend)

**Update Announcement**:
```javascript
// Can update if:
// 1. You are the creator (published_by === currentUser.id)
// 2. OR you are SUPER_ADMIN
// 3. OR you are MESOB_MANAGER
```

**Delete Announcement**:
```javascript
// Can delete if:
// 1. You are the creator (published_by === currentUser.id)
// 2. OR you are SUPER_ADMIN
// 3. OR you are MESOB_MANAGER
```

---

## 📝 How to Edit an Announcement

### For MESOB Manager / Super Admin:

1. **Login** to your dashboard
   - MESOB Manager: `mesob_manager@mesob.gov.et`
   - Super Admin: `admin@mesobcenter.et`

2. **Navigate to Announcements**
   - Click "Announcements" in the sidebar

3. **View Announcement Details**
   - Click on any announcement in the list
   - The detail view opens

4. **Click "Edit" Button**
   - Button appears in top-right corner (next to "Active" badge)
   - Only visible if you have permission to edit

5. **Update the Announcement**
   - Modify Title
   - Modify Content
   - Change Audience/Scope
   - Change Target Roles (if scope is ROLE)

6. **Click "Update Announcement"**
   - Changes are saved immediately
   - Success message appears
   - Returns to announcement list

### For Institution Manager:

**Same steps as above**, BUT:
- ✅ Can only edit announcements YOU created
- ❌ Cannot edit announcements created by others
- "Edit" button only appears on YOUR announcements

---

## 🗑️ How to Delete an Announcement

### For MESOB Manager / Super Admin:

1. **Login** to your dashboard

2. **Navigate to Announcements** → Click on announcement

3. **Click "Delete" Button**
   - Button appears in top-right corner (red text)
   - Only visible if you have permission

4. **Confirm Deletion**
   - Confirmation dialog appears:
     ```
     Are you sure you want to delete "[Announcement Title]"?
     
     This action cannot be undone.
     ```

5. **Click "OK"**
   - Announcement is permanently deleted
   - Success message appears
   - Returns to announcement list

### For Institution Manager:

- ✅ Can only delete announcements YOU created
- ❌ Cannot delete announcements created by others

---

## 🎨 UI Components

### Announcement Detail View

```
┌────────────────────────────────────────────────────────┐
│ ← Back to Announcements                                │
├────────────────────────────────────────────────────────┤
│ Announcement Title              [Active] [Edit] [Delete]│
│ Aug 24, 2026 • Created by John Doe                     │
├────────────────────────────────────────────────────────┤
│ This is the announcement content...                    │
│                                                        │
├────────────────────────────────────────────────────────┤
│ Scope: PUBLIC                                          │
└────────────────────────────────────────────────────────┘
```

### Buttons

**Edit Button**:
- Text: "Edit"
- Color: Blue (`text-blue-600`)
- Hover: Light blue background (`hover:bg-blue-50`)
- Only visible if user can modify

**Delete Button**:
- Text: "Delete"
- Color: Red (`text-red-600`)
- Hover: Light red background (`hover:bg-red-50`)
- Only visible if user can modify

---

## 🔧 Technical Implementation

### Backend API Endpoints

**Update Announcement**:
```http
PATCH /api/announcements/:id
Authorization: Bearer <token>

Body:
{
  "title": "Updated Title",
  "content": "Updated content...",
  "scope": "PUBLIC",
  "targetRoles": [],
  "institutionId": null,
  "expiresAt": null
}

Response:
{
  "success": true,
  "message": "Announcement updated successfully",
  "data": { ... }
}
```

**Delete Announcement**:
```http
DELETE /api/announcements/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Announcement deleted successfully"
}
```

### Frontend Context Methods

**AnnouncementContext.jsx**:
```javascript
const {
  updateAnnouncement,  // Update function
  deleteAnnouncement   // Delete function
} = useAnnouncements();

// Update announcement
const result = await updateAnnouncement(announcementId, {
  title: "New Title",
  content: "New content",
  scope: "PUBLIC"
});

// Delete announcement
const result = await deleteAnnouncement(announcementId);
```

### Permission Check Function

```javascript
function canModify(announcement) {
  // Super Admin and MESOB Manager can modify all
  if (['SUPER_ADMIN', 'MESOB_MANAGER'].includes(user?.role)) {
    return true;
  }
  
  // Others can only modify their own
  return announcement.creator?.id === user?.id || 
         announcement.published_by === user?.id;
}
```

---

## 🧪 Testing Steps

### Test 1: Edit as MESOB Manager

1. **Login as MESOB Manager**
2. **Go to Announcements**
3. **Click on any announcement**
4. **Verify "Edit" button appears**
5. **Click "Edit"**
6. **Change title and content**
7. **Click "Update Announcement"**
8. **✅ Expected**: Success message, changes saved

### Test 2: Delete as MESOB Manager

1. **Click on an announcement**
2. **Verify "Delete" button appears**
3. **Click "Delete"**
4. **Verify confirmation dialog**
5. **Click "OK"**
6. **✅ Expected**: Announcement deleted, returns to list

### Test 3: Edit Own Announcement as Institution Manager

1. **Login as Institution Manager**
2. **Create new announcement**
3. **Click on the announcement you just created**
4. **✅ Expected**: "Edit" and "Delete" buttons appear
5. **Edit the announcement**
6. **✅ Expected**: Changes saved successfully

### Test 4: Cannot Edit Others' Announcements (Institution Manager)

1. **Login as Institution Manager**
2. **View announcement created by MESOB Manager**
3. **✅ Expected**: NO "Edit" or "Delete" buttons
4. **✅ Expected**: Only "Back" button available

### Test 5: Edit Button Conditional Display

1. **Login as different roles**
2. **Check announcement details**
3. **✅ Expected**:
   - MESOB Manager: Sees Edit/Delete on ALL
   - Super Admin: Sees Edit/Delete on ALL
   - Institution Manager: Sees Edit/Delete ONLY on own
   - Others: NO Edit/Delete buttons

---

## 📋 Features Added

### AnnouncementContext (Frontend)

**New Methods**:
- ✅ `updateAnnouncement(id, data)` - Update announcement
- ✅ `deleteAnnouncement(id)` - Delete announcement

### MESOB Manager Dashboard

**Edit Feature**:
- ✅ "Edit" button in detail view
- ✅ Opens edit form with pre-filled data
- ✅ "Update Announcement" button
- ✅ Success/error messages
- ✅ Returns to list after update

**Delete Feature**:
- ✅ "Delete" button in detail view
- ✅ Confirmation dialog before delete
- ✅ Permanent deletion
- ✅ Success message
- ✅ Returns to list after delete

**Permission Checking**:
- ✅ `canModify()` function checks permissions
- ✅ Buttons only show when allowed
- ✅ Works for all user roles

---

## 🔒 Security Features

### Backend Authorization

**Checks Before Update**:
1. ✅ Announcement exists
2. ✅ User is authenticated
3. ✅ User is creator OR admin/MESOB manager
4. ✅ Updates only allowed fields

**Checks Before Delete**:
1. ✅ Announcement exists
2. ✅ User is authenticated
3. ✅ User is creator OR admin/MESOB manager
4. ✅ Deletion is permanent (no soft delete)

### Frontend Validation

**Edit Form Validation**:
- ✅ Title required
- ✅ Content required
- ✅ Scope required
- ✅ Target roles required (if scope is ROLE)

**Permission Display**:
- ✅ Buttons hidden if no permission
- ✅ Check happens before API call
- ✅ Backend validates again

---

## 🚨 Common Issues & Solutions

### Issue 1: "Edit" button not showing

**Causes**:
1. You don't have permission
2. You're not the creator (Institution Manager)
3. Frontend not checking permissions correctly

**Solutions**:
1. Check your role in profile
2. Check who created the announcement
3. MESOB Manager/Super Admin can edit all
4. Institution Manager can only edit own

### Issue 2: Cannot update announcement

**Error**: "You do not have permission to update this announcement."

**Cause**: Backend authorization failed

**Solutions**:
1. Verify you're the creator
2. Verify your role is SUPER_ADMIN or MESOB_MANAGER
3. Check token is valid (not expired)

### Issue 3: Delete confirmation not appearing

**Cause**: JavaScript confirm dialog blocked by browser

**Solution**: 
- Check browser popup settings
- Allow dialogs for this site

### Issue 4: Changes not reflecting after update

**Cause**: Frontend not refreshing data

**Solution**:
- Page should auto-refresh announcements
- Try manual page reload (F5)
- Check network tab for API response

---

## 📊 Data Flow

### Edit Flow

```
User clicks "Edit"
      ↓
Load announcement into form
      ↓
User modifies fields
      ↓
User clicks "Update"
      ↓
Frontend validates
      ↓
API PATCH /announcements/:id
      ↓
Backend checks permissions
      ↓
Backend updates database
      ↓
Backend logs audit
      ↓
Response with success
      ↓
Frontend refreshes list
      ↓
Show success message
```

### Delete Flow

```
User clicks "Delete"
      ↓
Show confirmation dialog
      ↓
User confirms
      ↓
API DELETE /announcements/:id
      ↓
Backend checks permissions
      ↓
Backend deletes from database
      ↓
Backend logs audit
      ↓
Response with success
      ↓
Frontend removes from list
      ↓
Show success message
```

---

## 📝 Audit Logging

All edit and delete actions are logged:

**Update Action**:
```javascript
{
  user_id: "user-uuid",
  action: "ANNOUNCEMENT_UPDATE",
  details: "Updated announcement: [Title]",
  created_at: "2026-08-24T10:30:00Z"
}
```

**Delete Action**:
```javascript
{
  user_id: "user-uuid",
  action: "ANNOUNCEMENT_DELETE",
  details: "Deleted announcement: [Title]",
  created_at: "2026-08-24T10:30:00Z"
}
```

---

## ✅ Status

**Backend**:
- ✅ Update API endpoint working
- ✅ Delete API endpoint working
- ✅ Authorization rules implemented
- ✅ Audit logging enabled

**Frontend**:
- ✅ AnnouncementContext has update/delete methods
- ✅ MESOB Manager dashboard has Edit/Delete UI
- ✅ Permission checking implemented
- ✅ Confirmation dialogs working

**Permissions**:
- ✅ SUPER_ADMIN can edit/delete all
- ✅ MESOB_MANAGER can edit/delete all
- ✅ INSTITUTION_MANAGER can edit/delete own
- ✅ Others cannot edit/delete

---

## 🚀 Future Enhancements

### Phase 1: UI Improvements
- Add inline editing (edit directly in detail view)
- Add bulk delete (select multiple and delete)
- Add undo delete (soft delete with restore)

### Phase 2: Advanced Features
- Version history (track all changes)
- Schedule updates (update at specific time)
- Draft mode (save without publishing)

### Phase 3: Collaboration
- Multiple editors approval workflow
- Comments on announcements
- Change notifications to affected users

---

**Last Updated**: 2026-08-24
**Files Modified**: 
- `frontend/src/context/AnnouncementContext.jsx`
- `frontend/src/pages/dashboard/MesobManagerDashboard.jsx`

**Status**: ✅ Fully Implemented and Ready to Use
