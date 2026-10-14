import { supabase } from '../config/supabase.js';

/**
 * Get services by institution
 * @param {string} institutionId - Institution ID
 * @returns {Promise<Object>} List of services
 */
export const getServicesByInstitution = async (institutionId) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        id,
        institution_id,
        title_en,
        title_am,
        description_en,
        description_am,
        processing_time,
        service_fee,
        is_active,
        created_at
      `)
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .order('title_en', { ascending: true });

    if (error) {
      console.error('Get services error:', error);
      return {
        success: false,
        message: 'Failed to fetch services.'
      };
    }

    // Map database fields to expected API format
    const mappedData = (data || []).map(service => ({
      id: service.id,
      institution_id: service.institution_id,
      name: service.title_en,
      name_am: service.title_am,
      description: service.description_en,
      description_am: service.description_am,
      processing_time: service.processing_time,
      fee_amount: service.service_fee,
      status: service.is_active ? 'ACTIVE' : 'INACTIVE',
      created_at: service.created_at
    }));

    return {
      success: true,
      data: mappedData
    };

  } catch (error) {
    console.error('Get services error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching services.'
    };
  }
};

/**
 * Get all services (with optional filters)
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} List of services
 */
export const getAllServices = async (filters = {}) => {
  try {
    let query = supabase
      .from('services')
      .select(`
        id,
        institution_id,
        code,
        title_en,
        title_am,
        description_en,
        description_am,
        processing_time,
        service_fee,
        service_url,
        is_active,
        created_at,
        updated_at,
        metadata,
        institutions (
          id,
          name_en,
          name_am,
          code
        )
      `)
      .order('title_en', { ascending: true });

    if (filters.institutionId) {
      query = query.eq('institution_id', filters.institutionId);
    }

    if (filters.status !== undefined) {
      // Map status filter to is_active boolean
      const isActive = filters.status === 'ACTIVE';
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get all services error:', error);
      return {
        success: false,
        message: 'Failed to fetch services.'
      };
    }

    // Map database fields to expected API format - keep original field names for frontend compatibility
    const mappedData = (data || []).map(service => ({
      id: service.id,
      institution_id: service.institution_id,
      code: service.code,
      title_en: service.title_en,
      title_am: service.title_am,
      description_en: service.description_en,
      description_am: service.description_am,
      processing_time: service.processing_time,
      service_fee: service.service_fee,
      service_url: service.service_url,
      is_active: service.is_active,
      created_at: service.created_at,
      updated_at: service.updated_at,
      metadata: service.metadata,
      institutions: service.institutions,
      // Legacy field mappings for backward compatibility
      name: service.title_en,
      name_am: service.title_am,
      description: service.description_en,
      fee_amount: service.service_fee,
      status: service.is_active ? 'ACTIVE' : 'INACTIVE'
    }));

    return {
      success: true,
      data: mappedData
    };

  } catch (error) {
    console.error('Get all services error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching services.'
    };
  }
};

/**
 * Get service by ID
 * @param {string} serviceId - Service ID
 * @returns {Promise<Object>} Service data
 */
export const getServiceById = async (serviceId) => {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select(`
        id,
        institution_id,
        title_en,
        title_am,
        description_en,
        description_am,
        processing_time,
        service_fee,
        service_url,
        is_active,
        created_at,
        updated_at,
        institutions (
          id,
          name_en,
          name_am,
          code,
          logo_url
        )
      `)
      .eq('id', serviceId)
      .single();

    if (error || !service) {
      return {
        success: false,
        message: 'Service not found.'
      };
    }

    // Get requirements count
    const { count: requirementsCount } = await supabase
      .from('service_requirements')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', serviceId);

    // Map database fields to expected API format
    const mappedService = {
      id: service.id,
      institution_id: service.institution_id,
      name: service.title_en,
      name_am: service.title_am,
      description: service.description_en,
      description_am: service.description_am,
      processing_time: service.processing_time,
      fee_amount: service.service_fee,
      official_link: service.service_url,
      status: service.is_active ? 'ACTIVE' : 'INACTIVE',
      created_at: service.created_at,
      updated_at: service.updated_at,
      institutions: service.institutions,
      requirements_count: requirementsCount || 0
    };

    return {
      success: true,
      data: mappedService
    };

  } catch (error) {
    console.error('Get service by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch service.'
    };
  }
};

/**
 * Create new service
 * @param {Object} serviceData - Service data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created service
 */
export const createService = async (serviceData, currentUser) => {
  try {
    const { institutionId, name, nameAm, description, descriptionAm, processingTime, processingTimeAm, feeAmount, officialLink, requiredDocuments } = serviceData;

    // Validation
    if (!institutionId || !name) {
      return {
        success: false,
        message: 'Institution ID and service name are required.'
      };
    }

    // Verify institution exists
    const { data: institution } = await supabase
      .from('institutions')
      .select('id')
      .eq('id', institutionId)
      .single();

    if (!institution) {
      return {
        success: false,
        message: 'Institution not found.'
      };
    }

    // Create service
    const { data: newService, error } = await supabase
      .from('services')
      .insert({
        institution_id: institutionId,
        name,
        name_am: nameAm,
        description,
        description_am: descriptionAm,
        processing_time: processingTime,
        processing_time_am: processingTimeAm,
        fee_amount: feeAmount || 0,
        official_link: officialLink,
        required_documents: requiredDocuments,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        institution_id,
        name,
        description,
        fee_amount,
        status,
        created_at
      `)
      .single();

    if (error) {
      console.error('Create service error:', error);
      return {
        success: false,
        message: 'Failed to create service.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'SERVICE_CREATE', `Created service: ${newService.name}`);

    return {
      success: true,
      message: 'Service created successfully',
      data: newService
    };

  } catch (error) {
    console.error('Create service error:', error);
    return {
      success: false,
      message: 'An error occurred while creating service.'
    };
  }
};

/**
 * Update service
 * @param {string} serviceId - Service ID
 * @param {Object} updates - Fields to update
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated service
 */
export const updateService = async (serviceId, updates, currentUser) => {
  try {
    // Get existing service
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('id, name')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      return {
        success: false,
        message: 'Service not found.'
      };
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.nameAm) updateData.name_am = updates.nameAm;
    if (updates.description) updateData.description = updates.description;
    if (updates.descriptionAm) updateData.description_am = updates.descriptionAm;
    if (updates.processingTime) updateData.processing_time = updates.processingTime;
    if (updates.processingTimeAm) updateData.processing_time_am = updates.processingTimeAm;
    if (updates.feeAmount !== undefined) updateData.fee_amount = updates.feeAmount;
    if (updates.officialLink) updateData.official_link = updates.officialLink;
    if (updates.requiredDocuments) updateData.required_documents = updates.requiredDocuments;
    if (updates.status) updateData.status = updates.status;

    // Update service
    const { data: updatedService, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .select(`
        id,
        name,
        description,
        fee_amount,
        status,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Update service error:', error);
      return {
        success: false,
        message: 'Failed to update service.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'SERVICE_UPDATE', `Updated service: ${existingService.name}`);

    return {
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    };

  } catch (error) {
    console.error('Update service error:', error);
    return {
      success: false,
      message: 'An error occurred while updating service.'
    };
  }
};

/**
 * Delete service (soft delete)
 * @param {string} serviceId - Service ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Result
 */
export const deleteService = async (serviceId, currentUser) => {
  try {
    // Get service
    const { data: service } = await supabase
      .from('services')
      .select('name')
      .eq('id', serviceId)
      .single();

    if (!service) {
      return {
        success: false,
        message: 'Service not found.'
      };
    }

    // Soft delete
    const { error } = await supabase
      .from('services')
      .update({
        status: 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (error) {
      console.error('Delete service error:', error);
      return {
        success: false,
        message: 'Failed to delete service.'
      };
    }

    // Log audit
    await logAudit(currentUser.id, 'SERVICE_DELETE', `Deleted service: ${service.name}`);

    return {
      success: true,
      message: 'Service deleted successfully'
    };

  } catch (error) {
    console.error('Delete service error:', error);
    return {
      success: false,
      message: 'An error occurred while deleting service.'
    };
  }
};

/**
 * Get requirements by service
 * @param {string} serviceId - Service ID
 * @returns {Promise<Object>} List of requirements
 */
export const getRequirementsByService = async (serviceId) => {
  try {
    const { data, error } = await supabase
      .from('service_requirements')
      .select(`
        id,
        service_id,
        document_name_en,
        document_name_am,
        description_en,
        description_am,
        is_mandatory,
        display_order,
        created_at
      `)
      .eq('service_id', serviceId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Get requirements error:', error);
      return {
        success: false,
        message: 'Failed to fetch requirements.'
      };
    }

    // Map to expected API format
    const mappedData = (data || []).map(req => ({
      id: req.id,
      service_id: req.service_id,
      requirement_en: req.document_name_en,
      requirement_am: req.document_name_am,
      description_en: req.description_en,
      description_am: req.description_am,
      is_mandatory: req.is_mandatory,
      display_order: req.display_order,
      created_at: req.created_at
    }));

    return {
      success: true,
      data: mappedData
    };

  } catch (error) {
    console.error('Get requirements error:', error);
    return {
      success: false,
      message: 'An error occurred while fetching requirements.'
    };
  }
};

/**
 * Create requirement
 * @param {string} serviceId - Service ID
 * @param {Object} requirementData - Requirement data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Created requirement
 */
export const createRequirement = async (serviceId, requirementData, currentUser) => {
  try {
    const { requirementEn, requirementAm, displayOrder } = requirementData;

    if (!requirementEn) {
      return {
        success: false,
        message: 'Requirement text (English) is required.'
      };
    }

    // Verify service exists
    const { data: service } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .single();

    if (!service) {
      return {
        success: false,
        message: 'Service not found.'
      };
    }

    const { data: newRequirement, error } = await supabase
      .from('service_requirements')
      .insert({
        service_id: serviceId,
        requirement_en: requirementEn,
        requirement_am: requirementAm,
        display_order: displayOrder || 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Create requirement error:', error);
      return {
        success: false,
        message: 'Failed to create requirement.'
      };
    }

    await logAudit(currentUser.id, 'REQUIREMENT_CREATE', `Created requirement for service ${serviceId}`);

    return {
      success: true,
      message: 'Requirement created successfully',
      data: newRequirement
    };

  } catch (error) {
    console.error('Create requirement error:', error);
    return {
      success: false,
      message: 'An error occurred while creating requirement.'
    };
  }
};

/**
 * Update requirement
 * @param {string} requirementId - Requirement ID
 * @param {Object} updates - Fields to update
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated requirement
 */
export const updateRequirement = async (requirementId, updates, currentUser) => {
  try {
    const updateData = { updated_at: new Date().toISOString() };

    if (updates.requirementEn) updateData.requirement_en = updates.requirementEn;
    if (updates.requirementAm) updateData.requirement_am = updates.requirementAm;
    if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

    const { data: updatedRequirement, error } = await supabase
      .from('service_requirements')
      .update(updateData)
      .eq('id', requirementId)
      .select()
      .single();

    if (error) {
      console.error('Update requirement error:', error);
      return {
        success: false,
        message: 'Failed to update requirement.'
      };
    }

    await logAudit(currentUser.id, 'REQUIREMENT_UPDATE', `Updated requirement ${requirementId}`);

    return {
      success: true,
      message: 'Requirement updated successfully',
      data: updatedRequirement
    };

  } catch (error) {
    console.error('Update requirement error:', error);
    return {
      success: false,
      message: 'An error occurred while updating requirement.'
    };
  }
};

/**
 * Delete requirement
 * @param {string} requirementId - Requirement ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Result
 */
export const deleteRequirement = async (requirementId, currentUser) => {
  try {
    const { error } = await supabase
      .from('service_requirements')
      .delete()
      .eq('id', requirementId);

    if (error) {
      console.error('Delete requirement error:', error);
      return {
        success: false,
        message: 'Failed to delete requirement.'
      };
    }

    await logAudit(currentUser.id, 'REQUIREMENT_DELETE', `Deleted requirement ${requirementId}`);

    return {
      success: true,
      message: 'Requirement deleted successfully'
    };

  } catch (error) {
    console.error('Delete requirement error:', error);
    return {
      success: false,
      message: 'An error occurred while deleting requirement.'
    };
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
