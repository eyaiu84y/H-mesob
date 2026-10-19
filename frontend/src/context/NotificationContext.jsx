/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

/**
 * Notification types:
 * - APPLICATION_UPDATE: Application status changed
 * - QUEUE_ASSIGNMENT: Queue item assigned / called
 * - MAINTENANCE_ASSIGNMENT: Maintenance task assigned / resolved
 * - ANNOUNCEMENT: New announcement published
 * - SYSTEM_MESSAGE: System message
 */

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const activeUserIdRef = useRef(user?.id || null);
  useEffect(() => {
    activeUserIdRef.current = user?.id || null;
  }, [user?.id]);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (filters = {}) => {
    if (!activeUserIdRef.current) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.isRead !== undefined) params.append('isRead', filters.isRead);
      if (filters.type) params.append('type', filters.type);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const queryString = params.toString();
      const url = queryString ? `/notifications?${queryString}` : '/notifications';

      const response = await api.get(url);

      const isSuccess = response?.success ?? response?.data?.success;
      const dataPayload = response?.data ?? response?.data?.data;

      if (isSuccess && Array.isArray(dataPayload)) {
        setNotifications(dataPayload);
        if (response?.meta?.unreadCount !== undefined) {
          setUnreadCount(Number(response.meta.unreadCount) || 0);
        }
      } else if (isSuccess && Array.isArray(response?.data?.notifications)) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!activeUserIdRef.current) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get('/notifications/unread-count');
      const isSuccess = response?.success ?? response?.data?.success;
      const count = response?.data?.unreadCount ?? response?.data?.data?.unreadCount;

      if (isSuccess && typeof count === 'number') {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // Refresh both notifications and unread count
  const refreshNotifications = useCallback(async () => {
    if (!activeUserIdRef.current) return;
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Auto-fetch and poll when user is logged in
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Safe periodic polling every 25 seconds
    const intervalId = setInterval(() => {
      if (activeUserIdRef.current) {
        fetchNotifications();
        fetchUnreadCount();
      }
    }, 25000);

    // Refresh when user refocuses tab
    const handleFocus = () => {
      if (activeUserIdRef.current) {
        fetchNotifications();
        fetchUnreadCount();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, fetchNotifications, fetchUnreadCount]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      const isSuccess = response?.success ?? response?.data?.success;

      if (isSuccess) {
        // Optimistic / local state update
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );

        setUnreadCount(prev => Math.max(0, prev - 1));
        return { success: true };
      } else {
        throw new Error(response?.message || 'Failed to mark notification as read');
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
      const isSuccess = response?.success ?? response?.data?.success;

      if (isSuccess) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        return { success: true };
      } else {
        throw new Error(response?.message || 'Failed to mark all notifications as read');
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

  // Legacy compatibility methods
  const createNotification = useCallback((notification) => {
    console.warn('createNotification called: notifications are managed securely on the backend');
    return notification;
  }, []);

  const deleteNotification = useCallback(async () => {
    return { success: false, message: 'Delete not supported' };
  }, []);

  const clearAllNotifications = useCallback(async () => {
    return { success: false, message: 'Clear not supported' };
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
        refreshNotifications,
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

