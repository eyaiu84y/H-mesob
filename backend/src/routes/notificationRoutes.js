import express from 'express';
import {
  getNotificationsController,
  getUnreadCountController,
  patchMarkAsRead,
  patchMarkAllAsRead,
  getEmailOutboxStatsController,
  getEmailOutboxLogsController,
  getEmailOutboxHealthController,
  patchEmailOutboxConfigController,
  purgeMockEmailOutboxController
} from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/notifications/email-outbox/stats
 * @desc    Get email outbox delivery monitoring stats
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER)
 */
router.get('/email-outbox/stats',
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER'),
  getEmailOutboxStatsController
);

/**
 * @route   GET /api/notifications/email-outbox/health
 * @desc    Get email outbox worker health, backlog depth, and throughput metrics
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER)
 */
router.get('/email-outbox/health',
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER'),
  getEmailOutboxHealthController
);

/**
 * @route   PATCH /api/notifications/email-outbox/config
 * @desc    Update worker concurrency or switch active email provider
 * @access  Private (SUPER_ADMIN)
 */
router.patch('/email-outbox/config',
  authenticate,
  authorize('SUPER_ADMIN'),
  patchEmailOutboxConfigController
);

/**
 * @route   GET /api/notifications/email-outbox/logs
 * @desc    Get email outbox delivery logs (masked, sanitized)
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER)
 */
router.get('/email-outbox/logs',
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER'),
  getEmailOutboxLogsController
);

/**
 * @route   POST /api/notifications/email-outbox/purge-mock
 * @desc    Purge mock/simulated email outbox logs
 * @access  Private (SUPER_ADMIN)
 */
router.post('/email-outbox/purge-mock',
  authenticate,
  authorize('SUPER_ADMIN'),
  purgeMockEmailOutboxController
);

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
