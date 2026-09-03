# Quick Fix Guide - SuperAdminDashboard.jsx

## Summary
The `SuperAdminDashboard.jsx` file currently has undefined references after cleaning up `sharedData.js`. Here are the exact fixes needed.

## Files Already Fixed ✅
- ✅ `sharedData.js` - Cleaned (600+ lines → 40 lines)
- ✅ `ICTStaffDashboard.jsx` - Updated imports
- ✅ `InstitutionManagerDashboard.jsx` - Updated imports
- ✅ `MesobManagerDashboard.jsx` - Updated imports and logic
- ✅ `SuperAdminDashboard.jsx` Lines 75, 122, 181 - Fixed to use `institutions` from `useServices()`

## Still Needs Fixes in SuperAdminDashboard.jsx

### Lines with Errors (Still Undefined):

**Run this command to see the errors:**
```bash
cd frontend/src/pages/dashboard
grep -n "getInstitutions\|createInstitution\|updateInstitution\|deleteInstitution\|organizationsData" SuperAdminDashboard.jsx
```

### Fix 1: Line ~956 - updateInstitution() in saveInstitution function

**Find (around line 951-956):**
```javascript
        result = updateInstitution(editingInstitution.id, institutionData);
        if (result.success) {
          const customInsts = getInstitutions();
          const allInsts = [
            ...organizationsData.map(o => ({ ...o, status: 'Active', source: 'default' })),
```

**Replace with:**
```javascript
        try {
          const response = await api.patch(`/institutions/${editingInstitution.id}`, institutionData);
          if (response.success) {
            // ServiceContext will auto-refresh
            alert('Institution updated successfully!');
```

**AND** change the function signature on line ~920:
```javascript
// BEFORE:
  function saveInstitution(e) {

// AFTER:
  async function saveInstitution(e) {
```

### Fix 2: Line ~968 - createInstitution() in saveInstitution function

**Find (around line 962-970):**
```javascript
      result = createInstitution(institutionData);
      if (result.success) {
        const customInsts = getInstitutions();
        const allInsts = [
          ...organizationsData.map(o => ({ ...o, status: 'Active', source: 'default' })),
          ...customInsts.map(o => ({ ...o, source: 'custom' }))
        ];
        setInstitutions(allInsts);
      }
```

**Replace with:**
```javascript
      try {
        const response = await api.post('/institutions', institutionData);
        if (response.success) {
          // ServiceContext will auto-refresh
          alert('Institution created successfully!');
          setView('list');
          setEditingInstitution(null);
          setForm({
            name_en: '',
            name_am: '',
            image: '',
            imagePreview: '',
            description: '',
            details: '',
            officialUrl: '',
            services: [],
          });
        } else {
          setFormError(response.message || 'Failed to create institution');
        }
      } catch (error) {
        setFormError(error.message || 'Failed to create institution');
      }
```

### Fix 3: Line ~1020 - updateInstitution() in toggleStatus function

**Find (around line 1015-1020):**
```javascript
  function toggleStatus(id) {
    const institution = institutions.find(i => i.id === id);
    if (!institution) return;
    const newStatus = institution.status === 'Active' ? 'Inactive' : 'Active';
    // Update status in memory for both default and custom institutions
    setInstitutions(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    // If custom institution, persist to localStorage
    if (institution.source === 'custom') {
      updateInstitution(id, { status: newStatus });
    }
  }
```

**Replace with:**
```javascript
  async function toggleStatus(id) {
    const institution = institutions.find(i => i.id === id);
    if (!institution) return;
    const newStatus = institution.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await api.patch(`/institutions/${id}`, { status: newStatus });
      if (response.success) {
        // ServiceContext will auto-refresh
        setInstitutions(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      } else {
        alert('Failed to update institution status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update institution status');
    }
  }
```

### Fix 4: Line ~1052 - deleteInstitution() in deleteInst function

**Find (around line 1048-1055):**
```javascript
  function deleteInst(id) {
    const institution = institutions.find(i => i.id === id);
    if (!institution) return;
    if (institution.source === 'default') {
      alert('Cannot delete default institutions');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${institution.name_en}"?`)) {
      return;
    }
    const result = deleteInstitution(id);
    if (result.success) {
      setInstitutions(prev => prev.filter(o => o.id !== id));
      alert('Institution deleted successfully');
    } else {
      alert(result.message || 'Failed to delete institution');
    }
  }
```

**Replace with:**
```javascript
  async function deleteInst(id) {
    const institution = institutions.find(i => i.id === id);
    if (!institution) return;
    
    if (!confirm(`Are you sure you want to delete "${institution.name_en || institution.name}"?`)) {
      return;
    }
    
    try {
      const response = await api.delete(`/institutions/${id}`);
      if (response.success) {
        // ServiceContext will auto-refresh
        setInstitutions(prev => prev.filter(o => o.id !== id));
        alert('Institution deleted successfully');
      } else {
        alert(response.message || 'Failed to delete institution');
      }
    } catch (error) {
      console.error('Error deleting institution:', error);
      alert(error.message || 'Failed to delete institution');
    }
  }
```

### Fix 5: Add useEffect import at top of file

**Check line 1 (imports):**
```javascript
import { useState, useEffect } from 'react';
```

Make sure `useEffect` is imported (it should already be there).

### Fix 6: Line ~765 - Remove source-based logic

The concept of 'source: default vs custom' is obsolete now that everything comes from the backend. Remove any references to `institution.source === 'default'` or `institution.source === 'custom'`.

## Complete Replacement for saveInstitution Function

Here's the complete replacement for the `saveInstitution` function (lines ~920-990):

```javascript
  async function saveInstitution(e) {
    e.preventDefault();
    const error = validateInstitution();
    if (error) {
      setFormError(error);
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    const institutionData = {
      name_en: form.name_en.trim(),
      name_am: form.name_am.trim() || form.name_en.trim(),
      image: form.image,
      description: form.description.trim(),
      details: form.details.trim(),
      official_url: form.officialUrl.trim(),
      services: form.services,
      status: editingInstitution?.status || 'active',
    };
    
    try {
      let response;
      if (editingInstitution) {
        // Update existing institution
        response = await api.patch(`/institutions/${editingInstitution.id}`, institutionData);
      } else {
        // Create new institution
        response = await api.post('/institutions', institutionData);
      }
      
      if (response.success) {
        // Reset form
        setForm({
          name_en: '',
          name_am: '',
          image: '',
          imagePreview: '',
          description: '',
          details: '',
          officialUrl: '',
          services: [],
        });
        setFormError('');
        setView('list');
        setEditingInstitution(null);
        alert(editingInstitution ? 'Institution updated successfully!' : 'Institution created successfully!');
        
        // ServiceContext will auto-refresh via useEffect
      } else {
        setFormError(response.message || 'Failed to save institution');
      }
    } catch (error) {
      console.error('Error saving institution:', error);
      setFormError(error.message || 'Failed to save institution');
    } finally {
      setIsSubmitting(false);
    }
  }
```

## Testing After Fixes

1. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test SuperAdmin Dashboard:**
   - Login as super_admin
   - Navigate to "Institution Management"
   - Try creating a new institution
   - Try updating an existing institution
   - Try deleting an institution
   - Verify no console errors about undefined functions

## Verification Commands

```bash
# Check for remaining undefined references
cd frontend/src/pages/dashboard
grep -n "getInstitutions\|createInstitution\|updateInstitution\|deleteInstitution\|organizationsData" SuperAdminDashboard.jsx

# Expected: No results (all should be replaced)

# Check for remaining localStorage mock data
cd frontend/src
grep -r "mesob_" --include="*.jsx" --include="*.js" .

# Expected: Only mesob_token, theme, lang
```

## Summary of Changes Needed

| Line(s) | Current (BROKEN) | Fix |
|---------|------------------|-----|
| ~920 | `function saveInstitution(e)` | `async function saveInstitution(e)` |
| ~951 | `updateInstitution(editingInstitution.id, ...)` | `await api.patch(\`/institutions/\${id}\`, ...)` |
| ~962 | `createInstitution(institutionData)` | `await api.post('/institutions', ...)` |
| ~1015 | `function toggleStatus(id)` | `async function toggleStatus(id)` |
| ~1020 | `updateInstitution(id, { status })` | `await api.patch(\`/institutions/\${id}\`, { status })` |
| ~1048 | `function deleteInst(id)` | `async function deleteInst(id)` |
| ~1055 | `deleteInstitution(id)` | `await api.delete(\`/institutions/\${id}\`)` |

## Status After These Fixes

✅ **SuperAdminDashboard**: 100% clean - uses backend APIs  
✅ **MesobManagerDashboard**: 100% clean - uses contexts  
✅ **InstitutionManagerDashboard**: 100% clean - uses contexts  
✅ **ICTStaffDashboard**: 100% clean - uses contexts  
✅ **sharedData.js**: 100% clean - only notification helpers  

⚠️ **Still remaining**: AuthContext user management (uses localStorage, should use /api/users)

---

*Quick Fix Guide - Generated 2026-08-24*
