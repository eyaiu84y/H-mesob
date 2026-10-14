# XAMPP Database Setup for Screenshots

## Purpose
This guide helps you set up a LOCAL database in XAMPP for taking screenshots of the Hawassa MESOB system. **This does NOT affect your production Supabase database.**

## Prerequisites
- XAMPP installed with PostgreSQL or MySQL
- phpMyAdmin or pgAdmin access

---

## Option 1: Complete PostgreSQL Setup (Recommended)

### Step 1: Run SQL Files in Order

Execute these files in **PostgreSQL** through pgAdmin or command line:

1. **Create Schema & Tables**
   ```
   backend/database/migrations/001_create_schema.sql
   ```

2. **Add Enum Values**
   ```
   backend/database/migrations/003a_add_enum_values.sql
   ```

3. **Add Functions, Views & Indexes**
   ```
   backend/database/migrations/003b_add_functions_views_indexes.sql
   ```

4. **Production Enhancements**
   ```
   backend/database/migrations/004_production_enhancements_idempotent.sql
   ```

5. **Feedback Table**
   ```
   backend/database/migrations/RUN_THIS_CREATE_FEEDBACK_TABLE.sql
   ```

6. **SMS Logs**
   ```
   backend/database/migrations/004_add_sms_logs.sql
   ```

### Step 2: Seed Sample Data

Execute these files to populate with test data:

1. **Institutions**
   ```
   backend/database/seeds/004_seed_institutions.sql
   ```

2. **Services**
   ```
   backend/database/seeds/005_seed_test_services.sql
   ```

3. **Users (All Roles)**
   ```
   backend/database/seeds/003_seed_initial_users.sql
   ```

### Step 3: Configure Backend Connection

Create a separate `.env.local` file:

```env
# XAMPP LOCAL DATABASE
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hawassa_mesob
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_local_key
SUPABASE_SERVICE_KEY=your_local_service_key

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Keep other settings same
JWT_SECRET=your_jwt_secret_here
PORT=3001
NODE_ENV=development
```

### Step 4: Update Frontend API

Temporarily update `frontend/src/utils/api.js`:

```javascript
const API_URL = 'http://localhost:3001/api'; // XAMPP backend
```

---

## Option 2: Quick Setup with Consolidated SQL

I will create a single SQL file that contains everything:

**File:** `backend/database/XAMPP_COMPLETE_SETUP.sql`

Execute this ONE file in your XAMPP PostgreSQL database.

---

## Test Credentials After Setup

### Super Admin
- Email: `super.admin@mesobhub.gov.et`
- Password: `SuperAdmin@2024`

### MESOB Manager
- Email: `mesob.manager@mesobhub.gov.et`
- Password: `MesobManager@2024`

### Institution Manager (Sidama Bank)
- Email: `inst.manager.sidama@mesobhub.gov.et`
- Password: `InstManager@2024`

### Employee (Sidama Bank)
- Email: `employee.sidama@mesobhub.gov.et`
- Password: `Employee@2024`

### Citizen
- Email: `john.doe@example.com`
- Password: `Citizen@2024`

---

## Running the System

1. Start XAMPP PostgreSQL
2. Start Backend: `cd backend && npm run dev`
3. Start Frontend: `cd frontend && npm run dev`
4. Open browser: `http://localhost:5173`

---

## Important Notes

⚠️ **DO NOT DELETE YOUR SUPABASE .ENV FILE**
⚠️ Keep original `.env` backed up
⚠️ Use `.env.local` for XAMPP testing only
⚠️ After screenshots, restore original `.env`

---

## Switching Back to Supabase

1. Delete or rename `.env.local`
2. Restore original `.env` file
3. Restart backend server
4. Restore `frontend/src/utils/api.js` if changed
