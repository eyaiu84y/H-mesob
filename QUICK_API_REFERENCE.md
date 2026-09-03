# 🚀 QUICK API REFERENCE

**Hawassa MESOB REST API**  
**Base URL:** `http://localhost:5000/api`

---

## 🔐 AUTHENTICATION

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}'

# Save the token from response
TOKEN="eyJhbGci..."

# Use token in requests
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 QUICK ENDPOINT REFERENCE

### Authentication (5 endpoints)
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/verify-token
```

### Users (6 endpoints)
```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
PATCH  /api/users/:id/status
DELETE /api/users/:id
```

### Institutions (5 endpoints)
```
GET    /api/institutions
GET    /api/institutions/:id
GET    /api/institutions/:institutionId/services
POST   /api/institutions
PATCH  /api/institutions/:id
DELETE /api/institutions/:id
```

### Services (5 endpoints)
```
GET    /api/services
GET    /api/services/:id
POST   /api/services
PATCH  /api/services/:id
DELETE /api/services/:id
```

### Requirements (3 endpoints)
```
GET    /api/services/:serviceId/requirements
POST   /api/services/:serviceId/requirements
PATCH  /api/requirements/:id
DELETE /api/requirements/:id
```

### Search (1 endpoint)
```
GET    /api/search?q=<query>
```

### Applications (5 endpoints)
```
POST   /api/applications
GET    /api/applications
GET    /api/applications/:id
PATCH  /api/applications/:id/status
PATCH  /api/applications/:id/assign
```

### Queue (6 endpoints)
```
POST   /api/queues/join
GET    /api/queues
GET    /api/queues/:id
POST   /api/queues/:id/call-next
PATCH  /api/queues/:id/status
GET    /api/queues/:id/status
```

### Maintenance (8 endpoints)
```
POST   /api/maintenance/reports
GET    /api/maintenance/reports
GET    /api/maintenance/reports/:id
POST   /api/maintenance/reports/:id/assign
GET    /api/maintenance/my-tasks
GET    /api/maintenance/tasks/:id
PATCH  /api/maintenance/tasks/:id/status
PATCH  /api/maintenance/tasks/:id/resolve
```

### Announcements (6 endpoints)
```
GET    /api/announcements
GET    /api/announcements/:id
POST   /api/announcements
PATCH  /api/announcements/:id
POST   /api/announcements/:id/publish
DELETE /api/announcements/:id
```

### Notifications (4 endpoints)
```
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

### Dashboards (1 endpoint)
```
GET    /api/dashboards/me
```

**Total:** 60+ endpoints

---

## 👥 TEST USERS

| Email | Password | Role |
|-------|----------|------|
| superadmin@mesobcenter.et | SuperAdmin@2026 | SUPER_ADMIN |
| manager@mesobcenter.et | MesobManager@2026 | MESOB_MANAGER |
| inst.manager@mesobcenter.et | InstManager@2026 | INSTITUTION_MANAGER |
| employee@mesobcenter.et | Employee@2026 | EMPLOYEE |
| ict.staff@mesobcenter.et | IctStaff@2026 | ICT_STAFF |
| citizen@mesobcenter.et | Citizen@2026 | CITIZEN |

---

## 🧪 QUICK TEST

```bash
# Start server
cd backend
npm start

# Run test suite
bash test-complete-api.sh
```

---

## 📚 DOCUMENTATION

- **Complete API Docs:** `COMPLETE_REST_API_DOCUMENTATION.md`
- **Implementation Report:** `COMPLETE_API_IMPLEMENTATION_REPORT.md`
- **Test Suite:** `backend/test-complete-api.sh`

---

## ⚠️ IMPORTANT

**Role Mapping Required in Frontend:**
- Frontend `"technician"` → Backend `"ICT_STAFF"`
- All other roles: Direct match with UPPER_CASE

---

**🎉 All APIs Ready!**
