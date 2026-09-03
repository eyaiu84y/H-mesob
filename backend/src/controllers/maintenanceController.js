import {
  createMaintenanceReport,
  getMaintenanceReports,
  getMaintenanceReportById,
  assignMaintenanceReport,
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
    const { ictStaffId } = req.body;
    if (!ictStaffId) return res.status(400).json({ success: false, message: 'ICT Staff ID is required.' });

    const result = await assignMaintenanceReport(req.params.id, ictStaffId, req.user);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Assign maintenance report controller error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign maintenance report.' });
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
