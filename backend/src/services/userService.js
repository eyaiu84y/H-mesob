import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

/**
 * Get all users with optional filtering
 * @param {Object} filters - Filter options (role, status, institutionId)
 * @param {Object} user - Current authenticated user
 * @returns {Promise<Object>} List of users
 */
export const getAllUsers = async (filters = {}, user) => {
  try {
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        status,
        institution_id,
        created_at,
        last_login_at
      `)
      .order('created_at', { ascending: false });

    // Institution-scoped filtering
    if (user.role === 'INSTITUTION_MANAGER' || user.role === 'EMPLOYEE' || user.role === 'TECHNICIAN' || user.role === 'ICT_STAFF') {
      query = query.eq('institution_id', user.institution_id);
    }

    // Apply filters
    if (filters.role) {
      const upperRole = String(filters.role).toUpperCase();
      if (upperRole === 'CUSTOMER' || upperRole === 'CITIZEN') {
        query = query.eq('role', 'CITIZEN');
      } else if (upperRole === 'TECHNICIAN' || upperRole === 'ICT_STAFF') {
        query = query.eq('role', 'ICT_STAFF');
      } else {
        query = query.eq('role', upperRole);
      }
    }
    if (filters.status) {
      const upperStatus = String(filters.status).toUpperCase();
      query = query.eq('status', upperStatus);
    }
    if (filters.institutionId && (user.role === 'SUPER_ADMIN' || user.role === 'MESOB_MANAGER')) {
      query = query.eq('institution_id', filters.institutionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        message: 'Failed to fetch users.'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Get users error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching users.'
    };
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (userId, currentUser) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        status,
        institution_id,
        employee_id,
        profile_photo_url,
        national_id,
        created_at,
        updated_at,
        last_login_at,
        metadata
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        success: false,
        message: 'User not found.'
      };
    }

    // Authorization: Users can only view users in their institution (except SUPER_ADMIN/MESOB_MANAGER)
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'MESOB_MANAGER') {
      if (user.institution_id !== currentUser.institution_id && user.id !== currentUser.id) {
        return {
          success: false,
          message: 'You do not have permission to view this user.'
        };
      }
    }

    return {
      success: true,
      data: user
    };

  } catch (error) {
    console.error('Get user by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch user.'
    };
  }
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData, currentUser) => {
  try {
    const { email, password, fullName, phone, role, institutionId, employeeId, nationalId } = userData;

    // Authorization: Only SUPER_ADMIN can create users
    if (currentUser.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        message: 'Only Super Admin can create users.'
      };
    }

    // Validation
    if (!email || !password || !fullName || !role) {
      return {
        success: false,
        message: 'Email, password, full name, and role are required.'
      };
    }

    // Role validation
    const validRoles = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'CUSTOMER', 'ICT_STAFF', 'CITIZEN'];
    if (!validRoles.includes(role)) {
      return {
        success: false,
        message: 'Invalid role specified.'
      };
    }

    // If Super Admin creates a user or for any INSTITUTION_MANAGER accounts, route through central Mesob Manager approval workflow
    const currentRole = (currentUser?.role || '').toUpperCase();
    if (currentRole === 'SUPER_ADMIN' || role === 'INSTITUTION_MANAGER') {
      const { submitUser } = await import('./approvalService.js');
      return submitUser(userData, currentUser);
    }

    // Institution validation for institutional roles
    if (['INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes(role) && !institutionId) {
      return {
        success: false,
        message: 'Institution ID is required for this role.'
      };
    }

    // Resolve institution ID to UUID for institutional roles
let institutionUuid = null;

if (institutionId && ['INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes(role)) {
  const { data: institution, error: instError } = await supabase
    .from('institutions')
    .select('id')
    .eq('id', institutionId)
    .single();

  if (instError || !institution) {
    return {
      success: false,
      message: 'Invalid institution specified.'
    };
  }

  institutionUuid = institution.id;
}

    // Check if email exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email already exists.'
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    let { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        phone,
        role,
        institution_id: institutionUuid || null,
        employee_id: employeeId || null,
        national_id: nationalId || null,
        status: 'ACTIVE',
        created_by: currentUser.id,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        status,
        institution_id,
        employee_id,
        created_at
      `)
      .single();

    if (error && error.code === '22P02') {
      const fallbackRole = role === 'CUSTOMER' ? 'CITIZEN' : role === 'TECHNICIAN' ? 'ICT_STAFF' : null;
      if (fallbackRole) {
        const fallbackRes = await supabase
          .from('users')
          .insert({
            email: email.toLowerCase(),
            password_hash: passwordHash,
            full_name: fullName,
            phone,
            role: fallbackRole,
            institution_id: institutionUuid || null,
            employee_id: employeeId || null,
            national_id: nationalId || null,
            status: 'ACTIVE',
            created_by: currentUser.id,
            created_at: new Date().toISOString()
          })
          .select(`
            id,
            email,
            full_name,
            phone,
            role,
            status,
            institution_id,
            employee_id,
            created_at
          `)
          .single();
        newUser = fallbackRes.data;
        error = fallbackRes.error;
      }
    }

    if (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        message: 'Failed to create user.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'USER_CREATE', `Created user: ${newUser.email}`);

    return {
      success: true,
      message: 'User created successfully',
      data: newUser
    };

  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      message: 'An error occurred while creating user.'
    };
  }
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, updates, currentUser) => {
  try {
    // Get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role, institution_id, email')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return {
        success: false,
        message: 'User not found.'
      };
    }

    // Authorization checks
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'MESOB_MANAGER') {
      // INSTITUTION_MANAGER can only update users in their institution
      if (currentUser.role === 'INSTITUTION_MANAGER') {
        if (existingUser.institution_id !== currentUser.institution_id) {
          return {
            success: false,
            message: 'You can only update users in your institution.'
          };
        }
      } else {
        // Other roles can only update themselves
        if (userId !== currentUser.id) {
          return {
            success: false,
            message: 'You can only update your own profile.'
          };
        }
      }
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (updates.fullName) updateData.full_name = updates.fullName;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.profilePhotoUrl) updateData.profile_photo_url = updates.profilePhotoUrl;
    if (updates.nationalId) updateData.national_id = updates.nationalId;
    if (updates.employeeId) updateData.employee_id = updates.employeeId;

    // Only admins can change role
    if (updates.role && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MESOB_MANAGER')) {
      const r = String(updates.role).toUpperCase();
      updateData.role = r === 'CUSTOMER' ? 'CITIZEN' : r === 'TECHNICIAN' ? 'ICT_STAFF' : r;
    }

    // Only admins can change institution
    if (updates.institutionId && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MESOB_MANAGER')) {
      updateData.institution_id = updates.institutionId;
    }

    // Password change
    if (updates.password) {
      updateData.password_hash = await bcrypt.hash(updates.password, 10);
      updateData.password_changed_at = new Date().toISOString();
    }

    // Update user
    let { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        status,
        institution_id,
        updated_at
      `)
      .single();

    if (error && error.code === '22P02' && updateData.role) {
      const fallbackRole = updateData.role === 'CUSTOMER' ? 'CITIZEN' : updateData.role === 'TECHNICIAN' ? 'ICT_STAFF' : null;
      if (fallbackRole) {
        const fallbackRes = await supabase
          .from('users')
          .update({ ...updateData, role: fallbackRole })
          .eq('id', userId)
          .select(`
            id,
            email,
            full_name,
            phone,
            role,
            status,
            institution_id,
            updated_at
          `)
          .single();
        updatedUser = fallbackRes.data;
        error = fallbackRes.error;
      }
    }

    if (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: 'Failed to update user.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'USER_UPDATE', `Updated user: ${existingUser.email}`);

    return {
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    };

  } catch (error) {
    console.error('Update user error:', error);
    return {
      success: false,
      message: 'An error occurred while updating user.'
    };
  }
};

/**
 * Update user status
 * @param {string} userId - User ID
 * @param {string} status - New status (ACTIVE, INACTIVE, SUSPENDED)
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated user
 */
export const updateUserStatus = async (userId, status, currentUser) => {
  try {
    // Only admins and institution managers can change status
    if (!['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: 'You do not have permission to change user status.'
      };
    }

    // Validate status
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return {
        success: false,
        message: 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED.'
      };
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('institution_id, email, metadata')
      .eq('id', userId)
      .single();

    if (!user) {
      return {
        success: false,
        message: 'User not found.'
      };
    }

    // Anti-privilege escalation: cannot directly activate if pending central approval
    if (status === 'ACTIVE') {
      const approvalStatus = user.metadata?.approval?.status;
      if (approvalStatus === 'PENDING_APPROVAL' || approvalStatus === 'REJECTED') {
        return {
          success: false,
          message: 'Anti-privilege escalation: User accounts pending or rejected in central approval can only be activated through the central approval workflow.'
        };
      }
    }

    // Institution managers can only update users in their institution
    if (currentUser.role === 'INSTITUTION_MANAGER' && user.institution_id !== currentUser.institution_id) {
      return {
        success: false,
        message: 'You can only update users in your institution.'
      };
    }

    // Update status
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, status')
      .single();

    if (error) {
      console.error('Update status error:', error);
      return {
        success: false,
        message: 'Failed to update user status.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'USER_STATUS_UPDATE', `Changed ${user.email} status to ${status}`);

    return {
      success: true,
      message: 'User status updated successfully',
      data: updatedUser
    };

  } catch (error) {
    console.error('Update user status error:', error);
    return {
      success: false,
      message: 'An error occurred while updating user status.'
    };
  }
};

/**
 * Delete user (soft delete - set status to INACTIVE)
 * @param {string} userId - User ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Result
 */
export const deleteUser = async (userId, currentUser) => {
  try {
    // Only SUPER_ADMIN can delete users
    if (currentUser.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        message: 'Only super administrators can delete users.'
      };
    }

    // Cannot delete yourself
    if (userId === currentUser.id) {
      return {
        success: false,
        message: 'You cannot delete your own account.'
      };
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      return {
        success: false,
        message: 'User not found.'
      };
    }

    // Soft delete (set status to INACTIVE)
    const { error } = await supabase
      .from('users')
      .update({
        status: 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        message: 'Failed to delete user.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'USER_DELETE', `Deleted user: ${user.email}`);

    return {
      success: true,
      message: 'User deleted successfully'
    };

  } catch (error) {
    console.error('Delete user error:', error);
    return {
      success: false,
      message: 'An error occurred while deleting user.'
    };
  }
};

// Helper: Log audit event
const logAudit = async (userId, action, details) => {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
