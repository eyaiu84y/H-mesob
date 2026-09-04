# Fix: service_feedback Table Missing Error

## 🔴 Error
```
"Could not find the table 'public.service_feedback' in the schema cache"
```

## ✅ Solution

The `service_feedback` table doesn't exist in your Supabase database. You need to create it.

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com
2. Login to your account
3. Select your project
4. Click on **SQL Editor** in the left sidebar (or go to Database → SQL Editor)

### Step 2: Run the Migration Script
1. Click **New Query** button
2. Copy the ENTIRE contents of this file:
   ```
   backend/database/migrations/RUN_THIS_CREATE_FEEDBACK_TABLE.sql
   ```
3. Paste it into the SQL Editor
4. Click **Run** button (or press Ctrl+Enter)

### Step 3: Verify Success
After running the script, you should see:
```
✅ service_feedback table created successfully!
```

And a list of columns showing the table structure.

### Step 4: Restart Backend
```bash
# Stop the backend (Ctrl+C)
# Then start it again
npm start
```

### Step 5: Test
1. Login as Institution Manager
2. Go to "Service Feedback" section
3. Should load without errors (may show "No feedback available" which is normal)

---

## 🎯 Quick Copy-Paste

**Open file**: `backend/database/migrations/RUN_THIS_CREATE_FEEDBACK_TABLE.sql`

**Copy all the SQL** → **Paste in Supabase SQL Editor** → **Click Run**

---

## ⚠️ Alternative: If SQL Editor Not Available

If you can't access Supabase SQL Editor, you can use `psql` command:

```bash
# Navigate to backend folder
cd ~/Desktop/IT/Hawssa-mesob-F-B/backend

# Run the migration (replace with your actual connection string)
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f database/migrations/RUN_THIS_CREATE_FEEDBACK_TABLE.sql
```

---

## 📋 What This Creates

1. **Table**: `service_feedback` with all required columns
2. **Indexes**: For fast queries on feedback data
3. **RLS Policies**: Security rules for who can view/insert feedback
4. **Trigger**: Auto-update `updated_at` timestamp
5. **Constraints**: Rating 1-5, duplicate prevention

---

## 🔍 Verify Table Exists

Run this query in Supabase SQL Editor to check:

```sql
SELECT COUNT(*) as feedback_count 
FROM service_feedback;
```

Should return `0` (zero feedback, but table exists) or a count if feedback was already submitted.

---

## ✅ After This Fix

Your feedback system will work:
- ✅ Citizens can submit feedback
- ✅ Institution Managers can view feedback
- ✅ MESOB Managers can view all feedback
- ✅ Statistics will calculate correctly

---

**Need help?** Check the SQL script at:
`backend/database/migrations/RUN_THIS_CREATE_FEEDBACK_TABLE.sql`
