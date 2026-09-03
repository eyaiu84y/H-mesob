import express from 'express';
import { getUsers, getUser, postUser, patchUser, patchUserStatus, removeUser } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (with optional filters)
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.get('/', 
  authenticate, 
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (authenticated users, with authorization checks)
 */
router.get('/:id', 
  authenticate,
  getUser
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (SUPER_ADMIN only)
 */
router.post('/', 
  authenticate,
  authorize('SUPER_ADMIN'),
  postUser
);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user
 * @access  Private (authenticated users, with authorization checks)
 */
router.patch('/:id', 
  authenticate,
  patchUser
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)
 */
router.patch('/:id/status', 
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'),
  patchUserStatus
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (SUPER_ADMIN only)
 */
router.delete('/:id', 
  authenticate,
  authorize('SUPER_ADMIN'),
  removeUser
);

export default router;
