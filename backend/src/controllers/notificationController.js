import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../services/notificationService.js';

export const getNotificationsController = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const filters = {
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
      type: req.query.type,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    };

    const result = await getNotifications(req.user, filters);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get notifications controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

export const getUnreadCountController = async (req, res) => {
  try {
    const result = await getUnreadCount(req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get unread count controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count.' });
  }
};

export const patchMarkAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const result = await markAsRead(req.params.id, req.user);
    if (!result.success) {
      const status = result.message?.includes('not found') ? 404 : 400;
      return res.status(status).json(result);
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('Mark as read controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
};

export const patchMarkAllAsRead = async (req, res) => {
  try {
    const result = await markAllAsRead(req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Mark all as read controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
};
