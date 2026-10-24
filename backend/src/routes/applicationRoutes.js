import express from 'express';
import { postApplication, getApplicationsController, getApplication, patchApplicationStatus, patchApplicationAssign, postResubmitApplication } from '../controllers/applicationController.js';
import { authenticate, authorize, requireVerifiedCustomer } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/applications
 * @desc    Create new application
 * @access  Private (CUSTOMER with verified email)
 */
router.post('/', 
  authenticate,
  authorize('CUSTOMER', 'CITIZEN'),
  requireVerifiedCustomer,
  postApplication
);

/**
 * @route   POST /api/applications/:id/resubmit
 * @desc    Resubmit application with updated documents
 * @access  Private (CUSTOMER with verified email)
 */
router.post('/:id/resubmit', 
  authenticate,
  authorize('CUSTOMER', 'CITIZEN'),
  requireVerifiedCustomer,
  postResubmitApplication
);


/**
 * @route   GET /api/applications
 * @desc    Get applications (filtered by role)
 * @access  Private (authenticated users)
 */
router.get('/', 
  authenticate,
  getApplicationsController
);

/**
 * @route   GET /api/applications/:id
 * @desc    Get application by ID
 * @access  Private (authenticated users)
 */
router.get('/:id', 
  authenticate,
  getApplication
);

/**
 * @route   PATCH /api/applications/:id/status
 * @desc    Update application status
 * @access  Private (EMPLOYEE, INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/:id/status', 
  authenticate,
  authorize('EMPLOYEE', 'INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchApplicationStatus
);

/**
 * @route   PATCH /api/applications/:id/assign
 * @desc    Assign application to employee
 * @access  Private (INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/:id/assign', 
  authenticate,
  authorize('INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchApplicationAssign
);

export default router;
