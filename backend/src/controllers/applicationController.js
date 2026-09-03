import { createApplication, getApplications, getApplicationById, updateApplicationStatus, assignApplication } from '../services/applicationService.js';

/**
 * POST /api/applications
 * Create new application
 */
export const postApplication = async (req, res) => {
  try {
    const applicationData = {
      serviceId: req.body.serviceId,
      institutionId: req.body.institutionId,
      applicationData: req.body.applicationData,
      documents: req.body.documents
    };

    const result = await createApplication(applicationData, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Create application controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application.'
    });
  }
};

/**
 * GET /api/applications
 * Get applications (filtered by role)
 */
export const getApplicationsController = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      institutionId: req.query.institutionId,
      assignedToMe: req.query.assignedToMe === 'true'
    };

    const result = await getApplications(filters, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get applications controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications.'
    });
  }
};

/**
 * GET /api/applications/:id
 * Get application by ID
 */
export const getApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getApplicationById(id, req.user);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get application controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application.'
    });
  }
};

/**
 * PATCH /api/applications/:id/status
 * Update application status
 */
export const patchApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.'
      });
    }

    const result = await updateApplicationStatus(id, status, notes, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Update application status controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status.'
    });
  }
};

/**
 * PATCH /api/applications/:id/assign
 * Assign application to employee
 */
export const patchApplicationAssign = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required.'
      });
    }

    const result = await assignApplication(id, employeeId, req.user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Assign application controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign application.'
    });
  }
};
