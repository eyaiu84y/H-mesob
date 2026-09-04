# Announcement System - Complete Guide

## ✅ System Fixed

### 🔴 Error Fixed
**Error**: "Cannot read properties of undefined (reading 'success')"

**Location**: When clicking "Publish Announcement" button

**Fix Applied**: Updated `AnnouncementContext.jsx` to handle different API response formats

---

## 📋 How Announcement System Works

### 1. **Creating Announcements**

#### Who Can Create:
- ✅ **Institution Managers**: Can create announcements for their institution
- ✅ **MESOB Managers**: Can create announcements for all institutions
- ✅ **Super Admins**: Can create any announcement

#### Announcement Types (Scope):
1. **PUBLIC** - Visible to everyone including non-logged in users on main website
2. **INSTITUTION** - Visible only to users of specific institution
3. **CITIZENS** - Visible only to citizens
4. **STAFF** - Visible only to staff members

---

## 🌐 Where Announcements Display

### 1. **Main Website "Latest News" Section** ✅

**Location**: Home page (public, no login required)

**What Shows**:
- Only **PUBLIC** scope announcements
- Anyone can view without logging in
- Displayed in the News section

**How It Works**:
```javascript
// frontend/src/components/News.jsx
const publicAnnouncements = announcements.filter(a => a.scope === 'PUBLIC');
```

**Features**:
- ✅ Shows list of all public announcements
- ✅ Click to view full details on the right
- ✅ Shows title, content, date, publisher
- ✅ Auto-refreshes when new announcements published

### 2. **Citizen Dashboard "Announcements"** ✅

**Location**: Citizen Dashboard → Announcements section

**What Shows**:
- PUBLIC announcements
- CITIZENS scope announcements
- Announcements targeted to citizens

**Features**:
- ✅ List view with full details
- ✅ Click to expand and read full announcement
- ✅ Shows institution name, date, content

### 3. **Institution Manager Dashboard "Announcements"** ✅

**Location**: Institution Manager Dashboard → Announcements section

**What Shows**:
- PUBLIC announcements
- INSTITUTION scope (their institution only)
- STAFF scope announcements

**Features**:
- ✅ View announcements
- ✅ Create new announcements
- ✅ Edit/Delete own announcements
- ✅ Target specific audience (scope selection)

### 4. **MESOB Manager Dashboard "Announcements"** ✅

**Location**: MESOB Manager Dashboard → Announcements section

**What Shows**:
- All announcements (all scopes)
- System-wide announcements

**Features**:
- ✅ View all announcements
- ✅ Create system-wide announcements
- ✅ Manage any announcement
- ✅ Full control over announcement system

---

## 📝 Creating Public Announcements

### Step-by-Step Guide

#### For Institution Managers:

1. **Login** as Institution Manager
2. **Navigate** to Announcements section
3. **Click** "New Announcement" or "Create Announcement"
4. **Fill Form**:
   - **Title**: Short, descriptive title
   - **Content**: Full announcement message
   - **Audience (Scope)**: Select **"Public - Visible to everyone including citizens"**
   - **Date**: Publication date (optional)
5. **Click** "Publish Announcement"
6. **✅ Success**: Announcement now visible on main website

#### For MESOB Managers:

1. **Login** as MESOB Manager
2. **Navigate** to Announcements section
3. **Click** "Create Announcement"
4. **Fill Form**:
   - **Title**: Announcement title
   - **Content**: Full message
   - **Scope**: Select **"PUBLIC"**
   - **Institution**: Select target institution (optional)
5. **Click** "Publish"
6. **✅ Success**: Visible on main website immediately

---

## 🎯 Announcement Scopes Explained

### PUBLIC (Main Website Display)
**Who Sees**: Everyone (including non-logged in users)
**Where**: 
- ✅ Main website "Latest News"
- ✅ All dashboards
**Use Case**: 
- System-wide notifications
- Public service announcements
- Holiday schedules
- Important policy changes

### INSTITUTION
**Who Sees**: Only users of specific institution
**Where**: 
- ✅ Institution staff dashboards
- ✅ Citizens who use that institution
**Use Case**:
- Institution-specific updates
- Department news
- Internal policy changes

### CITIZENS
**Who Sees**: Only citizens
**Where**:
- ✅ Citizen dashboard only
**Use Case**:
- Citizen-specific instructions
- Application process updates
- Citizen portal features

### STAFF
**Who Sees**: Only staff members (employees, managers, ICT)
**Where**:
- ✅ Staff dashboards only
**Use Case**:
- Internal staff communications
- Training announcements
- System maintenance notices

---

## 🔧 Technical Implementation

### Backend API Endpoints

```javascript
// Get all announcements
GET /api/announcements
Response: { success: true, data: [...announcements] }

// Create announcement
POST /api/announcements
Body: {
  title: string,
  content: string,
  scope: 'PUBLIC' | 'INSTITUTION' | 'CITIZENS' | 'STAFF',
  institution_id: uuid (optional),
  published_at: date (optional)
}
Response: { success: true, data: {...announcement} }

// Update announcement
PUT /api/announcements/:id
Body: {...updates}
Response: { success: true, data: {...announcement} }

// Delete announcement
DELETE /api/announcements/:id
Response: { success: true, message: 'Deleted' }
```

### Frontend Components

**Main Website**:
- `frontend/src/components/News.jsx` - Public news display
- Filters by `scope === 'PUBLIC'`
- Auto-refreshes on load

**Dashboards**:
- `CitizenDashboard.jsx` - Citizen announcements
- `InstitutionManagerDashboard.jsx` - Manager announcements
- `MesobManagerDashboard.jsx` - System-wide announcements

**Context**:
- `frontend/src/context/AnnouncementContext.jsx` - State management
- Provides: `announcements`, `fetchAnnouncements`, `createAnnouncement`

---

## 🧪 Testing Checklist

### Test 1: Create Public Announcement
- [ ] Login as Institution Manager
- [ ] Go to Announcements
- [ ] Click "New Announcement"
- [ ] Fill title and content
- [ ] Select scope: "Public"
- [ ] Click "Publish Announcement"
- [ ] ✅ Should succeed (no error)
- [ ] Check main website
- [ ] ✅ Announcement should appear in "Latest News"

### Test 2: View on Main Website
- [ ] Open main website (logout or incognito)
- [ ] Scroll to "Latest News" section
- [ ] ✅ Should see public announcements
- [ ] Click on announcement
- [ ] ✅ Should show full content on right side

### Test 3: View in Citizen Dashboard
- [ ] Login as Citizen
- [ ] Go to Announcements section
- [ ] ✅ Should see PUBLIC and CITIZENS scope announcements
- [ ] Click to expand
- [ ] ✅ Should show full details

### Test 4: View in Manager Dashboard
- [ ] Login as Institution Manager
- [ ] Go to Announcements section
- [ ] ✅ Should see PUBLIC, INSTITUTION, STAFF announcements
- [ ] Can create new announcements
- [ ] Can edit/delete own announcements

### Test 5: Scope Filtering
- [ ] Create announcement with scope "INSTITUTION"
- [ ] Check main website
- [ ] ✅ Should NOT appear (not public)
- [ ] Check citizen dashboard
- [ ] ✅ Should appear only for that institution's citizens

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot read properties of undefined (reading 'success')"
**Status**: ✅ FIXED
**Solution**: Updated AnnouncementContext to handle response formats
**File**: `frontend/src/context/AnnouncementContext.jsx`

### Issue 2: Announcements not showing on main website
**Causes**:
1. Scope is not "PUBLIC"
2. Not published yet (published_at in future)
3. Frontend not fetching

**Solutions**:
1. Verify scope is exactly "PUBLIC" (uppercase)
2. Check published_at date
3. Refresh browser
4. Check browser console for errors

### Issue 3: Cannot create announcement
**Causes**:
1. User doesn't have permission
2. Required fields missing
3. Backend error

**Solutions**:
1. Verify user role (INSTITUTION_MANAGER or higher)
2. Fill all required fields (title, content, scope)
3. Check backend logs for detailed error

### Issue 4: Announcement shows for wrong audience
**Cause**: Scope set incorrectly

**Solution**: 
1. Edit announcement
2. Change scope to correct value
3. Save

---

## 📊 Database Schema

```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scope VARCHAR(50) NOT NULL, -- 'PUBLIC', 'INSTITUTION', 'CITIZENS', 'STAFF'
  institution_id UUID REFERENCES institutions(id),
  creator_id UUID REFERENCES users(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX idx_announcements_scope ON announcements(scope);
CREATE INDEX idx_announcements_published_at ON announcements(published_at DESC);
CREATE INDEX idx_announcements_institution ON announcements(institution_id);
```

---

## 🎨 UI/UX Features

### Main Website News Section
- ✅ Modern card design
- ✅ Left side: List of announcements
- ✅ Right side: Full content display
- ✅ Click to expand
- ✅ Shows publisher and date
- ✅ Responsive design

### Dashboard Announcements
- ✅ Badge indicating new/unread
- ✅ Priority highlighting
- ✅ Filter by scope
- ✅ Search functionality
- ✅ Create/Edit forms

---

## 🚀 Future Enhancements

### Phase 2
1. **Rich Text Editor**: Add formatting (bold, lists, links)
2. **Images**: Allow image attachments
3. **Notifications**: Push notifications for new announcements
4. **Email**: Send email notifications for important announcements

### Phase 3
1. **Scheduling**: Schedule announcements for future publish
2. **Expiry**: Auto-hide announcements after expiry date
3. **Analytics**: Track announcement views and engagement
4. **Multi-language**: Separate content for English and Amharic

---

## ✅ Current Status

**Working Features**:
- ✅ Create announcements (all roles)
- ✅ View announcements (all dashboards)
- ✅ Public announcements on main website
- ✅ Scope-based filtering
- ✅ Edit/Delete announcements
- ✅ Date display
- ✅ Publisher information

**Recently Fixed**:
- ✅ API response handling error
- ✅ AnnouncementContext response parsing

**Ready for Use**:
- ✅ Main website Latest News
- ✅ All dashboard announcement sections
- ✅ Full CRUD operations
- ✅ Multi-scope support

---

**Last Updated**: 2026-08-24
**Version**: 1.0.0
**Status**: ✅ Fully Operational
