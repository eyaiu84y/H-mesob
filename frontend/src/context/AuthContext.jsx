/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { saveToken, removeToken } from '../utils/api';
import { transformUserFromBackend, toBackendRole } from '../utils/roleMapper';

const AuthContext = createContext(null);

// Valid roles that can be authenticated
const VALID_ROLES = [
  'super_admin',
  'mesob_manager',
  'institution_manager',
  'employee',
  'technician',
  'customer',
  'ict_staff'
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = localStorage.getItem('mesob_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch user profile from backend
        const response = await api.get('/auth/me');
        
        if (response.success && response.data && response.data.user) {
          const frontendUser = transformUserFromBackend(response.data.user);
          
          if (!VALID_ROLES.includes(frontendUser.role)) {
            console.warn('Invalid role from backend:', frontendUser.role);
            removeToken();
            setUser(null);
            setLoading(false);
            return;
          }
          
          setUser(frontendUser);
        } else {
          removeToken();
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  // ==========================================
  // USER MANAGEMENT (Backend API)
  // ==========================================
  
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Fetch users from backend API
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/users');
      
      if (response.success && Array.isArray(response.data)) {
        const transformedUsers = response.data.map(backendUser => transformUserFromBackend(backendUser));
        setAllUsers(transformedUsers);
        return transformedUsers;
      } else {
        setAllUsers([]);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setAllUsers([]);
      return [];
    } finally {
      setUsersLoading(false);
    }
  }, []);
  
  function getUsers() {
    return allUsers;
  }
  
  useEffect(() => {
    if (user && user.role === 'super_admin') {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  async function createUser(userData, creatorRole) {
    try {
      if (creatorRole !== 'super_admin') {
        return { 
          success: false, 
          message: "Only Super Admin can create users." 
        };
      }

      if (!userData.name?.trim()) {
        return { success: false, message: "Full name is required." };
      }
      
      if (!userData.email?.trim()) {
        return { success: false, message: "Email is required." };
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email.trim())) {
        return { success: false, message: "Please enter a valid email address." };
      }
      
      if (!userData.role) {
        return { success: false, message: "Role is required." };
      }
      
      if (!VALID_ROLES.includes(userData.role)) {
        return { success: false, message: "Invalid role." };
      }
      
      const institutionRequiredRoles = ['institution_manager', 'employee', 'technician', 'ict_staff'];
      if (institutionRequiredRoles.includes(userData.role)) {
        if (!userData.institution?.trim()) {
          return { success: false, message: `Institution is required for ${ROLE_LABELS[userData.role]}.` };
        }
      }
      
      const employeeIdRequiredRoles = ['institution_manager', 'employee', 'technician', 'ict_staff'];
      if (employeeIdRequiredRoles.includes(userData.role)) {
        if (!userData.employeeId?.trim()) {
          return { success: false, message: `Employee/Staff ID is required for ${ROLE_LABELS[userData.role]}.` };
        }
      }
      
      if (userData.phone && !/^[\d\s\-+()]+$/.test(userData.phone)) {
        return { success: false, message: "Please enter a valid phone number." };
      }
      
      const apiData = {
        email: userData.email.trim().toLowerCase(),
        password: userData.password?.trim() || undefined,
        fullName: userData.name.trim(),
        phone: userData.phone?.trim() || null,
        role: toBackendRole(userData.role) || userData.role.toUpperCase(),
        institutionId: userData.institution?.trim() || null,
        employeeId: userData.employeeId?.trim() || null,
        nationalId: userData.nationalId?.trim() || null
      };
      
      const response = await api.post('/users', apiData);
      
      if (!response.success) {
        return { 
          success: false, 
          message: response.message || 'Failed to create user'
        };
      }
      
      await fetchUsers();
      
      return { 
        success: true, 
        message: response.message || "User created successfully.", 
        user: response.data,
        tempPassword: response.data?.tempPassword
      };
      
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        message: 'Failed to create user. Please try again.'
      };
    }
  }

  async function updateUser(userId, updates) {
    try {
      const apiUpdates = {
        fullName: updates.name !== undefined ? updates.name : updates.fullName,
        phone: updates.phone,
        role: updates.role ? (toBackendRole(updates.role) || updates.role.toUpperCase()) : undefined,
        institutionId: updates.institution,
        employeeId: updates.employeeId,
        nationalId: updates.nationalId,
        metadata: updates.metadata
      };
      
      Object.keys(apiUpdates).forEach(key => 
        apiUpdates[key] === undefined && delete apiUpdates[key]
      );
      
      const response = await api.patch(`/users/${userId}`, apiUpdates);
      
      if (!response.success) {
        return {
          success: false,
          message: response.message || 'Failed to update user'
        };
      }
      
      await fetchUsers();

      if (user && user.id === userId && response.data) {
        const frontendUser = transformUserFromBackend(response.data);
        setUser(frontendUser);
        try {
          localStorage.setItem('user', JSON.stringify(frontendUser));
        } catch {
          // Ignore localStorage errors
        }
      }
      
      return {
        success: true,
        message: 'User updated successfully.',
        user: response.data
      };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user'
      };
    }
  }

  async function toggleUserStatus(userId) {
    try {
      const currentUsers = getUsers();
      const targetUser = currentUsers.find(u => u.id === userId);
      
      if (!targetUser) {
        return { success: false, message: 'User not found.' };
      }
      
      const currentStatus = targetUser.status || 'Active';
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      
      const response = await api.patch(`/users/${userId}/status`, {
        status: newStatus.toUpperCase()
      });
      
      if (!response.success) {
        return {
          success: false,
          message: response.message || 'Failed to update user status'
        };
      }
      
      await fetchUsers();
      
      return {
        success: true,
        message: `User ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully.`,
        user: response.data
      };
    } catch (error) {
      console.error('Toggle user status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user status'
      };
    }
  }

  async function login(email, password) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      console.log('=== LOGIN ATTEMPT (Backend API) ===');
      console.log('Email:', cleanEmail);

      if (cleanEmail.endsWith('@mesobcenter.et')) {
        return {
          success: false,
          message: 'Access restricted: Legacy @mesobcenter.et domain is prohibited. Internal staff must use @mesobcenterh.gov.et and customers must use @gmail.com.'
        };
      }

      if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@mesobcenterh.gov.et')) {
        return {
          success: false,
          message: 'Invalid email domain. Customers must use @gmail.com and internal staff must use @mesobcenterh.gov.et.'
        };
      }
      
      const response = await api.post('/auth/login', {
        email: cleanEmail,
        password: password,
      });
      
      console.log('Backend response:', response);
      
      if (!response.success) {
        console.log('Login failed:', response.message);
        return { success: false, message: response.message || "Invalid email or password. Please try again." };
      }
      
      const { user: backendUser, accessToken, mustChangePassword } = response.data;
      
      if (!backendUser || !accessToken) {
        console.error('Invalid response format: missing user or token');
        return { success: false, message: "Invalid server response. Please try again." };
      }
      
      const frontendUser = transformUserFromBackend(backendUser);
      
      if (!VALID_ROLES.includes(frontendUser.role)) {
        console.error('Invalid role from backend:', frontendUser.role);
        return { success: false, message: "Invalid user role. Please contact support." };
      }
      
      saveToken(accessToken);
      setUser(frontendUser);
      
      return { 
        success: true, 
        message: "Login successful.", 
        user: frontendUser,
        mustChangePassword: mustChangePassword || frontendUser.mustChangePassword
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: "An error occurred during login. Please try again." };
    }
  }

  async function changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (!response.success) {
        return {
          success: false,
          message: response.message || 'Failed to change password.'
        };
      }

      const { user: backendUser, accessToken } = response.data;
      if (backendUser) {
        const frontendUser = transformUserFromBackend(backendUser);
        frontendUser.mustChangePassword = false;
        setUser(frontendUser);
      }
      if (accessToken) {
        saveToken(accessToken);
      }

      return {
        success: true,
        message: 'Password changed successfully.'
      };
    } catch (error) {
      console.error('changePassword error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while changing password.'
      };
    }
  }

  async function verifyEmail(email, code, token = null) {
    try {
      const response = await api.post('/auth/verify-email', { email, code, token });
      if (response.success && user) {
        setUser(prev => ({ ...prev, emailVerified: true }));
      }
      return response;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Verification failed.' 
      };
    }
  }

  async function resendVerification(email) {
    try {
      return await api.post('/auth/resend-verification', { email });
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to resend code.' 
      };
    }
  }

  async function sendPhoneOTP(phone) {
    try {
      return await api.post('/auth/send-phone-otp', { phone });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send phone OTP.'
      };
    }
  }

  async function verifyPhoneOTP(code) {
    try {
      const res = await api.post('/auth/verify-phone-otp', { code });
      if (res.success) {
        setUser(prev => {
          const updated = prev ? { ...prev, phoneVerified: true } : prev;
          try {
            if (updated) localStorage.setItem('user', JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      }
      return res;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify phone OTP.'
      };
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    removeToken();
    setUser(null);
    window.location.href = '/';
  }

  async function signup(name, email, password, role) {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, message: "Please enter a valid email address." };
      }

      // Customer accounts strictly require Gmail address ending in @gmail.com
      if (!cleanEmail.endsWith('@gmail.com')) {
        return {
          success: false,
          message: "Customer registration requires a valid Google account ending in @gmail.com."
        };
      }
      
      // Block staff role self-registration
      const STAFF_ROLES = ['super_admin', 'mesob_manager', 'institution_manager', 'employee', 'technician', 'ict_staff'];
      if (STAFF_ROLES.includes(role)) {
        return { success: false, message: "Staff accounts can only be created by administrators." };
      }
      
      // Validate role is 'customer' for public signup
      if (role !== 'customer') {
        return { success: false, message: "Invalid role for public registration." };
      }
      
      // Call backend register API
      const response = await api.post('/auth/register', {
        email: cleanEmail,
        password: password,
        firstName: name.trim().split(' ')[0],
        lastName: name.trim().split(' ').slice(1).join(' ') || name.trim().split(' ')[0],
        role: 'CUSTOMER',
      });
      
      if (!response.success) {
        return { success: false, message: response.message || "Registration failed. Please try again." };
      }
      
      const { user: backendUser, accessToken, verificationCode } = response.data;
      
      if (!backendUser || !accessToken) {
        return { success: false, message: "Invalid server response. Please try again." };
      }
      
      const frontendUser = transformUserFromBackend(backendUser);
      
      saveToken(accessToken);
      setUser(frontendUser);
      
      return { 
        success: true, 
        message: "Account created successfully. Please verify your email.", 
        user: frontendUser,
        verificationCode 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: "An error occurred during registration. Please try again." };
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      signup, 
      changePassword,
      verifyEmail,
      resendVerification,
      sendPhoneOTP,
      verifyPhoneOTP,
      getUsers, 
      fetchUsers,
      createUser, 
      updateUser, 
      toggleUserStatus, 
      isLoggedIn: !!user,
      loading,
      usersLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Role configuration constants
export const ROLE_ROUTES = {
  super_admin:          "/dashboard/super-admin",
  mesob_manager:        "/dashboard/mesob-manager",
  institution_manager:  "/dashboard/institution-manager",
  employee:             "/dashboard/employee",
  technician:           "/dashboard/technician",
  customer:             "/dashboard/customer",
};
// Legacy route aliases for compatibility (non-enumerable so Object.entries / Object.keys don't produce duplicate items)
Object.defineProperty(ROLE_ROUTES, 'ict_staff', { value: '/dashboard/technician', enumerable: false, writable: true, configurable: true });
Object.defineProperty(ROLE_ROUTES, 'citizen', { value: '/dashboard/customer', enumerable: false, writable: true, configurable: true });

export const ROLE_LABELS = {
  super_admin:          "Super Admin",
  mesob_manager:        "MESOB Manager",
  institution_manager:  "Institution Manager",
  employee:             "Employee",
  technician:           "Technician",
  customer:             "Customer",
};
// Legacy label aliases (non-enumerable so Object.entries / Object.keys don't produce duplicate items)
Object.defineProperty(ROLE_LABELS, 'ict_staff', { value: 'Technician', enumerable: false, writable: true, configurable: true });
Object.defineProperty(ROLE_LABELS, 'citizen', { value: 'Customer', enumerable: false, writable: true, configurable: true });

// Internal staff roles manageable by administrators (Customer excluded as customers self-register)
export const INTERNAL_ROLE_LABELS = {
  super_admin:          "Super Admin",
  mesob_manager:        "MESOB Manager",
  institution_manager:  "Institution Manager",
  employee:             "Employee",
  technician:           "Technician",
};
Object.defineProperty(INTERNAL_ROLE_LABELS, 'ict_staff', { value: 'Technician', enumerable: false, writable: true, configurable: true });

export const ROLE_BADGE = {
  super_admin:          "bg-slate-100 text-slate-800 border border-slate-300 font-medium",
  mesob_manager:        "bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium",
  institution_manager:  "bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium",
  employee:             "bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium",
  technician:           "bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium",
  customer:             "bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium",
};
// Legacy aliases (non-enumerable)
Object.defineProperty(ROLE_BADGE, 'ict_staff', { value: 'bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium', enumerable: false, writable: true, configurable: true });
Object.defineProperty(ROLE_BADGE, 'citizen', { value: 'bg-blue-50 text-[#1e3a8a] border border-blue-200 font-medium', enumerable: false, writable: true, configurable: true });
