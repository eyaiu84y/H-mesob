import express from 'express';
import {
  postMaintenanceReport,
  getReports,
  getReport,
  postAssignReport,
  patchReviewReport,
  patchApproveReport,
  patchRejectReport,
  patchCloseReport,
  patchReopenReport,
  patchResolveReport,
  patchReportStatus,
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
 * @access  Private (EMPLOYEE, TECHNICIAN, ICT_STAFF, INSTITUTION_MANAGER)
 */
router.post('/reports', 
  authenticate,
  authorize('EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'),
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
 * @route   PATCH /api/maintenance/reports/:id/review
 * @desc    Review maintenance report (Approve or Reject)
 * @access  Private (INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/reports/:id/review',
  authenticate,
  authorize('INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchReviewReport
);

/**
 * @route   PATCH /api/maintenance/reports/:id/approve
 * @desc    Approve maintenance report
 * @access  Private (INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/reports/:id/approve',
  authenticate,
  authorize('INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchApproveReport
);

/**
 * @route   PATCH /api/maintenance/reports/:id/reject
 * @desc    Reject maintenance report (requires reason)
 * @access  Private (INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/reports/:id/reject',
  authenticate,
  authorize('INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchRejectReport
);

/**
 * @route   POST /api/maintenance/reports/:id/assign
 * @desc    Assign maintenance report to Technician
 * @access  Private (INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.post('/reports/:id/assign', 
  authenticate,
  authorize('INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  postAssignReport
);

/**
 * @route   PATCH /api/maintenance/reports/:id/status
 * @desc    Update report status (IN_PROGRESS, WAITING_PARTS, ON_HOLD)
 * @access  Private (TECHNICIAN, ICT_STAFF, INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/reports/:id/status',
  authenticate,
  authorize('TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchReportStatus
);

/**
 * @route   PATCH /api/maintenance/reports/:id/resolve
 * @desc    Resolve maintenance report directly
 * @access  Private (TECHNICIAN, ICT_STAFF, INSTITUTION_MANAGER)
 */
router.patch('/reports/:id/resolve',
  authenticate,
  authorize('TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'),
  patchResolveReport
);

/**
 * @route   PATCH /api/maintenance/reports/:id/close
 * @desc    Verify completion and close maintenance report
 * @access  Private (INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/reports/:id/close',
  authenticate,
  authorize('INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchCloseReport
);

/**
 * @route   PATCH /api/maintenance/reports/:id/reopen
 * @desc    Return/reopen maintenance report with reason
 * @access  Private (INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/reports/:id/reopen',
  authenticate,
  authorize('INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchReopenReport
);

/**
 * @route   GET /api/maintenance/my-tasks
 * @desc    Get my maintenance tasks (for Technicians)
 * @access  Private (TECHNICIAN, ICT_STAFF)
 */
router.get('/my-tasks', 
  authenticate,
  authorize('TECHNICIAN', 'ICT_STAFF'),
  getMyTasksController
);

/**
 * @route   GET /api/maintenance/tasks/:id
 * @desc    Get task by ID
 * @access  Private (TECHNICIAN, ICT_STAFF, INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.get('/tasks/:id', 
  authenticate,
  authorize('TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  getTask
);

/**
 * @route   PATCH /api/maintenance/tasks/:id/status
 * @desc    Update task status
 * @access  Private (TECHNICIAN, ICT_STAFF, INSTITUTION_MANAGER)
 */
router.patch('/tasks/:id/status', 
  authenticate,
  authorize('TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'),
  patchTaskStatus
);

/**
 * @route   PATCH /api/maintenance/tasks/:id/resolve
 * @desc    Resolve maintenance task
 * @access  Private (TECHNICIAN, ICT_STAFF, INSTITUTION_MANAGER)
 */
router.patch('/tasks/:id/resolve', 
  authenticate,
  authorize('TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'),
  patchResolveTask
);

export default router;

