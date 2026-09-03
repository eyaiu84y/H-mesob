import express from 'express';
import {
  getNotificationsController,
  getUnreadCountController,
  patchMarkAsRead,
  patchMarkAllAsRead
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private (authenticated users)
 */
router.get('/', 
  authenticate,
  getNotificationsController
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private (authenticated users)
 */
router.get('/unread-count', 
  authenticate,
  getUnreadCountController
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (authenticated users)
 */
router.patch('/:id/read', 
  authenticate,
  patchMarkAsRead
);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (authenticated users)
 */
router.patch('/read-all', 
  authenticate,
  patchMarkAllAsRead
);

export default router;
