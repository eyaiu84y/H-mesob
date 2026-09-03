import express from 'express';
import {
  getAnnouncementsController,
  getAnnouncement,
  postAnnouncement,
  patchAnnouncement,
  postPublishAnnouncement,
  removeAnnouncement
} from '../controllers/announcementController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/announcements
 * @desc    Get announcements (filtered by role)
 * @access  Public (with optional auth for personalized filtering)
 */
router.get('/', 
  optionalAuth,
  getAnnouncementsController
);

/**
 * @route   GET /api/announcements/:id
 * @desc    Get announcement by ID
 * @access  Public
 */
router.get('/:id', 
  optionalAuth,
  getAnnouncement
);

/**
 * @route   POST /api/announcements
 * @desc    Create announcement
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.post('/', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  postAnnouncement
);

/**
 * @route   PATCH /api/announcements/:id
 * @desc    Update announcement
 * @access  Private (creator or admins)
 */
router.patch('/:id', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  patchAnnouncement
);

/**
 * @route   POST /api/announcements/:id/publish
 * @desc    Publish announcement
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.post('/:id/publish', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  postPublishAnnouncement
);

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete announcement
 * @access  Private (creator or admins)
 */
router.delete('/:id', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  removeAnnouncement
);

export default router;
