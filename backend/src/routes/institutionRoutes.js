import express from 'express';
import { getInstitutions, getInstitution, postInstitution, patchInstitution, removeInstitution } from '../controllers/institutionController.js';
import { getInstitutionServices } from '../controllers/serviceController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/institutions
 * @desc    Get all institutions
 * @access  Public (with optional auth for personalized data)
 */
router.get('/', 
  optionalAuth,
  getInstitutions
);

/**
 * @route   GET /api/institutions/:id
 * @desc    Get institution by ID
 * @access  Public
 */
router.get('/:id', 
  optionalAuth,
  getInstitution
);

/**
 * @route   GET /api/institutions/:institutionId/services
 * @desc    Get services by institution
 * @access  Public
 */
router.get('/:institutionId/services', 
  optionalAuth,
  getInstitutionServices
);

/**
 * @route   POST /api/institutions
 * @desc    Create new institution
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER only)
 */
router.post('/', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER'),
  postInstitution
);

/**
 * @route   PATCH /api/institutions/:id
 * @desc    Update institution
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER only)
 */
router.patch('/:id', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER'),
  patchInstitution
);

router.put('/:id', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER'),
  patchInstitution
);

/**
 * @route   DELETE /api/institutions/:id
 * @desc    Delete institution (soft delete)
 * @access  Private (SUPER_ADMIN only)
 */
router.delete('/:id', 
  authenticate,
  authorize('SUPER_ADMIN'),
  removeInstitution
);

export default router;
