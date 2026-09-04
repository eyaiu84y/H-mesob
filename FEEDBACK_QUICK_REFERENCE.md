# Feedback System - Quick Reference Guide

## 🎯 Quick Start

### For Citizens
**Submit Feedback After Queue Service**:
1. Join queue → Get token → Service completed
2. Feedback UI appears automatically
3. Rate 1-5 stars + optional comment
4. Submit → Done!

**Submit Feedback After Application**:
1. Submit application → Application completed
2. View application details
3. Scroll to "Rate This Service"
4. Rate and submit

**View Your Feedback History**:
1. Go to "My Feedback" section
2. See all your ratings
3. Click to view details

---

### For Institution Managers
**View Feedback**:
1. Login → Navigate to "Service Feedback"
2. See statistics, chart, and feedback list
3. Use filters to narrow down
4. Click feedback to see details

**Key Metrics to Monitor**:
- Average Rating (target: ≥4.0)
- Excellent+ Rate (target: ≥80%)
- Poor Rate (target: <5%)

---

### For MESOB Managers
**View All Feedback**:
1. Login → Navigate to "Feedback Overview"
2. See system-wide statistics
3. Filter by institution to compare
4. Identify poor performers

**Actions to Take**:
- Monitor institutions with low ratings
- Compare institution performance
- Track trends over time
- Take action on poor ratings

---

## 📊 Rating Scale

| Stars | Meaning | Action Needed |
|-------|---------|---------------|
| ⭐ 1 | Poor | 🔴 Immediate attention |
| ⭐⭐ 2 | Good | 🟠 Improvement needed |
| ⭐⭐⭐ 3 | Very Good | 🟡 Room for growth |
| ⭐⭐⭐⭐ 4 | Excellent | 🟢 Maintain quality |
| ⭐⭐⭐⭐⭐ 5 | Fantastic | 💚 Best in class |

---

## 🔒 Security Rules

| Role | Can Submit | Can View | Can Edit |
|------|------------|----------|----------|
| **Citizen** | ✅ Own | ✅ Own only | ❌ No |
| **Institution Manager** | ❌ No | ✅ Own institution | ❌ No |
| **MESOB Manager** | ❌ No | ✅ All institutions | ❌ No |
| **Super Admin** | ❌ No | ✅ All | ✅ Yes |

---

## 🚫 Duplicate Prevention

- ✅ One feedback per application
- ✅ One feedback per queue entry
- ✅ Database constraint enforced
- ❌ Cannot submit twice for same service interaction

---

## 📍 File Locations

### Backend
```
backend/src/services/feedbackService.js       - Business logic
backend/src/controllers/feedbackController.js - HTTP handlers
backend/src/routes/feedbackRoutes.js          - API routes
backend/database/migrations/
  ├─ 004_create_feedback_table.sql           - Table schema
  └─ 005_feedback_rls_policies.sql           - Security policies
```

### Frontend
```
frontend/src/context/FeedbackContext.jsx                    - State management
frontend/src/components/dashboard/FeedbackRating.jsx        - Rating UI
frontend/src/components/dashboard/InstitutionFeedback.jsx   - Manager view
frontend/src/components/dashboard/MesobFeedbackOverview.jsx - MESOB view
frontend/src/pages/dashboard/CitizenDashboard.jsx          - Citizen interface
frontend/src/components/dashboard/QueueManagement.jsx       - Queue integration
```

---

## 🌐 API Endpoints

### Citizen Endpoints
```
POST   /api/feedback                 - Submit feedback
GET    /api/feedback/my-feedback     - Get my feedback
GET    /api/feedback/can-submit      - Check if can submit
```

### Institution Manager Endpoints
```
GET    /api/feedback/institution       - Get institution feedback
GET    /api/feedback/institution/stats - Get institution statistics
```

### MESOB Manager Endpoints
```
GET    /api/feedback                  - Get all feedback
GET    /api/feedback/stats            - Get overall statistics
```

---

## 🔧 Quick Fixes

### Feedback UI not showing
```bash
# Check queue entry has required fields
institutionId ✓
serviceId ✓
status = 'completed' ✓
```

### Statistics showing 0
```sql
-- Check if feedback exists
SELECT COUNT(*) FROM service_feedback WHERE institution_id = 'YOUR_ID';

-- If 0, no feedback submitted yet
-- If >0, refresh browser or check frontend console
```

### Cannot submit feedback
```
1. Check rating is 1-5
2. Verify not duplicate
3. Check backend logs
4. Verify database connection
```

---

## 📱 User Experience

### Citizen Journey
```
Service → Complete → Rate → View History
```

### Manager Journey
```
Login → View Stats → Filter → Analyze → Take Action
```

---

## 🎨 Color Codes

- 🟢 Green (4-5 stars): Excellent performance
- 🟡 Yellow (3 stars): Meeting expectations
- 🟠 Orange (2 stars): Below expectations
- 🔴 Red (1 star): Critical issues

---

## 💡 Best Practices

### For Citizens
✅ Be honest and constructive
✅ Add comments for context
✅ Rate promptly after service

### For Institution Managers
✅ Check feedback daily
✅ Respond to poor ratings
✅ Track improvement trends
✅ Share insights with team

### For MESOB Managers
✅ Monitor all institutions weekly
✅ Compare performance metrics
✅ Identify best practices
✅ Support poor performers

---

## 🐛 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Please select a rating" | No rating selected | Select 1-5 stars |
| "Already rated this service" | Duplicate submission | Cannot rate twice |
| "Failed to submit" | Backend/DB error | Check logs |
| "Not authorized" | Wrong role/permissions | Check user role |

---

## 📞 Support

### Developer Support
- Backend issues: Check `feedbackService.js`
- Frontend issues: Check `FeedbackContext.jsx`
- Database issues: Check migrations and RLS policies

### User Support
- Citizen help: Explain rating process
- Manager help: Show statistics interpretation
- Technical help: Check browser console

---

## ✅ Quick Test

1. **Citizen**: Join queue → Complete → Rate → Success?
2. **Citizen**: View "My Feedback" → Feedback shows?
3. **Inst Mgr**: View "Service Feedback" → Stats show?
4. **MESOB Mgr**: View "Feedback Overview" → All feedback shows?

**All yes?** ✅ System working!

---

## 🚀 Push to GitHub Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Documentation complete
- [ ] RLS policies active
- [ ] Statistics accurate
- [ ] Filters working
- [ ] Mobile responsive

**Ready?** `git add .` → `git commit` → `git push`

---

**Last Updated**: 2026-08-24 | **Version**: 1.0.0
