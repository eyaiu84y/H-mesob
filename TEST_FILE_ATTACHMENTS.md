# TEST FILE ATTACHMENTS - QUICK GUIDE

**Purpose:** Verify file attachment functionality works end-to-end

---

## PREREQUISITES

✅ Backend running: http://localhost:5000  
✅ Frontend running: http://localhost:5173  
✅ Storage bucket created: `maintenance-attachments`  
✅ Test files ready: 1 JPG, 1 PDF, 1 DOCX

---

## TEST 1: SUBMIT REPORT WITH PHOTO

### Steps:

1. Open http://localhost:5173
2. Login:
   - Email: employee@mesobcenter.et
   - Password: Employee@2026
3. Click "Maintenance Report" in sidebar
4. Click "Report Maintenance Problem"
5. Fill form:
   - **Problem Type:** Network / Internet
   - **Priority:** High
   - **Description:** WiFi keeps disconnecting every 5-10 minutes
   - **Location:** 2nd Floor, Building A
   - **Office Number:** Room 204
6. **Attach File:**
   - Click "Click to upload files"
   - Select a JPG/PNG photo (e.g., screenshot)
   - Verify photo appears in list below
   - Verify blue image icon shown
   - Verify file size displayed
7. Click "Submit Maintenance Report"

### Expected Results:

✅ Success message appears: "Maintenance report submitted successfully! Report Number: MAINT-2026-XXXXXX"  
✅ Form closes automatically  
✅ Report appears at top of "My Maintenance Reports" table  
✅ **Attachments column shows: 📎 1** (blue paperclip with count)  
✅ Report number starts with MAINT-2026-  

---

## TEST 2: SUBMIT REPORT WITH MULTIPLE FILES

### Steps:

1. Click "Report Maintenance Problem" again
2. Fill form (different problem)
3. **Attach Multiple Files:**
   - Upload photo.jpg (image)
   - Upload manual.pdf (document)
   - Upload notes.docx (Word doc)
4. Verify all 3 files shown:
   - Image icon for JPG
   - PDF icon for PDF
   - Document icon for DOCX
5. Remove PDF by clicking X button
6. Verify only 2 files remain
7. Submit

### Expected Results:

✅ Report created successfully  
✅ **Attachments column shows: 📎 2**  
✅ Only JPG and DOCX uploaded (PDF removed)

---

## TEST 3: FILE TYPE VALIDATION

### Steps:

1. Open form
2. Try to upload invalid.txt file
3. Observe alert message
4. Try to upload script.js file
5. Observe alert message
6. Upload valid.jpg file
7. Upload valid.pdf file
8. Verify both accepted

### Expected Results:

✅ TXT file rejected: "Invalid file type: invalid.txt. Only JPG, PNG, PDF, and DOCX files are allowed."  
✅ JS file rejected: Similar alert  
✅ JPG file accepted  
✅ PDF file accepted

---

## TEST 4: FILE SIZE VALIDATION

### Steps:

1. Open form
2. Try to upload 15MB file
3. Observe alert

### Expected Results:

✅ Alert shown: "File too large: filename. Maximum size is 10MB."  
✅ File NOT added to list

---

## TEST 5: VERIFY IN DATABASE

### Option A: API Check

```bash
# Get reports with attachments
curl -X GET http://localhost:5000/api/maintenance/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "report_number": "MAINT-2026-XXXXXX",
      "maintenance_attachments": [
        {
          "id": "uuid",
          "file_name": "screenshot.jpg",
          "file_type": "image/jpeg",
          "file_size": 245678,
          "file_url": "https://afsaruutbrnnmonciiga.supabase.co/storage/v1/object/public/maintenance-attachments/..."
        }
      ]
    }
  ]
}
```

### Option B: Database Query

```sql
-- View attachments
SELECT 
  mr.report_number,
  ma.file_name,
  ma.file_type,
  ma.file_size,
  ma.uploaded_at
FROM maintenance_reports mr
JOIN maintenance_attachments ma ON ma.maintenance_report_id = mr.id
ORDER BY mr.created_at DESC
LIMIT 5;
```

---

## TEST 6: VIEW ATTACHMENT (Verify URL)

### Steps:

1. Copy file_url from API response
2. Paste in browser
3. File should open/download

### Expected Results:

✅ File opens in browser (JPG/PNG/PDF)  
✅ Or file downloads (DOCX)  
✅ URL is public (no auth required)

---

## TEST 7: INSTITUTION MANAGER VIEW

### Steps:

1. Logout from employee account
2. Login as Institution Manager:
   - Email: inst.manager@mesobcenter.et
   - Password: InstManager@2026
3. Navigate to Maintenance section (when implemented)
4. View reports for Fayda institution
5. Check if attachments are visible

### Expected Results:

✅ Manager sees reports from their institution  
✅ Attachment counts visible  
✅ Can access attachment URLs  
✅ Cannot see reports from other institutions

---

## TEST 8: ICT STAFF VIEW

### Steps:

1. Logout
2. Login as ICT Staff:
   - Email: ict.staff@mesobcenter.et
   - Password: IctStaff@2026
3. View maintenance reports
4. Check attachments

### Expected Results:

✅ ICT Staff sees reports from their institution  
✅ Attachment counts visible  
✅ Can access files to diagnose issues

---

## TROUBLESHOOTING

### Issue: "Failed to create maintenance report"

**Check:**
- Backend running?
- JWT token valid?
- Storage bucket created?
- Network connection?

**Fix:**
```bash
# Re-run storage setup
cd backend
node setup-storage.js
```

---

### Issue: Files not uploading

**Check:**
- File type valid (JPG, PNG, PDF, DOCX)?
- File size under 10MB?
- Browser console for errors?

**Fix:**
- Use smaller files
- Check file extensions
- Clear browser cache

---

### Issue: Attachments not showing in table

**Check:**
- MaintenanceContext includes attachments?
- API response includes maintenance_attachments?
- transformReport() function updated?

**Fix:**
- Refresh the page
- Check browser dev tools Network tab
- Verify API response structure

---

## SUCCESS CRITERIA

### ✅ All Tests Pass If:

- [x] Can upload JPG files
- [x] Can upload PNG files
- [x] Can upload PDF files
- [x] Can upload DOCX files
- [x] Multiple files supported
- [x] Invalid types rejected
- [x] Large files rejected
- [x] Files can be removed before submit
- [x] Report created with attachments
- [x] Attachment count shown in table
- [x] Files stored in Supabase Storage
- [x] Public URLs work
- [x] Institution Manager can view attachments
- [x] ICT Staff can view attachments

---

## QUICK TEST CHECKLIST

```
□ Employee can attach files
□ File type validation works
□ File size validation works
□ Multiple files supported
□ Remove file works
□ Report submits successfully
□ Attachments count shows in table
□ Files viewable via URL
□ Manager can see attachments
□ ICT Staff can see attachments
```

---

## NEXT STEPS

After all tests pass:

1. ✅ Mark Phase 5A file attachments as COMPLETE
2. 🎯 Begin Phase 5B: Institution Manager maintenance dashboard
3. 🎯 Add attachment viewer modal
4. 🎯 Add ICT Staff maintenance management

---

**HAPPY TESTING!** 🎉

If all tests pass, the file attachment feature is production-ready!

---

**END OF TESTING GUIDE**
