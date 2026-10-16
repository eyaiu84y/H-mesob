import express from 'express';
import { postJoinQueue, getQueuesController, getQueue, postCallNext, patchQueueStatus, getQueueStatusController } from '../controllers/queueController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/queues/join
 * @desc    Join queue
 * @access  Private (CITIZEN)
 */
router.post('/join', 
  authenticate,
  authorize('CUSTOMER', 'CITIZEN'),
  postJoinQueue
);

/**
 * @route   GET /api/queues
 * @desc    Get queues (filtered by role)
 * @access  Private (authenticated users)
 */
router.get('/', 
  authenticate,
  getQueuesController
);

/**
 * @route   GET /api/queues/:id
 * @desc    Get queue by ID
 * @access  Private (authenticated users)
 */
router.get('/:id', 
  authenticate,
  getQueue
);

/**
 * @route   POST /api/queues/call-next
 * @desc    Call next person in queue (auto-selects next pending)
 * @access  Private (EMPLOYEE, INSTITUTION_MANAGER)
 */
router.post('/call-next', 
  authenticate,
  authorize('EMPLOYEE', 'INSTITUTION_MANAGER'),
  postCallNext
);

/**
 * @route   POST /api/queues/:id/call-next
 * @desc    Call specific queue entry by ID
 * @access  Private (EMPLOYEE, INSTITUTION_MANAGER)
 */
router.post('/:id/call-next', 
  authenticate,
  authorize('EMPLOYEE', 'INSTITUTION_MANAGER'),
  postCallNext
);

/**
 * @route   PATCH /api/queues/:id/status
 * @desc    Update queue status
 * @access  Private (EMPLOYEE, INSTITUTION_MANAGER, SUPER_ADMIN, MESOB_MANAGER)
 */
router.patch('/:id/status', 
  authenticate,
  authorize('EMPLOYEE', 'INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'),
  patchQueueStatus
);

/**
 * @route   GET /api/queues/:id/status
 * @desc    Get queue status (public)
 * @access  Public
 */
router.get('/:id/status', 
  optionalAuth,
  getQueueStatusController
);

export default router;
