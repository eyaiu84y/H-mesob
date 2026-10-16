import {
  getApprovals,
  submitInstitution,
  resubmitInstitution,
  submitUser,
  resubmitUser,
  reviewApproval
} from '../services/approvalService.js';

/**
 * GET /api/approvals
 * Retrieve approval queue
 * Access: SUPER_ADMIN, MESOB_MANAGER
 */
export const getApprovalQueue = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type
    };

    const result = await getApprovals(filters, req.user);
    if (!result.success) {
      return res.status(403).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('getApprovalQueue error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving approvals.' });
  }
};

/**
 * POST /api/approvals/institution
 * Submit an institution for central approval
 * Access: SUPER_ADMIN
 */
export const postSubmitInstitution = async (req, res) => {
  try {
    const result = await submitInstitution(req.body, req.user);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('postSubmitInstitution error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting institution.' });
  }
};

/**
 * POST /api/approvals/institution/:id/resubmit
 * Resubmit a previously rejected institution
 * Access: SUPER_ADMIN
 */
export const postResubmitInstitution = async (req, res) => {
  try {
    const result = await resubmitInstitution(req.params.id, req.body, req.user);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('postResubmitInstitution error:', error);
    return res.status(500).json({ success: false, message: 'Server error resubmitting institution.' });
  }
};

/**
 * POST /api/approvals/user
 * Submit an eligible user account for central approval (e.g. INSTITUTION_MANAGER)
 * Access: SUPER_ADMIN
 */
export const postSubmitUser = async (req, res) => {
  try {
    const result = await submitUser(req.body, req.user);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('postSubmitUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting user account.' });
  }
};

/**
 * POST /api/approvals/user/:id/resubmit
 * Resubmit a previously rejected user account
 * Access: SUPER_ADMIN
 */
export const postResubmitUser = async (req, res) => {
  try {
    const result = await resubmitUser(req.params.id, req.body, req.user);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('postResubmitUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error resubmitting user account.' });
  }
};

/**
 * PATCH /api/approvals/:entityType/:entityId/decision
 * Approve or Reject an institution or user request
 * Access: MESOB_MANAGER strictly
 */
export const patchApprovalDecision = async (req, res) => {
  try {
    const entityId = req.params.entityId || req.params.id;
    const entityType = req.params.entityType || req.body.entityType || req.body.type;
    const { decision, reason, notes } = req.body;

    const result = await reviewApproval(
      { entityType, entityId, decision, reason: reason || notes },
      req.user
    );

    if (!result.success) {
      // 403 if unauthorized or anti-privilege escalation; 400 for bad request
      const status = result.message?.includes('Anti-privilege') || result.message?.includes('Access denied') ? 403 : 400;
      return res.status(status).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('patchApprovalDecision error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing approval decision.' });
  }
};
