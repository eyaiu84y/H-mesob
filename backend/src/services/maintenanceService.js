import { supabase } from '../config/supabase.js';

/**
 * Create maintenance report
 * @param {Object} reportData - Report data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created report
 */
export const createMaintenanceReport = async (reportData, currentUser) => {
  try {
    const { institutionId, problemType, description, location, officeNumber, priority, category, attachments } = reportData;

    // Validation
    if (!institutionId || !problemType || !description) {
      return {
        success: false,
        message: 'Institution ID, problem type, and description are required.'
      };
    }

    // Institution authorization check
    // EMPLOYEE and ICT_STAFF can only create reports for their own institution
    const userRole = (currentUser.role || '').toUpperCase();
    if (['EMPLOYEE', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(userRole)) {
      if (currentUser.institution_id !== institutionId) {
        return {
          success: false,
          message: 'You can only create maintenance reports for your own institution.'
        };
      }
    }

    // Generate report number
    const reportNumber = `MAINT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Create report with explicit user context for RLS
    // When using service role, we need to handle RLS manually or set auth context
    const insertData = {
      report_number: reportNumber,
      reported_by: currentUser.id,
      institution_id: institutionId,
      title: problemType,
      description,
      location: location || null,
      equipment_info: officeNumber ? `Office: ${officeNumber}` : null,
      category: category || 'General',
      priority: priority || 'NORMAL',
      status: 'REPORTED'
    };

    // Don't set created_at - let database default handle it
    const { data: newReport, error } = await supabase
      .from('maintenance_reports')
      .insert(insertData)
      .select(`
        id,
        report_number,
        title,
        description,
        priority,
        status,
        created_at,
        institutions (
          id,
          name_en,
          name_am
        )
      `)
      .single();

    if (error) {
      console.error("========== MAINTENANCE REPORT INSERT ERROR ==========");
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);
      console.error("Error Details:", error.details);
      console.error("Error Hint:", error.hint);
      console.error("Insert Data:", JSON.stringify(insertData, null, 2));
      console.error("Current User:", JSON.stringify({
        id: currentUser.id,
        role: currentUser.role,
        institution_id: currentUser.institution_id
      }, null, 2));
      console.error("=====================================================");
      return {
        success: false,
        message: `Failed to create maintenance report: ${error.message}`
      };
    }

    // Handle file attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      try {
        const attachmentRecords = [];

        for (const attachment of attachments) {
          // Convert base64 to buffer
          const base64Data = attachment.data.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');

          // Upload file to Supabase Storage
          const fileName = `${newReport.id}/${Date.now()}_${attachment.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('maintenance-attachments')
            .upload(fileName, buffer, {
              contentType: attachment.type,
              upsert: false
            });

          if (uploadError) {
            console.error('File upload error:', uploadError);
            continue; // Skip this file, continue with others
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('maintenance-attachments')
            .getPublicUrl(fileName);

          // Create attachment record in database
          attachmentRecords.push({
            maintenance_report_id: newReport.id,
            file_name: attachment.name,
            file_type: attachment.type,
            file_size: attachment.size,
            file_url: urlData.publicUrl,
            uploaded_by: currentUser.id,
            uploaded_at: new Date().toISOString()
          });
        }

        // Insert attachment records
        if (attachmentRecords.length > 0) {
          await supabase
            .from('maintenance_attachments')
            .insert(attachmentRecords);
        }
      } catch (attachmentError) {
        console.error('Attachment handling error:', attachmentError);
        // Don't fail the whole request if attachments fail
      }
    }

    // Notify ICT staff
    await notifyIctStaff(institutionId, newReport.id, `New ${priority} maintenance report: ${problemType}`);

    // Log audit
    await logAudit(currentUser.id, 'MAINTENANCE_REPORT_CREATE', `Created maintenance report ${newReport.report_number}`);

    return {
      success: true,
      message: 'Maintenance report created successfully',
      data: newReport
    };

  } catch (error) {
    console.error('Create maintenance report error:', error);
    return {
      success: false,
      message: 'An error occurred while creating maintenance report.'
    };
  }
};

/**
 * Get maintenance reports (filtered by role)
 * @param {Object} filters - Filter options
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} List of reports
 */
export const getMaintenanceReports = async (filters, currentUser) => {
  try {
    console.log('=== GET MAINTENANCE REPORTS ===');
    console.log('Current User:', {
      id: currentUser.id,
      role: currentUser.role,
      institution_id: currentUser.institution_id
    });
    console.log('Filters:', filters);
    
    // Normalize role to uppercase for consistent comparison
    const userRole = (currentUser.role || '').toUpperCase();
    console.log('Normalized role:', userRole);
    
    let query = supabase
      .from('maintenance_reports')
      .select(`
        id,
        report_number,
        title,
        description,
        location,
        equipment_info,
        category,
        priority,
        status,
        created_at,
        resolved_at,
        reported_by,
        institution_id,
        assigned_to,
        institutions (
          id,
          name_en,
          name_am
        ),
        reporter:users!maintenance_reports_reported_by_fkey (
          id,
          full_name,
          phone
        ),
        assigned_user:users!maintenance_reports_assigned_to_fkey (
          id,
          full_name
        ),
        maintenance_attachments (
          id,
          file_name,
          file_type,
          file_size,
          file_url,
          uploaded_at
        )
      `)
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (userRole === 'CITIZEN') {
      // Citizens cannot access maintenance reports
      console.log('❌ Access denied - CITIZEN role');
      return {
        success: false,
        message: 'Access denied. Citizens cannot view maintenance reports.'
      };
    } else if (userRole === 'EMPLOYEE') {
      // Employees see reports they created in their institution
      console.log('Filtering for EMPLOYEE - institution:', currentUser.institution_id);
      query = query.eq('institution_id', currentUser.institution_id);
    } else if (userRole === 'ICT_STAFF') {
      // ICT staff see all reports in their institution
      console.log('Filtering for ICT_STAFF - institution:', currentUser.institution_id);
      query = query.eq('institution_id', currentUser.institution_id);
    } else if (userRole === 'INSTITUTION_MANAGER') {
      // Institution managers see all reports in their institution
      console.log('✅ Filtering for INSTITUTION_MANAGER - institution:', currentUser.institution_id);
      if (!currentUser.institution_id) {
        console.log('❌ WARNING: Institution Manager has no institution_id!');
      }
      query = query.eq('institution_id', currentUser.institution_id);
    } else {
      console.log('No role filter applied - ADMIN/MANAGER role');
    }

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.institutionId && ['SUPER_ADMIN', 'MESOB_MANAGER'].includes(userRole)) {
      query = query.eq('institution_id', filters.institutionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Get maintenance reports error:', error);
      return {
        success: false,
        message: 'Failed to fetch maintenance reports.'
      };
    }

    console.log('✅ Retrieved', data?.length || 0, 'maintenance reports');
    if (data && data.length > 0) {
      console.log('Sample report:', {
        id: data[0].id,
        report_number: data[0].report_number,
        title: data[0].title,
        institution_id: data[0].institution_id,
        reported_by: data[0].reported_by,
        status: data[0].status
      });
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ Get maintenance reports error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching maintenance reports.'
    };
  }
};

/**
 * Get maintenance report by ID
 * @param {string} reportId - Report ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Report data
 */
export const getMaintenanceReportById = async (reportId, currentUser) => {
  try {
    const { data: report, error } = await supabase
      .from('maintenance_reports')
      .select(`
        *,
        institutions (
          id,
          name_en,
          name_am
        ),
        reporter:users!maintenance_reports_reported_by_fkey (
          id,
          full_name,
          email,
          phone
        ),
        assigned_user:users!maintenance_reports_assigned_to_fkey (
          id,
          full_name,
          email,
          phone
        ),
        maintenance_attachments (
          id,
          file_name,
          file_type,
          file_size,
          file_url,
          uploaded_at,
          uploader:users!maintenance_attachments_uploaded_by_fkey (
            id,
            full_name
          )
        )
      `)
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return {
        success: false,
        message: 'Maintenance report not found.'
      };
    }

    // Authorization check
    const userRole = (currentUser.role || '').toUpperCase();
    if (['EMPLOYEE', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(userRole)
        && report.institution_id !== currentUser.institution_id
        && report.reported_by !== currentUser.id) {
      return {
        success: false,
        message: 'You do not have permission to view this report.'
      };
    }

    return {
      success: true,
      data: report
    };

  } catch (error) {
    console.error('Get maintenance report by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch maintenance report.'
    };
  }
};

/**
 * Assign maintenance report to ICT staff
 * @param {string} reportId - Report ID
 * @param {string} ictStaffId - ICT staff ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated report
 */
export const assignMaintenanceReport = async (reportId, ictStaffId, currentUser) => {
  try {
    // Get report
    const { data: report } = await supabase
      .from('maintenance_reports')
      .select('id, institution_id, title')
      .eq('id', reportId)
      .single();

    if (!report) {
      return {
        success: false,
        message: 'Maintenance report not found.'
      };
    }

    // Verify ICT staff
    const { data: ictStaff } = await supabase
      .from('users')
      .select('id, institution_id, full_name')
      .eq('id', ictStaffId)
      .eq('role', 'ICT_STAFF')
      .single();

    if (!ictStaff || ictStaff.institution_id !== report.institution_id) {
      return {
        success: false,
        message: 'ICT staff not found or does not belong to this institution.'
      };
    }

    // Update assignment
    const { data: updatedReport, error } = await supabase
      .from('maintenance_reports')
      .update({
        assigned_to: ictStaffId,
        status: 'ASSIGNED',
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Assign maintenance report error:', error);
      return {
        success: false,
        message: 'Failed to assign maintenance report.'
      };
    }

    // Create task for ICT staff
    await supabase
      .from('maintenance_tasks')
      .insert({
        maintenance_report_id: reportId,
        title: report.title || 'Maintenance Task',
        description: 'Assigned maintenance task',
        assigned_to: ictStaffId,
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString(),
        status: 'PENDING',
        created_at: new Date().toISOString()
      });

    // Notify ICT staff
    await createNotification({
      userId: ictStaffId,
      type: 'MAINTENANCE_ASSIGNMENT',
      title: 'Maintenance Task Assigned',
      message: `You have been assigned a maintenance task: ${report.title}`,
      relatedEntityId: reportId,
      relatedEntityType: 'maintenance_report'
    });

    // Log audit
    await logAudit(currentUser.id, 'MAINTENANCE_ASSIGN', `Assigned maintenance report ${reportId} to ${ictStaff.full_name}`);

    return {
      success: true,
      message: 'Maintenance report assigned successfully',
      data: updatedReport
    };

  } catch (error) {
    console.error('Assign maintenance report error:', error);
    return {
      success: false,
      message: 'An error occurred while assigning maintenance report.'
    };
  }
};

/**
 * Get my maintenance tasks (for ICT staff)
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} List of tasks
 */
export const getMyTasks = async (currentUser) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        id,
        status,
        created_at,
        completed_at,
        completion_notes,
        maintenance_reports (
          id,
          title,
          description,
          location,
          equipment_info,
          priority,
          status,
          institutions (
            name_en,
            name_am
          ),
          maintenance_attachments (
            id,
            file_name,
            file_url,
            file_type,
            file_size
          )
        )
      `)
      .eq('assigned_to', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get my tasks error:', error);
      return {
        success: false,
        message: 'Failed to fetch tasks.'
      };
    }

    console.log('✅ Fetched tasks for ICT staff:', {
      count: data?.length || 0,
      withAttachments: data?.filter(t => t.maintenance_reports?.maintenance_attachments?.length > 0).length || 0
    });

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Get my tasks error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching tasks.'
    };
  }
};

/**
 * Get task by ID
 * @param {string} taskId - Task ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Task data
 */
export const getTaskById = async (taskId, currentUser) => {
  try {
    const { data: task, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        maintenance_reports (
          *,
          institutions (
            id,
            name_en,
            name_am
          )
        ),
        assigned_user:users!maintenance_tasks_assigned_to_fkey (
          id,
          full_name
        ),
        assigner:users!maintenance_tasks_assigned_by_fkey (
          id,
          full_name
        )
      `)
      .eq('id', taskId)
      .single();

    if (error || !task) {
      return {
        success: false,
        message: 'Task not found.'
      };
    }

    // Authorization: only assigned ICT or managers can view
    const userRole = (currentUser.role || '').toUpperCase();
    if (userRole === 'ICT_STAFF' && task.assigned_to !== currentUser.id) {
      return {
        success: false,
        message: 'You do not have permission to view this task.'
      };
    }

    return {
      success: true,
      data: task
    };

  } catch (error) {
    console.error('Get task by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch task.'
    };
  }
};

/**
 * Update task status
 * @param {string} taskId - Task ID
 * @param {string} status - New status
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated task
 */
export const updateTaskStatus = async (taskId, status, currentUser) => {
  try {
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: 'Invalid status.'
      };
    }

    // Get task
    const { data: task } = await supabase
      .from('maintenance_tasks')
      .select('id, maintenance_report_id, assigned_to')
      .eq('id', taskId)
      .single();

    if (!task) {
      return {
        success: false,
        message: 'Task not found.'
      };
    }

    // Authorization
    const userRole = (currentUser.role || '').toUpperCase();
    if (userRole === 'ICT_STAFF' && task.assigned_to !== currentUser.id) {
      return {
        success: false,
        message: 'You can only update your own tasks.'
      };
    }

    // Update task
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'IN_PROGRESS') {
      // Update report status
      await supabase
        .from('maintenance_reports')
        .update({ 
          status: 'IN_PROGRESS',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.maintenance_report_id);
        
      console.log('✅ Task started:', {
        taskId,
        reportId: task.maintenance_report_id,
        status: 'IN_PROGRESS'
      });
    } else if (status === 'COMPLETED') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedTask, error } = await supabase
      .from('maintenance_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Update task status error:', error);
      return {
        success: false,
        message: 'Failed to update task status.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'MAINTENANCE_TASK_UPDATE', `Updated task ${taskId} to ${status}`);

    return {
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    };

  } catch (error) {
    console.error('Update task status error:', error);
    return {
      success: false,
      message: 'An error occurred while updating task status.'
    };
  }
};

/**
 * Resolve maintenance task
 * @param {string} taskId - Task ID
 * @param {string} resolutionNotes - Resolution notes
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated task and report
 */
export const resolveTask = async (taskId, resolutionNotes, currentUser) => {
  try {
    // Get task with report details
    const { data: task } = await supabase
      .from('maintenance_tasks')
      .select(`
        id, 
        maintenance_report_id, 
        assigned_to,
        maintenance_reports (
          id,
          title,
          reported_by,
          institution_id
        )
      `)
      .eq('id', taskId)
      .single();

    if (!task) {
      return {
        success: false,
        message: 'Task not found.'
      };
    }

    // Authorization
    const userRole = (currentUser.role || '').toUpperCase();
    if (userRole === 'ICT_STAFF' && task.assigned_to !== currentUser.id) {
      return {
        success: false,
        message: 'You can only resolve your own tasks.'
      };
    }

    // Update task
    await supabase
      .from('maintenance_tasks')
      .update({
        status: 'COMPLETED',
        completion_notes: resolutionNotes,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    // Update report
    const { data: updatedReport, error } = await supabase
      .from('maintenance_reports')
      .update({
        status: 'RESOLVED',
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
        resolved_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.maintenance_report_id)
      .select(`
        id,
        reported_by,
        title
      `)
      .single();

    if (error) {
      console.error('Resolve task error:', error);
      return {
        success: false,
        message: 'Failed to resolve task.'
      };
    }

    // Notify reporter (employee who submitted the report)
    await createNotification({
      userId: updatedReport.reported_by,
      type: 'MAINTENANCE_ASSIGNMENT',
      title: 'Maintenance Issue Resolved',
      message: `Your maintenance report has been resolved: ${updatedReport.title}`,
      relatedEntityId: task.maintenance_report_id,
      relatedEntityType: 'maintenance_report'
    });

    // Notify Institution Manager
    const institutionId = task.maintenance_reports?.institution_id;
    if (institutionId) {
      const { data: managers } = await supabase
        .from('users')
        .select('id')
        .eq('institution_id', institutionId)
        .eq('role', 'INSTITUTION_MANAGER')
        .eq('status', 'ACTIVE');

      if (managers && managers.length > 0) {
        for (const manager of managers) {
          await createNotification({
            userId: manager.id,
            type: 'MAINTENANCE_ASSIGNMENT',
            title: 'Maintenance Task Completed',
            message: `ICT staff has completed maintenance task: ${updatedReport.title}`,
            relatedEntityId: task.maintenance_report_id,
            relatedEntityType: 'maintenance_report'
          });
        }
      }
    }

    // Log audit
    await logAudit(currentUser.id, 'MAINTENANCE_RESOLVE', `Resolved maintenance task ${taskId}`);

    console.log('✅ Task resolved successfully:', {
      taskId,
      reportId: task.maintenance_report_id,
      status: 'COMPLETED',
      notifiedReporter: updatedReport.reported_by,
      notifiedManagers: institutionId ? 'Yes' : 'No'
    });

    return {
      success: true,
      message: 'Task resolved successfully',
      data: updatedReport
    };

  } catch (error) {
    console.error('Resolve task error:', error);
    return {
      success: false,
      message: 'An error occurred while resolving task.'
    };
  }
};

// Helper: Notify ICT staff
const notifyIctStaff = async (institutionId, reportId, message) => {
  try {
    const { data: ictStaff } = await supabase
      .from('users')
      .select('id')
      .eq('institution_id', institutionId)
      .eq('role', 'ICT_STAFF')
      .eq('status', 'ACTIVE');

    if (ictStaff && ictStaff.length > 0) {
      const notifications = ictStaff.map(ict => ({
        user_id: ict.id,
        type: 'MAINTENANCE_ASSIGNMENT',
        title: 'New Maintenance Report',
        message,
        related_entity_id: reportId,
        related_entity_type: 'maintenance_report',
        is_read: false,
        created_at: new Date().toISOString()
      }));

      await supabase.from('notifications').insert(notifications);
    }
  } catch (error) {
    console.error('Failed to notify ICT staff:', error);
  }
};

// Helper: Create notification
const createNotification = async (notificationData) => {
  try {
    const { userId, type, title, message, relatedEntityId, relatedEntityType } = notificationData;

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_entity_id: relatedEntityId,
        related_entity_type: relatedEntityType,
        is_read: false,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Helper: Log audit event
const logAudit = async (userId, action, details) => {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
