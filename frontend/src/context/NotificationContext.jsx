/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const NotificationContext = createContext(null);

/**
 * Notification types:
 * - MAINTENANCE_ASSIGNMENT: Maintenance task assigned
 * - APPLICATION_UPDATE: Application status changed
 * - QUEUE_ASSIGNMENT: Queue item assigned
 * - ANNOUNCEMENT: New announcement published
 * - SYSTEM_MESSAGE: System message
 */

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.isRead !== undefined) params.append('isRead', filters.isRead);
      if (filters.type) params.append('type', filters.type);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const url = queryString ? `/notifications?${queryString}` : '/notifications';

      const response = await api.get(url);

      if (response.data.success && response.data.data) {
        setNotifications(response.data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count');

      if (response.data.success && response.data.data) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);

      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));

        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to mark notification as read';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.patch('/notifications/read-all');

      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );

        // Reset unread count
        setUnreadCount(0);

        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to mark all notifications as read');
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to mark all notifications as read';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  // Get notifications (filtered)
  const getNotifications = useCallback((filters = {}) => {
    let filtered = notifications;

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.read !== undefined) {
      filtered = filtered.filter(n => n.is_read === filters.read);
    }

    return filtered;
  }, [notifications]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return unreadCount;
  }, [unreadCount]);

  // Legacy compatibility methods (for old code)
  const createNotification = useCallback((notification) => {
    // This is now a no-op since backend handles notification creation
    console.warn('createNotification called but backend handles notification creation automatically');
    return notification;
  }, []);

  const deleteNotification = useCallback(async () => {
    // Not implemented in backend yet
    console.warn('deleteNotification not implemented in backend');
    return { success: false, message: 'Not implemented' };
  }, []);

  const clearAllNotifications = useCallback(async () => {
    // Not implemented in backend yet
    console.warn('clearAllNotifications not implemented in backend');
    return { success: false, message: 'Not implemented' };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        error,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        getNotifications,
        getUnreadCount,
        // Legacy compatibility
        createNotification,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
