/**
 * Role Mapping Utility
 * 
 * Frontend uses lowercase_underscore: 'super_admin', 'mesob_manager', etc.
 * Backend uses UPPERCASE: 'SUPER_ADMIN', 'MESOB_MANAGER', etc.
 * 
 * This utility provides safe bidirectional mapping without modifying backend.
 */

/**
 * Convert frontend role to backend role format
 * @param {string} frontendRole - Frontend role (e.g., 'customer', 'technician')
 * @returns {string} Backend role (e.g., 'CUSTOMER', 'TECHNICIAN')
 */
export function toBackendRole(frontendRole) {
  if (!frontendRole) return null;
  const role = frontendRole.toLowerCase();
  if (role === 'citizen' || role === 'customer') return 'CITIZEN';
  if (role === 'ict_staff' || role === 'technician') return 'ICT_STAFF';
  return frontendRole.toUpperCase();
}

/**
 * Convert backend role to frontend role format
 * @param {string} backendRole - Backend role (e.g., 'CUSTOMER', 'TECHNICIAN')
 * @returns {string} Frontend role (e.g., 'customer', 'technician')
 */
export function toFrontendRole(backendRole) {
  if (!backendRole) return null;
  const role = backendRole.toUpperCase();
  if (role === 'CITIZEN' || role === 'CUSTOMER') return 'customer';
  if (role === 'ICT_STAFF' || role === 'TECHNICIAN') return 'technician';
  return backendRole.toLowerCase();
}

/**
 * Transform backend user object to frontend format
 * @param {object} backendUser - User object from backend API
 * @returns {object} User object in frontend format
 */
export function transformUserFromBackend(backendUser) {
  if (!backendUser) return null;
  
  // Normalize status from backend UPPERCASE to frontend title case
  let status = 'Active'; // default
  if (backendUser.status) {
    const upperStatus = backendUser.status.toUpperCase();
    if (upperStatus === 'ACTIVE') {
      status = 'Active';
    } else if (upperStatus === 'INACTIVE') {
      status = 'Inactive';
    } else if (upperStatus === 'SUSPENDED') {
      status = 'Suspended';
    }
  }
  
  return {
    id: backendUser.id,
    name: backendUser.full_name || backendUser.name,
    email: backendUser.email,
    role: toFrontendRole(backendUser.role),
    employeeId: backendUser.employee_id || backendUser.employeeId || null,
    institution: backendUser.institution_id || backendUser.institution || null,
    institution_id: backendUser.institution_id || backendUser.institution || null,
    phone: backendUser.phone || null,
    status: status,
    metadata: backendUser.metadata || null,
  };
}

/**
 * Transform frontend user object to backend format
 * @param {object} frontendUser - User object in frontend format
 * @returns {object} User object in backend format
 */
export function transformUserToBackend(frontendUser) {
  if (!frontendUser) return null;
  
  return {
    id: frontendUser.id,
    full_name: frontendUser.name,
    email: frontendUser.email,
    role: toBackendRole(frontendUser.role),
    employee_id: frontendUser.employeeId || null,
    institution_id: frontendUser.institution || null,
    phone: frontendUser.phone || null,
    status: frontendUser.status || 'Active',
  };
}
