import { supabase } from '../config/supabase.js';
import { createNotification } from './notificationService.js';

// Recent submission cache to protect against rapid double-clicks
const recentSubmissions = new Map();

/**
 * Create new application
 * @param {Object} applicationData - Application data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created application
 */
export const createApplication = async (applicationData, currentUser) => {
  try {
    const { serviceId, institutionId, applicationData: appData, documents } = applicationData;

    // For backwards compatibility with mock data, allow serviceId and institutionId to be null
    // In that case, use service/institution names from applicationData
    let finalServiceId = serviceId;
    let finalInstitutionId = institutionId;

    // If IDs are not provided, try to find them by name from applicationData
    if (!finalServiceId && appData?.serviceName) {
      const { data: service } = await supabase
        .from('services')
        .select('id')
        .ilike('title_en', appData.serviceName)
        .single();
      finalServiceId = service?.id || null;
    }

    if (!finalInstitutionId && appData?.institutionName) {
      const { data: institution } = await supabase
        .from('institutions')
        .select('id')
        .ilike('name_en', appData.institutionName)
        .single();
      finalInstitutionId = institution?.id || null;
    }

    // Protection Against Rapid or Simultaneous Submissions (Double-clicks)
    const lockKey = `${currentUser.id}_${finalServiceId || 'generic'}`;
    const now = Date.now();
    const lastSubTime = recentSubmissions.get(lockKey);
    if (lastSubTime && (now - lastSubTime) < 3000) {
      // Check if an application was already created for this user and service in the last 5 seconds
      const fiveSecondsAgo = new Date(now - 5000).toISOString();
      let recentQuery = supabase
        .from('applications')
        .select(`
          id,
          application_number,
          status,
          submitted_at,
          updated_at,
          services ( id, title_en, title_am ),
          institutions ( id, name_en, name_am )
        `)
        .eq('citizen_id', currentUser.id)
        .gte('created_at', fiveSecondsAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (finalServiceId) {
        recentQuery = recentQuery.eq('service_id', finalServiceId);
      }
      const { data: recentCreated } = await recentQuery;
      if (recentCreated && recentCreated.length > 0) {
        return {
          success: true,
          message: 'Application submitted successfully',
          data: recentCreated[0]
        };
      }
    }
    recentSubmissions.set(lockKey, now);

    // Fetch service info to check duplicate registration policy & required docs
    let serviceObj = null;
    if (finalServiceId) {
      const { data: svc } = await supabase
        .from('services')
        .select('id, code, title_en, title_am, metadata')
        .eq('id', finalServiceId)
        .single();
      serviceObj = svc;
    }

    // ── 1. DUPLICATE REGISTRATION PREVENTION ──────────────────────────
    // For services configured as one-time registrations:
    // Prevent customer from creating another active or completed registration.
    const isOneTimeService = () => {
      if (!serviceObj) return false;
      const meta = serviceObj.metadata || {};
      if (
        meta.is_one_time === true ||
        meta.one_time === true ||
        meta.allow_multiple === false ||
        meta.registration_policy === 'ONE_TIME' ||
        appData?.isOneTime === true ||
        appData?.is_one_time === true ||
        appData?.allow_multiple === false
      ) {
        return true;
      }
      // Standard one-time registration service codes
      const oneTimeCodes = [
        'FAYDA_NEW',
        'REV_TIN',
        'sim-registration',
        'business-registration',
        'trade-name-reservation',
        'CBE_ACCOUNT',
        'account-opening',
        'investment-license',
        'work-permit-new'
      ];
      if (serviceObj.code && oneTimeCodes.includes(serviceObj.code)) {
        return true;
      }
      const titleLower = (serviceObj.title_en || '').toLowerCase();
      if (
        titleLower.includes('new national id') ||
        titleLower.includes('tin registration') ||
        titleLower.includes('new business registration') ||
        titleLower.includes('new sim card') ||
        titleLower.includes('new bank account')
      ) {
        return true;
      }
      return false;
    };

    if (finalServiceId && isOneTimeService()) {
      // Check for active or completed applications for this service & citizen
      // REJECTED and CANCELLED do not block the customer
      const { data: activeExisting } = await supabase
        .from('applications')
        .select('id, application_number, status, submitted_at')
        .eq('citizen_id', currentUser.id)
        .eq('service_id', finalServiceId)
        .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS', 'APPROVED', 'COMPLETED'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (activeExisting && activeExisting.length > 0) {
        const existingApp = activeExisting[0];
        return {
          success: false,
          isDuplicate: true,
          message: `An active or completed registration already exists for this service (Reference: ${existingApp.application_number}, Status: ${existingApp.status}). Duplicate registrations are not permitted.`,
          existingApplication: {
            id: existingApp.id,
            applicationNumber: existingApp.application_number,
            referenceNumber: existingApp.application_number,
            status: existingApp.status,
            submittedAt: existingApp.submitted_at
          }
        };
      }
    }

    // ── 2. ALLOW SUBMISSION WHEN DOCUMENTS ARE MISSING ───────────────
    // Preserve uploaded docs and submitted applicant information.
    // Identify any missing required documents for employee review.
    const uploadedList = documents || [];
    const uploadedNames = uploadedList.map(d => (typeof d === 'string' ? d : d.name || d.title || d.fileName || '')).filter(Boolean);
    const requiredDocs = serviceObj?.metadata?.required_documents || appData?.serviceDetails?.requiredDocs || appData?.requiredDocs || [];
    const missingDocs = requiredDocs.filter(req => !uploadedNames.some(u => u.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(u.toLowerCase())));

    const enrichedAppData = {
      ...(appData || {}),
      requiredDocuments: requiredDocs,
      missingDocuments: missingDocs,
      hasMissingDocuments: missingDocs.length > 0
    };

    // If still no IDs found, create a generic entry (for demo/mock data)
    if (!finalServiceId || !finalInstitutionId) {
      console.warn('Creating application with mock data (no real service/institution IDs)');
    }

    // Generate application number
    const applicationNumber = generateApplicationNumber();

    // Create application - status is SUBMITTED
    const { data: newApplication, error } = await supabase
      .from('applications')
      .insert({
        citizen_id: currentUser.id,
        service_id: finalServiceId,
        institution_id: finalInstitutionId,
        application_number: applicationNumber,
        status: 'SUBMITTED',
        application_data: enrichedAppData,
        documents: uploadedList,
        metadata: {
          ...(applicationData.metadata || {}),
          requiredDocuments: requiredDocs,
          missingDocuments: missingDocs,
          hasMissingDocuments: missingDocs.length > 0
        },
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        application_number,
        status,
        submitted_at,
        updated_at,
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

    // Notify the applicant (Customer)
    await createNotification({
      recipientId: currentUser.id,
      type: 'APPLICATION_UPDATE',
      title: 'Application Submitted',
      message: `Your application #${applicationNumber} has been submitted successfully.${missingDocs.length > 0 ? ' Some required documents are pending employee review.' : ''}`,
      relatedEntityId: newApplication.id,
      relatedEntityType: 'application'
    });

    // Create notification for institution employees and manager
    if (finalInstitutionId) {
      await createNotification({
        institutionId: finalInstitutionId,
        roles: ['INSTITUTION_MANAGER', 'EMPLOYEE'],
        type: 'APPLICATION_UPDATE',
        title: 'New Application Submitted',
        message: `New application #${applicationNumber} has been submitted for review.${missingDocs.length > 0 ? ` (${missingDocs.length} missing document(s))` : ''}`,
        relatedEntityId: newApplication.id,
        relatedEntityType: 'application'
      });
    }

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
        updated_at,
        reviewed_at,
        completed_at,
        citizen_id,
        assigned_to,
        application_data,
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
    const userRole = (currentUser.role || '').toUpperCase();
    if (userRole === 'CITIZEN' || userRole === 'CUSTOMER') {
      // Customers see only their applications
      query = query.eq('citizen_id', currentUser.id);
    } else if (['EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(userRole)) {
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

    const enrichedData = (data || []).map(item => ({
      ...item,
      customer_id: item.citizen_id,
      customer: item.users
    }));

    return {
      success: true,
      data: enrichedData
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
    const userRole = (currentUser.role || '').toUpperCase();
    if ((userRole === 'CITIZEN' || userRole === 'CUSTOMER') && application.citizen_id !== currentUser.id) {
      return {
        success: false,
        message: 'You do not have permission to view this application.'
      };
    }

    if (['EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(userRole) 
        && application.institution_id !== currentUser.institution_id) {
      return {
        success: false,
        message: 'You do not have permission to view this application.'
      };
    }

    return {
      success: true,
      data: {
        ...application,
        customer_id: application.citizen_id,
        customer: application.users
      }
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
 * @param {string} notes - Status change notes / rejection reason
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

    // Mandatory rejection reason check
    if (status === 'REJECTED' && (!notes || !notes.trim())) {
      return {
        success: false,
        message: 'A rejection reason is mandatory.'
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
    const roleUpper = (currentUser.role || '').toUpperCase();
    if (!['EMPLOYEE', 'INSTITUTION_MANAGER', 'SUPER_ADMIN', 'MESOB_MANAGER'].includes(roleUpper)) {
      return {
        success: false,
        message: 'You do not have permission to update application status.'
      };
    }

    if ((roleUpper === 'EMPLOYEE' || roleUpper === 'INSTITUTION_MANAGER') 
        && application.institution_id !== currentUser.institution_id) {
      return {
        success: false,
        message: 'You can only update applications in your institution.'
      };
    }

    // Update status and record decision metadata
    const updateData = {
      status,
      review_notes: notes?.trim() || null,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (status === 'COMPLETED' || status === 'APPROVED') {
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

    // Notify customer with appropriate title and status context
    let statusTitle = 'Application Status Updated';
    let statusMsg = `Your application #${application.application_number} status is now ${status}.`;
    if (status === 'PENDING_DOCUMENTS' || status === 'REQUIRES_DOCUMENTS') {
      statusTitle = 'Additional Documents Required';
      statusMsg = `Please provide required additional documents for application #${application.application_number}.${notes ? ` Instructions: ${notes.trim()}` : ''}`;
    } else if (status === 'APPROVED') {
      statusTitle = 'Application Approved';
      statusMsg = `Congratulations! Your application #${application.application_number} has been approved.`;
    } else if (status === 'COMPLETED') {
      statusTitle = 'Application Completed';
      statusMsg = `Your application #${application.application_number} has been completed.`;
    } else if (status === 'REJECTED') {
      statusTitle = 'Application Decision';
      statusMsg = `Your application #${application.application_number} has been reviewed and rejected.${notes ? ` Reason: ${notes.trim()}` : ''}`;
    }

    await createNotification({
      recipientId: application.citizen_id,
      type: 'APPLICATION_UPDATE',
      title: statusTitle,
      message: statusMsg,
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
 * Resubmit application with corrected or additional documents
 * @param {string} applicationId - Application ID
 * @param {Array} newDocuments - Updated documents array
 * @param {string} notes - Optional resubmission notes
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated application
 */
export const resubmitApplication = async (applicationId, newDocuments = [], notes = '', currentUser) => {
  try {
    const { data: application, error: fetchErr } = await supabase
      .from('applications')
      .select('id, citizen_id, institution_id, application_number, status, documents, application_data')
      .eq('id', applicationId)
      .single();

    if (fetchErr || !application) {
      return {
        success: false,
        message: 'Application not found.'
      };
    }

    // Check ownership
    const userRole = (currentUser.role || '').toUpperCase();
    if ((userRole === 'CITIZEN' || userRole === 'CUSTOMER') && application.citizen_id !== currentUser.id) {
      return {
        success: false,
        message: 'You can only resubmit your own applications.'
      };
    }

    // Only applications with REJECTED or PENDING_DOCUMENTS can be resubmitted
    if (!['REJECTED', 'PENDING_DOCUMENTS'].includes(application.status)) {
      return {
        success: false,
        message: `Cannot resubmit application with status: ${application.status}. Only Rejected or Pending Documents applications can be resubmitted.`
      };
    }

    // Merge documents
    const existingDocs = Array.isArray(application.documents) ? application.documents : [];
    const incomingDocs = Array.isArray(newDocuments) ? newDocuments : (newDocuments ? [newDocuments] : []);
    const mergedDocs = [...existingDocs, ...incomingDocs];

    const currentAppData = application.application_data || {};
    const updatedAppData = {
      ...currentAppData,
      resubmittedAt: new Date().toISOString(),
      resubmissionNotes: notes?.trim() || 'Updated documents provided by applicant.'
    };

    const { data: updatedApp, error: updateErr } = await supabase
      .from('applications')
      .update({
        status: 'SUBMITTED',
        documents: mergedDocs,
        application_data: updatedAppData,
        review_notes: notes ? `Resubmitted: ${notes.trim()}` : 'Resubmitted with updated documents',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        id,
        application_number,
        status,
        submitted_at,
        updated_at,
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

    if (updateErr) {
      console.error('Resubmit application error:', updateErr);
      return {
        success: false,
        message: 'Failed to resubmit application.'
      };
    }

    // Notify customer
    await createNotification({
      recipientId: application.citizen_id,
      type: 'APPLICATION_UPDATE',
      title: 'Application Resubmitted',
      message: `Your application #${application.application_number} has been resubmitted successfully with updated documents.`,
      relatedEntityId: applicationId,
      relatedEntityType: 'application'
    });

    // Notify institution staff
    if (application.institution_id) {
      await createNotification({
        institutionId: application.institution_id,
        roles: ['INSTITUTION_MANAGER', 'EMPLOYEE'],
        type: 'APPLICATION_UPDATE',
        title: 'Application Resubmitted',
        message: `Application #${application.application_number} has been resubmitted with updated documents for review.`,
        relatedEntityId: applicationId,
        relatedEntityType: 'application'
      });
    }

    await logAudit(currentUser.id, 'APPLICATION_RESUBMIT', `Resubmitted application ${application.application_number}`);

    return {
      success: true,
      message: 'Application resubmitted successfully',
      data: updatedApp
    };
  } catch (error) {
    console.error('Resubmit application error:', error);
    return {
      success: false,
      message: 'An error occurred while resubmitting application.'
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

    // Authorization check: only authorized managers can assign work within permitted institutional scope
    const assignerRole = (currentUser.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER'].includes(assignerRole)) {
      return {
        success: false,
        message: 'You do not have permission to assign applications.'
      };
    }
    if (assignerRole === 'INSTITUTION_MANAGER' && currentUser.institution_id !== application.institution_id) {
      return {
        success: false,
        message: 'You can only assign applications within your own institution.'
      };
    }

    // Verify employee exists, is an EMPLOYEE (not customer/technician), and belongs to same institution
    const { data: employee } = await supabase
      .from('users')
      .select('id, institution_id, full_name, role')
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
      recipientId: employeeId,
      type: 'APPLICATION_UPDATE',
      title: 'New Application Assigned',
      message: `Application #${application.application_number} has been assigned to you for processing.`,
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
