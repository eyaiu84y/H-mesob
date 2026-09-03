# Feedback System - Deployment Checklist

## 🚀 Pre-Deployment Checklist

### ✅ Code Completion
- [x] All 6 implementation tasks completed
- [x] 26 files created/modified
- [x] Documentation complete
- [x] Test suite documented

### 📋 Before You Deploy

#### 1. Database Setup
```bash
# Must complete BEFORE starting services
```
- [ ] Access Supabase dashboard
- [ ] Navigate to SQL Editor
- [ ] Execute `backend/database/migrations/004_create_feedback_table.sql`
- [ ] Execute `backend/database/migrations/005_feedback_rls_policies.sql`
- [ ] Verify table created: `SELECT * FROM service_feedback LIMIT 1;`
- [ ] Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'service_feedback';`

#### 2. Environment Variables
```bash
# Backend .env
```
- [ ] `SUPABASE_URL` set and valid
- [ ] `SUPABASE_KEY` (anon key) set and valid
- [ ] `JWT_SECRET` set
- [ ] `TELEGRAM_BOT_TOKEN` set (for Telegram features)
- [ ] `PORT` set (default: 5000)

```bash
# Frontend .env
```
- [ ] `VITE_API_URL` points to backend (e.g., http://localhost:5000/api)
- [ ] `VITE_SUPABASE_URL` matches backend
- [ ] `VITE_SUPABASE_ANON_KEY` matches backend

#### 3. Dependencies
```bash
# Backend
cd backend
npm install  # Should already be done, but verify

# Frontend  
cd frontend
npm install  # Should already be done, but verify
```
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] No npm audit critical vulnerabilities

#### 4. File Verification
- [ ] All 15 backend files exist
- [ ] All 5 frontend files exist
- [ ] All 6 documentation files exist
- [ ] No syntax errors in any file

---

## 🧪 Testing Phase

### Quick Smoke Tests (5 minutes)

#### Backend API Test
```bash
# Start backend
cd backend
npm run dev

# In another terminal, test endpoint
curl http://localhost:5000/api/feedback/stats

# Expected: {"success":true,"data":{...}}
```
- [ ] Backend starts without errors
- [ ] API responds to requests
- [ ] No database connection errors

#### Frontend Test
```bash
# Start frontend
cd frontend
npm run dev

# Open browser: http://localhost:3000
```
- [ ] Frontend loads without errors
- [ ] Login page visible
- [ ] No console errors

#### Telegram Bot Test
```bash
# Start bot
cd backend
npm run bot

# In Telegram, send: /testfeedback
```
- [ ] Bot starts without errors
- [ ] `/testfeedback` command works
- [ ] 5-star keyboard appears
- [ ] Rating submission succeeds

### Full Test Suite (30-60 minutes)
- [ ] Follow `FEEDBACK_TESTING_REPORT.md`
- [ ] Complete all 37 test cases
- [ ] Document any failures
- [ ] Fix critical issues before deployment

---

## 📦 Deployment Steps

### Development Environment
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Telegram Bot (optional)
cd backend
npm run bot
```
- [ ] All services running
- [ ] No errors in any terminal
- [ ] Able to access frontend at http://localhost:3000

### Staging Environment
```bash
# 1. Push code to staging branch
git checkout staging
git merge main
git push origin staging

# 2. Deploy backend (your hosting service)
# 3. Deploy frontend (your hosting service)
# 4. Deploy bot (if using)

# 5. Run migrations on staging database
# (via Supabase dashboard for staging project)

# 6. Test all flows in staging
```
- [ ] Code deployed to staging
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Basic functionality tested

### Production Environment
```bash
# 1. Verify staging works perfectly
# 2. Push code to production branch
git checkout production
git merge staging
git push origin production

# 3. Deploy backend to production
# 4. Deploy frontend to production  
# 5. Deploy bot to production

# 6. Run migrations on production database
# (via Supabase dashboard for production project)

# 7. Test critical paths immediately
```
- [ ] Code deployed to production
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Smoke tests pass
- [ ] Monitor error logs for 1 hour

---

## ✅ Post-Deployment Verification

### Immediate Checks (5 minutes)
- [ ] Website loads
- [ ] Login works
- [ ] Citizens can access dashboards
- [ ] Managers can access dashboards
- [ ] No 500 errors in logs
- [ ] Database connections stable

### Feedback Flow Tests (15 minutes)

#### Test 1: Website Submission
1. [ ] Login as citizen
2. [ ] Navigate to completed application
3. [ ] Click "Rate Service"
4. [ ] Select rating (e.g., 4 stars)
5. [ ] Add comment
6. [ ] Submit
7. [ ] Verify success message
8. [ ] Verify "Already Rated" state

#### Test 2: Telegram Submission
1. [ ] Telegram bot running
2. [ ] Send `/testfeedback`
3. [ ] Select rating
4. [ ] Verify dynamic success message
5. [ ] Try duplicate (should block)

#### Test 3: Manager Dashboard
1. [ ] Login as Institution Manager
2. [ ] Navigate to Service Feedback
3. [ ] Verify feedback visible
4. [ ] Verify statistics correct
5. [ ] Verify source badges show

#### Test 4: MESOB Dashboard
1. [ ] Login as MESOB Manager
2. [ ] Navigate to Feedback Overview
3. [ ] Verify all feedback visible
4. [ ] Verify overall statistics
5. [ ] Test filters

### Database Verification
```sql
-- Check feedback records exist
SELECT COUNT(*) FROM service_feedback;

-- Check both sources represented
SELECT source, COUNT(*) FROM service_feedback GROUP BY source;

-- Check rating distribution
SELECT rating, COUNT(*) FROM service_feedback GROUP BY rating ORDER BY rating;

-- Check RLS working
-- (Try queries as different roles)
```
- [ ] Feedback records exist
- [ ] Both sources present (if tested both)
- [ ] No orphaned records
- [ ] RLS policies active

---

## 📊 Monitoring (First 24 Hours)

### Metrics to Watch
- [ ] Error rate (should be < 1%)
- [ ] API response time (should be < 500ms)
- [ ] Database query performance
- [ ] User submissions (expect gradual increase)
- [ ] Telegram bot uptime

### Logs to Monitor
- [ ] Backend error logs
- [ ] Database slow query logs
- [ ] Telegram bot logs
- [ ] Frontend console errors (if accessible)

### User Feedback
- [ ] Support tickets mentioning feedback
- [ ] User confusion points
- [ ] Feature requests
- [ ] Bug reports

---

## 🐛 Rollback Plan

### If Critical Issues Found:

#### Option 1: Quick Fix
1. Identify issue
2. Fix in code
3. Test locally
4. Deploy fix
5. Verify in production

#### Option 2: Rollback
```bash
# 1. Revert code deployment
git revert <commit-hash>
git push

# 2. Redeploy previous version
# (via your hosting service)

# 3. Rollback database migrations (if needed)
# ⚠️ CAUTION: May lose data
DROP TABLE service_feedback;

# 4. Notify users of temporary downtime
```

### When to Rollback:
- [ ] Data loss occurring
- [ ] System crashes
- [ ] Security vulnerability discovered
- [ ] Core functionality broken
- [ ] > 10% error rate

### When NOT to Rollback:
- [ ] Minor UI bugs (fix forward)
- [ ] Non-critical features broken
- [ ] Single user reports
- [ ] Performance slightly slower than expected

---

## 📞 Support Information

### Who to Contact:
- **Database issues:** Database admin / Supabase support
- **Backend issues:** Backend developer
- **Frontend issues:** Frontend developer
- **Telegram issues:** Bot developer
- **Infrastructure:** DevOps team

### Documentation Links:
- Implementation: `FEEDBACK_IMPLEMENTATION_STATUS.md`
- Testing: `FEEDBACK_TESTING_REPORT.md`
- Telegram: `TELEGRAM_FEEDBACK_INTEGRATION_GUIDE.md`
- Summary: `FEEDBACK_SYSTEM_FINAL_SUMMARY.md`

---

## ✅ Final Sign-Off

### Before marking as "Deployed":
- [ ] All pre-deployment checks completed
- [ ] All deployment steps completed
- [ ] All post-deployment verifications passed
- [ ] Monitoring setup
- [ ] Team notified
- [ ] Documentation accessible
- [ ] Rollback plan ready

### Sign-Off:
- **Deployed By:** _________________
- **Date:** _________________
- **Time:** _________________
- **Environment:** [ ] Development [ ] Staging [ ] Production
- **Issues Found:** _________________
- **Status:** [ ] Success [ ] Issues [ ] Rollback Required

---

## 🎉 Deployment Complete!

Once all boxes are checked, the feedback system is fully deployed and operational.

**Next steps:**
1. Monitor for 24 hours
2. Gather user feedback
3. Plan iteration/improvements
4. Celebrate! 🎊

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Ready for Deployment
