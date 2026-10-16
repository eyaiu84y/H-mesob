import { supabase } from '../config/supabase.js';

// Valid PostgreSQL notification_type enum values in Supabase schema
export const VALID_NOTIFICATION_TYPES = [
  'APPLICATION_UPDATE',
  'QUEUE_ASSIGNMENT',
  'MAINTENANCE_ASSIGNMENT',
  'ANNOUNCEMENT',
  'SYSTEM_MESSAGE'
];

/**
 * Normalizes any notification type to one of the strict Postgres enum values
 */
export const normalizeNotificationType = (type) => {
  if (!type) return 'SYSTEM_MESSAGE';
  const upper = String(type).toUpperCase();
  if (VALID_NOTIFICATION_TYPES.includes(upper)) {
    return upper;
  }
  // Mappings for approval or custom event types
  if (upper.includes('APPROVAL') || upper.includes('SECURITY') || upper.includes('SYSTEM')) {
    return 'SYSTEM_MESSAGE';
  }
  if (upper.includes('QUEUE')) {
    return 'QUEUE_ASSIGNMENT';
  }
  if (upper.includes('MAINTENANCE') || upper.includes('TASK')) {
    return 'MAINTENANCE_ASSIGNMENT';
  }
  if (upper.includes('APPLICATION') || upper.includes('DOCUMENT')) {
    return 'APPLICATION_UPDATE';
  }
  return 'SYSTEM_MESSAGE';
};

/**
 * Centralized, safe notification creator
 * Respects deduplication, validates enum types, and inserts correct column 'recipient_id'
 * 
 * @param {Object} options
 * @param {string} [options.recipientId] - Direct user recipient ID
 * @param {string} [options.userId] - Alias for recipientId
 * @param {string} [options.institutionId] - Institution scope (to notify staff)
 * @param {string|string[]} [options.roles] - Target roles within institution or system
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message content
 * @param {string} [options.relatedEntityType] - e.g. 'application', 'queue', 'maintenance_report'
 * @param {string} [options.relatedEntityId] - UUID of the related entity
 * @param {string} [options.announcementId] - UUID of announcement if applicable
 * @param {Object} [options.metadata] - Extra metadata json
 * @returns {Promise<Object>} { success: boolean, count?: number }
 */
export const createNotification = async (options) => {
  try {
    const {
      recipientId,
      userId,
      institutionId,
      roles,
      type: rawType,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      announcementId,
      metadata = {}
    } = options;

    const type = normalizeNotificationType(rawType);
    const targetUserIds = new Set();

    // Direct recipient
    const directId = recipientId || userId;
    if (directId) {
      targetUserIds.add(directId);
    }

    // Role-based / Institution-based recipients
    if (institutionId || (roles && roles.length > 0)) {
      let query = supabase
        .from('users')
        .select('id, role')
        .eq('status', 'ACTIVE');

      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }

      if (roles) {
        const roleArray = Array.isArray(roles) ? roles : [roles];
        // Normalize role names including legacy aliases
        const expandedRoles = [];
        roleArray.forEach(r => {
          const u = String(r).toUpperCase();
          expandedRoles.push(u);
          if (u === 'TECHNICIAN') expandedRoles.push('ICT_STAFF');
          if (u === 'ICT_STAFF') expandedRoles.push('TECHNICIAN');
          if (u === 'CUSTOMER') expandedRoles.push('CITIZEN');
          if (u === 'CITIZEN') expandedRoles.push('CUSTOMER');
        });
        query = query.in('role', expandedRoles);
      }

      const { data: users, error: fetchErr } = await query;
      if (!fetchErr && users) {
        users.forEach(u => targetUserIds.add(u.id));
      }
    }

    if (targetUserIds.size === 0) {
      return { success: true, count: 0, message: 'No recipients resolved.' };
    }

    const recipients = Array.from(targetUserIds);
    const nowIso = new Date().toISOString();
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    // Check recent notifications to prevent accidental duplicates
    const { data: recentNotifs } = await supabase
      .from('notifications')
      .select('recipient_id, title, related_entity_id')
      .in('recipient_id', recipients)
      .eq('type', type)
      .gte('created_at', twoMinutesAgo);

    const recentSet = new Set(
      (recentNotifs || []).map(r => `${r.recipient_id}:${r.title}:${r.related_entity_id || ''}`)
    );

    const rowsToInsert = recipients
      .filter(recId => !recentSet.has(`${recId}:${title}:${relatedEntityId || ''}`))
      .map(recId => ({
        recipient_id: recId,
        type,
        title,
        message,
        related_entity_type: relatedEntityType || null,
        related_entity_id: relatedEntityId || null,
        announcement_id: announcementId || null,
        is_read: false,
        created_at: nowIso,
        metadata: {
          ...metadata,
          original_type: rawType !== type ? rawType : undefined
        }
      }));

    if (rowsToInsert.length === 0) {
      return { success: true, count: 0, deduplicated: true };
    }

    const { error: insertErr } = await supabase
      .from('notifications')
      .insert(rowsToInsert);

    if (insertErr) {
      console.error('Failed to insert notifications:', insertErr);
      return { success: false, message: insertErr.message };
    }

    return { success: true, count: rowsToInsert.length };

  } catch (error) {
    console.error('createNotification error (non-fatal):', error);
    return { success: false, message: error.message };
  }
};

/**
 * Prepares notification dispatch for the Institution/User Approval Workflow
 */
export const notifyApprovalRequest = async ({ entityType, entityId, entityName, requestingAdminId }) => {
  return createNotification({
    roles: ['MESOB_MANAGER'],
    type: 'SYSTEM_MESSAGE',
    title: `Approval Required: ${entityType}`,
    message: `A new ${entityType} "${entityName || entityId}" has been submitted and is awaiting your review and approval.`,
    relatedEntityType: 'approval_request',
    relatedEntityId: entityId,
    metadata: {
      action: 'APPROVAL_PENDING',
      entity_type: entityType,
      requested_by: requestingAdminId
    }
  });
};

/**
 * Prepares notification dispatch when an Approval Decision is made
 */
export const notifyApprovalDecision = async ({ entityType, entityId, entityName, requestingAdminId, status, decisionNotes }) => {
  if (!requestingAdminId) return { success: false, message: 'Requesting admin ID required' };
  
  return createNotification({
    recipientId: requestingAdminId,
    type: 'SYSTEM_MESSAGE',
    title: `Approval ${status}: ${entityType}`,
    message: `Your request for ${entityType} "${entityName || entityId}" has been ${status}.${decisionNotes ? ` Reason: ${decisionNotes}` : ''}`,
    relatedEntityType: 'approval_decision',
    relatedEntityId: entityId,
    metadata: {
      action: 'APPROVAL_DECISION',
      status,
      entity_type: entityType
    }
  });
};

/**
 * Get user notifications with strict RBAC enforcement
 * @param {Object} currentUser - Current authenticated user from verified JWT
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} List of notifications
 */
export const getNotifications = async (currentUser, filters = {}) => {
  try {
    if (!currentUser || !currentUser.id) {
      return {
        success: false,
        message: 'Authentication required.'
      };
    }

    const limit = Math.min(Math.max(parseInt(filters.limit) || 30, 1), 100);
    const offset = Math.max(parseInt(filters.offset) || 0, 0);

    // Strict Authorization: User can ONLY see their own notifications
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by read status
    if (filters.isRead !== undefined) {
      query = query.eq('is_read', Boolean(filters.isRead));
    }

    // Filter by type
    if (filters.type) {
      const normalized = normalizeNotificationType(filters.type);
      query = query.eq('type', normalized);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Get notifications error:', error);
      return {
        success: false,
        message: 'Failed to fetch notifications.'
      };
    }

    return {
      success: true,
      data: data || [],
      total: count || 0,
      limit,
      offset
    };

  } catch (error) {
    console.error('Get notifications error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching notifications.'
    };
  }
};

/**
 * Get unread notification count with strict user identity isolation
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Unread count
 */
export const getUnreadCount = async (currentUser) => {
  try {
    if (!currentUser || !currentUser.id) {
      return {
        success: false,
        message: 'Authentication required.'
      };
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', currentUser.id)
      .eq('is_read', false);

    if (error) {
      console.error('Get unread count error:', error);
      return {
        success: false,
        message: 'Failed to fetch unread count.'
      };
    }

    return {
      success: true,
      data: {
        unreadCount: count || 0
      }
    };

  } catch (error) {
    console.error('Get unread count error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching unread count.'
    };
  }
};

/**
 * Mark notification as read with strict ownership verification
 * @param {string} notificationId - Notification ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId, currentUser) => {
  try {
    if (!currentUser || !currentUser.id) {
      return { success: false, message: 'Authentication required.' };
    }

    if (!notificationId) {
      return { success: false, message: 'Notification ID is required.' };
    }

    // Verify ownership: notification must belong to current user
    const { data: notification, error: findError } = await supabase
      .from('notifications')
      .select('id, recipient_id, is_read')
      .eq('id', notificationId)
      .single();

    if (findError || !notification || notification.recipient_id !== currentUser.id) {
      return {
        success: false,
        message: 'Notification not found or access denied.'
      };
    }

    // If already read, return success directly
    if (notification.is_read) {
      return {
        success: true,
        message: 'Notification already marked as read',
        data: notification
      };
    }

    // Mark as read
    const { data: updatedNotification, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('recipient_id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('Mark as read error:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read.'
      };
    }

    return {
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification
    };

  } catch (error) {
    console.error('Mark as read error:', error);
    return {
      success: false,
      message: 'An error occurred while marking notification as read.'
    };
  }
};

/**
 * Mark all notifications as read for current user
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Result
 */
export const markAllAsRead = async (currentUser) => {
  try {
    if (!currentUser || !currentUser.id) {
      return { success: false, message: 'Authentication required.' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('recipient_id', currentUser.id)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all as read error:', error);
      return {
        success: false,
        message: 'Failed to mark all notifications as read.'
      };
    }

    return {
      success: true,
      message: 'All notifications marked as read'
    };

  } catch (error) {
    console.error('Mark all as read error:', error);
    return {
      success: false,
      message: 'An error occurred while marking all notifications as read.'
    };
  }
};
