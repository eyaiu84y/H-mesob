import { supabase } from '../config/supabase.js';

/**
 * Get user notifications
 * @param {Object} currentUser - Current authenticated user
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} List of notifications
 */
export const getNotifications = async (currentUser, filters = {}) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', currentUser.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get notifications error:', error);
      return {
        success: false,
        message: 'Failed to fetch notifications.'
      };
    }

    return {
      success: true,
      data: data || []
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
 * Get unread notification count
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Unread count
 */
export const getUnreadCount = async (currentUser) => {
  try {
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
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId, currentUser) => {
  try {
    // Verify notification belongs to user
    const { data: notification } = await supabase
      .from('notifications')
      .select('id, recipient_id')
      .eq('id', notificationId)
      .single();

    if (!notification || notification.recipient_id !== currentUser.id) {
      return {
        success: false,
        message: 'Notification not found.'
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
 * Mark all notifications as read
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Result
 */
export const markAllAsRead = async (currentUser) => {
  try {
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
