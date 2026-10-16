import { supabase } from '../config/supabase.js';

/**
 * Get all institutions
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} List of institutions
 */
export const getAllInstitutions = async (filters = {}) => {
  try {
    let query = supabase
      .from('institutions')
      .select(`
        id,
        name_en,
        name_am,
        code,
        description,
        logo_url,
        website_url,
        phone,
        email,
        address,
        status,
        created_at,
        updated_at
      `)
      .order('name_en', { ascending: true });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get institutions error:', error);
      return {
        success: false,
        message: 'Failed to fetch institutions.'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Get institutions error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching institutions.'
    };
  }
};

/**
 * Get institution by ID
 * @param {string} institutionId - Institution ID
 * @returns {Promise<Object>} Institution data
 */
export const getInstitutionById = async (institutionId) => {
  try {
    const { data: institution, error } = await supabase
      .from('institutions')
      .select(`
        id,
        name_en,
        name_am,
        code,
        description,
        logo_url,
        website_url,
        phone,
        email,
        address,
        status,
        created_at,
        updated_at,
        metadata
      `)
      .eq('id', institutionId)
      .single();

    if (error || !institution) {
      return {
        success: false,
        message: 'Institution not found.'
      };
    }

    // Get services count
    const { count: servicesCount } = await supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId);

    // Get users count
    const { count: usersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId);

    institution.services_count = servicesCount || 0;
    institution.users_count = usersCount || 0;

    return {
      success: true,
      data: institution
    };

  } catch (error) {
    console.error('Get institution by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch institution.'
    };
  }
};

/**
 * Create new institution
 * Directs through Central Mesob Manager approval workflow
 * @param {Object} institutionData - Institution data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created institution pending approval
 */
export const createInstitution = async (institutionData, currentUser) => {
  const { submitInstitution } = await import('./approvalService.js');
  return submitInstitution(institutionData, currentUser);
};

/**
 * Update institution
 * @param {string} institutionId - Institution ID
 * @param {Object} updates - Fields to update
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated institution
 */
export const updateInstitution = async (institutionId, updates, currentUser) => {
  try {
    // Get existing institution
    const { data: existingInstitution, error: fetchError } = await supabase
      .from('institutions')
      .select('id, name_en, metadata, status')
      .eq('id', institutionId)
      .single();

    if (fetchError || !existingInstitution) {
      return {
        success: false,
        message: 'Institution not found.'
      };
    }

    // Anti-privilege escalation: cannot directly activate if pending central approval
    if (updates.status === 'ACTIVE' || updates.status === 'Active') {
      const approvalStatus = existingInstitution.metadata?.approval?.status;
      if (approvalStatus === 'PENDING_APPROVAL' || approvalStatus === 'REJECTED') {
        return {
          success: false,
          message: 'Anti-privilege escalation: Institutions pending or rejected in central approval can only be activated through the central approval workflow.'
        };
      }
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name_en = updates.name;
    if (updates.nameAm) updateData.name_am = updates.nameAm;
    if (updates.code) updateData.code = updates.code;
    if (updates.description) updateData.description = updates.description;
    if (updates.logoUrl) updateData.logo_url = updates.logoUrl;
    if (updates.websiteUrl) updateData.website_url = updates.websiteUrl;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.email) updateData.email = updates.email;
    if (updates.address) updateData.address = updates.address;
    if (updates.status) updateData.status = updates.status;

    // Update institution
    const { data: updatedInstitution, error } = await supabase
      .from('institutions')
      .update(updateData)
      .eq('id', institutionId)
      .select(`
        id,
        name_en,
        name_am,
        code,
        description,
        logo_url,
        status,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Update institution error:', error);
      return {
        success: false,
        message: 'Failed to update institution.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'INSTITUTION_UPDATE', `Updated institution: ${existingInstitution.name_en}`);

    return {
      success: true,
      message: 'Institution updated successfully',
      data: updatedInstitution
    };

  } catch (error) {
    console.error('Update institution error:', error);
    return {
      success: false,
      message: 'An error occurred while updating institution.'
    };
  }
};

/**
 * Delete institution (soft delete - set status to INACTIVE)
 * @param {string} institutionId - Institution ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Result
 */
export const deleteInstitution = async (institutionId, currentUser) => {
  try {
    // Get institution
    const { data: institution } = await supabase
      .from('institutions')
      .select('name_en')
      .eq('id', institutionId)
      .single();

    if (!institution) {
      return {
        success: false,
        message: 'Institution not found.'
      };
    }

    // Check if institution has active users
    const { count: activeUsersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionId)
      .eq('status', 'ACTIVE');

    if (activeUsersCount > 0) {
      return {
        success: false,
        message: `Cannot delete institution with ${activeUsersCount} active users. Please deactivate users first.`
      };
    }

    // Soft delete (set status to INACTIVE)
    const { error } = await supabase
      .from('institutions')
      .update({
        status: 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', institutionId);

    if (error) {
      console.error('Delete institution error:', error);
      return {
        success: false,
        message: 'Failed to delete institution.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'INSTITUTION_DELETE', `Deleted institution: ${institution.name_en}`);

    return {
      success: true,
      message: 'Institution deleted successfully'
    };

  } catch (error) {
    console.error('Delete institution error:', error);
    return {
      success: false,
      message: 'An error occurred while deleting institution.'
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
