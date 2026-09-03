import express from 'express';
import {
  postMaintenanceReport,
  getReports,
  getReport,
  postAssignReport,
  getMyTasksController,
  getTask,
  patchTaskStatus,
  patchResolveTask
} from '../controllers/maintenanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/maintenance/reports
 * @desc    Create maintenance report
 * @access  Private (EMPLOYEE, ICT_STAFF, INSTITUTION_MANAGER)
 */
router.post('/reports', 
  authenticate,
  authorize('EMPLOYEE', 'ICT_STAFF', 'INSTITUTION_MANAGER'),
  postMaintenanceReport
);

/**
 * @route   GET /api/maintenance/reports
 * @desc    Get maintenance reports (filtered by role)
 * @access  Private (authenticated users)
 */
router.get('/reports', 
  authenticate,
  getReports
);

/**
 * @route   GET /api/maintenance/reports/:id
 * @desc    Get maintenance report by ID
 * @access  Private (authenticated users)
 */
router.get('/reports/:id', 
  authenticate,
  getReport
);

/**
 * @route   POST /api/maintenance/reports/:id/assign
 * @desc    Assign maintenance report to ICT staff
 * @access  Private (INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.post('/reports/:id/assign', 
  authenticate,
  authorize('INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  postAssignReport
);

/**
 * @route   GET /api/maintenance/my-tasks
 * @desc    Get my maintenance tasks (for ICT staff)
 * @access  Private (ICT_STAFF)
 */
router.get('/my-tasks', 
  authenticate,
  authorize('ICT_STAFF'),
  getMyTasksController
);

/**
 * @route   GET /api/maintenance/tasks/:id
 * @desc    Get task by ID
 * @access  Private (ICT_STAFF, INSTITUTION_MANAGER)
 */
router.get('/tasks/:id', 
  authenticate,
  authorize('ICT_STAFF', 'INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  getTask
);

/**
 * @route   PATCH /api/maintenance/tasks/:id/status
 * @desc    Update task status
 * @access  Private (ICT_STAFF, INSTITUTION_MANAGER)
 */
router.patch('/tasks/:id/status', 
  authenticate,
  authorize('ICT_STAFF', 'INSTITUTION_MANAGER'),
  patchTaskStatus
);

/**
 * @route   PATCH /api/maintenance/tasks/:id/resolve
 * @desc    Resolve maintenance task
 * @access  Private (ICT_STAFF, INSTITUTION_MANAGER)
 */
router.patch('/tasks/:id/resolve', 
  authenticate,
  authorize('ICT_STAFF', 'INSTITUTION_MANAGER'),
  patchResolveTask
);

export default router;
