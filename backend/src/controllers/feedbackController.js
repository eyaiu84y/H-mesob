import * as feedbackService from '../services/feedbackService.js';

/**
 * Feedback Controller
 * Handles HTTP requests for feedback operations
 */

/**
 * Submit feedback
 * POST /api/feedback
 * Body: { institution_id, service_id, rating, application_id?, queue_entry_id?, comment?, source? }
 */
export async function submitFeedback(req, res) {
  try {
    const { institution_id, service_id, rating, application_id, queue_entry_id, comment, source } = req.body;

    // Validate required fields
    if (!institution_id) {
      return res.status(400).json({
        success: false,
        message: 'Institution ID is required'
      });
    }

    if (!service_id) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required'
      });
    }

    // Validate rating value
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Ensure user is a customer/citizen
    const role = (req.user.role || '').toUpperCase();
    if (role !== 'CUSTOMER' && role !== 'CITIZEN') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can submit feedback'
      });
    }

    // Submit feedback
    const feedback = await feedbackService.submitFeedback({
      citizen_id: req.user.id,
      institution_id,
      service_id,
      rating: ratingNum,
      application_id: application_id || null,
      queue_entry_id: queue_entry_id || null,
      comment: comment || null,
      source: source || 'WEBSITE'
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error in submitFeedback controller:', error);

    if (error.message === 'You have already rated this service') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('not found') || error.message.includes('not active')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
}

/**
 * Get feedback for current user
 * GET /api/feedback/my-feedback
 * Query params: institution_id?, service_id?, rating?
 */
export async function getMyFeedback(req, res) {
  try {
    const { institution_id, service_id, rating } = req.query;

    // Only customers can access their own feedback
    const role = (req.user.role || '').toUpperCase();
    if (role !== 'CUSTOMER' && role !== 'CITIZEN') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can access this endpoint'
      });
    }

    const filters = {};
    if (institution_id) filters.institution_id = institution_id;
    if (service_id) filters.service_id = service_id;
    if (rating) filters.rating = parseInt(rating);

    const feedback = await feedbackService.getCitizenFeedback(req.user.id, filters);

    return res.status(200).json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error in getMyFeedback controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
}

/**
 * Get feedback for institution (Institution Manager only)
 * GET /api/feedback/institution
 * Query params: service_id?, rating?, source?, date_from?, date_to?
 */
export async function getInstitutionFeedback(req, res) {
  try {
    const { service_id, rating, source, date_from, date_to } = req.query;

    // Only institution managers can access this
    if (req.user.role !== 'INSTITUTION_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Only institution managers can access this endpoint'
      });
    }

    if (!req.user.institution_id) {
      return res.status(400).json({
        success: false,
        message: 'Institution not found for this user'
      });
    }

    const filters = {};
    if (service_id) filters.service_id = service_id;
    if (rating) filters.rating = parseInt(rating);
    if (source) filters.source = source;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const feedback = await feedbackService.getInstitutionFeedback(req.user.institution_id, filters);

    return res.status(200).json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error in getInstitutionFeedback controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch institution feedback'
    });
  }
}

/**
 * Get institution feedback statistics
 * GET /api/feedback/institution/stats
 */
export async function getInstitutionStats(req, res) {
  try {
    // Only institution managers can access this
    if (req.user.role !== 'INSTITUTION_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Only institution managers can access this endpoint'
      });
    }

    if (!req.user.institution_id) {
      return res.status(400).json({
        success: false,
        message: 'Institution not found for this user'
      });
    }

    const stats = await feedbackService.getInstitutionFeedbackStats(req.user.institution_id);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getInstitutionStats controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics'
    });
  }
}

/**
 * Get all feedback (MESOB Manager and Super Admin only)
 * GET /api/feedback
 * Query params: institution_id?, service_id?, rating?, source?, date_from?, date_to?
 */
export async function getAllFeedback(req, res) {
  try {
    const { institution_id, service_id, rating, source, date_from, date_to } = req.query;

    // Only MESOB managers and super admins can access all feedback
    if (req.user.role !== 'MESOB_MANAGER' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access all feedback'
      });
    }

    const filters = {};
    if (institution_id) filters.institution_id = institution_id;
    if (service_id) filters.service_id = service_id;
    if (rating) filters.rating = parseInt(rating);
    if (source) filters.source = source;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const feedback = await feedbackService.getAllFeedback(filters);

    return res.status(200).json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error in getAllFeedback controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
}

/**
 * Get overall feedback statistics (MESOB Manager and Super Admin only)
 * GET /api/feedback/stats
 * Query params: institution_id?, service_id?, date_from?, date_to?
 */
export async function getOverallStats(req, res) {
  try {
    const { institution_id, service_id, date_from, date_to } = req.query;

    // Only MESOB managers and super admins can access overall stats
    if (req.user.role !== 'MESOB_MANAGER' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access overall statistics'
      });
    }

    const filters = {};
    if (institution_id) filters.institution_id = institution_id;
    if (service_id) filters.service_id = service_id;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const stats = await feedbackService.getOverallFeedbackStats(filters);

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getOverallStats controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch overall statistics'
    });
  }
}

/**
 * Check if can submit feedback for specific interaction
 * GET /api/feedback/can-submit
 * Query params: application_id? or queue_entry_id?
 */
export async function checkCanSubmit(req, res) {
  try {
    const { application_id, queue_entry_id } = req.query;

    // Only customers can check feedback eligibility
    const role = (req.user.role || '').toUpperCase();
    if (role !== 'CUSTOMER' && role !== 'CITIZEN') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can check feedback eligibility'
      });
    }

    const canSubmit = await feedbackService.canSubmitFeedback(
      req.user.id,
      application_id || null,
      queue_entry_id || null
    );

    return res.status(200).json({
      success: true,
      data: {
        canSubmit,
        message: canSubmit ? 'You can submit feedback' : 'You have already submitted feedback'
      }
    });
  } catch (error) {
    console.error('Error in checkCanSubmit controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check feedback eligibility'
    });
  }
}

export default {
  submitFeedback,
  getMyFeedback,
  getInstitutionFeedback,
  getInstitutionStats,
  getAllFeedback,
  getOverallStats,
  checkCanSubmit
};
