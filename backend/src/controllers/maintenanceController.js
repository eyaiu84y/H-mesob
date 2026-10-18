import {
  createMaintenanceReport,
  getMaintenanceReports,
  getMaintenanceReportById,
  assignMaintenanceReport,
  reviewMaintenanceReport,
  closeMaintenanceReport,
  reopenMaintenanceReport,
  resolveMaintenanceReport,
  updateReportStatus,
  getMyTasks,
  getTaskById,
  updateTaskStatus,
  resolveTask
} from '../services/maintenanceService.js';

export const postMaintenanceReport = async (req, res) => {
  try {
    const reportData = {
      institutionId: req.body.institutionId,
      problemType: req.body.problemType,
      description: req.body.description,
      location: req.body.location,
      officeNumber: req.body.officeNumber,
      priority: req.body.priority,
      category: req.body.category,
      attachments: req.body.attachments // Array of {name, type, size, data (base64)}
    };

    const result = await createMaintenanceReport(reportData, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (error) {
    console.error("CREATE MAINTENANCE REPORT CONTROLLER ERROR");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: `Failed to create maintenance report: ${error.message}`
    });
  }
};

export const getReports = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      institutionId: req.query.institutionId
    };

    const result = await getMaintenanceReports(filters, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get maintenance reports controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance reports.' });
  }
};

export const getReport = async (req, res) => {
  try {
    const result = await getMaintenanceReportById(req.params.id, req.user);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance report.' });
  }
};

export const postAssignReport = async (req, res) => {
  try {
    const technicianId = req.body.technicianId || req.body.ictStaffId;
    if (!technicianId) {
      return res.status(400).json({ success: false, message: 'Technician ID is required.' });
    }

    const result = await assignMaintenanceReport(req.params.id, technicianId, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Assign maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign maintenance report.' });
  }
};

export const patchReviewReport = async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, message: 'Review action (APPROVE or REJECT) is required.' });
    }
    const result = await reviewMaintenanceReport(req.params.id, action, reason, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Review maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to review maintenance report.' });
  }
};

export const patchApproveReport = async (req, res) => {
  try {
    const { notes } = req.body || {};
    const result = await reviewMaintenanceReport(req.params.id, 'APPROVE', notes, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Approve maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve maintenance report.' });
  }
};

export const patchRejectReport = async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A mandatory rejection reason is required.' });
    }
    const result = await reviewMaintenanceReport(req.params.id, 'REJECT', reason, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Reject maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject maintenance report.' });
  }
};

export const patchCloseReport = async (req, res) => {
  try {
    const result = await closeMaintenanceReport(req.params.id, req.body, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Close maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to close maintenance report.' });
  }
};

export const patchReopenReport = async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A return/reopen reason is required.' });
    }
    const result = await reopenMaintenanceReport(req.params.id, reason, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Reopen maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to return maintenance report.' });
  }
};

export const patchResolveReport = async (req, res) => {
  try {
    const { resolutionNotes } = req.body || {};
    if (!resolutionNotes || !resolutionNotes.trim()) {
      return res.status(400).json({ success: false, message: 'Resolution notes are required.' });
    }
    const result = await resolveMaintenanceReport(req.params.id, resolutionNotes, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Resolve maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve maintenance report.' });
  }
};

export const patchReportStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });
    const result = await updateReportStatus(req.params.id, status, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update report status controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to update report status.' });
  }
};

export const getMyTasksController = async (req, res) => {
  try {
    const result = await getMyTasks(req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get my tasks controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

export const getTask = async (req, res) => {
  try {
    const result = await getTaskById(req.params.id, req.user);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get task controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch task.' });
  }
};

export const patchTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });

    const result = await updateTaskStatus(req.params.id, status, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update task status controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task status.' });
  }
};

export const patchResolveTask = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const result = await resolveTask(req.params.id, resolutionNotes, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Resolve task controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve task.' });
  }
};
