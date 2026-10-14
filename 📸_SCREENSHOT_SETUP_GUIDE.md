# 📸 Screenshot Setup Guide for XAMPP

## Quick Setup (3 Steps)

### Step 1: Create Local Database in XAMPP

1. Open phpMyAdmin or pgAdmin
2. Create new database: `hawassa_mesob`
3. Import this file:
   ```
   backend/database/XAMPP_COMPLETE_SETUP.sql
   ```

### Step 2: Configure Backend for Local Database

Create file: `backend/.env.local`

```env
# XAMPP LOCAL DATABASE
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/hawassa_mesob

# OR for MySQL:
# DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/hawassa_mesob

# Keep these same
JWT_SECRET=your_jwt_secret_from_original_env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 3: Run System

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open browser: `http://localhost:5173`

---

## 🔑 Test Login Credentials

### Super Admin Dashboard
- **Email:** super.admin@mesobhub.gov.et
- **Password:** SuperAdmin@2024
- **Access:** All system management

### MESOB Manager Dashboard
- **Email:** mesob.manager@mesobhub.gov.et
- **Password:** MesobManager@2024
- **Access:** Cross-institution oversight

### Institution Manager (Sidama Bank)
- **Email:** inst.manager.sidama@mesobhub.gov.et
- **Password:** InstManager@2024
- **Access:** Sidama Bank management

### Employee (Sidama Bank)
- **Email:** employee.sidama@mesobhub.gov.et
- **Password:** Employee@2024
- **Access:** Service processing for Sidama Bank

### ICT Staff (Sidama Bank)
- **Email:** ict.sidama@mesobhub.gov.et
- **Password:** IctStaff@2024
- **Access:** Maintenance reports

### Citizen
- **Email:** john.doe@example.com
- **Password:** Citizen@2024
- **Access:** Apply for services, join queue

---

## 📋 What's Included

✅ **12 Government Institutions** (All approved institutions)
✅ **15+ Sample Services** (Banking, Postal, Tax, Justice, Trade, Transport, etc.)
✅ **10+ Users** (All roles represented)
✅ **Sample Applications** (For testing Reports feature)
✅ **Queue Entries** (For testing Queue Status)
✅ **Announcements** (System, Institution, Public)
✅ **Maintenance Reports** (For ICT Staff dashboard)

---

## 📸 Screenshots to Take

### 1. Citizen Dashboard
- Login as: `john.doe@example.com`
- Screenshot: Dashboard home
- Screenshot: Service catalog
- Screenshot: My Applications
- Screenshot: Queue status
- Screenshot: Join Queue feature

### 2. Employee Dashboard
- Login as: `employee.sidama@mesobhub.gov.et`
- Screenshot: Dashboard with statistics
- Screenshot: Search Applications
- Screenshot: Service Requirements
- Screenshot: Maintenance Reports
- Screenshot: **Reports section** (This Month filter with applications)
- Screenshot: Announcements

### 3. Institution Manager Dashboard
- Login as: `inst.manager.sidama@mesobhub.gov.et`
- Screenshot: Dashboard overview
- Screenshot: Applications management
- Screenshot: Queue Management
- Screenshot: Reports
- Screenshot: Announcements (CRUD operations)
- Screenshot: User Management

### 4. MESOB Manager Dashboard (Updated Colors!)
- Login as: `mesob.manager@mesobhub.gov.et`
- Screenshot: Dashboard with **teal/cyan gradient colors**
- Screenshot: **Colorful stat cards** (Waiting, Processing, Completed)
- Screenshot: Institution Overview
- Screenshot: Performance Metrics
- Screenshot: System-wide Reports

### 5. Super Admin Dashboard
- Login as: `super.admin@mesobhub.gov.et`
- Screenshot: System Dashboard
- Screenshot: User Management (all roles)
- Screenshot: Institution Management (all 12 institutions)
- Screenshot: System Announcements publishing
- Screenshot: Analytics

### 6. ICT Staff Dashboard
- Login as: `ict.sidama@mesobhub.gov.et`
- Screenshot: Maintenance Dashboard
- Screenshot: Reports list
- Screenshot: Assign/Resolve maintenance

---

## ⚠️ Important Notes

### Before Taking Screenshots:

1. **Backup your original `.env` file!**
   ```bash
   cp backend/.env backend/.env.supabase.backup
   ```

2. **Use `.env.local` for XAMPP** (don't modify original `.env`)

3. **Test each role** to ensure data displays correctly

4. **Check that Reports show data** (employee dashboard, this month filter)

5. **Verify colored backgrounds** in MESOB Manager dashboard

### After Screenshots:

1. **Delete `.env.local`**
   ```bash
   rm backend/.env.local
   ```

2. **Restart backend** to use original Supabase connection

3. **NEVER commit** `.env.local` to git

4. **XAMPP database is independent** - your Supabase production data is untouched

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:** Check XAMPP PostgreSQL is running, verify DATABASE_URL in `.env.local`

### Issue: "Login fails"
**Solution:** Ensure SQL import completed successfully, check password hash format

### Issue: "No data showing"
**Solution:** Verify all INSERT statements executed successfully

### Issue: "Reports show no applications"
**Solution:** Check that applications have `submitted_at` timestamps in current month

### Issue: "Colors not showing in MESOB Manager"
**Solution:** Hard refresh browser (Ctrl+F5), clear cache

---

## 📁 File Locations

```
Hawssa-mesob-F-B/
├── backend/
│   └── database/
│       ├── XAMPP_COMPLETE_SETUP.sql          ← Run this file
│       └── XAMPP_SETUP_FOR_SCREENSHOTS.md    ← Detailed guide
└── 📸_SCREENSHOT_SETUP_GUIDE.md              ← This file
```

---

## ✅ Checklist

- [ ] Created `hawassa_mesob` database in XAMPP
- [ ] Imported `XAMPP_COMPLETE_SETUP.sql`
- [ ] Created `backend/.env.local` with correct DATABASE_URL
- [ ] Backed up original `.env` file
- [ ] Started backend (npm run dev)
- [ ] Started frontend (npm run dev)
- [ ] Tested login for each role
- [ ] Verified data displays in dashboards
- [ ] Took screenshots for all 6 roles
- [ ] Deleted `.env.local` after screenshots
- [ ] Restored original Supabase connection
- [ ] Production system still working ✓

---

**Need Help?** Check `backend/database/XAMPP_SETUP_FOR_SCREENSHOTS.md` for detailed setup instructions.
