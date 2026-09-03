/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { saveToken, removeToken } from '../utils/api';
import { transformUserFromBackend } from '../utils/roleMapper';

const AuthContext = createContext(null);

// Valid roles that can be authenticated
const VALID_ROLES = ['super_admin', 'mesob_manager', 'institution_manager', 'employee', 'ict_staff', 'citizen'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        // Check if token exists
        const token = localStorage.getItem('mesob_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch user profile from backend
        const response = await api.get('/auth/me');
        
        if (response.success && response.data && response.data.user) {
          // Transform backend user to frontend format
          const frontendUser = transformUserFromBackend(response.data.user);
          
          // Validate role
          if (!VALID_ROLES.includes(frontendUser.role)) {
            console.warn('Invalid role from backend:', frontendUser.role);
            removeToken();
            setUser(null);
            setLoading(false);
            return;
          }
          
          setUser(frontendUser);
        } else {
          // Invalid or expired token
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

  // Note: User management functions (createUser, updateUser, etc.) are kept for Super Admin features
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
        // Transform backend users to frontend format
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
  
  // Get users - now returns from state (fetched from backend)
  function getUsers() {
    return allUsers;
  }
  
  // Load users on mount (for Super Admin)
  useEffect(() => {
    if (user && user.role === 'super_admin') {
      fetchUsers();
    }
  }, [user?.role]);

  async function createUser(userData, creatorRole) {
    try {
      // Authorization: Only Super Admin can create users
      if (creatorRole !== 'super_admin') {
        return { 
          success: false, 
          message: "Only Super Admin can create users." 
        };
      }

      // Validation
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
      
      const institutionRequiredRoles = ['institution_manager', 'employee', 'ict_staff'];
      if (institutionRequiredRoles.includes(userData.role)) {
        if (!userData.institution?.trim()) {
          return { success: false, message: `Institution is required for ${ROLE_LABELS[userData.role]}.` };
        }
      }
      
      const employeeIdRequiredRoles = ['institution_manager', 'employee', 'ict_staff'];
      if (employeeIdRequiredRoles.includes(userData.role)) {
        if (!userData.employeeId?.trim()) {
          return { success: false, message: `Employee/Staff ID is required for ${ROLE_LABELS[userData.role]}.` };
        }
      }
      
      if (userData.phone && !/^[\d\s\-+()]+$/.test(userData.phone)) {
        return { success: false, message: "Please enter a valid phone number." };
      }
      
      // Generate temporary password
      const tempPassword = `temp${Date.now().toString().slice(-6)}`;
      
      // Map frontend fields to backend API fields
      const apiData = {
        email: userData.email.trim().toLowerCase(),
        password: tempPassword,
        fullName: userData.name.trim(),
        phone: userData.phone?.trim() || null,
        role: userData.role.toUpperCase(), // Backend expects UPPERCASE roles
        institutionId: userData.institution?.trim() || null,
        employeeId: userData.employeeId?.trim() || null,
        nationalId: userData.nationalId?.trim() || null
      };
      
      // Call backend API to create user
      const response = await api.post('/users', apiData);
      
      if (!response.success) {
        return { 
          success: false, 
          message: response.message || 'Failed to create user'
        };
      }
      
      // Refresh users list from backend
      await fetchUsers();
      
      // Success - return temp password for display
      return { 
        success: true, 
        message: "User created successfully.", 
        user: response.data,
        tempPassword: tempPassword
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
      // Map frontend updates to backend API fields
      const apiUpdates = {
        fullName: updates.name,
        phone: updates.phone,
        role: updates.role ? updates.role.toUpperCase() : undefined,
        institutionId: updates.institution,
        employeeId: updates.employeeId,
        nationalId: updates.nationalId
      };
      
      // Remove undefined fields
      Object.keys(apiUpdates).forEach(key => 
        apiUpdates[key] === undefined && delete apiUpdates[key]
      );
      
      // Call backend API
      const response = await api.patch(`/users/${userId}`, apiUpdates);
      
      if (!response.success) {
        return {
          success: false,
          message: response.message || 'Failed to update user'
        };
      }
      
      // Refresh users list from backend
      await fetchUsers();
      
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
      // Get current user to determine new status
      const currentUsers = getUsers();
      const user = currentUsers.find(u => u.id === userId);
      
      if (!user) {
        return { success: false, message: 'User not found.' };
      }
      
      // Determine new status (toggle)
      const currentStatus = user.status || 'Active';
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      
      // Call backend API
      const response = await api.patch(`/users/${userId}/status`, {
        status: newStatus.toUpperCase() // Backend expects UPPERCASE
      });
      
      if (!response.success) {
        return {
          success: false,
          message: response.message || 'Failed to update user status'
        };
      }
      
      // Refresh users list from backend
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
      console.log('=== LOGIN ATTEMPT (Backend API) ===');
      console.log('Email:', email);
      
      // Call backend login API
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password,
      });
      
      console.log('Backend response:', response);
      
      if (!response.success) {
        console.log('Login failed:', response.message);
        return { success: false, message: response.message || "Invalid email or password. Please try again." };
      }
      
      // Extract data from response
      const { user: backendUser, accessToken } = response.data;
      
      if (!backendUser || !accessToken) {
        console.error('Invalid response format: missing user or token');
        return { success: false, message: "Invalid server response. Please try again." };
      }
      
      // Transform backend user to frontend format
      const frontendUser = transformUserFromBackend(backendUser);
      
      console.log('Transformed user:', frontendUser);
      
      // Validate role
      if (!VALID_ROLES.includes(frontendUser.role)) {
        console.error('Invalid role from backend:', frontendUser.role);
        return { success: false, message: "Invalid user role. Please contact support." };
      }
      
      // Save JWT token
      saveToken(accessToken);
      console.log('Token saved');
      
      // Update state
      setUser(frontendUser);
      console.log('User state updated');
      
      return { success: true, message: "Login successful.", user: frontendUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: "An error occurred during login. Please try again." };
    }
  }

  async function logout() {
    try {
      // Call backend logout API (best effort)
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with client-side logout even if backend call fails
    }
    
    // Clear token and user state
    removeToken();
    setUser(null);
    
    // Redirect to login page
    window.location.href = '/';
  }

  async function signup(name, email, password, role) {
    try {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return { success: false, message: "Please enter a valid email address." };
      }
      
      // Block staff role self-registration
      const STAFF_ROLES = ['super_admin', 'mesob_manager', 'institution_manager', 'employee', 'ict_staff'];
      if (STAFF_ROLES.includes(role)) {
        return { success: false, message: "Staff accounts can only be created by administrators." };
      }
      
      // Validate role is 'citizen' for public signup
      if (role !== 'citizen') {
        return { success: false, message: "Invalid role for public registration." };
      }
      
      // Call backend register API
      const response = await api.post('/auth/register', {
        email: email.trim(),
        password: password,
        firstName: name.trim().split(' ')[0],
        lastName: name.trim().split(' ').slice(1).join(' ') || name.trim().split(' ')[0],
        role: 'CITIZEN', // Backend expects UPPERCASE
      });
      
      if (!response.success) {
        return { success: false, message: response.message || "Registration failed. Please try again." };
      }
      
      // Extract data from response
      const { user: backendUser, accessToken } = response.data;
      
      if (!backendUser || !accessToken) {
        return { success: false, message: "Invalid server response. Please try again." };
      }
      
      // Transform backend user to frontend format
      const frontendUser = transformUserFromBackend(backendUser);
      
      // Save JWT token
      saveToken(accessToken);
      
      // Update state
      setUser(frontendUser);
      
      return { success: true, message: "Account created successfully.", user: frontendUser };
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
  ict_staff:            "/dashboard/ict-staff",
  citizen:              "/dashboard/citizen",
};

export const ROLE_LABELS = {
  super_admin:          "Super Admin",
  mesob_manager:        "MESOB Manager",
  institution_manager:  "Institution Manager",
  employee:             "Employee",
  ict_staff:            "ICT Staff",
  citizen:              "Citizen",
};

export const ROLE_BADGE = {
  super_admin:          "bg-purple-100 text-purple-800",
  mesob_manager:        "bg-red-100 text-red-800",
  institution_manager:  "bg-orange-100 text-orange-800",
  employee:             "bg-blue-100 text-blue-800",
  ict_staff:            "bg-cyan-100 text-cyan-800",
  citizen:              "bg-green-100 text-green-800",
};
