import { supabase } from '../config/supabase.js';

// Valid PostgreSQL notification_type enum values in Supabase schema
export const VALID_NOTIFICATION_TYPES = [
  'APPLICATION_UPDATE',
  'QUEUE_ASSIGNMENT',
  'MAINTENANCE_ASSIGNMENT',
  'ANNOUNCEMENT',
  'SYSTEM_MESSAGE'
];

// Valid PostgreSQL user_role enum values in Supabase schema
export const VALID_DB_ROLES = [
  'SUPER_ADMIN',
  'MESOB_MANAGER',
  'INSTITUTION_MANAGER',
  'EMPLOYEE',
  'ICT_STAFF',
  'CITIZEN'
];

/**
 * Maps any role string/alias to the exact PostgreSQL enum value
 * E.g., 'CUSTOMER' -> 'CITIZEN', 'TECHNICIAN' -> 'ICT_STAFF'
 */
export const toDbRole = (role) => {
  if (!role) return null;
  const upper = String(role).toUpperCase().trim();
  if (upper === 'CUSTOMER' || upper === 'CITIZEN') return 'CITIZEN';
  if (upper === 'TECHNICIAN' || upper === 'ICT_STAFF') return 'ICT_STAFF';
  if (VALID_DB_ROLES.includes(upper)) return upper;
  return null;
};

/**
 * Checks whether a notification represents an internal administrative or approval event
 * that customers must NEVER receive or see.
 */
export const isInternalAdministrativeNotification = (title = '', type = '', relatedEntityType = '', metadata = {}) => {
  const t = String(title || '').toLowerCase();
  const ret = String(relatedEntityType || '').toLowerCase();
  const action = String(metadata?.action || '').toLowerCase();
  const entityType = String(metadata?.entity_type || '').toLowerCase();

  // Internal approval requests / decisions
  if (ret === 'approval_request' || ret === 'approval_decision') return true;
  if (t.includes('approval required') || t.includes('approval approved') || t.includes('approval rejected')) return true;
  if (action.includes('approval') || action.includes('user_approve') || action.includes('institution_approve')) return true;
  if (entityType === 'user account' || entityType === 'institution' || entityType === 'user') {
    if (t.includes('approval') || action.includes('approval')) return true;
  }
  return false;
};

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
 * Respects deduplication, validates enum types, role-based targeting, and recipient RBAC filtering.
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
        const rawRoleArray = Array.isArray(roles) ? roles : [roles];
        const dbRoles = [...new Set(rawRoleArray.map(toDbRole).filter(Boolean))];
        if (dbRoles.length > 0) {
          query = query.in('role', dbRoles);
        } else {
          // If none of the passed roles match valid roles, return no matches safely
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data: users, error: fetchErr } = await query;
      if (!fetchErr && users) {
        users.forEach(u => targetUserIds.add(u.id));
      } else if (fetchErr) {
        console.error('Failed to resolve role recipients for notification:', fetchErr);
      }
    }

    if (targetUserIds.size === 0) {
      return { success: true, count: 0, message: 'No recipients resolved.' };
    }

    let recipients = Array.from(targetUserIds);

    // SECURITY CHECK: Customers must NEVER receive internal administrative notifications
    const isInternal = isInternalAdministrativeNotification(title, type, relatedEntityType, metadata);
    if (isInternal && recipients.length > 0) {
      const { data: recipientUsers, error: recUserErr } = await supabase
        .from('users')
        .select('id, role')
        .in('id', recipients);

      if (!recUserErr && recipientUsers) {
        const customerIds = new Set(
          recipientUsers.filter(u => u.role === 'CITIZEN' || u.role === 'CUSTOMER').map(u => u.id)
        );
        if (customerIds.size > 0) {
          console.warn(`[SECURITY] Stripped ${customerIds.size} CUSTOMER/CITIZEN recipients from internal notification: "${title}"`);
          recipients = recipients.filter(id => !customerIds.has(id));
        }
      }
    }

    if (recipients.length === 0) {
      return { success: true, count: 0, message: 'No authorized recipients remaining for this notification.' };
    }

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

    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
    const validRelatedEntityId = isUuid(relatedEntityId) ? relatedEntityId.trim() : null;
    const validAnnouncementId = isUuid(announcementId) ? announcementId.trim() : null;

    const rowsToInsert = recipients
      .filter(recId => !recentSet.has(`${recId}:${title}:${relatedEntityId || ''}`))
      .map(recId => ({
        recipient_id: recId,
        type,
        title,
        message,
        related_entity_type: relatedEntityType || null,
        related_entity_id: validRelatedEntityId,
        announcement_id: validAnnouncementId,
        is_read: false,
        created_at: nowIso,
        metadata: {
          ...metadata,
          ...(relatedEntityId && !validRelatedEntityId ? { raw_related_entity_id: relatedEntityId } : {}),
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
 * Strictly routes to authorized MESOB_MANAGER users.
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
 * Strictly routes to the submitting administrator (requestingAdminId).
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
    const userRole = toDbRole(currentUser.role);
    const isCustomer = userRole === 'CITIZEN' || userRole === 'CUSTOMER';

    // Strict Authorization: User can ONLY see their own notifications
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Defense-in-depth: Customers must never receive or see internal administrative notifications
    if (isCustomer) {
      query = query
        .not('related_entity_type', 'in', '("approval_request","approval_decision")')
        .not('title', 'ilike', '%Approval Required%')
        .not('title', 'ilike', '%Approval APPROVED: User Account%')
        .not('title', 'ilike', '%Approval REJECTED: User Account%')
        .not('title', 'ilike', '%Approval APPROVED: Institution%')
        .not('title', 'ilike', '%Approval REJECTED: Institution%');
    }

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

    // Data sanitization: Do not expose internal administrative details or personal identifiers to customers
    const sanitizedData = (data || []).map(notif => {
      if (isCustomer) {
        const { metadata: rawMeta, ...rest } = notif;
        const safeMeta = {};
        if (rawMeta && typeof rawMeta === 'object') {
          // Allow customer-relevant metadata attributes only
          const allowedKeys = [
            'action',
            'status',
            'application_number',
            'queue_number',
            'service_name',
            'rating',
            'feedback_id',
            'ticket_number',
            'counter'
          ];
          allowedKeys.forEach(key => {
            if (rawMeta[key] !== undefined) safeMeta[key] = rawMeta[key];
          });
        }
        return {
          ...rest,
          metadata: safeMeta
        };
      }
      return notif;
    });

    return {
      success: true,
      data: sanitizedData,
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

    const userRole = toDbRole(currentUser.role);
    const isCustomer = userRole === 'CITIZEN' || userRole === 'CUSTOMER';

    let query = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', currentUser.id)
      .eq('is_read', false);

    // Defense-in-depth: Exclude internal administrative notifications from customer unread count
    if (isCustomer) {
      query = query
        .not('related_entity_type', 'in', '("approval_request","approval_decision")')
        .not('title', 'ilike', '%Approval Required%')
        .not('title', 'ilike', '%Approval APPROVED: User Account%')
        .not('title', 'ilike', '%Approval REJECTED: User Account%')
        .not('title', 'ilike', '%Approval APPROVED: Institution%')
        .not('title', 'ilike', '%Approval REJECTED: Institution%');
    }

    const { count, error } = await query;

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

    const userRole = toDbRole(currentUser.role);
    const isCustomer = userRole === 'CITIZEN' || userRole === 'CUSTOMER';

    // Verify ownership: notification must exist and belong strictly to current user
    const { data: notification, error: findError } = await supabase
      .from('notifications')
      .select('id, recipient_id, is_read, title, type, related_entity_type, metadata')
      .eq('id', notificationId)
      .single();

    if (findError || !notification || notification.recipient_id !== currentUser.id) {
      return {
        success: false,
        message: 'Notification not found or access denied.'
      };
    }

    // Customer security: customer cannot access or mark internal administrative notifications as read
    if (isCustomer && isInternalAdministrativeNotification(notification.title, notification.type, notification.related_entity_type, notification.metadata)) {
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
 * Strictly applies only to the authenticated user's authorized notifications.
 * 
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Result
 */
export const markAllAsRead = async (currentUser) => {
  try {
    if (!currentUser || !currentUser.id) {
      return { success: false, message: 'Authentication required.' };
    }

    const userRole = toDbRole(currentUser.role);
    const isCustomer = userRole === 'CITIZEN' || userRole === 'CUSTOMER';

    let updateQuery = supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('recipient_id', currentUser.id)
      .eq('is_read', false);

    if (isCustomer) {
      updateQuery = updateQuery
        .not('related_entity_type', 'in', '("approval_request","approval_decision")')
        .not('title', 'ilike', '%Approval Required%')
        .not('title', 'ilike', '%Approval APPROVED: User Account%')
        .not('title', 'ilike', '%Approval REJECTED: User Account%')
        .not('title', 'ilike', '%Approval APPROVED: Institution%')
        .not('title', 'ilike', '%Approval REJECTED: Institution%');
    }

    const { error } = await updateQuery;

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
