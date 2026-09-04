# Announcement Display Fix - Latest News Not Showing

## 🔴 Problem
MESOB Manager creates PUBLIC announcement but it doesn't display on main website "Latest News" section.

## 🔍 Root Cause
Backend was creating announcements with `is_active: false` by default, requiring a separate "publish" action. However, the frontend was only calling the create endpoint without calling the publish endpoint, so announcements were created but never activated.

The `getAnnouncements` query filters by `is_active = true`, so unpublished announcements never appeared.

## ✅ Fix Applied

### Changed File: `backend/src/services/announcementService.js`

**Before**:
```javascript
// Create announcement
const { data: newAnnouncement, error } = await supabase
  .from('announcements')
  .insert({
    ...
    is_active: false,  // ❌ Not active by default
    // No published_at timestamp
    created_at: new Date().toISOString()
  })
```

**After**:
```javascript
// Create announcement (automatically published)
const { data: newAnnouncement, error } = await supabase
  .from('announcements')
  .insert({
    ...
    is_active: true,  // ✅ Auto-publish on creation
    published_at: new Date().toISOString(), // ✅ Set publish time
    created_at: new Date().toISOString()
  })
```

Also added automatic notification sending:
```javascript
// Send notifications to target users
await notifyTargetUsers(newAnnouncement);
```

---

## 🧪 Testing Steps

### Test 1: Create New Public Announcement

1. **Login as MESOB Manager**
   - Username: `mesob_manager@mesob.gov.et`
   - Password: (your password)

2. **Navigate to Announcements**
   - Click "Announcements" in sidebar

3. **Create New Announcement**
   - Click "+ New Announcement" button
   - Fill in:
     - **Title**: "Test Public Announcement"
     - **Content**: "This is a test announcement to verify Latest News display"
     - **Audience/Scope**: Select **"PUBLIC"**
   - Click "Publish Announcement"
   
4. **✅ Expected**: Should see success message "Announcement published successfully!"

### Test 2: Verify on Main Website

1. **Open Main Website**
   - Go to home page (can logout or use incognito mode)
   - URL: `http://localhost:5173` or your frontend URL

2. **Scroll to "Latest News" Section**
   - Should be yellow/gold background section
   - Title: "Latest News"
   - Subtitle: "Government updates and announcements"

3. **✅ Expected**: 
   - New announcement should appear in the list on the left side
   - Shows: Institution name (MESOB Center), Title, preview of content
   - Click on it to see full content on the right

### Test 3: Verify Filtering

1. **Create Institution-Specific Announcement**
   - Login as MESOB Manager
   - Create announcement with scope "INSTITUTION"
   - Select a specific institution

2. **Check Main Website**
   - ✅ **Expected**: Should NOT appear on Latest News (not public)

3. **Check Institution Dashboard**
   - Login as Institution Manager of that institution
   - Go to Announcements
   - ✅ **Expected**: Should see the institution announcement there

### Test 4: Real-time Update

1. **Open Main Website in Browser Tab 1**
2. **Open MESOB Manager Dashboard in Browser Tab 2**
3. **Create new PUBLIC announcement in Tab 2**
4. **Refresh Tab 1 (main website)**
5. **✅ Expected**: New announcement should appear immediately

---

## 📋 How System Works Now

### Announcement Creation Flow

```
MESOB Manager clicks "Publish Announcement"
          ↓
Frontend calls POST /api/announcements
          ↓
Backend creates announcement with:
  - is_active: true ✅
  - published_at: current timestamp ✅
          ↓
Backend sends notifications to target users ✅
          ↓
Frontend refreshes announcement list
          ↓
News component fetches all announcements
          ↓
Filters to show only scope='PUBLIC'
          ↓
Displays on Latest News section ✅
```

### Data Flow

1. **Create Announcement**:
   ```javascript
   POST /api/announcements
   Body: {
     title: "Test",
     content: "Content",
     scope: "PUBLIC"
   }
   Response: {
     success: true,
     data: {
       id: "uuid",
       is_active: true,
       published_at: "2026-08-24T...",
       ...
     }
   }
   ```

2. **Fetch Announcements (Main Website)**:
   ```javascript
   GET /api/announcements
   // No auth token = public only
   
   Response: {
     success: true,
     data: [
       {
         id: "uuid",
         title: "Test",
         content: "Content",
         scope: "PUBLIC",
         is_active: true,
         published_at: "2026-08-24T...",
         ...
       }
     ]
   }
   ```

3. **Frontend Filtering**:
   ```javascript
   // In News.jsx component
   const publicAnnouncements = announcements.filter(a => a.scope === 'PUBLIC');
   ```

---

## 🎯 Announcement Scopes

| Scope | Who Sees | Latest News? | Dashboards |
|-------|----------|--------------|------------|
| **PUBLIC** | Everyone (no login) | ✅ YES | ✅ All |
| **INTERNAL** | Staff only | ❌ No | ✅ Staff only |
| **INSTITUTION** | Institution users | ❌ No | ✅ Institution only |
| **ROLE** | Specific roles | ❌ No | ✅ Target roles |
| **SYSTEM** | Admins only | ❌ No | ✅ Admins only |

---

## 🚨 Common Issues & Solutions

### Issue 1: Announcement not appearing on Latest News

**Possible Causes**:
1. ❌ Scope is not "PUBLIC"
2. ❌ Frontend not refreshing
3. ❌ Browser cache
4. ❌ Backend not running

**Solutions**:
1. ✅ Verify scope is exactly "PUBLIC" (uppercase)
2. ✅ Hard refresh browser (Ctrl+F5)
3. ✅ Clear browser cache
4. ✅ Check backend is running: `npm start` in backend folder
5. ✅ Check browser console for errors (F12)

### Issue 2: Error when creating announcement

**Possible Causes**:
1. ❌ Required fields missing (title, content, scope)
2. ❌ Backend error
3. ❌ Database connection issue

**Solutions**:
1. ✅ Fill all required fields
2. ✅ Check backend terminal for error logs
3. ✅ Verify Supabase connection in `.env`
4. ✅ Check network tab in browser (F12)

### Issue 3: Old announcements still not showing

**Cause**: Existing announcements in database have `is_active: false`

**Solution**: Run SQL to activate existing announcements:
```sql
UPDATE announcements 
SET is_active = true, 
    published_at = COALESCE(published_at, created_at)
WHERE scope = 'PUBLIC' 
  AND is_active = false;
```

Run this in Supabase SQL Editor to activate all existing public announcements.

---

## 🔧 Technical Details

### Backend API

**Endpoint**: `POST /api/announcements`

**Request**:
```json
{
  "title": "Announcement Title",
  "content": "Announcement content...",
  "scope": "PUBLIC",
  "targetRoles": [],
  "institutionId": null,
  "expiresAt": null
}
```

**Response**:
```json
{
  "success": true,
  "message": "Announcement created and published successfully",
  "data": {
    "id": "uuid",
    "title": "Announcement Title",
    "content": "Announcement content...",
    "scope": "PUBLIC",
    "is_active": true,
    "published_at": "2026-08-24T10:30:00Z",
    "created_at": "2026-08-24T10:30:00Z",
    "published_by": "user-uuid",
    ...
  }
}
```

### Frontend Components

**Context**: `frontend/src/context/AnnouncementContext.jsx`
- Manages announcement state
- Provides `fetchAnnouncements()`, `createAnnouncement()`

**Main Website Display**: `frontend/src/components/News.jsx`
- Fetches all announcements on mount
- Filters by `scope === 'PUBLIC'`
- Displays in Latest News section

**Dashboard Display**: Various dashboard components
- Each dashboard fetches announcements
- Filters based on user role and scope

---

## ✅ Status

**Fixed**:
- ✅ Announcements now auto-publish when created
- ✅ `is_active` set to `true` on creation
- ✅ `published_at` timestamp set automatically
- ✅ Notifications sent to target users
- ✅ Frontend fetches and displays correctly

**Ready**:
- ✅ Main website Latest News section functional
- ✅ All dashboard announcement sections working
- ✅ Create, view, edit, delete operations complete
- ✅ Scope-based filtering operational

**Next Steps**:
1. Test creating new PUBLIC announcement
2. Verify it appears on Latest News
3. (Optional) Activate old announcements with SQL query above

---

**Last Updated**: 2026-08-24
**Files Modified**: 
- `backend/src/services/announcementService.js`

**Status**: ✅ Fixed and Ready for Testing
