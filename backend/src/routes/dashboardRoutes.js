import express from 'express';
import { getMyDashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/dashboards/me
 * @desc    Get dashboard data for current user (role-specific)
 * @access  Private (authenticated users)
 */
router.get('/me', 
  authenticate,
  getMyDashboard
);

export default router;
