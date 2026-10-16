import express from 'express';
import {
  getApprovalQueue,
  postSubmitInstitution,
  postResubmitInstitution,
  postSubmitUser,
  postResubmitUser,
  patchApprovalDecision
} from '../controllers/approvalController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/approvals
 * @desc    Get approval queue (supports ?status=... and ?type=...)
 * @access  Private (SUPER_ADMIN, MESOB_MANAGER)
 */
router.get('/',
  authenticate,
  authorize('SUPER_ADMIN', 'MESOB_MANAGER'),
  getApprovalQueue
);

/**
 * @route   POST /api/approvals/institution
 * @desc    Submit institution for central approval
 * @access  Private (SUPER_ADMIN only)
 */
router.post('/institution',
  authenticate,
  authorize('SUPER_ADMIN'),
  postSubmitInstitution
);

/**
 * @route   POST /api/approvals/institution/:id/resubmit
 * @desc    Resubmit a rejected institution with corrections
 * @access  Private (SUPER_ADMIN only)
 */
router.post('/institution/:id/resubmit',
  authenticate,
  authorize('SUPER_ADMIN'),
  postResubmitInstitution
);

/**
 * @route   POST /api/approvals/user
 * @desc    Submit eligible user account for central approval (e.g. INSTITUTION_MANAGER)
 * @access  Private (SUPER_ADMIN only)
 */
router.post('/user',
  authenticate,
  authorize('SUPER_ADMIN'),
  postSubmitUser
);

/**
 * @route   POST /api/approvals/user/:id/resubmit
 * @desc    Resubmit a rejected user account with corrections
 * @access  Private (SUPER_ADMIN only)
 */
router.post('/user/:id/resubmit',
  authenticate,
  authorize('SUPER_ADMIN'),
  postResubmitUser
);

/**
 * @route   PATCH|POST /api/approvals/:entityType/:entityId/decision
 * @route   PATCH|POST /api/approvals/:id/review
 * @route   PATCH|POST /api/approvals/:id/decision
 * @desc    Approve or Reject an institution or user submission
 * @access  Private (MESOB_MANAGER strictly)
 */
router.patch('/:entityType/:entityId/decision',
  authenticate,
  authorize('MESOB_MANAGER'),
  patchApprovalDecision
);

router.post('/:entityType/:entityId/decision',
  authenticate,
  authorize('MESOB_MANAGER'),
  patchApprovalDecision
);

router.post('/:entityType/:entityId/review',
  authenticate,
  authorize('MESOB_MANAGER'),
  patchApprovalDecision
);

router.patch('/:entityType/:entityId/review',
  authenticate,
  authorize('MESOB_MANAGER'),
  patchApprovalDecision
);

router.post('/:id/review',
  authenticate,
  authorize('MESOB_MANAGER'),
  patchApprovalDecision
);

router.patch('/:id/decision',
  authenticate,
  authorize('MESOB_MANAGER'),
  patchApprovalDecision
);

router.post('/:id/decision',
  authenticate,
  authorize('MESOB_MANAGER'),
  patchApprovalDecision
);

export default router;
