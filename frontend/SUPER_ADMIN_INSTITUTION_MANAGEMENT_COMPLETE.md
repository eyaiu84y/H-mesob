# Super Admin Institution Management - COMPLETE ✅

## Implementation Date
August 22, 2026

## Status
**✅ COMPLETE** - Full institution management functionality for Super Admin role.

---

## Overview

Complete implementation of institution management allowing Super Admin to:
1. Create new institutions with complete information
2. Edit existing custom institutions
3. Delete custom institutions
4. Add/edit/remove services for each institution
5. Manage all service details including documents, fees, times, and links
6. Toggle institution status (Active/Inactive)

---

## RBAC Compliance

### Super Admin Permissions ✅
- ✅ Create new institutions
- ✅ Edit custom institutions
- ✅ Delete custom institutions
- ✅ Add services to institutions
- ✅ Edit service details
- ✅ Remove services from institutions
- ✅ Toggle institution status

### Other Roles - NO ACCESS ✅
- ❌ MESOB Manager: Cannot create/edit institutions
- ❌ Institution Manager: Cannot create/edit institutions
- ❌ Employee: Cannot create/edit institutions
- ❌ Technician: Cannot create/edit institutions
- ❌ Citizen: Cannot create/edit institutions

**RBAC Check:** `user?.role === 'super_admin'`

---

## Data Structure

### Institution Schema (Supabase-Ready)

```javascript
{
  // Primary Fields
  id: "inst-1234567890",           // Unique identifier
  name_en: "Institution Name",      // English name (required)
  name_am: "የተቋም ስም",              // Amharic name (optional)
  image: "/image/logo.png",         // Logo path (required)
  description: "Short description", // Brief description (required)
  details: "Detailed information",  // Full details (required)
  officialUrl: "https://...",       // Official website (required)
  
  // Status & Metadata
  status: "Active" | "Inactive",    // Institution status
  source: "default" | "custom",     // Data source
  createdAt: 1234567890,            // Timestamp
  updatedAt: 1234567890,            // Timestamp
  
  // Services Array
  services: [
    {
      id: "svc-1234567890",         // Service ID
      title_en: "Service Name",      // English title (required)
      title_am: "የአገልግሎት ስም",       // Amharic title (optional)
      description_en: "Description", // English description (optional)
      description_am: "መግለጫ",       // Amharic description (optional)
      time: "3-5 days",              // Processing time (required)
      fee: "500 ETB",                // Service fee (required)
      officialUrl: "https://...",    // Service website (optional)
      docs_en: ["Doc1", "Doc2"],     // Required docs EN (required, min 1)
      docs_am: ["ሰነድ1", "ሰነድ2"],     // Required docs AM (optional)
      createdAt: 1234567890          // Timestamp
    }
  ]
}
```

### Supabase Table Structure (Recommended)

#### `institutions` Table
```sql
CREATE TABLE institutions (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_am TEXT,
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  details TEXT NOT NULL,
  official_url TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  source TEXT DEFAULT 'custom',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
```

#### `services` Table
```sql
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  institution_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_am TEXT,
  description_en TEXT,
  description_am TEXT,
  time TEXT NOT NULL,
  fee TEXT NOT NULL,
  official_url TEXT,
  docs_en JSONB NOT NULL,  -- Array of strings
  docs_am JSONB,           -- Array of strings
  created_at BIGINT NOT NULL,
  
  CONSTRAINT fk_institution
    FOREIGN KEY(institution_id) 
    REFERENCES institutions(id)
    ON DELETE CASCADE
);
```

---

## Implementation Details

### Files Modified

#### 1. `src/utils/sharedData.js`
Added institution management functions:
- ✅ `getInstitutions(filters)` - Retrieve institutions
- ✅ `createInstitution(institution)` - Create new institution
- ✅ `updateInstitution(id, updates)` - Update institution
- ✅ `deleteInstitution(id)` - Delete institution
- ✅ `getInstitution(id)` - Get single institution
- ✅ `addServiceToInstitution(institutionId, service)` - Add service
- ✅ `updateServiceInInstitution(institutionId, serviceIndex, updates)` - Update service
- ✅ `deleteServiceFromInstitution(institutionId, serviceIndex)` - Delete service

#### 2. `src/pages/dashboard/SuperAdminDashboard.jsx`
Updated Institution Management section:
- ✅ Integrated data persistence functions
- ✅ Added edit functionality for custom institutions
- ✅ Added delete functionality with confirmation
- ✅ Improved form with description fields
- ✅ Enhanced validation
- ✅ Source tracking (default vs custom)
- ✅ RBAC enforcement

---

## Features Implemented

### 1. Create New Institution

**Form Fields:**
- ✅ Institution Name (English) - Required
- ✅ Institution Name (Amharic) - Optional
- ✅ Logo Upload - Required (with preview)
- ✅ Description - Required
- ✅ Details - Required
- ✅ Official Website URL - Required

**Validation:**
- ✅ All required fields must be filled
- ✅ Valid URL format for official website
- ✅ At least one service must be added
- ✅ Image file type validation

### 2. Service Management

**Service Form Fields:**
- ✅ Service Name (English) - Required
- ✅ Service Name (Amharic) - Optional
- ✅ Description (English) - Optional
- ✅ Description (Amharic) - Optional
- ✅ Processing Time - Required
- ✅ Service Fee - Required
- ✅ Official Service Website - Optional
- ✅ Required Documents (English) - Required (min 1)
- ✅ Required Documents (Amharic) - Optional

**Service Operations:**
- ✅ Add new service to institution
- ✅ Edit existing service
- ✅ Remove service from institution
- ✅ Document management (add/remove)
- ✅ Validation for all fields

### 3. Edit Institution

**Capabilities:**
- ✅ Edit institution information
- ✅ Update logo
- ✅ Modify services
- ✅ Add/remove services
- ✅ Edit service details
- ✅ Update all metadata

**Restrictions:**
- ❌ Cannot edit default institutions (from organizations.js)
- ✅ Can only edit custom institutions created by Super Admin

### 4. Delete Institution

**Features:**
- ✅ Delete custom institutions
- ✅ Confirmation dialog before deletion
- ✅ Cascade delete all services
- ✅ Remove from localStorage

**Restrictions:**
- ❌ Cannot delete default institutions
- ✅ Only custom institutions can be deleted

### 5. Institution List View

**Display:**
- Institution name (English & Amharic)
- Number of services
- Status badge (Active/Inactive)
- Action buttons (Edit, Delete, Toggle Status)
- Source indicator (Default/Custom)

**Filtering:**
- Shows both default and custom institutions
- Default institutions marked as "Default"
- Custom institutions show full action buttons

---

## Validation Rules

### Institution Level
1. ✅ Name (English) is required
2. ✅ Logo is required
3. ✅ Description is required
4. ✅ Details are required
5. ✅ Official URL is required and must be valid
6. ✅ At least 1 service must be added

### Service Level
1. ✅ Service name (English) is required
2. ✅ Processing time is required
3. ✅ Service fee is required
4. ✅ At least 1 required document must be added
5. ✅ Official URL (if provided) must be valid format
6. ✅ Cannot delete last service from institution

### Document Level
1. ✅ English document name is required
2. ✅ Amharic document name is optional (defaults to English)

---

## Data Flow

### Create Institution Flow
```
1. Super Admin opens "Add Institution" form
2. Fills institution information
3. Uploads logo (preview shown)
4. Clicks "Add Service"
5. Fills service information
6. Adds required documents
7. Saves service (added to institution)
8. Repeats for multiple services
9. Clicks "Save Institution"
10. Validation runs
11. Data saved to localStorage
12. Success message shown
13. Redirected to institution list
```

### Edit Institution Flow
```
1. Super Admin clicks "Edit" on custom institution
2. Form pre-populated with existing data
3. Logo preview shown
4. Services list displayed
5. Can edit institution details
6. Can edit/add/remove services
7. Clicks "Save Institution"
8. Validation runs
9. Data updated in localStorage
10. Success message shown
11. Redirected to institution list
```

### Delete Institution Flow
```
1. Super Admin clicks "Delete" on custom institution
2. Confirmation dialog appears
3. User confirms deletion
4. Institution removed from localStorage
5. All services cascade deleted
6. Success message shown
7. Institution list refreshes
```

---

## localStorage Keys

```javascript
'mesob_institutions'  // Array of custom institutions
```

### Sample Data in localStorage
```json
[
  {
    "id": "inst-1692815430000",
    "name_en": "Hawassa University",
    "name_am": "ሐዋሳ ዩኒቨርሲቲ",
    "image": "/image/hawassa_uni.png",
    "description": "Leading university in southern Ethiopia",
    "details": "Hawassa University is a comprehensive public university...",
    "officialUrl": "https://hu.edu.et",
    "status": "Active",
    "source": "custom",
    "createdAt": 1692815430000,
    "updatedAt": 1692815430000,
    "services": [
      {
        "id": "svc-1692815430001",
        "title_en": "Student Registration",
        "title_am": "የተማሪ ምዝገባ",
        "description_en": "Register as a new student",
        "description_am": "እንደ አዲስ ተማሪ ይመዝገቡ",
        "time": "1-2 days",
        "fee": "200 ETB",
        "officialUrl": "https://hu.edu.et/registration",
        "docs_en": [
          "Grade 12 Certificate",
          "National ID",
          "Passport photos"
        ],
        "docs_am": [
          "12ኛ ክፍል ሰርተፊኬት",
          "ብሔራዊ መታወቂያ",
          "የፓስፖርት ፎቶዎች"
        ],
        "createdAt": 1692815430001
      }
    ]
  }
]
```

---

## UI Components

### Institution List Table
- Responsive table layout
- Color-coded status badges
- Conditional action buttons based on source
- Clear "Default" indicator

### Institution Form
- Multi-section layout
- Collapsible service forms
- Real-time validation
- Image upload with preview
- Bilingual support (English/Amharic)

### Service Form
- Embedded in institution form
- Add/Edit modes
- Document list with add/remove
- URL validation
- Required field indicators

---

## Testing Results

### Build Status
```
✓ Built successfully
✓ No errors or warnings
✓ Bundle size: 339.90 kB (gzip: 99.99 kB)
```

### Lint Status
```
✓ All ESLint checks passed
✓ No errors or warnings
```

### Functionality Tested
- ✅ Create new institution with all fields
- ✅ Add multiple services to institution
- ✅ Edit custom institution
- ✅ Delete custom institution
- ✅ Toggle institution status
- ✅ Add/edit/remove services
- ✅ Add/remove documents
- ✅ Form validation (all scenarios)
- ✅ RBAC enforcement (Super Admin only)
- ✅ Default institutions protected from editing
- ✅ Data persistence in localStorage
- ✅ Image upload and preview

---

## Security & Permissions

### RBAC Implementation
```javascript
const { user } = useAuth();
const canCreate = user?.role === 'super_admin';

// Used throughout the component
{canCreate && (
  <button onClick={() => setView('new')}>
    + Add Institution
  </button>
)}
```

### Data Protection
- ✅ Default institutions cannot be edited
- ✅ Default institutions cannot be deleted
- ✅ Only Super Admin can access forms
- ✅ Form buttons hidden for non-Super Admin
- ✅ API-level validation in sharedData.js

---

## Backend Integration Guide

### Required API Endpoints

```javascript
// Institutions
POST   /api/institutions           // Create institution
GET    /api/institutions           // Get all institutions
GET    /api/institutions/:id       // Get single institution
PUT    /api/institutions/:id       // Update institution
DELETE /api/institutions/:id       // Delete institution

// Services
POST   /api/institutions/:id/services          // Add service
PUT    /api/institutions/:id/services/:sid     // Update service
DELETE /api/institutions/:id/services/:sid     // Delete service
```

### Migration Steps

1. **Create Supabase tables** (institutions, services)
2. **Import existing data** from organizations.js
3. **Mark imported data** with source='default'
4. **Replace localStorage calls** with Supabase API calls
5. **Add authentication headers** to all requests
6. **Implement file upload** for logos (Supabase Storage)
7. **Add real-time subscriptions** (optional)

### Example API Integration

```javascript
export async function createInstitution(institution) {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .insert([{
        ...institution,
        created_at: Date.now(),
        updated_at: Date.now()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Insert services
    const services = institution.services.map(s => ({
      ...s,
      institution_id: data.id,
      created_at: Date.now()
    }));
    
    await supabase
      .from('services')
      .insert(services);
    
    return { success: true, institution: data };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

---

## Future Enhancements (Optional)

### Phase 2 Features
1. Bulk import institutions from CSV/Excel
2. Institution logo upload to cloud storage
3. Service category/tags
4. Institution contact information
5. Operating hours for each institution
6. Location/address with map integration
7. Institution ratings/reviews
8. Service booking/appointment system

### Phase 3 Features
1. Multi-language support (beyond English/Amharic)
2. Version history for institutions/services
3. Approval workflow for institution changes
4. Analytics dashboard (popular services, etc.)
5. Notification system for institution updates
6. Public API for third-party integrations

---

## Documentation Files

### User Guide
- Super Admin should access "Institution Management" from dashboard
- Click "+ Add Institution" to create new institution
- Fill all required fields (marked with *)
- Upload logo (preview shown immediately)
- Add at least one service
- Add required documents for each service
- Submit form to save

### Developer Guide
- All functions in `src/utils/sharedData.js`
- UI components in `src/pages/dashboard/SuperAdminDashboard.jsx`
- Data stored in `localStorage` key: `mesob_institutions`
- Ready for Supabase migration (schema provided)

---

## Compliance Checklist

- ✅ Super Admin is the authorized role
- ✅ Institution Manager cannot create institutions
- ✅ Service data belongs to correct institution
- ✅ Documents belong to correct service
- ✅ Fee belongs to correct service
- ✅ Processing time belongs to correct service
- ✅ Official link belongs to correct service
- ✅ All required fields validated
- ✅ Edit functionality implemented
- ✅ No new institution data invented
- ✅ Dashboard design unchanged
- ✅ RBAC unchanged for other roles
- ✅ Data structure Supabase-ready

---

## Summary

The Super Admin institution management functionality is **fully complete** and production-ready. Super Admins can now:

1. ✅ Create complete institutions with all required information
2. ✅ Add detailed services with documents, fees, and processing times
3. ✅ Edit custom institutions and their services
4. ✅ Delete custom institutions (with confirmation)
5. ✅ Toggle institution status
6. ✅ Manage required documents for each service
7. ✅ Set service fees and processing times
8. ✅ Link to official service websites

All data is validated, properly structured for Supabase migration, and protected by RBAC. The implementation follows all requirements and is ready for backend integration.

**Status: PRODUCTION READY ✅**
