# User Roles Quick Reference 🔐

## 6 System Roles

### 1. SUPER_ADMIN 👑
- **Full system access**
- **No institution required**
- Can manage all institutions, users, services
- Test Account: `superadmin@mesobcenter.et` / `SuperAdmin@2026`

### 2. MESOB_MANAGER 🏢
- **MESOB Center management**
- **No institution required**
- Oversees all MESOB centers
- Test Account: `manager@mesobcenter.et` / `MesobManager@2026`

### 3. INSTITUTION_MANAGER 🏛️
- **Institution-level admin**
- **Requires institution assignment**
- Manages institution services, employees, queues
- Test Accounts:
  - Fayda: `inst.manager@mesobcenter.et` / `InstManager@2026`
  - CBE: `cbe.manager@mesobcenter.et` / `CbeManager@2026`
  - Ethio Telecom: `ethiotel.manager@mesobcenter.et` / `EthioManager@2026`

### 4. EMPLOYEE 👔
- **Service delivery staff**
- **Requires institution assignment**
- Handles applications, serves queue entries
- Test Accounts:
  - Fayda: `employee@mesobcenter.et` / `Employee@2026`
  - CBE: `cbe.employee@mesobcenter.et` / `CbeEmployee@2026`
  - Ethio Telecom: `ethiotel.employee@mesobcenter.et` / `EthioEmployee@2026`

### 5. ICT_STAFF 💻
- **Technical support**
- **Requires institution assignment**
- System maintenance, reports, technical issues
- Test Accounts:
  - Fayda: `ict.staff@mesobcenter.et` / `IctStaff@2026`
  - CBE: `cbe.ict@mesobcenter.et` / `CbeIct@2026`
  - Ethio Telecom: `ethiotel.ict@mesobcenter.et` / `EthioIct@2026`

### 6. CITIZEN 👤
- **Public users**
- **No institution required**
- Submit applications, join queues, view status
- Test Account: `citizen@mesobcenter.et` / `Citizen@2026`

---

## Test All Roles

```bash
bash test-all-roles.sh
```

---

## Quick Login Test (curl)

```bash
# SUPER_ADMIN
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}'

# MESOB_MANAGER
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@mesobcenter.et","password":"MesobManager@2026"}'

# INSTITUTION_MANAGER
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"inst.manager@mesobcenter.et","password":"InstManager@2026"}'

# EMPLOYEE
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@mesobcenter.et","password":"Employee@2026"}'

# ICT_STAFF
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ict.staff@mesobcenter.et","password":"IctStaff@2026"}'

# CITIZEN
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citizen@mesobcenter.et","password":"Citizen@2026"}'
```

---

## All 12 Test Users

| # | Role | Email | Password | Institution |
|---|------|-------|----------|-------------|
| 1 | SUPER_ADMIN | superadmin@mesobcenter.et | SuperAdmin@2026 | - |
| 2 | MESOB_MANAGER | manager@mesobcenter.et | MesobManager@2026 | - |
| 3 | INSTITUTION_MANAGER | inst.manager@mesobcenter.et | InstManager@2026 | Fayda |
| 4 | EMPLOYEE | employee@mesobcenter.et | Employee@2026 | Fayda |
| 5 | ICT_STAFF | ict.staff@mesobcenter.et | IctStaff@2026 | Fayda |
| 6 | CITIZEN | citizen@mesobcenter.et | Citizen@2026 | - |
| 7 | INSTITUTION_MANAGER | cbe.manager@mesobcenter.et | CbeManager@2026 | CBE |
| 8 | EMPLOYEE | cbe.employee@mesobcenter.et | CbeEmployee@2026 | CBE |
| 9 | ICT_STAFF | cbe.ict@mesobcenter.et | CbeIct@2026 | CBE |
| 10 | INSTITUTION_MANAGER | ethiotel.manager@mesobcenter.et | EthioManager@2026 | Ethio Telecom |
| 11 | EMPLOYEE | ethiotel.employee@mesobcenter.et | EthioEmployee@2026 | Ethio Telecom |
| 12 | ICT_STAFF | ethiotel.ict@mesobcenter.et | EthioIct@2026 | Ethio Telecom |

---

## ⚠️ Production Security

**IMPORTANT:** These are TEST credentials!

Before production:
1. ✅ Change ALL passwords
2. ✅ Use strong, unique passwords
3. ✅ Force password change on first login
4. ✅ Enable password rotation policies
5. ✅ Consider MFA for admin roles

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
