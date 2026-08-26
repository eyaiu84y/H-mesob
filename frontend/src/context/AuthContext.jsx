/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

// Constants extracted to separate exports to avoid react-refresh warnings
const DEMO_USERS = [
  { id: 1, name: "Super Admin",          email: "superadmin@mesobcenter.et",        password: "super123",   role: "super_admin",         employeeId: "EMP-001", institution: null, status: "Active" },
  { id: 2, name: "MESOB Manager",        email: "manager@mesobcenter.et",           password: "manager123", role: "mesob_manager",       employeeId: "EMP-002", institution: null, status: "Active" },
  
  // National ID Program
  { id: 3, name: "Institution Manager",  email: "inst.manager@mesobcenter.et",      password: "inst123",    role: "institution_manager", employeeId: "EMP-003", institution: "National ID Program", status: "Active" },
  { id: 4, name: "Abebe Kebede",         email: "employee@mesobcenter.et",          password: "emp123",     role: "employee",            employeeId: "EMP-004", institution: "National ID Program", status: "Active" },
  { id: 5, name: "ICT Staff",            email: "ict.staff@mesobcenter.et",         password: "ict123",     role: "technician",          employeeId: "TECH-001", institution: "National ID Program", status: "Active" },
  
  // Commercial Bank of Ethiopia (CBE)
  { id: 7, name: "Yonas Tadesse",        email: "cbe.manager@mesobcenter.et",       password: "cbe123",     role: "institution_manager", employeeId: "EMP-007", institution: "Commercial Bank of Ethiopia", status: "Active" },
  { id: 8, name: "Meron Alemu",          email: "cbe.employee@mesobcenter.et",      password: "cbe123",     role: "employee",            employeeId: "EMP-008", institution: "Commercial Bank of Ethiopia", status: "Active" },
  { id: 9, name: "Solomon Bekele",       email: "cbe.ict@mesobcenter.et",           password: "cbe123",     role: "technician",          employeeId: "TECH-002", institution: "Commercial Bank of Ethiopia", status: "Active" },
  
  // Ethio Telecom
  { id: 10, name: "Tigist Worku",        email: "ethiotel.manager@mesobcenter.et",  password: "ethio123",   role: "institution_manager", employeeId: "EMP-010", institution: "Ethio Telecom", status: "Active" },
  { id: 11, name: "Dawit Haile",         email: "ethiotel.employee@mesobcenter.et", password: "ethio123",   role: "employee",            employeeId: "EMP-011", institution: "Ethio Telecom", status: "Active" },
  { id: 12, name: "Hanna Tesfaye",       email: "ethiotel.ict@mesobcenter.et",      password: "ethio123",   role: "technician",          employeeId: "TECH-003", institution: "Ethio Telecom", status: "Active" },
  
  // Citizen (no institution)
  { id: 6, name: "Citizen",              email: "citizen@mesobcenter.et",           password: "citizen123", role: "citizen",             employeeId: null, institution: null, status: "Active" },
];

const AuthContext = createContext(null);

// Valid roles that can be authenticated
const VALID_ROLES = ['super_admin', 'mesob_manager', 'institution_manager', 'employee', 'technician', 'citizen'];

// Validate stored session
function validateStoredSession(sessionData) {
  if (!sessionData) return null;
  
  // Check required fields
  if (!sessionData.id || !sessionData.name || !sessionData.email || !sessionData.role) {
    console.warn('Invalid session: missing required fields');
    return null;
  }
  
  // Check role is valid
  if (!VALID_ROLES.includes(sessionData.role)) {
    console.warn('Invalid session: unknown role', sessionData.role);
    return null;
  }
  
  // Session is valid
  return sessionData;
}

export function AuthProvider({ children }) {
  // Initialize user state from localStorage with validation
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('mesob_auth');
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      const validated = validateStoredSession(parsed);
      
      if (!validated) {
        // Clear invalid session
        localStorage.removeItem('mesob_auth');
        return null;
      }
      
      return validated;
    } catch (error) {
      console.error('Failed to restore session:', error);
      localStorage.removeItem('mesob_auth');
      return null;
    }
  });

  function getUsers() {
    try {
      const stored = localStorage.getItem('mesob_users');
      if (!stored) {
        return [...DEMO_USERS];
      }
      
      const storedUsers = JSON.parse(stored);
      
      // Get demo user emails for comparison
      const demoEmails = DEMO_USERS.map(u => u.email.toLowerCase());
      
      // Filter out any stored versions of demo users (they might be outdated)
      const customUsers = storedUsers.filter(
        u => !demoEmails.includes(u.email.toLowerCase())
      );
      
      // Always use current DEMO_USERS (authoritative) + custom signup users
      return [...DEMO_USERS, ...customUsers];
    } catch {
      return [...DEMO_USERS];
    }
  }

  function saveUsers(users) {
    localStorage.setItem('mesob_users', JSON.stringify(users));
  }

  // Super Admin and Institution Manager create users
  function createUser(userData, creatorRole, creatorInstitution) {
    const users = getUsers();
    
    // Validation
    if (!userData.name?.trim()) {
      return { success: false, message: "Full name is required." };
    }
    
    if (!userData.email?.trim()) {
      return { success: false, message: "Email is required." };
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email.trim())) {
      return { success: false, message: "Please enter a valid email address." };
    }
    
    // Check duplicate email
    const exists = users.find((u) => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (exists) {
      return { success: false, message: "An account with this email already exists." };
    }
    
    // Role validation
    if (!userData.role) {
      return { success: false, message: "Role is required." };
    }
    
    if (!VALID_ROLES.includes(userData.role)) {
      return { success: false, message: "Invalid role." };
    }
    
    // RBAC - Super Admin can create any role
    // Institution Manager can only create employee and technician for their institution
    if (creatorRole === 'institution_manager') {
      if (!['employee', 'technician'].includes(userData.role)) {
        return { success: false, message: "Institution Managers can only create Employee and Technician accounts." };
      }
      if (userData.institution !== creatorInstitution) {
        return { success: false, message: "Institution Managers can only create users for their own institution." };
      }
    }
    
    // Institution validation for institution-scoped roles
    const institutionRequiredRoles = ['institution_manager', 'employee', 'technician'];
    if (institutionRequiredRoles.includes(userData.role)) {
      if (!userData.institution?.trim()) {
        return { success: false, message: `Institution is required for ${ROLE_LABELS[userData.role]}.` };
      }
    }
    
    // Employee ID validation for staff roles
    const employeeIdRequiredRoles = ['institution_manager', 'employee', 'technician'];
    if (employeeIdRequiredRoles.includes(userData.role)) {
      if (!userData.employeeId?.trim()) {
        return { success: false, message: `Employee/Staff ID is required for ${ROLE_LABELS[userData.role]}.` };
      }
    }
    
    // Phone validation (optional but format check if provided)
    if (userData.phone && !/^[\d\s\-+()]+$/.test(userData.phone)) {
      return { success: false, message: "Please enter a valid phone number." };
    }
    
    // Generate temporary password
    const tempPassword = `temp${Date.now().toString().slice(-6)}`;
    
    const newUser = {
      id: Date.now(),
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone?.trim() || null,
      password: tempPassword, // Temporary password
      role: userData.role,
      employeeId: userData.employeeId?.trim() || null,
      institution: userData.institution?.trim() || null,
      status: userData.status || 'Active',
      createdAt: Date.now(),
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return { 
      success: true, 
      message: "User created successfully.", 
      user: newUser,
      tempPassword: tempPassword // Return temp password for admin to share
    };
  }

  // Update user (Super Admin only, or Institution Manager for their staff)
  function updateUser(userId, updates, updaterRole, updaterInstitution) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: "User not found." };
    }
    
    const existingUser = users[userIndex];
    
    // RBAC check
    if (updaterRole === 'institution_manager') {
      // Institution Manager can only update their own institution's employee/technician
      if (!['employee', 'technician'].includes(existingUser.role)) {
        return { success: false, message: "You can only update Employee and Technician accounts." };
      }
      if (existingUser.institution !== updaterInstitution) {
        return { success: false, message: "You can only update users from your institution." };
      }
      // Prevent role escalation
      if (updates.role && !['employee', 'technician'].includes(updates.role)) {
        return { success: false, message: "You cannot assign administrative roles." };
      }
    }
    
    // Validation for updates
    if (updates.name !== undefined && !updates.name?.trim()) {
      return { success: false, message: "Name cannot be empty." };
    }
    
    if (updates.role && !VALID_ROLES.includes(updates.role)) {
      return { success: false, message: "Invalid role." };
    }
    
    // Institution validation
    const institutionRequiredRoles = ['institution_manager', 'employee', 'technician'];
    if (updates.role && institutionRequiredRoles.includes(updates.role)) {
      if (!updates.institution?.trim() && !existingUser.institution) {
        return { success: false, message: `Institution is required for ${ROLE_LABELS[updates.role]}.` };
      }
    }
    
    // Update user
    users[userIndex] = {
      ...existingUser,
      ...updates,
      id: existingUser.id, // Preserve ID
      email: existingUser.email, // Email cannot be changed
      password: existingUser.password, // Password not changed here
      updatedAt: Date.now(),
    };
    
    saveUsers(users);
    
    return { success: true, message: "User updated successfully.", user: users[userIndex] };
  }

  // Activate/Deactivate user
  function toggleUserStatus(userId, updaterRole, updaterInstitution) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: "User not found." };
    }
    
    const user = users[userIndex];
    
    // RBAC check
    if (updaterRole === 'institution_manager') {
      if (!['employee', 'technician'].includes(user.role)) {
        return { success: false, message: "You can only manage Employee and Technician accounts." };
      }
      if (user.institution !== updaterInstitution) {
        return { success: false, message: "You can only manage users from your institution." };
      }
    }
    
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    users[userIndex] = { ...user, status: newStatus, updatedAt: Date.now() };
    
    saveUsers(users);
    
    return { success: true, message: `User ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully.`, user: users[userIndex] };
  }

  function login(email, password) {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Email:', email);
      console.log('Password:', password ? '***' : 'empty');
      
      const users = getUsers();
      console.log('Available users:', users.map(u => u.email));
      
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      console.log('User found:', found ? found.email : 'NO');
      
      if (!found) {
        console.log('Login failed: Invalid credentials');
        return { success: false, message: "Invalid email or password. Please try again." };
      }
      
      // Validate role before creating session
      if (!VALID_ROLES.includes(found.role)) {
        console.error('Login failed: Invalid role', found.role);
        return { success: false, message: "Invalid user role. Please contact support." };
      }
      
      const sessionUser = { 
        id: found.id, 
        name: found.name, 
        email: found.email, 
        role: found.role,
        employeeId: found.employeeId || null,
        institution: found.institution || null
      };
      console.log('Session user created:', sessionUser);
      
      localStorage.setItem('mesob_auth', JSON.stringify(sessionUser));
      console.log('User saved to localStorage');
      
      setUser(sessionUser);
      console.log('State updated with user');
      
      return { success: true, message: "Login successful.", user: sessionUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: "An error occurred during login. Please try again." };
    }
  }

  function logout() {
    localStorage.removeItem('mesob_auth');
    setUser(null);
    window.location.href = '/';
  }

  function signup(name, email, password, role) {
    const users = getUsers();
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { success: false, message: "Please enter a valid email address." };
    }
    
    // CRITICAL: Block staff role self-registration
    // Only 'citizen' role is allowed for public signup
    // Staff roles can ONLY be created by Super Admin through User Management
    const STAFF_ROLES = ['super_admin', 'mesob_manager', 'institution_manager', 'employee', 'technician'];
    if (STAFF_ROLES.includes(role)) {
      return { success: false, message: "Staff accounts can only be created by administrators." };
    }
    
    // Validate role is 'citizen' for public signup
    if (role !== 'citizen') {
      return { success: false, message: "Invalid role for public registration." };
    }
    
    const exists = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      return { success: false, message: "An account with this email already exists." };
    }
    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      employeeId: null, // Citizens don't have employee IDs
      institution: null, // Citizens are not assigned to institutions
      status: 'Active', // New citizens are active by default
      phone: null,
      createdAt: Date.now(),
    };
    users.push(newUser);
    saveUsers(users);
    const sessionUser = { 
      id: newUser.id, 
      name: newUser.name, 
      email: newUser.email, 
      role: newUser.role,
      employeeId: newUser.employeeId,
      institution: newUser.institution,
    };
    localStorage.setItem('mesob_auth', JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { success: true, message: "Account created successfully.", user: sessionUser };
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, getUsers, createUser, updateUser, toggleUserStatus, isLoggedIn: !!user }}>
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
  citizen:              "/dashboard/citizen",
};

export const ROLE_LABELS = {
  super_admin:          "Super Admin",
  mesob_manager:        "MESOB Manager",
  institution_manager:  "Institution Manager",
  employee:             "Employee",
  technician:           "ICT Staff",
  citizen:              "Citizen",
};

export const ROLE_BADGE = {
  super_admin:          "bg-purple-100 text-purple-800",
  mesob_manager:        "bg-red-100 text-red-800",
  institution_manager:  "bg-orange-100 text-orange-800",
  employee:             "bg-blue-100 text-blue-800",
  technician:           "bg-cyan-100 text-cyan-800",
  citizen:              "bg-green-100 text-green-800",
};
