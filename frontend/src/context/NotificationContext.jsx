/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext(null);

// localStorage key for notifications
const NOTIFICATIONS_KEY = 'mesob_notifications';

/**
 * Notification types:
 * - maintenance_report: Employee submitted maintenance report
 * - task_assigned: Technician assigned to task
 * - task_completed: Technician completed task
 * - announcement: New announcement published
 */

function loadNotifications() {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch {
    // ignore
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(loadNotifications);

  // Persist to localStorage
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Create notification
  const createNotification = useCallback((notification) => {
    const newNotification = {
      id: `notif-${Date.now()}`,
      ...notification,
      read: false,
      createdAt: Date.now(),
    };
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification;
  }, []);

  // Mark as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read for a user
  const markAllAsRead = useCallback((recipientEmail) => {
    setNotifications(prev =>
      prev.map(n => 
        n.recipientEmail === recipientEmail && !n.read 
          ? { ...n, read: true } 
          : n
      )
    );
  }, []);

  // Get notifications for a specific user
  const getNotifications = useCallback((recipientEmail, filters = {}) => {
    let filtered = notifications.filter(n => n.recipientEmail === recipientEmail);

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.read !== undefined) {
      filtered = filtered.filter(n => n.read === filters.read);
    }

    if (filters.institution) {
      filtered = filtered.filter(n => n.institution === filters.institution);
    }

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [notifications]);

  // Get unread count
  const getUnreadCount = useCallback((recipientEmail) => {
    return notifications.filter(n => 
      n.recipientEmail === recipientEmail && !n.read
    ).length;
  }, [notifications]);

  // Delete notification
  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear all notifications for a user
  const clearAllNotifications = useCallback((recipientEmail) => {
    setNotifications(prev => 
      prev.filter(n => n.recipientEmail !== recipientEmail)
    );
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        createNotification,
        markAsRead,
        markAllAsRead,
        getNotifications,
        getUnreadCount,
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
