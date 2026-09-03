# ✅ FRONTEND INTEGRATION CHECKLIST

**For Frontend Developers**  
**Date:** August 24, 2026

This checklist guides you through integrating the React frontend with the completed REST API backend.

---

## 📋 PRE-INTEGRATION SETUP

### 1. Verify Backend is Running
```bash
cd backend
npm start
```

**Expected output:**
```
🚀 Server running on port 5000
✅ Database connected
```

### 2. Run Backend Tests
```bash
cd backend
bash test-complete-api.sh
```

**Expected:** 34/34 tests passing

### 3. Test Backend Manually
```bash
# Health check
curl http://localhost:5000/api/health

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesobcenter.et","password":"SuperAdmin@2026"}'
```

---

## 🔧 STEP-BY-STEP INTEGRATION

### Step 1: Create API Service Layer

**File:** `frontend/src/services/api.js`

```javascript
import axios from 'axios';

// API base URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds
});

// Request interceptor: Add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/verify-token`, {
            refreshToken
          });

          if (response.data.success) {
            const { accessToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

**Action:** [ ] Create `frontend/src/services/api.js`

---

### Step 2: Create Role Mapper Utility

**File:** `frontend/src/utils/roleMapper.js`

```javascript
/**
 * Role mapping between frontend and backend
 * Frontend uses lowercase with underscores
 * Backend uses UPPER_CASE
 */

const ROLE_MAPPING_TO_BACKEND = {
  'technician': 'ICT_STAFF',
  'super_admin': 'SUPER_ADMIN',
  'mesob_manager': 'MESOB_MANAGER',
  'institution_manager': 'INSTITUTION_MANAGER',
  'employee': 'EMPLOYEE',
  'citizen': 'CITIZEN'
};

const ROLE_MAPPING_TO_FRONTEND = {
  'ICT_STAFF': 'technician',
  'SUPER_ADMIN': 'super_admin',
  'MESOB_MANAGER': 'mesob_manager',
  'INSTITUTION_MANAGER': 'institution_manager',
  'EMPLOYEE': 'employee',
  'CITIZEN': 'citizen'
};

/**
 * Convert frontend role to backend role
 * @param {string} frontendRole - Role from frontend (e.g., 'technician')
 * @returns {string} Backend role (e.g., 'ICT_STAFF')
 */
export const mapRoleToBackend = (frontendRole) => {
  return ROLE_MAPPING_TO_BACKEND[frontendRole] || frontendRole.toUpperCase();
};

/**
 * Convert backend role to frontend role
 * @param {string} backendRole - Role from backend (e.g., 'ICT_STAFF')
 * @returns {string} Frontend role (e.g., 'technician')
 */
export const mapRoleToFrontend = (backendRole) => {
  return ROLE_MAPPING_TO_FRONTEND[backendRole] || backendRole.toLowerCase();
};

/**
 * Check if a role has permission
 * @param {string} userRole - User's frontend role
 * @param {string[]} allowedRoles - Array of allowed frontend roles
 * @returns {boolean}
 */
export const hasPermission = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};
```

**Action:** [ ] Create `frontend/src/utils/roleMapper.js`

---

### Step 3: Update Authentication Context

**File:** `frontend/src/contexts/AuthContext.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { mapRoleToFrontend, mapRoleToBackend } from '../utils/roleMapper';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch current user from backend
   */
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const userData = response.data.data;
        // Map backend role to frontend role
        setUser({
          ...userData,
          role: mapRoleToFrontend(userData.role)
        });
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { accessToken, refreshToken, user: userData } = response.data.data;

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Map backend role to frontend role
        const mappedUser = {
          ...userData,
          role: mapRoleToFrontend(userData.role)
        };

        setUser(mappedUser);
        return { success: true, user: mappedUser };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Map frontend role to backend role if role is provided
      const backendData = {
        ...userData,
        role: userData.role ? mapRoleToBackend(userData.role) : 'CITIZEN'
      };

      const response = await api.post('/auth/register', backendData);

      if (response.data.success) {
        const { accessToken, refreshToken, user: newUser } = response.data.data;

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Map backend role to frontend role
        const mappedUser = {
          ...newUser,
          role: mapRoleToFrontend(newUser.role)
        };

        setUser(mappedUser);
        return { success: true, user: mappedUser };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local state regardless of API success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    try {
      const response = await api.patch(`/users/${user.id}`, updates);
      if (response.data.success) {
        const updatedUser = {
          ...response.data.data,
          role: mapRoleToFrontend(response.data.data.role)
        };
        setUser(updatedUser);
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Update failed';
      return { success: false, message: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Action:** [ ] Update `frontend/src/contexts/AuthContext.jsx`

---

### Step 4: Create API Service Modules

Create individual service modules for each API group:

#### 4a. User Service

**File:** `frontend/src/services/userService.js`

```javascript
import api from './api';

export const userService = {
  // Get all users (with filters)
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/users?${params}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, updates) => {
    const response = await api.patch(`/users/${id}`, updates);
    return response.data;
  },

  // Change user status
  changeUserStatus: async (id, status) => {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  // Delete user (soft delete)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};
```

**Action:** [ ] Create `frontend/src/services/userService.js`

#### 4b. Institution Service

**File:** `frontend/src/services/institutionService.js`

```javascript
import api from './api';

export const institutionService = {
  // Get all institutions
  getInstitutions: async () => {
    const response = await api.get('/institutions');
    return response.data;
  },

  // Get institution by ID
  getInstitutionById: async (id) => {
    const response = await api.get(`/institutions/${id}`);
    return response.data;
  },

  // Get institution services
  getInstitutionServices: async (institutionId) => {
    const response = await api.get(`/institutions/${institutionId}/services`);
    return response.data;
  },

  // Create institution
  createInstitution: async (data) => {
    const response = await api.post('/institutions', data);
    return response.data;
  },

  // Update institution
  updateInstitution: async (id, updates) => {
    const response = await api.patch(`/institutions/${id}`, updates);
    return response.data;
  },

  // Delete institution
  deleteInstitution: async (id) => {
    const response = await api.delete(`/institutions/${id}`);
    return response.data;
  }
};
```

**Action:** [ ] Create `frontend/src/services/institutionService.js`

#### 4c. Application Service

**File:** `frontend/src/services/applicationService.js`

```javascript
import api from './api';

export const applicationService = {
  // Submit new application
  submitApplication: async (data) => {
    const response = await api.post('/applications', data);
    return response.data;
  },

  // Get applications (filtered by role)
  getApplications: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/applications?${params}`);
    return response.data;
  },

  // Get application by ID
  getApplicationById: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  // Update application status
  updateStatus: async (id, status, notes = '') => {
    const response = await api.patch(`/applications/${id}/status`, {
      status,
      notes
    });
    return response.data;
  },

  // Assign employee to application
  assignEmployee: async (id, employeeId) => {
    const response = await api.patch(`/applications/${id}/assign`, {
      employeeId
    });
    return response.data;
  }
};
```

**Action:** [ ] Create `frontend/src/services/applicationService.js`

#### 4d. Queue Service

**File:** `frontend/src/services/queueService.js`

```javascript
import api from './api';

export const queueService = {
  // Join queue
  joinQueue: async (data) => {
    const response = await api.post('/queues/join', data);
    return response.data;
  },

  // Get queues (filtered by role)
  getQueues: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/queues?${params}`);
    return response.data;
  },

  // Get queue details
  getQueueById: async (id) => {
    const response = await api.get(`/queues/${id}`);
    return response.data;
  },

  // Call next person in queue
  callNext: async (id, counterId) => {
    const response = await api.post(`/queues/${id}/call-next`, {
      counterId
    });
    return response.data;
  },

  // Update queue status
  updateStatus: async (id, status, notes = '') => {
    const response = await api.patch(`/queues/${id}/status`, {
      status,
      notes
    });
    return response.data;
  },

  // Get public queue status
  getQueueStatus: async (id) => {
    const response = await api.get(`/queues/${id}/status`);
    return response.data;
  }
};
```

**Action:** [ ] Create `frontend/src/services/queueService.js`

---

### Step 5: Update Environment Variables

**File:** `frontend/.env`

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# For production:
# VITE_API_URL=https://api.hawassamesob.et/api
```

**Action:** [ ] Create/update `frontend/.env`

---

### Step 6: Update Login Page

**File:** `frontend/src/pages/LoginPage.jsx`

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Redirect based on role
      const role = result.user.role;
      switch (role) {
        case 'super_admin':
        case 'mesob_manager':
          navigate('/admin/dashboard');
          break;
        case 'institution_manager':
          navigate('/manager/dashboard');
          break;
        case 'employee':
          navigate('/employee/dashboard');
          break;
        case 'technician':
          navigate('/technician/dashboard');
          break;
        case 'citizen':
          navigate('/citizen/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>
        
        {error && <div className="error">{error}</div>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

**Action:** [ ] Update `frontend/src/pages/LoginPage.jsx`

---

### Step 7: Update Protected Route Component

**File:** `frontend/src/components/ProtectedRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/roleMapper';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !hasPermission(user.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
```

**Action:** [ ] Update `frontend/src/components/ProtectedRoute.jsx`

---

### Step 8: Replace Mock Data in Pages

For each page that uses mock data, replace with API calls:

#### Example: Institutions Page

**Before (Mock):**
```javascript
const institutions = [
  { id: 1, name: 'Health Bureau', ... },
  // ...hardcoded data
];
```

**After (API):**
```javascript
import { useState, useEffect } from 'react';
import { institutionService } from '../services/institutionService';

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const result = await institutionService.getInstitutions();
      if (result.success) {
        setInstitutions(result.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {institutions.map(inst => (
        <div key={inst.id}>
          <h2>{inst.name_en}</h2>
          <p>{inst.description_en}</p>
        </div>
      ))}
    </div>
  );
}
```

**Action:** [ ] Update all pages with mock data

---

## 🧪 TESTING CHECKLIST

### Manual Testing

#### Authentication Tests
- [ ] Can register new citizen account
- [ ] Can login with each test user role
- [ ] Token is stored in localStorage
- [ ] Token is sent in Authorization header
- [ ] Auto-logout on token expiration
- [ ] Refresh token works on 401

#### User Management Tests
- [ ] Can view user list (as admin)
- [ ] Can create new user (as admin)
- [ ] Can update user profile
- [ ] Can change user status
- [ ] Cannot access other users (as citizen)

#### Institution Tests
- [ ] Can view all institutions (public)
- [ ] Can view institution details
- [ ] Can view institution services
- [ ] Can create institution (as admin)
- [ ] Can update institution (as admin)

#### Service Tests
- [ ] Can browse service catalogue
- [ ] Can view service details
- [ ] Can view service requirements
- [ ] Can search services

#### Application Tests
- [ ] Can submit application (as citizen)
- [ ] Can view own applications
- [ ] Can track application status
- [ ] Can update status (as employee)
- [ ] Can assign employee (as manager)

#### Queue Tests
- [ ] Can join queue (as citizen)
- [ ] Can view queue position
- [ ] Can call next (as employee)
- [ ] Token number displays correctly
- [ ] Queue status updates in real-time

#### Maintenance Tests
- [ ] Can report issue (as employee)
- [ ] Can upload photo attachments
- [ ] Can view own reports
- [ ] Can assign ICT staff (as manager)
- [ ] Can update task status (as ICT staff)
- [ ] Can resolve task (as ICT staff)

#### Announcement Tests
- [ ] Can view relevant announcements
- [ ] Can create announcement (as admin)
- [ ] Can publish announcement
- [ ] Announcements filtered by role/institution

#### Notification Tests
- [ ] Notifications appear for events
- [ ] Unread count updates
- [ ] Can mark as read
- [ ] Can mark all as read

#### Dashboard Tests
- [ ] Dashboard shows role-specific data
- [ ] Statistics are accurate
- [ ] Charts render correctly
- [ ] Data updates on refresh

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: "Network Error" or CORS Error

**Cause:** Backend not running or CORS not configured

**Solution:**
1. Check backend is running: `curl http://localhost:5000/api/health`
2. Verify CORS is enabled in `backend/src/server.js`

### Issue 2: "401 Unauthorized" on Every Request

**Cause:** Token not being sent or invalid

**Solution:**
1. Check localStorage has `accessToken`
2. Verify token in request headers (DevTools → Network)
3. Re-login to get fresh token

### Issue 3: "403 Forbidden" on Specific Routes

**Cause:** User role doesn't have permission

**Solution:**
1. Check user role: `console.log(user.role)`
2. Verify role mapping is correct
3. Check backend authorization for that endpoint

### Issue 4: "Technician" Role Not Working

**Cause:** Role mapping not applied

**Solution:**
1. Ensure `roleMapper.js` is imported and used
2. Map `"technician"` → `"ICT_STAFF"` in API calls
3. Map `"ICT_STAFF"` → `"technician"` in responses

### Issue 5: User Name Not Displaying

**Cause:** Database uses `full_name`, not `firstName`/`lastName`

**Solution:**
Use `user.full_name` instead of `${user.firstName} ${user.lastName}`

---

## 📊 COMPLETION CHECKLIST

### Setup Phase
- [ ] Backend server running
- [ ] Backend tests passing
- [ ] Manual API test successful

### Code Implementation
- [ ] API service layer created (`api.js`)
- [ ] Role mapper created (`roleMapper.js`)
- [ ] AuthContext updated
- [ ] User service created
- [ ] Institution service created
- [ ] Application service created
- [ ] Queue service created
- [ ] Maintenance service created (optional)
- [ ] Announcement service created (optional)
- [ ] Notification service created (optional)
- [ ] Dashboard service created (optional)
- [ ] Environment variables configured

### Page Updates
- [ ] Login page updated
- [ ] Register page updated (if exists)
- [ ] Protected routes updated
- [ ] Dashboard pages updated
- [ ] User management pages updated
- [ ] Institution pages updated
- [ ] Service catalogue updated
- [ ] Application pages updated
- [ ] Queue pages updated
- [ ] Maintenance pages updated (if exists)
- [ ] Announcements updated (if exists)
- [ ] Notifications updated

### Testing Phase
- [ ] Authentication flow tested
- [ ] All 6 roles tested
- [ ] CRUD operations tested
- [ ] Role-based access tested
- [ ] Error handling tested
- [ ] Token refresh tested
- [ ] Logout tested

### Final Verification
- [ ] No console errors
- [ ] No hardcoded mock data
- [ ] All API calls use service layer
- [ ] All roles mapped correctly
- [ ] All features working end-to-end

---

## 🎯 NEXT STEPS AFTER INTEGRATION

1. **User Acceptance Testing**
   - Test with real users
   - Gather feedback
   - Fix bugs

2. **Performance Optimization**
   - Implement loading states
   - Add error boundaries
   - Optimize re-renders

3. **Production Deployment**
   - Update API_URL for production
   - Deploy frontend
   - Test production environment

---

## 📞 SUPPORT

### Documentation
- **API Reference:** `COMPLETE_REST_API_DOCUMENTATION.md`
- **Implementation Report:** `COMPLETE_API_IMPLEMENTATION_REPORT.md`
- **Quick Reference:** `QUICK_API_REFERENCE.md`

### Test Users
| Email | Password | Role |
|-------|----------|------|
| superadmin@mesobcenter.et | SuperAdmin@2026 | SUPER_ADMIN |
| manager@mesobcenter.et | MesobManager@2026 | MESOB_MANAGER |
| employee@mesobcenter.et | Employee@2026 | EMPLOYEE |
| ict.staff@mesobcenter.et | IctStaff@2026 | ICT_STAFF |
| citizen@mesobcenter.et | Citizen@2026 | CITIZEN |

---

**Good luck with the integration!** 🚀

---

**Checklist Version:** 1.0  
**Last Updated:** August 24, 2026
