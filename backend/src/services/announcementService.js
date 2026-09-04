import { supabase } from '../config/supabase.js';

/**
 * Get announcements (filtered by user role)
 * @param {Object} filters - Filter options
 * @param {Object} currentUser - Current authenticated user (optional)
 * @returns {Promise<Object>} List of announcements
 */
export const getAnnouncements = async (filters, currentUser) => {
  try {
    let query = supabase
      .from('announcements')
      .select(`
        id,
        title,
        content,
        scope,
        target_roles,
        is_active,
        published_at,
        expires_at,
        created_at,
        institutions (
          id,
          name_en,
          name_am
        ),
        creator:users!announcements_published_by_fkey (
          id,
          full_name
        )
      `)
      .eq('is_active', true)
      .order('published_at', { ascending: false });

    // Filter by expiration
    query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // Role-based filtering with PUBLIC/INTERNAL distinction
    if (currentUser) {
      // CITIZEN: Only PUBLIC announcements
      if (currentUser.role === 'CITIZEN') {
        query = query.eq('scope', 'PUBLIC');
      } 
      // STAFF (all other roles): PUBLIC + INTERNAL + authorized INSTITUTION + authorized ROLE
      else {
        // Build OR conditions for staff visibility
        // Note: We'll fetch all and filter to avoid complex Postgres array queries
        // This is more reliable than using .cs operator which can fail
      }
    } else {
      // Public only for unauthenticated users
      query = query.eq('scope', 'PUBLIC');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get announcements error:', error);
      return {
        success: false,
        message: 'Failed to fetch announcements.'
      };
    }

    // For staff users, apply additional filtering in JavaScript
    let filteredData = data || [];
    
    if (currentUser && currentUser.role !== 'CITIZEN') {
      filteredData = (data || []).filter(announcement => {
        // PUBLIC - visible to everyone
        if (announcement.scope === 'PUBLIC') return true;
        
        // INTERNAL - visible only to staff
        if (announcement.scope === 'INTERNAL') return true;
        
        // SYSTEM - visible to admins only
        if (announcement.scope === 'SYSTEM') {
          return ['SUPER_ADMIN', 'MESOB_MANAGER'].includes(currentUser.role);
        }
        
        // INSTITUTION - visible if user belongs to the institution
        if (announcement.scope === 'INSTITUTION' && announcement.institution_id) {
          return currentUser.institution_id === announcement.institution_id;
        }
        
        // ROLE - visible if user's role is in target_roles
        if (announcement.target_roles && Array.isArray(announcement.target_roles)) {
          return announcement.target_roles.includes(currentUser.role);
        }
        
        return false;
      });
    }

    return {
      success: true,
      data: filteredData
    };

  } catch (error) {
    console.error('Get announcements error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching announcements.'
    };
  }
};

/**
 * Get announcement by ID
 * @param {string} announcementId - Announcement ID
 * @returns {Promise<Object>} Announcement data
 */
export const getAnnouncementById = async (announcementId) => {
  try {
    const { data: announcement, error } = await supabase
      .from('announcements')
      .select(`
        *,
        institutions (
          id,
          name_en,
          name_am
        ),
        creator:users!announcements_published_by_fkey (
          id,
          full_name,
          role
        )
      `)
      .eq('id', announcementId)
      .single();

    if (error || !announcement) {
      return {
        success: false,
        message: 'Announcement not found.'
      };
    }

    return {
      success: true,
      data: announcement
    };

  } catch (error) {
    console.error('Get announcement by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch announcement.'
    };
  }
};

/**
 * Create announcement
 * @param {Object} announcementData - Announcement data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created announcement
 */
export const createAnnouncement = async (announcementData, currentUser) => {
  try {
    const { title, content, scope, targetRoles, institutionId, expiresAt } = announcementData;

    // Validation
    if (!title || !content || !scope) {
      return {
        success: false,
        message: 'Title, content, and scope are required.'
      };
    }

    // Validate scope
    const validScopes = ['SYSTEM', 'INSTITUTION', 'ROLE', 'PUBLIC', 'INTERNAL'];
    if (!validScopes.includes(scope)) {
      return {
        success: false,
        message: 'Invalid scope.'
      };
    }

    // Create announcement (automatically published)
    const { data: newAnnouncement, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        scope,
        target_roles: targetRoles || [],
        institution_id: scope === 'INSTITUTION' ? institutionId : null,
        published_by: currentUser.id,
        is_active: true, // Auto-publish on creation
        published_at: new Date().toISOString(), // Set publish time
        expires_at: expiresAt || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Create announcement error:', error);
      return {
        success: false,
        message: 'Failed to create announcement.'
      };
    }

    // Send notifications to target users
    await notifyTargetUsers(newAnnouncement);

    // Log audit
    await logAudit(currentUser.id, 'ANNOUNCEMENT_CREATE', `Created and published announcement: ${title}`);

    return {
      success: true,
      message: 'Announcement created and published successfully',
      data: newAnnouncement
    };

  } catch (error) {
    console.error('Create announcement error:', error);
    return {
      success: false,
      message: 'An error occurred while creating announcement.'
    };
  }
};

/**
 * Update announcement
 * @param {string} announcementId - Announcement ID
 * @param {Object} updates - Fields to update
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated announcement
 */
export const updateAnnouncement = async (announcementId, updates, currentUser) => {
  try {
    // Get existing announcement
    const { data: existing } = await supabase
      .from('announcements')
      .select('id, published_by, title')
      .eq('id', announcementId)
      .single();

    if (!existing) {
      return {
        success: false,
        message: 'Announcement not found.'
      };
    }

    // Authorization: only creator or admins can update
    if (existing.published_by !== currentUser.id && 
        !['SUPER_ADMIN', 'MESOB_MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: 'You do not have permission to update this announcement.'
      };
    }

    // Prepare update data
    const updateData = { updated_at: new Date().toISOString() };
    
    if (updates.title) updateData.title = updates.title;
    if (updates.content) updateData.content = updates.content;
    if (updates.scope) updateData.scope = updates.scope;
    if (updates.targetRoles) updateData.target_roles = updates.targetRoles;
    if (updates.institutionId !== undefined) updateData.institution_id = updates.institutionId;
    if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;

    // Update announcement
    const { data: updatedAnnouncement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', announcementId)
      .select()
      .single();

    if (error) {
      console.error('Update announcement error:', error);
      return {
        success: false,
        message: 'Failed to update announcement.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'ANNOUNCEMENT_UPDATE', `Updated announcement: ${existing.title}`);

    return {
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
    };

  } catch (error) {
    console.error('Update announcement error:', error);
    return {
      success: false,
      message: 'An error occurred while updating announcement.'
    };
  }
};

/**
 * Publish announcement
 * @param {string} announcementId - Announcement ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Published announcement
 */
export const publishAnnouncement = async (announcementId, currentUser) => {
  try {
    // Get announcement
    const { data: announcement } = await supabase
      .from('announcements')
      .select('id, title, scope, target_roles, institution_id')
      .eq('id', announcementId)
      .single();

    if (!announcement) {
      return {
        success: false,
        message: 'Announcement not found.'
      };
    }

    // Publish
    const { data: publishedAnnouncement, error } = await supabase
      .from('announcements')
      .update({
        is_active: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', announcementId)
      .select()
      .single();

    if (error) {
      console.error('Publish announcement error:', error);
      return {
        success: false,
        message: 'Failed to publish announcement.'
      };
    }

    // Create notifications for target users
    await notifyTargetUsers(announcement);

    // Log audit
    await logAudit(currentUser.id, 'ANNOUNCEMENT_PUBLISH', `Published announcement: ${announcement.title}`);

    return {
      success: true,
      message: 'Announcement published successfully',
      data: publishedAnnouncement
    };

  } catch (error) {
    console.error('Publish announcement error:', error);
    return {
      success: false,
      message: 'An error occurred while publishing announcement.'
    };
  }
};

/**
 * Delete announcement
 * @param {string} announcementId - Announcement ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Result
 */
export const deleteAnnouncement = async (announcementId, currentUser) => {
  try {
    // Get announcement
    const { data: announcement } = await supabase
      .from('announcements')
      .select('id, published_by, title')
      .eq('id', announcementId)
      .single();

    if (!announcement) {
      return {
        success: false,
        message: 'Announcement not found.'
      };
    }

    // Authorization
    if (announcement.published_by !== currentUser.id && 
        !['SUPER_ADMIN', 'MESOB_MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: 'You do not have permission to delete this announcement.'
      };
    }

    // Delete
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) {
      console.error('Delete announcement error:', error);
      return {
        success: false,
        message: 'Failed to delete announcement.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'ANNOUNCEMENT_DELETE', `Deleted announcement: ${announcement.title}`);

    return {
      success: true,
      message: 'Announcement deleted successfully'
    };

  } catch (error) {
    console.error('Delete announcement error:', error);
    return {
      success: false,
      message: 'An error occurred while deleting announcement.'
    };
  }
};

// Helper: Notify target users
const notifyTargetUsers = async (announcement) => {
  try {
    let query = supabase.from('users').select('id').eq('status', 'ACTIVE');

    if (announcement.scope === 'PUBLIC') {
      // All active users
    } else if (announcement.scope === 'INTERNAL') {
      // Only staff (all roles except CITIZEN)
      query = query.in('role', ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'ICT_STAFF']);
    } else if (announcement.scope === 'SYSTEM') {
      // Only admins and managers
      query = query.in('role', ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER']);
    } else if (announcement.scope === 'ROLE' && announcement.target_roles.length > 0) {
      query = query.in('role', announcement.target_roles);
    } else if (announcement.scope === 'INSTITUTION' && announcement.institution_id) {
      query = query.eq('institution_id', announcement.institution_id);
    }

    const { data: users } = await query;

    if (users && users.length > 0) {
      const notifications = users.map(user => ({
        recipient_id: user.id,
        type: 'ANNOUNCEMENT',
        title: 'New Announcement',
        message: announcement.title,
        related_entity_id: announcement.id,
        related_entity_type: 'announcement',
        is_read: false,
        created_at: new Date().toISOString()
      }));

      await supabase.from('notifications').insert(notifications);
    }
  } catch (error) {
    console.error('Failed to notify target users:', error);
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
