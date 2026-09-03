# 🚀 QUICK START GUIDE
## Production Database Foundation Setup

**⏱️ Time Required:** 15-30 minutes  
**Prerequisites:** Node.js 18+, Supabase project, SQL Editor access

---

## ⚡ FAST TRACK (6 Steps)

### 1️⃣ Install Dependencies (2 min)
```bash
cd backend
npm install
```

### 2️⃣ Generate Password Hashes (2 min)
```bash
npm run generate-passwords
```

**Output:** Copy the password hashes displayed

### 3️⃣ Update Seed File (3 min)

Edit `backend/database/seeds/003_seed_initial_users.sql`

Replace ALL instances of:
```sql
'$2b$10$rGHvFQKVzpKMQXXC5xF3sOYqLw8w1eKqYvN3bT6LZc.bZJKKJKJKJ'
```

With your generated hashes (one per user)

### 4️⃣ Execute Production Enhancements (5 min)

**In Supabase SQL Editor:**
1. Open `backend/database/migrations/004_production_enhancements.sql`
2. Copy all content
3. Paste into Supabase SQL Editor
4. Click "Run" (or F5)

**Expected:** No errors, "Query successful" message

### 5️⃣ Execute User Seed (3 min)

**In Supabase SQL Editor:**
1. Open `backend/database/seeds/003_seed_initial_users.sql` (with updated hashes)
2. Copy all content
3. Paste into Supabase SQL Editor
4. Click "Run" (or F5)

**Expected:** "✅ Successfully created 13 initial users" message

### 6️⃣ Verify Database (5 min)

**In Supabase SQL Editor:**
1. Open `backend/database/verify_production_database.sql`
2. Copy all content
3. Paste into Supabase SQL Editor
4. Click "Run" (or F5)

**Expected:** All checks show ✅ PASS

---

## ✅ VERIFICATION QUERIES

Run these quick checks if you skip the full verification script:

```sql
-- Check tables (should be 17)
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';

-- Check institutions (should be 12)
SELECT COUNT(*) FROM institutions;

-- Check services (should be 37)
SELECT COUNT(*) FROM services;

-- Check users (should be 13)
SELECT COUNT(*) FROM users;

-- Check passwords are hashed (all should start with $2b$)
SELECT email, LEFT(password_hash, 4) AS hash_prefix FROM users;

-- Check all users email verified (should be 13)
SELECT COUNT(*) FROM users WHERE email_verified = TRUE;
```

---

## 🔐 STORE CREDENTIALS

After Step 2, store these securely:

| Email | Password | Role |
|-------|----------|------|
| superadmin@mesobcenter.et | [from generator] | SUPER_ADMIN |
| manager@mesobcenter.et | [from generator] | MESOB_MANAGER |
| inst.manager@mesobcenter.et | [from generator] | INSTITUTION_MANAGER |
| employee@mesobcenter.et | [from generator] | EMPLOYEE |
| ict.staff@mesobcenter.et | [from generator] | ICT_STAFF |
| citizen@mesobcenter.et | [from generator] | CITIZEN |
| ... (7 more) | ... | ... |

**Use a password manager!** Never commit to git.

---

## 🚨 TROUBLESHOOTING

### Problem: npm install fails
**Solution:**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Problem: bcrypt installation fails on Windows
**Solution:**
```bash
# Install windows build tools
npm install --global windows-build-tools

# Or use pre-built binaries
npm install bcrypt --build-from-source=false
```

### Problem: Migration 004 fails
**Check:**
1. Migrations 001-003 already executed?
2. Supabase service_role key correct?
3. SQL syntax errors? (copy/paste issue?)

**Solution:** Run migrations in order 001 → 002 → 003 → 004

### Problem: User seed fails
**Check:**
1. Password hashes updated from placeholder?
2. All 13 hashes unique and valid?
3. Institutions exist? (need 001_seed_institutions.sql)

**Solution:**
```sql
-- Check institutions
SELECT id, code FROM institutions WHERE code IN ('fayda', 'cbe', 'ethiotel');
-- Should return 3 rows

-- If missing, run:
-- backend/database/seeds/001_seed_institutions.sql
```

### Problem: Verification fails
**Check which section failed:**
- Section 1-4: Core data issues → Check seeds executed
- Section 5: User data issues → Check Step 5 completed
- Section 6: Security issues → Check password hashes valid
- Section 7-8: Functions/views → Check migration 003 executed
- Section 12-13: Enhancements → Check migration 004 executed

---

## 📋 CHECKLIST

Copy this to track progress:

```
Setup Checklist:
[ ] 1. npm install completed
[ ] 2. Password hashes generated
[ ] 3. Seed file updated with real hashes
[ ] 4. Migration 004 executed successfully
[ ] 5. User seed executed successfully
[ ] 6. Verification script passed all checks
[ ] 7. Credentials stored in password manager
[ ] 8. Team notified of completion

Ready for Phase 2:
[ ] Database foundation verified
[ ] bcrypt and jsonwebtoken installed
[ ] Initial users can be queried
[ ] Role mapping understood
[ ] Documentation reviewed
```

---

## 🎯 WHAT'S NEXT?

After completing all 6 steps:

### Immediate
1. ✅ Review `DATABASE_FOUNDATION_COMPLETE.md`
2. ✅ Understand role mapping (technician → ICT_STAFF)
3. ✅ Brief team on security requirements

### This Week
1. ⏳ Begin Phase 2: Authentication API
2. ⏳ Implement JWT token generation
3. ⏳ Create POST /api/auth/login endpoint
4. ⏳ Test login with initial users

### Next Month
1. ⏳ Complete all 69 API endpoints
2. ⏳ Replace frontend localStorage with APIs
3. ⏳ Comprehensive testing
4. ⏳ Security audit

---

## 📚 FULL DOCUMENTATION

For detailed information, see:

- **DATABASE_FOUNDATION_COMPLETE.md** - Implementation summary
- **PRODUCTION_DATABASE_SETUP.md** - Detailed setup guide
- **COMPLETE_BACKEND_DATABASE_AUDIT_REPORT.md** - Full audit
- **AUDIT_EXECUTIVE_SUMMARY.md** - Quick overview

---

## 🆘 NEED HELP?

**Quick Answers:**
1. **Where are migrations?** `backend/database/migrations/`
2. **Where are seeds?** `backend/database/seeds/`
3. **How to verify?** Run `verify_production_database.sql`
4. **Forgot password?** Re-run `npm run generate-passwords`
5. **SQL errors?** Check Supabase logs in dashboard

**Still stuck?**
1. Review error messages carefully
2. Check TROUBLESHOOTING section above
3. Consult detailed documentation
4. Check Supabase dashboard for errors

---

## ⚡ ONE-LINER COMMANDS

```bash
# Install, generate, and verify
cd backend && npm install && npm run generate-passwords

# After updating seed file and running migrations in Supabase:
# Verify database
psql -h [supabase-host] -U postgres -d postgres -f backend/database/verify_production_database.sql
```

---

**⏱️ TOTAL TIME:** ~15-30 minutes  
**✅ STATUS:** Ready for Phase 2  
**🚀 NEXT:** Authentication API Implementation

---

**Good luck! 🎉**
