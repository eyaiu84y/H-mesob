import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { notifyApprovalRequest, notifyApprovalDecision } from './notificationService.js';

// Helper: Log audit trail
const logAudit = async ({ userId, action, entityType, entityId, oldValue, newValue, details }) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue || null,
      new_value: newValue || null,
      details: details || action,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Audit logging error (non-fatal):', err.message);
  }
};

/**
 * Get all approval requests (institutions and eligible users)
 * Accessible to MESOB_MANAGER and SUPER_ADMIN
 */
export const getApprovals = async (filters = {}, currentUser) => {
  try {
    const role = (currentUser?.role || '').toUpperCase();
    if (role !== 'MESOB_MANAGER' && role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Access denied. Mesob Manager or Super Admin role required.' };
    }

    const normStatus = (filters.status || 'ALL').toUpperCase();
    const normType = (filters.type || 'ALL').toUpperCase();
    const approvalList = [];

    // 1. Fetch institutions if type is 'ALL' or 'INSTITUTION'
    if (normType === 'ALL' || normType === 'INSTITUTION') {
      const { data: institutions, error: instError } = await supabase
        .from('institutions')
        .select('id, name_en, name_am, code, description, logo_url, website_url, email, phone, address, status, metadata, created_at, updated_at');

      if (!instError && Array.isArray(institutions)) {
        for (const inst of institutions) {
          const approval = inst.metadata?.approval;
          if (approval && approval.status) {
            const instApprStatus = (approval.status || '').toUpperCase();
            if (normStatus === 'ALL' || instApprStatus === normStatus) {
              approvalList.push({
                id: inst.id,
                entityType: 'INSTITUTION',
                entityId: inst.id,
                entityName: inst.name_en,
                name: inst.name_en,
                name_en: inst.name_en,
                nameAm: inst.name_am,
                name_am: inst.name_am,
                code: inst.code,
                logoUrl: inst.logo_url || null,
                websiteUrl: inst.website_url || null,
                status: approval.status,
                entityStatus: inst.status,
                submittingAdmin: {
                  id: approval.submitted_by || approval.requested_by,
                  name: approval.submitted_by_name || approval.requested_by_name || 'Super Admin',
                  email: approval.submitted_by_email || approval.requested_by_email || ''
                },
                submittedAt: approval.submitted_at || inst.created_at,
                reviewedBy: approval.reviewed_by ? {
                  id: approval.reviewed_by,
                  name: approval.reviewed_by_name || 'Mesob Manager',
                  email: approval.reviewed_by_email || ''
                } : null,
                reviewedAt: approval.reviewed_at || null,
                rejectionReason: approval.rejection_reason || null,
                history: approval.history || [],
                details: {
                  code: inst.code,
                  description: inst.description,
                  email: inst.email,
                  phone: inst.phone,
                  address: inst.address,
                  logoUrl: inst.logo_url || null,
                  websiteUrl: inst.website_url || null,
                  nameAm: inst.name_am,
                  nameEn: inst.name_en,
                  createdAt: inst.created_at,
                  updatedAt: inst.updated_at
                }
              });
            }
          }
        }
      }
    }

    // 2. Fetch users if type is 'ALL' or 'USER'
    if (normType === 'ALL' || normType === 'USER') {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone,
          role,
          status,
          institution_id,
          employee_id,
          national_id,
          metadata,
          created_at,
          institutions:institution_id (name_en, code)
        `);

      if (!userError && Array.isArray(users)) {
        for (const u of users) {
          const approval = u.metadata?.approval;
          if (approval && approval.status) {
            const userApprStatus = (approval.status || '').toUpperCase();
            if (normStatus === 'ALL' || userApprStatus === normStatus) {
              approvalList.push({
                id: u.id,
                entityType: 'USER',
                entityId: u.id,
                entityName: u.full_name,
                requestedRole: u.role,
                status: approval.status,
                entityStatus: u.status,
                institutionName: u.institutions?.name_en || 'None',
                submittingAdmin: {
                  id: approval.submitted_by || approval.requested_by,
                  name: approval.submitted_by_name || approval.requested_by_name || 'Super Admin',
                  email: approval.submitted_by_email || approval.requested_by_email || ''
                },
                submittedAt: approval.submitted_at || u.created_at,
                reviewedBy: approval.reviewed_by ? {
                  id: approval.reviewed_by,
                  name: approval.reviewed_by_name || 'Mesob Manager',
                  email: approval.reviewed_by_email || ''
                } : null,
                reviewedAt: approval.reviewed_at || null,
                rejectionReason: approval.rejection_reason || null,
                history: approval.history || [],
                details: {
                  email: u.email,
                  phone: u.phone,
                  role: u.role,
                  institutionId: u.institution_id,
                  institutionName: u.institutions?.name_en,
                  employeeId: u.employee_id,
                  nationalId: u.national_id,
                  createdAt: u.created_at
                }
              });
            }
          }
        }
      }
    }

    // Sort by submittedAt descending
    approvalList.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return {
      success: true,
      data: approvalList,
      meta: {
        total: approvalList.length,
        pending: approvalList.filter(a => a.status === 'PENDING_APPROVAL').length,
        approved: approvalList.filter(a => a.status === 'APPROVED').length,
        rejected: approvalList.filter(a => a.status === 'REJECTED').length
      }
    };

  } catch (error) {
    console.error('getApprovals error:', error);
    return { success: false, message: 'Failed to retrieve approval queue.' };
  }
};

/**
 * Submit a new institution for central approval
 * Only SUPER_ADMIN can submit
 */
export const submitInstitution = async (institutionData, currentUser) => {
  try {
    const role = (currentUser?.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Only Super Admin can submit institutions for approval.' };
    }

    const name = (institutionData.name || institutionData.name_en || '').trim();
    const nameAm = (institutionData.nameAm || institutionData.name_am || name).trim();
    const code = (institutionData.code || '').trim();
    const description = institutionData.description || null;
    const logoUrl = institutionData.logoUrl || institutionData.logo_url || null;
    const websiteUrl = institutionData.websiteUrl || institutionData.website_url || null;
    const phone = institutionData.phone || null;
    const email = institutionData.email || null;
    const address = institutionData.address || null;

    if (!name || !code) {
      return { success: false, message: 'Institution Name and Code are mandatory fields.' };
    }

    // Verify code uniqueness
    const { data: existing } = await supabase
      .from('institutions')
      .select('id')
      .eq('code', code.toLowerCase().trim())
      .single();

    if (existing) {
      return { success: false, message: 'An institution with this code already exists.' };
    }

    const nowIso = new Date().toISOString();
    const approvalBlock = {
      status: 'PENDING_APPROVAL',
      requested_by: currentUser.id,
      submitted_by: currentUser.id,
      requested_by_name: currentUser.full_name || currentUser.name || 'Super Admin',
      submitted_by_name: currentUser.full_name || currentUser.name || 'Super Admin',
      requested_by_email: currentUser.email,
      submitted_by_email: currentUser.email,
      submitted_at: nowIso,
      history: [
        {
          action: 'SUBMITTED',
          by: currentUser.id,
          by_name: currentUser.full_name || currentUser.name || 'Super Admin',
          timestamp: nowIso,
          notes: 'Initial creation and submission for central Mesob Manager approval.'
        }
      ]
    };

    // Keep status 'INACTIVE' until explicitly approved
    const { data: newInstitution, error: insertError } = await supabase
      .from('institutions')
      .insert({
        name_en: name.trim(),
        name_am: nameAm || name.trim(),
        code: code.toLowerCase().trim(),
        description: description || null,
        logo_url: logoUrl || null,
        website_url: websiteUrl || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        status: 'INACTIVE',
        metadata: { approval: approvalBlock },
        created_at: nowIso,
        updated_at: nowIso
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert institution error:', insertError);
      return { success: false, message: 'Failed to save institution submission.' };
    }

    // Audit log
    await logAudit({
      userId: currentUser.id,
      action: 'INSTITUTION_SUBMIT_APPROVAL',
      entityType: 'institution',
      entityId: newInstitution.id,
      details: `Submitted institution "${newInstitution.name_en}" (${newInstitution.code}) for central approval.`
    });

    // Notify Mesob Manager
    await notifyApprovalRequest({
      entityType: 'Institution',
      entityId: newInstitution.id,
      entityName: newInstitution.name_en,
      requestingAdminId: currentUser.id
    });

    return {
      success: true,
      message: 'Institution submitted successfully and is pending Mesob Manager approval.',
      data: newInstitution
    };

  } catch (error) {
    console.error('submitInstitution error:', error);
    return { success: false, message: 'Failed to submit institution for approval.' };
  }
};

/**
 * Resubmit a previously rejected institution for central approval
 */
export const resubmitInstitution = async (institutionId, updates, currentUser) => {
  try {
    const role = (currentUser?.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Only Super Admin can resubmit institutions for approval.' };
    }

    const { data: inst, error: fetchErr } = await supabase
      .from('institutions')
      .select('*')
      .eq('id', institutionId)
      .single();

    if (fetchErr || !inst) {
      return { success: false, message: 'Institution not found.' };
    }

    const currentApproval = inst.metadata?.approval || {};
    const nowIso = new Date().toISOString();

    const history = Array.isArray(currentApproval.history) ? [...currentApproval.history] : [];
    history.push({
      action: 'RESUBMITTED',
      by: currentUser.id,
      by_name: currentUser.full_name || currentUser.name || 'Super Admin',
      timestamp: nowIso,
      previous_status: currentApproval.status,
      notes: updates.resubmitNotes || 'Resubmitted with corrected requirements.'
    });

    const updatedApproval = {
      ...currentApproval,
      status: 'PENDING_APPROVAL',
      requested_by: currentUser.id,
      requested_by_name: currentUser.full_name || currentUser.name || 'Super Admin',
      requested_by_email: currentUser.email,
      submitted_at: nowIso,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      history
    };

    const updatePayload = {
      status: 'INACTIVE', // Must remain inactive
      updated_at: nowIso,
      metadata: { ...inst.metadata, approval: updatedApproval }
    };

    if (updates.name || updates.name_en) updatePayload.name_en = (updates.name || updates.name_en).trim();
    if (updates.nameAm || updates.name_am) updatePayload.name_am = (updates.nameAm || updates.name_am).trim();
    if (updates.description) updatePayload.description = updates.description;
    if (updates.phone) updatePayload.phone = updates.phone;
    if (updates.email) updatePayload.email = updates.email;
    if (updates.address) updatePayload.address = updates.address;
    if (updates.websiteUrl || updates.website_url || updates.officialUrl) updatePayload.website_url = updates.websiteUrl || updates.website_url || updates.officialUrl;
    if (updates.logoUrl || updates.logo_url) updatePayload.logo_url = updates.logoUrl || updates.logo_url;

    const { data: updated, error: updateErr } = await supabase
      .from('institutions')
      .update(updatePayload)
      .eq('id', institutionId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, message: 'Failed to update and resubmit institution.' };
    }

    await logAudit({
      userId: currentUser.id,
      action: 'INSTITUTION_RESUBMIT_APPROVAL',
      entityType: 'institution',
      entityId: institutionId,
      details: `Resubmitted institution "${updated.name_en}" for central approval.`
    });

    await notifyApprovalRequest({
      entityType: 'Institution',
      entityId: updated.id,
      entityName: updated.name_en,
      requestingAdminId: currentUser.id
    });

    return {
      success: true,
      message: 'Institution resubmitted for Mesob Manager approval.',
      data: updated
    };

  } catch (error) {
    console.error('resubmitInstitution error:', error);
    return { success: false, message: 'Failed to resubmit institution.' };
  }
};

/**
 * Submit an eligible user account for central approval (e.g. INSTITUTION_MANAGER)
 * Only SUPER_ADMIN can submit
 */
export const submitUser = async (userData, currentUser) => {
  try {
    const role = (currentUser?.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Only Super Admin can submit user accounts for approval.' };
    }

    const fullName = (userData.fullName || userData.name || userData.full_name || '').trim();
    const email = (userData.email || '').toLowerCase().trim();
    const phone = userData.phone ? userData.phone.replace(/[\s\-()]/g, '') : null;
    const targetRole = (userData.role || '').toUpperCase();
    const institutionId = userData.institutionId || userData.institution_id || userData.institution || null;
    const employeeId = userData.employeeId || userData.employee_id || null;
    const nationalId = userData.nationalId || userData.national_id || null;
    const tempPassword = userData.password || `Mesob@${Math.floor(100000 + Math.random() * 900000)}`;

    if (!email || !fullName || !targetRole) {
      return { success: false, message: 'Full name, email, and role are required.' };
    }

    // Role validation
    const validRoles = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'CUSTOMER', 'ICT_STAFF', 'CITIZEN'];
    const normTargetRole = targetRole.toUpperCase();
    if (!validRoles.includes(normTargetRole)) {
      return { success: false, message: 'Invalid target role specified.' };
    }

    // Institutional roles require valid institution
    let resolvedInstitutionId = null;
    if (institutionId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(institutionId);
      if (isUuid) {
        resolvedInstitutionId = institutionId;
      } else {
        const { data: inst } = await supabase
          .from('institutions')
          .select('id')
          .or(`code.eq.${institutionId},name_en.ilike.${institutionId}`)
          .maybeSingle();
        resolvedInstitutionId = inst?.id || null;
      }
    }

    if (['INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes(normTargetRole) && !resolvedInstitutionId) {
      return { success: false, message: 'An institution assignment is required for this role.' };
    }

    // Check duplicate email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return { success: false, message: 'A user with this email address already exists.' };
    }

    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const nowIso = new Date().toISOString();

    const approvalBlock = {
      status: 'PENDING_APPROVAL',
      requested_by: currentUser.id,
      submitted_by: currentUser.id,
      requested_by_name: currentUser.full_name || currentUser.name || 'Super Admin',
      submitted_by_name: currentUser.full_name || currentUser.name || 'Super Admin',
      requested_by_email: currentUser.email,
      submitted_by_email: currentUser.email,
      submitted_at: nowIso,
      history: [
        {
          action: 'SUBMITTED',
          by: currentUser.id,
          by_name: currentUser.full_name || currentUser.name || 'Super Admin',
          timestamp: nowIso,
          notes: `Submitted account with role ${normTargetRole} for central approval.`
        }
      ]
    };

    // Map role alias to PostgreSQL database enum user_role ('TECHNICIAN' -> 'ICT_STAFF', 'CUSTOMER' -> 'CITIZEN')
    const dbRole = normTargetRole === 'CUSTOMER' ? 'CITIZEN' : normTargetRole === 'TECHNICIAN' ? 'ICT_STAFF' : normTargetRole;

    // User is created INACTIVE so login and protected endpoints are blocked until approved
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        full_name: fullName.trim(),
        phone: phone || null,
        role: dbRole,
        institution_id: resolvedInstitutionId || null,
        employee_id: employeeId || null,
        national_id: nationalId || null,
        status: 'INACTIVE',
        created_by: currentUser.id,
        created_at: nowIso,
        updated_at: nowIso,
        metadata: { approval: approvalBlock }
      })
      .select('id, email, full_name, role, status, institution_id, employee_id, created_at, metadata')
      .single();

    if (insertError) {
      console.error('Insert user error:', insertError);
      return { success: false, message: 'Failed to save user account submission.' };
    }

    await logAudit({
      userId: currentUser.id,
      action: 'USER_SUBMIT_APPROVAL',
      entityType: 'user',
      entityId: newUser.id,
      details: `Submitted user "${newUser.full_name}" (${newUser.role}) for central approval.`
    });

    // Notify Mesob Manager
    await notifyApprovalRequest({
      entityType: 'User Account',
      entityId: newUser.id,
      entityName: `${newUser.full_name} (${newUser.role})`,
      requestingAdminId: currentUser.id
    });

    return {
      success: true,
      message: 'User account created and submitted for Mesob Manager approval. Account remains inactive until approved.',
      data: newUser
    };

  } catch (error) {
    console.error('submitUser error:', error);
    return { success: false, message: 'Failed to submit user for approval.' };
  }
};

/**
 * Resubmit a previously rejected user account for approval
 */
export const resubmitUser = async (userId, updates, currentUser) => {
  try {
    const role = (currentUser?.role || '').toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Only Super Admin can resubmit user accounts for approval.' };
    }

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchErr || !user) {
      return { success: false, message: 'User not found.' };
    }

    const currentApproval = user.metadata?.approval || {};
    const nowIso = new Date().toISOString();

    const history = Array.isArray(currentApproval.history) ? [...currentApproval.history] : [];
    history.push({
      action: 'RESUBMITTED',
      by: currentUser.id,
      by_name: currentUser.full_name || currentUser.name || 'Super Admin',
      timestamp: nowIso,
      previous_status: currentApproval.status,
      notes: updates.resubmitNotes || 'Resubmitted with corrected account details.'
    });

    const updatedApproval = {
      ...currentApproval,
      status: 'PENDING_APPROVAL',
      requested_by: currentUser.id,
      requested_by_name: currentUser.full_name || currentUser.name || 'Super Admin',
      requested_by_email: currentUser.email,
      submitted_at: nowIso,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      history
    };

    const updatePayload = {
      status: 'INACTIVE', // Must remain inactive
      updated_at: nowIso,
      metadata: { ...user.metadata, approval: updatedApproval }
    };

    if (updates.fullName) updatePayload.full_name = updates.fullName.trim();
    if (updates.phone) updatePayload.phone = updates.phone;
    if (updates.employeeId) updatePayload.employee_id = updates.employeeId;
    if (updates.institutionId) updatePayload.institution_id = updates.institutionId;
    if (updates.role) {
      const normR = String(updates.role).toUpperCase();
      updatePayload.role = normR === 'CUSTOMER' ? 'CITIZEN' : normR === 'TECHNICIAN' ? 'ICT_STAFF' : normR;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, full_name, role, status, institution_id, employee_id, metadata')
      .single();

    if (updateErr) {
      return { success: false, message: 'Failed to update and resubmit user account.' };
    }

    await logAudit({
      userId: currentUser.id,
      action: 'USER_RESUBMIT_APPROVAL',
      entityType: 'user',
      entityId: userId,
      details: `Resubmitted user "${updated.full_name}" for central approval.`
    });

    await notifyApprovalRequest({
      entityType: 'User Account',
      entityId: updated.id,
      entityName: `${updated.full_name} (${updated.role})`,
      requestingAdminId: currentUser.id
    });

    return {
      success: true,
      message: 'User account resubmitted for Mesob Manager approval.',
      data: updated
    };

  } catch (error) {
    console.error('resubmitUser error:', error);
    return { success: false, message: 'Failed to resubmit user account.' };
  }
};

/**
 * Review and decide (APPROVE or REJECT) an approval request
 * Strictly MESOB_MANAGER role required
 * Anti-privilege escalation: Requester cannot approve their own submission!
 */
export const reviewApproval = async ({ entityType, entityId, decision, reason }, currentUser) => {
  try {
    const role = (currentUser?.role || '').toUpperCase();
    if (role !== 'MESOB_MANAGER') {
      return { success: false, message: 'Access denied. Only Mesob Manager has authority to approve or reject submissions.' };
    }

    const normDecision = (decision || '').toUpperCase();
    if (normDecision !== 'APPROVED' && normDecision !== 'REJECTED') {
      return { success: false, message: 'Decision must be either APPROVED or REJECTED.' };
    }

    if (normDecision === 'REJECTED' && (!reason || !reason.trim())) {
      return { success: false, message: 'A mandatory rejection reason is required when rejecting a submission.' };
    }

    let normType = (entityType || '').toUpperCase();
    if (!normType || (normType !== 'INSTITUTION' && normType !== 'USER')) {
      const { data: instCheck } = await supabase.from('institutions').select('id').eq('id', entityId).limit(1);
      if (instCheck && instCheck.length > 0) {
        normType = 'INSTITUTION';
      } else {
        const { data: userCheck } = await supabase.from('users').select('id').eq('id', entityId).limit(1);
        if (userCheck && userCheck.length > 0) {
          normType = 'USER';
        }
      }
    }
    const nowIso = new Date().toISOString();

    // ─────────────────────────────────────────────────────────────
    // INSTITUTION DECISION
    // ─────────────────────────────────────────────────────────────
    if (normType === 'INSTITUTION') {
      const { data: inst, error: fetchErr } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', entityId)
        .single();

      if (fetchErr || !inst) {
        return { success: false, message: 'Institution request not found.' };
      }

      const currentApproval = inst.metadata?.approval || {};

      // Anti-privilege escalation: requester cannot approve their own request!
      if (currentApproval.requested_by === currentUser.id) {
        return { success: false, message: 'Anti-privilege escalation: Requester cannot review or approve their own request.' };
      }

      // Concurrency check: must be pending
      if (currentApproval.status !== 'PENDING_APPROVAL') {
        return { success: false, message: `This request is not pending approval (currently ${currentApproval.status}).` };
      }

      // Mandatory logo verification: cannot approve institution without a valid logo
      if (normDecision === 'APPROVED') {
        const hasLogo = inst.logo_url && String(inst.logo_url).trim().length > 0 && inst.logo_url !== 'null';
        if (!hasLogo) {
          return {
            success: false,
            message: 'Cannot approve institution: A valid institution logo is required before approval.'
          };
        }
      }

      const history = Array.isArray(currentApproval.history) ? [...currentApproval.history] : [];
      history.push({
        action: normDecision,
        by: currentUser.id,
        by_name: currentUser.full_name || currentUser.name || 'Mesob Manager',
        timestamp: nowIso,
        reason: normDecision === 'REJECTED' ? reason.trim() : undefined
      });

      const updatedApproval = {
        ...currentApproval,
        status: normDecision,
        reviewed_by: currentUser.id,
        reviewed_by_name: currentUser.full_name || currentUser.name || 'Mesob Manager',
        reviewed_by_email: currentUser.email,
        reviewed_at: nowIso,
        rejection_reason: normDecision === 'REJECTED' ? reason.trim() : null,
        history
      };

      const newInstitutionStatus = normDecision === 'APPROVED' ? 'ACTIVE' : 'INACTIVE';

      const { data: updatedInst, error: updateErr } = await supabase
        .from('institutions')
        .update({
          status: newInstitutionStatus,
          updated_at: nowIso,
          metadata: { ...inst.metadata, approval: updatedApproval }
        })
        .eq('id', entityId)
        .select()
        .single();

      if (updateErr) {
        return { success: false, message: 'Failed to record approval decision.' };
      }

      await logAudit({
        userId: currentUser.id,
        action: normDecision === 'APPROVED' ? 'INSTITUTION_APPROVE' : 'INSTITUTION_REJECT',
        entityType: 'institution',
        entityId,
        details: `${normDecision} institution "${updatedInst.name_en}". ${normDecision === 'REJECTED' ? `Reason: ${reason.trim()}` : 'Activated successfully.'}`
      });

      // Notify the submitting Admin
      if (currentApproval.requested_by) {
        await notifyApprovalDecision({
          entityType: 'Institution',
          entityId: updatedInst.id,
          entityName: updatedInst.name_en,
          requestingAdminId: currentApproval.requested_by,
          status: normDecision,
          decisionNotes: normDecision === 'REJECTED' ? reason.trim() : undefined
        });
      }

      return {
        success: true,
        message: `Institution "${updatedInst.name_en}" has been ${normDecision.toLowerCase()} successfully.`,
        data: updatedInst
      };
    }

    // ─────────────────────────────────────────────────────────────
    // USER DECISION
    // ─────────────────────────────────────────────────────────────
    if (normType === 'USER') {
      const { data: user, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', entityId)
        .single();

      if (fetchErr || !user) {
        return { success: false, message: 'User account request not found.' };
      }

      const currentApproval = user.metadata?.approval || {};

      // Anti-privilege escalation check
      if (currentApproval.requested_by === currentUser.id) {
        return { success: false, message: 'Anti-privilege escalation: Requester cannot review or approve their own request.' };
      }

      // Concurrency check
      if (currentApproval.status !== 'PENDING_APPROVAL') {
        return { success: false, message: `This user account request is not pending approval (currently ${currentApproval.status}).` };
      }

      const history = Array.isArray(currentApproval.history) ? [...currentApproval.history] : [];
      history.push({
        action: normDecision,
        by: currentUser.id,
        by_name: currentUser.full_name || currentUser.name || 'Mesob Manager',
        timestamp: nowIso,
        reason: normDecision === 'REJECTED' ? reason.trim() : undefined
      });

      const updatedApproval = {
        ...currentApproval,
        status: normDecision,
        reviewed_by: currentUser.id,
        reviewed_by_name: currentUser.full_name || currentUser.name || 'Mesob Manager',
        reviewed_by_email: currentUser.email,
        reviewed_at: nowIso,
        rejection_reason: normDecision === 'REJECTED' ? reason.trim() : null,
        history
      };

      const newUserStatus = normDecision === 'APPROVED' ? 'ACTIVE' : 'INACTIVE';

      const { data: updatedUser, error: updateErr } = await supabase
        .from('users')
        .update({
          status: newUserStatus,
          updated_at: nowIso,
          metadata: { ...user.metadata, approval: updatedApproval }
        })
        .eq('id', entityId)
        .select('id, email, full_name, role, status, institution_id, employee_id, metadata')
        .single();

      if (updateErr) {
        return { success: false, message: 'Failed to record user approval decision.' };
      }

      await logAudit({
        userId: currentUser.id,
        action: normDecision === 'APPROVED' ? 'USER_APPROVE' : 'USER_REJECT',
        entityType: 'user',
        entityId,
        details: `${normDecision} user account "${updatedUser.full_name}" (${updatedUser.role}). ${normDecision === 'REJECTED' ? `Reason: ${reason.trim()}` : 'Activated successfully.'}`
      });

      // Notify the submitting Admin
      if (currentApproval.requested_by) {
        await notifyApprovalDecision({
          entityType: 'User Account',
          entityId: updatedUser.id,
          entityName: `${updatedUser.full_name} (${updatedUser.role})`,
          requestingAdminId: currentApproval.requested_by,
          status: normDecision,
          decisionNotes: normDecision === 'REJECTED' ? reason.trim() : undefined
        });
      }

      return {
        success: true,
        message: `User account "${updatedUser.full_name}" has been ${normDecision.toLowerCase()} successfully.`,
        data: updatedUser
      };
    }

    return { success: false, message: 'Invalid entity type. Must be INSTITUTION or USER.' };

  } catch (error) {
    console.error('reviewApproval error:', error);
    return { success: false, message: 'Failed to process approval decision.' };
  }
};
