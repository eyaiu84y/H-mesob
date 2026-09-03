# 🚀 Authentication API Quick Start

**Ready to use in 3 minutes!**

---

## 🏃 Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm start
```

Server will run on: `http://localhost:5000`

### 2. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}'
```

### 3. Save Your Token

```bash
# The response includes:
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGci...",  ← Save this!
    "refreshToken": "eyJhbGci...",
    "expiresIn": "24h"
  }
}
```

### 4. Make Authenticated Request

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 📡 Available Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | ❌ No | Login with email/password |
| `/api/auth/register` | POST | ❌ No | Create new account |
| `/api/auth/me` | GET | ✅ Yes | Get current user |
| `/api/auth/logout` | POST | ✅ Yes | Logout and invalidate session |
| `/api/auth/verify-token` | POST | ✅ Yes | Check if token is valid |

---

## 👥 Test Users (All 12)

### System-Wide (3)
- `superadmin@mesobcenter.et` / `SuperAdmin@2026` - SUPER_ADMIN
- `manager@mesobcenter.et` / `MesobManager@2026` - MESOB_MANAGER
- `citizen@mesobcenter.et` / `Citizen@2026` - CITIZEN

### Fayda (3)
- `inst.manager@mesobcenter.et` / `InstManager@2026` - INSTITUTION_MANAGER
- `employee@mesobcenter.et` / `Employee@2026` - EMPLOYEE
- `ict.staff@mesobcenter.et` / `IctStaff@2026` - ICT_STAFF

### CBE (3)
- `cbe.manager@mesobcenter.et` / `CbeManager@2026` - INSTITUTION_MANAGER
- `cbe.employee@mesobcenter.et` / `CbeEmployee@2026` - EMPLOYEE
- `cbe.ict@mesobcenter.et` / `CbeIct@2026` - ICT_STAFF

### Ethio Telecom (3)
- `ethiotel.manager@mesobcenter.et` / `EthioManager@2026` - INSTITUTION_MANAGER
- `ethiotel.employee@mesobcenter.et` / `EthioEmployee@2026` - EMPLOYEE
- `ethiotel.ict@mesobcenter.et` / `EthioIct@2026` - ICT_STAFF

---

## 🧪 Run Full Test Suite

```bash
cd backend
bash test-auth-api.sh
```

Tests all 10 scenarios in ~5 seconds!

---

## 💻 Frontend Integration Example

```javascript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'superadmin@mesobcenter.et',
    password: 'SuperAdmin@2026'
  })
});

const { data } = await response.json();
localStorage.setItem('token', data.accessToken);

// Get profile
const profile = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Logout
await fetch('http://localhost:5000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
localStorage.removeItem('token');
```

---

## 🔐 Security Notes

- ✅ All passwords are bcrypt hashed
- ✅ JWT tokens expire in 24 hours
- ✅ Account locks after 5 failed login attempts
- ✅ All auth events are audit logged
- ✅ Role-based access control active

---

## 📚 Full Documentation

See `PHASE_2_AUTHENTICATION_API_COMPLETE.md` for:
- Complete API documentation
- Security features
- Authorization examples
- Error handling
- Frontend integration guide

---

**🎉 You're ready to build authenticated features!**
