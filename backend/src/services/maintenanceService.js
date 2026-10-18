import { supabase } from '../config/supabase.js';
import { createNotification } from './notificationService.js';

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
    // EMPLOYEE, TECHNICIAN, and ICT_STAFF can only create reports for their own institution
    const userRole = (currentUser.role || '').toUpperCase();
    if (['EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(userRole)) {
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

    // Notify responsible Institution Manager
    await createNotification({
      institutionId,
      roles: ['INSTITUTION_MANAGER'],
      type: 'MAINTENANCE_ASSIGNMENT',
      title: 'New Maintenance Report',
      message: `New ${priority} priority maintenance issue: ${problemType}`,
      relatedEntityId: newReport.id,
      relatedEntityType: 'maintenance_report'
    });

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
    if (userRole === 'CITIZEN' || userRole === 'CUSTOMER') {
      // Customers cannot access maintenance reports
      console.log('❌ Access denied - CUSTOMER/CITIZEN role');
      return {
        success: false,
        message: 'Access denied. Customers cannot view maintenance reports.'
      };
    } else if (userRole === 'EMPLOYEE') {
      // Employees see reports they created in their institution
      console.log('Filtering for EMPLOYEE - institution:', currentUser.institution_id);
      query = query.eq('institution_id', currentUser.institution_id);
    } else if (userRole === 'TECHNICIAN' || userRole === 'ICT_STAFF') {
      // Technicians see all reports in their institution
      console.log('Filtering for TECHNICIAN/ICT_STAFF - institution:', currentUser.institution_id);
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

    const normalizedData = (data || []).map(r => {
      if (r.status === 'ACKNOWLEDGED' && r.metadata?.approval?.status === 'APPROVED') {
        return { ...r, status: 'APPROVED' };
      }
      return r;
    });

    return {
      success: true,
      data: normalizedData
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

    // Normalize ACKNOWLEDGED status if approved in metadata
    if (report.status === 'ACKNOWLEDGED' && report.metadata?.approval?.status === 'APPROVED') {
      report.status = 'APPROVED';
    }

    // Authorization check
    const userRole = (currentUser.role || '').toUpperCase();
    if (['EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(userRole)
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
/**
 * Review maintenance report (Approve or Reject)
 * @param {string} reportId - Report ID
 * @param {Object} reviewData - { decision: 'APPROVE' | 'REJECT', rejectionReason?: string, reason?: string, notes?: string }
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated report
 */
export const reviewMaintenanceReport = async (reportId, reviewDataOrDecision, reasonOrNotesOrUser, maybeUser) => {
  try {
    let decision = '';
    let rejectionReason = '';
    let reason = '';
    let notes = '';
    let currentUser = null;

    if (typeof reviewDataOrDecision === 'string') {
      decision = reviewDataOrDecision;
      if (typeof reasonOrNotesOrUser === 'string') {
        reason = reasonOrNotesOrUser;
        rejectionReason = reasonOrNotesOrUser;
        notes = reasonOrNotesOrUser;
        currentUser = maybeUser;
      } else {
        currentUser = reasonOrNotesOrUser;
      }
    } else if (reviewDataOrDecision && typeof reviewDataOrDecision === 'object') {
      decision = reviewDataOrDecision.decision || reviewDataOrDecision.action;
      reason = reviewDataOrDecision.reason;
      rejectionReason = reviewDataOrDecision.rejectionReason || reviewDataOrDecision.rejection_reason;
      notes = reviewDataOrDecision.notes;
      currentUser = reasonOrNotesOrUser;
    }

    const normalizedDecision = (decision || '').toUpperCase();

    if (!['APPROVE', 'REJECT'].includes(normalizedDecision)) {
      return {
        success: false,
        message: "Invalid review decision. Must be 'APPROVE' or 'REJECT'."
      };
    }

    // Get report
    const { data: report, error: fetchErr } = await supabase
      .from('maintenance_reports')
      .select('id, report_number, title, status, institution_id, reported_by, metadata')
      .eq('id', reportId)
      .single();

    if (fetchErr || !report) {
      return {
        success: false,
        message: 'Maintenance report not found.'
      };
    }

    // Authorization check: Only authorized Institution Manager (or Mesob Manager / Super Admin)
    const reviewerRole = (currentUser.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'].includes(reviewerRole)) {
      return {
        success: false,
        message: 'Unauthorized: Only an Institution Manager can review maintenance requests.'
      };
    }

    if (reviewerRole === 'INSTITUTION_MANAGER' && currentUser.institution_id !== report.institution_id) {
      return {
        success: false,
        message: 'Unauthorized: You can only review maintenance requests for your own institution.'
      };
    }

    if (normalizedDecision === 'APPROVE') {
      const currentMeta = report.metadata || {};
      const updatedMeta = {
        ...currentMeta,
        approval: {
          status: 'APPROVED',
          reviewed_by: currentUser.id,
          reviewed_by_name: currentUser.full_name,
          reviewed_at: new Date().toISOString(),
          notes: notes || null
        }
      };

      let updatedReport = null;
      const { data: appReport, error: updateErr } = await supabase
        .from('maintenance_reports')
        .update({
          status: 'APPROVED',
          metadata: updatedMeta,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single();

      if (updateErr) {
        if (updateErr.code === '22P02' || updateErr.message?.includes('enum maintenance_status')) {
          console.warn('PostgreSQL enum maintenance_status does not contain APPROVED. Storing as ACKNOWLEDGED with approval metadata.');
          const { data: ackReport, error: ackErr } = await supabase
            .from('maintenance_reports')
            .update({
              status: 'ACKNOWLEDGED',
              metadata: updatedMeta,
              updated_at: new Date().toISOString()
            })
            .eq('id', reportId)
            .select()
            .single();

          if (ackErr) {
            console.error('Approve maintenance report (ACKNOWLEDGED fallback) error:', ackErr);
            return {
              success: false,
              message: `Failed to approve maintenance report: ${ackErr.message}`
            };
          }
          updatedReport = { ...ackReport, status: 'APPROVED' };
        } else {
          console.error('Approve maintenance report error:', updateErr);
          return {
            success: false,
            message: `Failed to approve maintenance report: ${updateErr.message}`
          };
        }
      } else {
        updatedReport = appReport;
      }

      // Notify the requester
      if (report.reported_by) {
        await createNotification({
          recipientId: report.reported_by,
          type: 'SYSTEM_MESSAGE',
          title: 'Maintenance Request Approved',
          message: `Your maintenance request #${report.report_number || reportId} has been approved by the manager and is ready for technician assignment.`,
          relatedEntityId: reportId,
          relatedEntityType: 'maintenance_report'
        });
      }

      await logAudit(currentUser.id, 'MAINTENANCE_APPROVE', `Approved maintenance report ${report.report_number || reportId}`);

      return {
        success: true,
        message: 'Maintenance report approved successfully',
        data: updatedReport
      };
    } else {
      // REJECT decision: Requires mandatory non-empty reason
      const finalReason = (rejectionReason || reason || notes || '').trim();
      if (!finalReason) {
        return {
          success: false,
          message: 'A mandatory rejection reason is required to reject a maintenance report.'
        };
      }

      const currentMeta = report.metadata || {};
      const updatedMeta = {
        ...currentMeta,
        approval: {
          status: 'REJECTED',
          reviewed_by: currentUser.id,
          reviewed_by_name: currentUser.full_name,
          reviewed_at: new Date().toISOString(),
          rejection_reason: finalReason
        }
      };

      const { data: updatedReport, error: updateErr } = await supabase
        .from('maintenance_reports')
        .update({
          status: 'REJECTED',
          metadata: updatedMeta,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single();

      if (updateErr) {
        console.error('Reject maintenance report error:', updateErr);
        return {
          success: false,
          message: `Failed to reject maintenance report: ${updateErr.message}`
        };
      }

      // Notify the requester
      if (report.reported_by) {
        await createNotification({
          recipientId: report.reported_by,
          type: 'SYSTEM_MESSAGE',
          title: 'Maintenance Request Rejected',
          message: `Your maintenance request #${report.report_number || reportId} was rejected. Reason: ${finalReason}`,
          relatedEntityId: reportId,
          relatedEntityType: 'maintenance_report'
        });
      }

      await logAudit(currentUser.id, 'MAINTENANCE_REJECT', `Rejected maintenance report ${report.report_number || reportId}. Reason: ${finalReason}`);

      return {
        success: true,
        message: 'Maintenance report rejected',
        data: updatedReport
      };
    }
  } catch (error) {
    console.error('Review maintenance report error:', error);
    return {
      success: false,
      message: `An error occurred while reviewing maintenance report: ${error.message}`
    };
  }
};

/**
 * Assign maintenance report to an authorized technician
 * @param {string} reportId - Report ID
 * @param {string} technicianId - Technician user ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated report
 */
export const assignMaintenanceReport = async (reportId, technicianId, currentUser) => {
  try {
    const techId = technicianId;
    if (!techId) {
      return {
        success: false,
        message: 'Technician ID is required for assignment.'
      };
    }

    // Get report
    const { data: report, error: fetchErr } = await supabase
      .from('maintenance_reports')
      .select('id, report_number, institution_id, title, status, reported_by, metadata')
      .eq('id', reportId)
      .single();

    if (fetchErr || !report) {
      return {
        success: false,
        message: 'Maintenance report not found.'
      };
    }

    // Check report status: Rejected or Closed reports cannot be assigned
    if (report.status === 'REJECTED') {
      return {
        success: false,
        message: 'Cannot assign a rejected maintenance report. The request must first be approved or reopened.'
      };
    }
    if (report.status === 'CLOSED') {
      return {
        success: false,
        message: 'Cannot assign a closed maintenance report.'
      };
    }
    if (report.status === 'RESOLVED') {
      return {
        success: false,
        message: 'Cannot assign a resolved maintenance report. Verify completion or reopen if needed.'
      };
    }

    // Authorization check: only authorized managers can assign tasks within their scope
    const assignerRole = (currentUser.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'].includes(assignerRole)) {
      return {
        success: false,
        message: 'You do not have permission to assign maintenance tasks.'
      };
    }
    if (assignerRole === 'INSTITUTION_MANAGER' && currentUser.institution_id !== report.institution_id) {
      return {
        success: false,
        message: 'You can only assign maintenance tasks within your own institution.'
      };
    }

    // Validate target user
    const { data: targetUser, error: userErr } = await supabase
      .from('users')
      .select('id, institution_id, full_name, email, role, status')
      .eq('id', techId)
      .single();

    if (userErr || !targetUser) {
      return {
        success: false,
        message: 'Technician not found.'
      };
    }

    // Role check: Only TECHNICIAN (or legacy ICT_STAFF)
    const targetRole = (targetUser.role || '').toUpperCase();
    if (!['TECHNICIAN', 'ICT_STAFF'].includes(targetRole)) {
      return {
        success: false,
        message: `Assignment rejected: Cannot assign maintenance task to user with role '${targetRole}'. Tasks can only be assigned to authorized TECHNICIANS.`
      };
    }

    // Account status check
    if (targetUser.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'Assignment rejected: Technician account is inactive or suspended.'
      };
    }

    // Institution isolation check
    if (targetUser.institution_id !== report.institution_id) {
      return {
        success: false,
        message: 'Cross-institution assignment rejected: Technician does not belong to the institution of this report.'
      };
    }

    // Update assignment in database
    const { data: updatedReport, error: updateErr } = await supabase
      .from('maintenance_reports')
      .update({
        assigned_to: techId,
        status: 'ASSIGNED',
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateErr) {
      console.error('Assign maintenance report error:', updateErr);
      return {
        success: false,
        message: `Failed to assign maintenance report: ${updateErr.message}`
      };
    }

    // Create / link task for technician
    await supabase
      .from('maintenance_tasks')
      .insert({
        maintenance_report_id: reportId,
        title: report.title || 'Maintenance Task',
        description: 'Assigned maintenance task',
        assigned_to: techId,
        assigned_by: currentUser.id,
        assigned_at: new Date().toISOString(),
        status: 'PENDING',
        created_at: new Date().toISOString()
      });

    // Notify assigned technician
    await createNotification({
      recipientId: techId,
      type: 'MAINTENANCE_ASSIGNMENT',
      title: 'Maintenance Task Assigned',
      message: `You have been assigned to maintenance report #${report.report_number || reportId}: ${report.title || 'Maintenance Task'}`,
      relatedEntityId: reportId,
      relatedEntityType: 'maintenance_report'
    });

    // Notify original requester that technician has been assigned
    if (report.reported_by) {
      await createNotification({
        recipientId: report.reported_by,
        type: 'MAINTENANCE_ASSIGNMENT',
        title: 'Technician Assigned',
        message: `Technician ${targetUser.full_name} has been assigned to your maintenance request #${report.report_number || reportId}.`,
        relatedEntityId: reportId,
        relatedEntityType: 'maintenance_report'
      });
    }

    // Log audit
    await logAudit(currentUser.id, 'MAINTENANCE_ASSIGN', `Assigned maintenance report ${report.report_number || reportId} to ${targetUser.full_name}`);

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
 * Verify completion and close maintenance report
 * @param {string} reportId - Report ID
 * @param {Object} closeData - { notes?: string }
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated report
 */
export const closeMaintenanceReport = async (reportId, closeDataOrNotes, maybeUser) => {
  try {
    let notes = '';
    let currentUser = null;
    if (typeof closeDataOrNotes === 'string') {
      notes = closeDataOrNotes;
      currentUser = maybeUser;
    } else {
      notes = (closeDataOrNotes && closeDataOrNotes.notes) || '';
      currentUser = maybeUser;
    }

    const { data: report, error: fetchErr } = await supabase
      .from('maintenance_reports')
      .select('id, report_number, title, status, institution_id, reported_by, assigned_to, metadata')
      .eq('id', reportId)
      .single();

    if (fetchErr || !report) {
      return {
        success: false,
        message: 'Maintenance report not found.'
      };
    }

    const reviewerRole = (currentUser.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'].includes(reviewerRole)) {
      return {
        success: false,
        message: 'Unauthorized: Only an Institution Manager can close maintenance requests.'
      };
    }

    if (reviewerRole === 'INSTITUTION_MANAGER' && currentUser.institution_id !== report.institution_id) {
      return {
        success: false,
        message: 'Unauthorized: You can only close maintenance requests for your own institution.'
      };
    }

    const currentMeta = report.metadata || {};
    const updatedMeta = {
      ...currentMeta,
      closure: {
        closed_by: currentUser.id,
        closed_by_name: currentUser.full_name,
        closed_at: new Date().toISOString(),
        notes: notes || 'Verified and closed by manager'
      }
    };

    const { data: updatedReport, error: updateErr } = await supabase
      .from('maintenance_reports')
      .update({
        status: 'CLOSED',
        metadata: updatedMeta,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateErr) {
      return {
        success: false,
        message: `Failed to close maintenance report: ${updateErr.message}`
      };
    }

    // Notify requester
    if (report.reported_by) {
      await createNotification({
        recipientId: report.reported_by,
        type: 'SYSTEM_MESSAGE',
        title: 'Maintenance Request Closed',
        message: `Your maintenance request #${report.report_number || reportId} has been verified and closed by the manager.`,
        relatedEntityId: reportId,
        relatedEntityType: 'maintenance_report'
      });
    }

    await logAudit(currentUser.id, 'MAINTENANCE_CLOSE', `Closed maintenance report ${report.report_number || reportId}`);

    return {
      success: true,
      message: 'Maintenance report verified and closed successfully',
      data: updatedReport
    };
  } catch (error) {
    console.error('Close maintenance report error:', error);
    return {
      success: false,
      message: `An error occurred while closing maintenance report: ${error.message}`
    };
  }
};

/**
 * Return / Reopen incomplete maintenance report for further work
 * @param {string} reportId - Report ID
 * @param {Object|string} reopenDataOrReason - { reason: string } or string reason
 * @param {Object} [maybeUser] - Current authenticated user
 * @returns {Promise<Object>} Updated report
 */
export const reopenMaintenanceReport = async (reportId, reopenDataOrReason, maybeUser) => {
  try {
    let reason = '';
    let currentUser = null;
    if (typeof reopenDataOrReason === 'string') {
      reason = reopenDataOrReason;
      currentUser = maybeUser;
    } else {
      reason = reopenDataOrReason?.reason || reopenDataOrReason?.notes || '';
      currentUser = maybeUser;
    }

    const finalReason = (reason || '').trim();
    if (!finalReason) {
      return {
        success: false,
        message: 'A mandatory reason is required to return an incomplete maintenance report.'
      };
    }

    const { data: report, error: fetchErr } = await supabase
      .from('maintenance_reports')
      .select('id, report_number, title, status, institution_id, assigned_to, metadata')
      .eq('id', reportId)
      .single();

    if (fetchErr || !report) {
      return {
        success: false,
        message: 'Maintenance report not found.'
      };
    }

    const reviewerRole = (currentUser.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'].includes(reviewerRole)) {
      return {
        success: false,
        message: 'Unauthorized: Only an Institution Manager can return maintenance requests.'
      };
    }

    if (reviewerRole === 'INSTITUTION_MANAGER' && currentUser.institution_id !== report.institution_id) {
      return {
        success: false,
        message: 'Unauthorized: You can only return maintenance requests for your own institution.'
      };
    }

    const currentMeta = report.metadata || {};
    const updatedMeta = {
      ...currentMeta,
      reopened: {
        reopened_by: currentUser.id,
        reopened_by_name: currentUser.full_name,
        reopened_at: new Date().toISOString(),
        reason
      }
    };

    // Return to IN_PROGRESS
    const { data: updatedReport, error: updateErr } = await supabase
      .from('maintenance_reports')
      .update({
        status: 'IN_PROGRESS',
        metadata: updatedMeta,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateErr) {
      return {
        success: false,
        message: `Failed to return maintenance report: ${updateErr.message}`
      };
    }

    // Update tasks status to IN_PROGRESS
    await supabase
      .from('maintenance_tasks')
      .update({
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString()
      })
      .eq('maintenance_report_id', reportId);

    // Notify assigned technician
    if (report.assigned_to) {
      await createNotification({
        recipientId: report.assigned_to,
        type: 'MAINTENANCE_ALERT',
        title: 'Maintenance Task Returned',
        message: `Maintenance request #${report.report_number || reportId} was returned by the manager for further work. Reason: ${reason}`,
        relatedEntityId: reportId,
        relatedEntityType: 'maintenance_report'
      });
    }

    await logAudit(currentUser.id, 'MAINTENANCE_REOPEN', `Returned maintenance report ${report.report_number || reportId}. Reason: ${reason}`);

    return {
      success: true,
      message: 'Maintenance report returned to technician for further work',
      data: updatedReport
    };
  } catch (error) {
    console.error('Reopen maintenance report error:', error);
    return {
      success: false,
      message: `An error occurred while returning maintenance report: ${error.message}`
    };
  }
};

/**
 * Direct report resolution (for technicians)
 * @param {string} reportId - Report ID
 * @param {string} resolutionNotes - Resolution notes
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated report
 */
export const resolveMaintenanceReport = async (reportId, resolutionNotes, currentUser) => {
  try {
    if (!resolutionNotes || resolutionNotes.trim().length === 0) {
      return {
        success: false,
        message: 'Resolution notes are required.'
      };
    }

    const { data: report, error: fetchErr } = await supabase
      .from('maintenance_reports')
      .select('id, report_number, title, status, institution_id, reported_by, assigned_to')
      .eq('id', reportId)
      .single();

    if (fetchErr || !report) {
      return {
        success: false,
        message: 'Maintenance report not found.'
      };
    }

    const userRole = (currentUser.role || '').toUpperCase();
    if (['TECHNICIAN', 'ICT_STAFF'].includes(userRole) && report.assigned_to !== currentUser.id) {
      return {
        success: false,
        message: 'You can only resolve maintenance reports assigned to you.'
      };
    }

    // Update report
    const { data: updatedReport, error: updateErr } = await supabase
      .from('maintenance_reports')
      .update({
        status: 'RESOLVED',
        resolution_notes: resolutionNotes.trim(),
        resolved_at: new Date().toISOString(),
        resolved_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateErr) {
      return {
        success: false,
        message: `Failed to resolve maintenance report: ${updateErr.message}`
      };
    }

    // Update any linked tasks
    await supabase
      .from('maintenance_tasks')
      .update({
        status: 'COMPLETED',
        completion_notes: resolutionNotes.trim(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('maintenance_report_id', reportId);

    // Notify institution manager
    if (report.institution_id) {
      await createNotification({
        institutionId: report.institution_id,
        roles: ['INSTITUTION_MANAGER'],
        type: 'MAINTENANCE_ALERT',
        title: 'Maintenance Task Resolved',
        message: `Technician ${currentUser.full_name || 'Technician'} has resolved maintenance report #${report.report_number || reportId}. Please verify completion and close.`,
        relatedEntityId: reportId,
        relatedEntityType: 'maintenance_report'
      });
    }

    // Notify requester
    if (report.reported_by) {
      await createNotification({
        recipientId: report.reported_by,
        type: 'MAINTENANCE_ALERT',
        title: 'Maintenance Issue Resolved',
        message: `Your maintenance request #${report.report_number || reportId} has been resolved by technician.`,
        relatedEntityId: reportId,
        relatedEntityType: 'maintenance_report'
      });
    }

    await logAudit(currentUser.id, 'MAINTENANCE_RESOLVE', `Resolved maintenance report ${report.report_number || reportId}`);

    return {
      success: true,
      message: 'Maintenance report resolved successfully',
      data: updatedReport
    };
  } catch (error) {
    console.error('Resolve maintenance report error:', error);
    return {
      success: false,
      message: `An error occurred while resolving maintenance report: ${error.message}`
    };
  }
};

/**
 * Update report status (for technicians / managers)
 * @param {string} reportId - Report ID
 * @param {string} status - New status
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated report
 */
export const updateReportStatus = async (reportId, status, currentUser) => {
  try {
    const validStatuses = ['IN_PROGRESS', 'WAITING_PARTS', 'ON_HOLD'];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: `Invalid status update for report: ${status}`
      };
    }

    const { data: report, error: fetchErr } = await supabase
      .from('maintenance_reports')
      .select('id, report_number, title, status, institution_id, reported_by, assigned_to')
      .eq('id', reportId)
      .single();

    if (fetchErr || !report) {
      return { success: false, message: 'Maintenance report not found.' };
    }

    const userRole = (currentUser.role || '').toUpperCase();
    if (['TECHNICIAN', 'ICT_STAFF'].includes(userRole) && report.assigned_to !== currentUser.id) {
      return { success: false, message: 'You can only update reports assigned to you.' };
    }

    const { data: updatedReport, error: updateErr } = await supabase
      .from('maintenance_reports')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, message: `Failed to update status: ${updateErr.message}` };
    }

    // Update tasks
    await supabase
      .from('maintenance_tasks')
      .update({
        status: status === 'WAITING_PARTS' ? 'PENDING' : status,
        updated_at: new Date().toISOString()
      })
      .eq('maintenance_report_id', reportId);

    // Notify institution manager & requester when work started
    if (status === 'IN_PROGRESS') {
      if (report.institution_id) {
        await createNotification({
          institutionId: report.institution_id,
          roles: ['INSTITUTION_MANAGER'],
          type: 'MAINTENANCE_ALERT',
          title: 'Maintenance Work Started',
          message: `Technician ${currentUser.full_name || ''} has started work on report #${report.report_number || reportId}.`,
          relatedEntityId: reportId,
          relatedEntityType: 'maintenance_report'
        });
      }
      if (report.reported_by) {
        await createNotification({
          recipientId: report.reported_by,
          type: 'MAINTENANCE_ALERT',
          title: 'Maintenance Work Started',
          message: `Work has started on your maintenance request #${report.report_number || reportId}.`,
          relatedEntityId: reportId,
          relatedEntityType: 'maintenance_report'
        });
      }
    } else if (status === 'WAITING_PARTS') {
      if (report.institution_id) {
        await createNotification({
          institutionId: report.institution_id,
          roles: ['INSTITUTION_MANAGER'],
          type: 'MAINTENANCE_ALERT',
          title: 'Maintenance Waiting Parts',
          message: `Report #${report.report_number || reportId} is waiting for replacement parts.`,
          relatedEntityId: reportId,
          relatedEntityType: 'maintenance_report'
        });
      }
    }

    await logAudit(currentUser.id, 'MAINTENANCE_STATUS_UPDATE', `Updated report ${report.report_number || reportId} to ${status}`);

    return {
      success: true,
      message: `Report status updated to ${status}`,
      data: updatedReport
    };
  } catch (error) {
    console.error('Update report status error:', error);
    return { success: false, message: `Error updating report status: ${error.message}` };
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

    // Authorization: only assigned Technician or managers can view
    const userRole = (currentUser.role || '').toUpperCase();
    if (['TECHNICIAN', 'ICT_STAFF'].includes(userRole) && task.assigned_to !== currentUser.id) {
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
    if (['TECHNICIAN', 'ICT_STAFF'].includes(userRole) && task.assigned_to !== currentUser.id) {
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
    if (['TECHNICIAN', 'ICT_STAFF'].includes(userRole) && task.assigned_to !== currentUser.id) {
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
    if (updatedReport.reported_by) {
      await createNotification({
        recipientId: updatedReport.reported_by,
        type: 'MAINTENANCE_ASSIGNMENT',
        title: 'Maintenance Issue Resolved',
        message: `Your maintenance report has been resolved: ${updatedReport.title || 'Report'}`,
        relatedEntityId: task.maintenance_report_id,
        relatedEntityType: 'maintenance_report'
      });
    }

    // Notify Institution Manager
    const institutionId = task.maintenance_reports?.institution_id;
    if (institutionId) {
      await createNotification({
        institutionId,
        roles: ['INSTITUTION_MANAGER'],
        type: 'MAINTENANCE_ASSIGNMENT',
        title: 'Maintenance Task Completed',
        message: `Technician has completed maintenance task: ${updatedReport.title || 'Task'}`,
        relatedEntityId: task.maintenance_report_id,
        relatedEntityType: 'maintenance_report'
      });
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

// Helper: Notify Technicians


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
