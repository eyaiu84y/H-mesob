import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Feedback Routes
 * All routes require authentication
 */

// Submit feedback (Customers only)
router.post('/', authenticate, feedbackController.submitFeedback);

// Get my feedback (Customers only)
router.get('/my-feedback', authenticate, feedbackController.getMyFeedback);

// Check if can submit feedback (Customers only)
router.get('/can-submit', authenticate, feedbackController.checkCanSubmit);

// Get institution feedback (Institution Managers only)
router.get('/institution', authenticate, feedbackController.getInstitutionFeedback);

// Get institution statistics (Institution Managers only)
router.get('/institution/stats', authenticate, feedbackController.getInstitutionStats);

// Get all feedback (MESOB Managers and Super Admins only)
router.get('/', authenticate, feedbackController.getAllFeedback);

// Get overall statistics (MESOB Managers and Super Admins only)
router.get('/stats', authenticate, feedbackController.getOverallStats);

export default router;
