import { supabase } from '../config/supabase.js';

/**
 * Create new application
 * @param {Object} applicationData - Application data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created application
 */
export const createApplication = async (applicationData, currentUser) => {
  try {
    const { serviceId, institutionId, applicationData: appData, documents } = applicationData;

    // Validation
    if (!serviceId || !institutionId) {
      return {
        success: false,
        message: 'Service ID and Institution ID are required.'
      };
    }

    // Generate application number
    const applicationNumber = generateApplicationNumber();

    // Create application
    const { data: newApplication, error } = await supabase
      .from('applications')
      .insert({
        citizen_id: currentUser.id,
        service_id: serviceId,
        institution_id: institutionId,
        application_number: applicationNumber,
        status: 'SUBMITTED',
        application_data: appData || {},
        documents: documents || [],
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        application_number,
        status,
        submitted_at,
        services (
          id,
          title_en,
          title_am
        ),
        institutions (
          id,
          name_en,
          name_am
        )
      `)
      .single();

    if (error) {
      console.error('Create application error:', error);
      return {
        success: false,
        message: 'Failed to create application.'
      };
    }

    // Create notification for institution employees
    await createNotification({
      institutionId,
      type: 'APPLICATION_UPDATE',
      title: 'New Application Submitted',
      message: `New application ${applicationNumber} has been submitted`,
      relatedEntityId: newApplication.id,
      relatedEntityType: 'application'
    });

    // Log audit
    await logAudit(currentUser.id, 'APPLICATION_CREATE', `Created application ${applicationNumber}`);

    return {
      success: true,
      message: 'Application submitted successfully',
      data: newApplication
    };

  } catch (error) {
    console.error('Create application error:', error);
    return {
      success: false,
      message: 'An error occurred while creating application.'
    };
  }
};

/**
 * Get applications (filtered by user role)
 * @param {Object} filters - Filter options
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} List of applications
 */
export const getApplications = async (filters, currentUser) => {
  try {
    let query = supabase
      .from('applications')
      .select(`
        id,
        application_number,
        status,
        submitted_at,
        reviewed_at,
        completed_at,
        citizen_id,
        assigned_to,
        services (
          id,
          title_en,
          title_am
        ),
        institutions (
          id,
          name_en,
          name_am
        ),
        users!applications_citizen_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (currentUser.role === 'CITIZEN') {
      // Citizens see only their applications
      query = query.eq('citizen_id', currentUser.id);
    } else if (currentUser.role === 'EMPLOYEE' || currentUser.role === 'ICT_STAFF' || currentUser.role === 'INSTITUTION_MANAGER') {
      // Institution staff see only their institution's applications
      query = query.eq('institution_id', currentUser.institution_id);
    }

    // Apply additional filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.institutionId && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MESOB_MANAGER')) {
      query = query.eq('institution_id', filters.institutionId);
    }
    if (filters.assignedToMe && currentUser.role === 'EMPLOYEE') {
      query = query.eq('assigned_to', currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('=== GET APPLICATIONS ERROR ===');
      console.error('Supabase Error Code:', error.code);
      console.error('Supabase Error Message:', error.message);
      console.error('Supabase Error Details:', error.details);
      console.error('Supabase Error Hint:', error.hint);
      console.error('User Role:', currentUser.role);
      console.error('User ID:', currentUser.id);
      console.error('Institution ID:', currentUser.institution_id);
      console.error('Full Error:', JSON.stringify(error, null, 2));
      console.error('=============================');
      return {
        success: false,
        message: 'Failed to fetch applications.'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('Get applications error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching applications.'
    };
  }
};

/**
 * Get application by ID
 * @param {string} applicationId - Application ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Application data
 */
export const getApplicationById = async (applicationId, currentUser) => {
  try {
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        services (
          id,
          title_en,
          title_am,
          description_en
        ),
        institutions (
          id,
          name_en,
          name_am
        ),
        users!applications_citizen_id_fkey (
          id,
          full_name,
          email,
          phone
        ),
        assigned_employee:users!applications_assigned_to_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      return {
        success: false,
        message: 'Application not found.'
      };
    }

    // Authorization check
    if (currentUser.role === 'CITIZEN' && application.citizen_id !== currentUser.id) {
      return {
        success: false,
        message: 'You do not have permission to view this application.'
      };
    }

    if ((currentUser.role === 'EMPLOYEE' || currentUser.role === 'ICT_STAFF' || currentUser.role === 'INSTITUTION_MANAGER') 
        && application.institution_id !== currentUser.institution_id) {
      return {
        success: false,
        message: 'You do not have permission to view this application.'
      };
    }

    return {
      success: true,
      data: application
    };

  } catch (error) {
    console.error('Get application by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch application.'
    };
  }
};

/**
 * Update application status
 * @param {string} applicationId - Application ID
 * @param {string} status - New status
 * @param {string} notes - Status change notes
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated application
 */
export const updateApplicationStatus = async (applicationId, status, notes, currentUser) => {
  try {
    // Valid status transitions
    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: 'Invalid status.'
      };
    }

    // Get application
    const { data: application } = await supabase
      .from('applications')
      .select('id, citizen_id, institution_id, application_number, status')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return {
        success: false,
        message: 'Application not found.'
      };
    }

    // Authorization: Only employees and managers can change status
    if (!['EMPLOYEE', 'INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'].includes(currentUser.role)) {
      return {
        success: false,
        message: 'You do not have permission to update application status.'
      };
    }

    if ((currentUser.role === 'EMPLOYEE' || currentUser.role === 'INSTITUTION_MANAGER') 
        && application.institution_id !== currentUser.institution_id) {
      return {
        success: false,
        message: 'You can only update applications in your institution.'
      };
    }

    // Update status
    const updateData = {
      status,
      review_notes: notes,
      updated_at: new Date().toISOString()
    };

    if (status === 'UNDER_REVIEW') {
      updateData.reviewed_at = new Date().toISOString();
    } else if (status === 'COMPLETED' || status === 'APPROVED') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Update application status error:', error);
      return {
        success: false,
        message: 'Failed to update application status.'
      };
    }

    // Notify citizen
    await createNotification({
      userId: application.citizen_id,
      type: 'APPLICATION_UPDATE',
      title: 'Application Status Updated',
      message: `Your application ${application.application_number} status has been updated to ${status}`,
      relatedEntityId: applicationId,
      relatedEntityType: 'application'
    });

    // Log audit
    await logAudit(currentUser.id, 'APPLICATION_STATUS_UPDATE', `Updated application ${application.application_number} to ${status}`);

    return {
      success: true,
      message: 'Application status updated successfully',
      data: updatedApplication
    };

  } catch (error) {
    console.error('Update application status error:', error);
    return {
      success: false,
      message: 'An error occurred while updating application status.'
    };
  }
};

/**
 * Assign application to employee
 * @param {string} applicationId - Application ID
 * @param {string} employeeId - Employee ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated application
 */
export const assignApplication = async (applicationId, employeeId, currentUser) => {
  try {
    // Get application
    const { data: application } = await supabase
      .from('applications')
      .select('id, institution_id, application_number')
      .eq('id', applicationId)
      .single();

    if (!application) {
      return {
        success: false,
        message: 'Application not found.'
      };
    }

    // Verify employee exists and belongs to same institution
    const { data: employee } = await supabase
      .from('users')
      .select('id, institution_id, full_name')
      .eq('id', employeeId)
      .eq('role', 'EMPLOYEE')
      .single();

    if (!employee || employee.institution_id !== application.institution_id) {
      return {
        success: false,
        message: 'Employee not found or does not belong to this institution.'
      };
    }

    // Update assignment
    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update({
        assigned_to: employeeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Assign application error:', error);
      return {
        success: false,
        message: 'Failed to assign application.'
      };
    }

    // Notify employee
    await createNotification({
      userId: employeeId,
      type: 'APPLICATION_UPDATE',
      title: 'New Application Assigned',
      message: `Application ${application.application_number} has been assigned to you`,
      relatedEntityId: applicationId,
      relatedEntityType: 'application'
    });

    // Log audit
    await logAudit(currentUser.id, 'APPLICATION_ASSIGN', `Assigned application ${application.application_number} to ${employee.full_name}`);

    return {
      success: true,
      message: 'Application assigned successfully',
      data: updatedApplication
    };

  } catch (error) {
    console.error('Assign application error:', error);
    return {
      success: false,
      message: 'An error occurred while assigning application.'
    };
  }
};

// Helper: Generate application number
const generateApplicationNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `APP-${timestamp}-${random}`;
};

// Helper: Create notification
const createNotification = async (notificationData) => {
  try {
    const { userId, institutionId, type, title, message, relatedEntityId, relatedEntityType } = notificationData;

    if (userId) {
      // Single user notification
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
    } else if (institutionId) {
      // Notify all employees in institution
      const { data: employees } = await supabase
        .from('users')
        .select('id')
        .eq('institution_id', institutionId)
        .in('role', ['EMPLOYEE', 'INSTITUTION_MANAGER']);

      if (employees && employees.length > 0) {
        const notifications = employees.map(emp => ({
          user_id: emp.id,
          type,
          title,
          message,
          related_entity_id: relatedEntityId,
          related_entity_type: relatedEntityType,
          is_read: false,
          created_at: new Date().toISOString()
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }
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
