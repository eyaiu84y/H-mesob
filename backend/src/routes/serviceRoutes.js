import express from 'express';
import {
  getServices,
  getInstitutionServices,
  getService,
  postService,
  patchService,
  removeService,
  getRequirements,
  postRequirement,
  patchRequirement,
  removeRequirement
} from '../controllers/serviceController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// SERVICES ROUTES
// ============================================================================

/**
 * @route   GET /api/services
 * @desc    Get all services (with optional filters)
 * @access  Public
 */
router.get('/', 
  optionalAuth,
  getServices
);

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public
 */
router.get('/:id', 
  optionalAuth,
  getService
);

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.post('/', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  postService
);

/**
 * @route   PATCH /api/services/:id
 * @desc    Update service
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.patch('/:id', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  patchService
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service (soft delete)
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER)
 */
router.delete('/:id', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER'),
  removeService
);

// ============================================================================
// REQUIREMENTS ROUTES
// ============================================================================

/**
 * @route   GET /api/services/:serviceId/requirements
 * @desc    Get requirements by service
 * @access  Public
 */
router.get('/:serviceId/requirements', 
  optionalAuth,
  getRequirements
);

/**
 * @route   POST /api/services/:serviceId/requirements
 * @desc    Create requirement
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.post('/:serviceId/requirements', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  postRequirement
);

/**
 * @route   PATCH /api/requirements/:id
 * @desc    Update requirement
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.patch('/requirements/:id', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  patchRequirement
);

/**
 * @route   DELETE /api/requirements/:id
 * @desc    Delete requirement
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.delete('/requirements/:id', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  removeRequirement
);

export default router;
